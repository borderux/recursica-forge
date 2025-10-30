import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import tokensImport from '../../vars/Tokens.json'
import themeImport from '../../vars/Theme.json'
import uikitImport from '../../vars/UIKit.json'
import { applyCssVars } from '../theme/varsUtil'

type JsonLike = Record<string, any>

type ResolvedTheme = {
  light: Record<string, string>
  dark: Record<string, string>
}

type PaletteStore = {
  // Core palette bindings like --palette-black -> { token, hex }
  bindings: Record<string, { token: string; hex: string }>
  // Opacity slots bound to token names
  opacity: Record<'disabled' | 'overlay', { token: string; value: number }>
  // Configured palettes collection and any per-palette selections
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  // Optional per-palette primary level pick (by key)
  primaryLevels?: Record<string, string>
}

type VarsContextValue = {
  tokens: JsonLike
  setTokens: (next: JsonLike) => void
  theme: JsonLike
  setTheme: (next: JsonLike) => void
  uikit: JsonLike
  setUiKit: (next: JsonLike) => void
  resolvedTheme: ResolvedTheme
  palettes: PaletteStore
  setPalettes: (next: PaletteStore) => void
  resetAll: () => void
}

const STORAGE_KEYS = {
  version: 'rf:vars:version',
  tokens: 'rf:tokens',
  theme: 'rf:theme',
  uikit: 'rf:uikit',
  palettes: 'rf:palettes',
  resolved: 'rf:resolved:theme',
}

const VarsContext = createContext<VarsContextValue | undefined>(undefined)

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const k = '__ls_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

function hashObject(obj: unknown): string {
  const s = JSON.stringify(obj)
  // DJB2 hash
  let h = 5381
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h) + s.charCodeAt(i)
  return String(h >>> 0)
}

function computeBundleVersion(): string {
  return [
    hashObject(tokensImport),
    hashObject(themeImport),
    hashObject(uikitImport),
  ].join('.')
}

function readLSJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeLSJson<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function removeLS(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

function migratePaletteLocalKeys(): PaletteStore {
  // Gather from existing scattered keys and consolidate
  const bindings = readLSJson<Record<string, { token: string; hex: string }>>('palette-bindings', {})
  const opacity = readLSJson<Record<'disabled' | 'overlay', { token: string; value: number }>>('palette-opacity-bindings', {} as any)
  const dynamic = readLSJson<Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>>('dynamic-palettes', [
    { key: 'neutral', title: 'Neutral (Grayscale)', defaultLevel: 200 },
    { key: 'palette-1', title: 'Palette 1', defaultLevel: 500 },
    { key: 'palette-2', title: 'Palette 2', defaultLevel: 500 },
  ])
  const primaryLevels: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || ''
      if (k.startsWith('palette-primary-level:')) {
        const key = k.split(':')[1] || ''
        const v = JSON.parse(localStorage.getItem(k) || 'null')
        if (typeof v === 'string') primaryLevels[key] = v
      }
    }
  } catch {}
  return { bindings, opacity, dynamic, primaryLevels }
}

function buildResolvedTheme(tokens: JsonLike, theme: JsonLike): ResolvedTheme {
  // Build only palette-related resolved vars for now, consistent with current app usage
  // Map Theme.json entries to CSS vars using existing resolver semantics
  const makeIndex = (t: JsonLike) => {
    const out: Record<string, any> = {}
    const visit = (node: any, prefix: string, mode: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        out[`${mode}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, mode))
    }
    if (t?.light?.palette) visit(t.light.palette, 'palette', 'Light')
    if (t?.dark?.palette) visit(t.dark.palette, 'palette', 'Dark')
    return out
  }
  const themeIndex = makeIndex(theme)
  const getTokenValue = (name: string): string | number | undefined => {
    const normalized = (name || '').replace(/^token\./, '').replace(/\./g, '/')
    const parts = normalized.split('/')
    if (parts[0] === 'color' && parts.length >= 3) return tokens?.color?.[parts[1]]?.[parts[2]]?.$value
    if (parts[0] === 'opacity' && parts[1]) return tokens?.opacity?.[parts[1]]?.$value
    if (parts[0] === 'font' && parts[1] === 'weight' && parts[2]) return tokens?.font?.weight?.[parts[2]]?.$value
    if (parts[0] === 'font' && parts[1] === 'size' && parts[2]) return tokens?.font?.size?.[parts[2]]?.$value
    return undefined
  }
  const resolveThemeRef = (ref: any, modeLabel: 'Light' | 'Dark'): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'number') return ref
    if (typeof ref === 'string') {
      const s = ref.trim()
      if (!s.startsWith('{')) return s
      const inner = s.slice(1, -1)
      if (inner.startsWith('token.')) return getTokenValue(inner)
      if (inner.startsWith('theme.')) {
        const parts = inner.split('.')
        const mode = (parts[1] || '').toLowerCase() === 'dark' ? 'Dark' : 'Light'
        const path = parts.slice(2).join('/')
        const entry = (themeIndex as any)[`${mode}::${path}`]
        return resolveThemeRef(entry?.value, mode)
      }
      return s
    }
    if (typeof ref === 'object') {
      const coll = (ref as any).collection
      const name = (ref as any).name
      if (coll === 'Tokens' && typeof name === 'string') return getTokenValue(name)
      if (coll === 'Theme' && typeof name === 'string') {
        const entry = (themeIndex as any)[`${modeLabel}::${name}`]
        return resolveThemeRef(entry?.value, modeLabel)
      }
    }
    return undefined
  }
  const makeVarsForMode = (modeLabel: 'Light' | 'Dark') => {
    const levels = ['900','800','700','600','500','400','300','200','100','050']
    const vars: Record<string, string> = {}
    const palettes = ['neutral','palette-1','palette-2','palette-3','palette-4']
    palettes.forEach((pk) => {
      levels.forEach((lvl) => {
        const onToneName = `palette/${pk}/${lvl}/on-tone`
        const hiName = `palette/${pk}/${lvl}/high-emphasis`
        const loName = `palette/${pk}/${lvl}/low-emphasis`
        const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
        const hi = resolveThemeRef((themeIndex as any)[`${modeLabel}::${hiName}`]?.value ?? { collection: 'Theme', name: hiName }, modeLabel)
        const lo = resolveThemeRef((themeIndex as any)[`${modeLabel}::${loName}`]?.value ?? { collection: 'Theme', name: loName }, modeLabel)
        if (typeof onTone === 'string') vars[`--palette-${pk}-${lvl}-on-tone`] = String(onTone)
        if (typeof hi === 'number' || typeof hi === 'string') vars[`--palette-${pk}-${lvl}-high-emphasis`] = String(hi)
        if (typeof lo === 'number' || typeof lo === 'string') vars[`--palette-${pk}-${lvl}-low-emphasis`] = String(lo)
      })
    })
    return vars
  }
  return { light: makeVarsForMode('Light'), dark: makeVarsForMode('Dark') }
}

export function VarsProvider({ children }: { children: React.ReactNode }) {
  const lsAvailable = useMemo(() => isLocalStorageAvailable(), [])
  const [tokens, setTokensState] = useState<JsonLike>(() => (lsAvailable ? readLSJson(STORAGE_KEYS.tokens, tokensImport as any) : (tokensImport as any)))
  const [theme, setThemeState] = useState<JsonLike>(() => (lsAvailable ? readLSJson(STORAGE_KEYS.theme, themeImport as any) : (themeImport as any)))
  const [uikit, setUiKitState] = useState<JsonLike>(() => (lsAvailable ? readLSJson(STORAGE_KEYS.uikit, uikitImport as any) : (uikitImport as any)))
  const [palettes, setPalettesState] = useState<PaletteStore>(() => (lsAvailable ? readLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys()) : migratePaletteLocalKeys()))
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => buildResolvedTheme(tokens, theme))

  const applyInitialCss = useRef(false)

  // Seed or re-seed when bundled JSON changes
  useEffect(() => {
    if (!lsAvailable) return
    const currentVersion = localStorage.getItem(STORAGE_KEYS.version)
    const bundleVersion = computeBundleVersion()
    if (currentVersion !== bundleVersion) {
      writeLSJson(STORAGE_KEYS.tokens, tokensImport)
      writeLSJson(STORAGE_KEYS.theme, themeImport)
      writeLSJson(STORAGE_KEYS.uikit, uikitImport)
      writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
      localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
      setTokensState(tokensImport as any)
      setThemeState(themeImport as any)
      setUiKitState(uikitImport as any)
      setPalettesState(migratePaletteLocalKeys())
    }
  }, [lsAvailable])

  // Recompute resolved theme when inputs change and persist cache (both light/dark)
  useEffect(() => {
    const next = buildResolvedTheme(tokens, theme)
    setResolvedTheme(next)
    if (lsAvailable) writeLSJson(STORAGE_KEYS.resolved, next)
  }, [tokens, theme, lsAvailable])

  // Apply core palette CSS variables on first mount and whenever bindings/opacity change
  useEffect(() => {
    if (applyInitialCss.current) return
    applyInitialCss.current = true
    try {
      const get = (name: string): string | undefined => {
        const parts = (name || '').split('/')
        if (parts[0] === 'color' && parts.length >= 3) return (tokens as any)?.color?.[parts[1]]?.[parts[2]]?.$value
        return undefined
      }
      const defaults: Record<string, { token: string; hex: string }> = {
        '--palette-black': { token: 'color/gray/1000', hex: get('color/gray/1000') || '#000000' },
        '--palette-white': { token: 'color/gray/000', hex: get('color/gray/000') || '#ffffff' },
        '--palette-alert': { token: 'color/mandy/500', hex: get('color/mandy/500') || get('color/mandy/600') || '#d40d0d' },
        '--palette-warning': { token: 'color/mandarin/500', hex: get('color/mandarin/500') || '#fc7527' },
        '--palette-success': { token: 'color/greensheen/500', hex: get('color/greensheen/500') || '#008b38' },
      }
      const merged = { ...defaults, ...(palettes?.bindings || {}) }
      const colors: Record<string, string> = {}
      Object.entries(merged).forEach(([cssVar, info]) => { colors[cssVar] = info.hex })
      applyCssVars(colors)
    } catch {}
  }, [])

  // Persistors
  const setTokens = useCallback((next: JsonLike) => {
    setTokensState(next)
    if (lsAvailable) writeLSJson(STORAGE_KEYS.tokens, next)
  }, [lsAvailable])
  const setTheme = useCallback((next: JsonLike) => {
    setThemeState(next)
    if (lsAvailable) writeLSJson(STORAGE_KEYS.theme, next)
  }, [lsAvailable])
  const setUiKit = useCallback((next: JsonLike) => {
    setUiKitState(next)
    if (lsAvailable) writeLSJson(STORAGE_KEYS.uikit, next)
  }, [lsAvailable])
  const setPalettes = useCallback((next: PaletteStore) => {
    setPalettesState(next)
    if (lsAvailable) writeLSJson(STORAGE_KEYS.palettes, next)
  }, [lsAvailable])

  const resetAll = useCallback(() => {
    if (lsAvailable) {
      removeLS(STORAGE_KEYS.tokens)
      removeLS(STORAGE_KEYS.theme)
      removeLS(STORAGE_KEYS.uikit)
      removeLS(STORAGE_KEYS.palettes)
      removeLS(STORAGE_KEYS.resolved)
      // Also clear legacy palette keys for good measure
      try {
        const toRemove: string[] = []
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i) || ''
          if (k.startsWith('palette-') || k === 'family-friendly-names' || k === 'type-token-choices') toRemove.push(k)
        }
        toRemove.forEach((k) => removeLS(k))
      } catch {}
    }
    setTokensState(tokensImport as any)
    setThemeState(themeImport as any)
    setUiKitState(uikitImport as any)
    const pal = migratePaletteLocalKeys()
    setPalettesState(pal)
    // Notify interested pages (legacy listeners)
    try { window.dispatchEvent(new CustomEvent('paletteReset')) } catch {}
  }, [lsAvailable])

  const value = useMemo<VarsContextValue>(() => ({
    tokens, setTokens,
    theme, setTheme,
    uikit, setUiKit,
    resolvedTheme,
    palettes, setPalettes,
    resetAll,
  }), [tokens, setTokens, theme, setTheme, uikit, setUiKit, resolvedTheme, palettes, setPalettes, resetAll])

  return <VarsContext.Provider value={value}>{children}</VarsContext.Provider>
}

export function useVars(): VarsContextValue {
  const ctx = useContext(VarsContext)
  if (!ctx) throw new Error('useVars must be used within VarsProvider')
  return ctx
}


