import type { JsonLike } from '../resolvers/tokens'
import { buildPaletteVars } from '../resolvers/palettes'
import { buildLayerVars } from '../resolvers/layers'
import { buildTypographyVars, type TypographyChoices } from '../resolvers/typography'
import { applyCssVarsDelta, type CssVarMap } from '../css/apply'
import { computeBundleVersion } from './versioning'
import tokensImport from '../../vars/Tokens.json'
import themeImport from '../../vars/Brand.json'
import uikitImport from '../../vars/UIKit.json'
import { readOverrides } from '../../modules/theme/tokenOverrides'

type PaletteStore = {
  bindings: Record<string, { token: string; hex: string }>
  opacity: Record<'disabled' | 'overlay', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ElevationControl = { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }
export type ElevationState = {
  controls: Record<string, ElevationControl>
  colorTokens: Record<string, string>
  alphaTokens: Record<string, string>
  paletteSelections: Record<string, { paletteKey: string; level: string }>
  baseXDirection: 'left' | 'right'
  baseYDirection: 'up' | 'down'
  directions: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>
  shadowColorControl: { colorToken: string; alphaToken: string }
}

export type VarsState = {
  tokens: JsonLike
  theme: JsonLike
  uikit: JsonLike
  palettes: PaletteStore
  elevation: ElevationState
  version: number
}

const STORAGE_KEYS = {
  version: 'rf:vars:version',
  tokens: 'rf:tokens',
  theme: 'rf:theme',
  uikit: 'rf:uikit',
  palettes: 'rf:palettes',
  elevation: 'rf:elevation',
}

function isLocalStorageAvailable(): boolean {
  try { if (typeof window === 'undefined' || !window.localStorage) return false; const k = '__ls__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true } catch { return false }
}

function readLSJson<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
function writeLSJson<T>(key: string, value: T) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

function toTitleCase(label: string): string { return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim() }

function migratePaletteLocalKeys(): PaletteStore {
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

type Listener = () => void

class VarsStore {
  private state: VarsState
  private listeners: Set<Listener> = new Set()
  private lsAvailable = isLocalStorageAvailable()
  // Track last applied maps for delta application per domain
  private lastPalettes: CssVarMap | null = null
  private lastCorePalette: CssVarMap | null = null
  private lastLayers: CssVarMap | null = null
  private lastTypography: CssVarMap | null = null

  constructor() {
    const tokens = this.lsAvailable ? readLSJson(STORAGE_KEYS.tokens, tokensImport as any) : (tokensImport as any)
    const themeRaw = this.lsAvailable ? readLSJson(STORAGE_KEYS.theme, themeImport as any) : (themeImport as any)
    const theme = (themeRaw as any)?.brand ? themeRaw : ({ brand: themeRaw } as any)
    const uikit = this.lsAvailable ? readLSJson(STORAGE_KEYS.uikit, uikitImport as any) : (uikitImport as any)
    const palettes = this.lsAvailable ? readLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys()) : migratePaletteLocalKeys()
    const elevation = this.initElevationState(theme as any)
    this.state = { tokens, theme, uikit, palettes, elevation, version: 0 }

    // Versioning and seeding when bundle changes
    if (this.lsAvailable) {
      const bundleVersion = computeBundleVersion(tokensImport, themeImport, uikitImport)
      const storedVersion = localStorage.getItem(STORAGE_KEYS.version)
      if (storedVersion !== bundleVersion) {
        writeLSJson(STORAGE_KEYS.tokens, tokensImport)
        const normalizedTheme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
        writeLSJson(STORAGE_KEYS.theme, normalizedTheme)
        writeLSJson(STORAGE_KEYS.uikit, uikitImport)
        writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
        try {
          const colors: any = (tokensImport as any)?.tokens?.color || {}
          const names: Record<string, string> = {}
          Object.keys(colors).forEach((fam) => { if (fam !== 'translucent') names[fam] = toTitleCase(fam) })
          writeLSJson('family-friendly-names', names)
        } catch {}
        localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
        this.state = { tokens: tokensImport as any, theme: normalizedTheme as any, uikit: uikitImport as any, palettes: migratePaletteLocalKeys(), elevation: this.initElevationState(normalizedTheme as any), version: (this.state?.version || 0) + 1 }
      }
      // Ensure keys exist
      if (!localStorage.getItem(STORAGE_KEYS.tokens)) writeLSJson(STORAGE_KEYS.tokens, this.state.tokens)
      if (!localStorage.getItem(STORAGE_KEYS.theme)) writeLSJson(STORAGE_KEYS.theme, this.state.theme)
      if (!localStorage.getItem(STORAGE_KEYS.uikit)) writeLSJson(STORAGE_KEYS.uikit, this.state.uikit)
      if (!localStorage.getItem(STORAGE_KEYS.palettes)) writeLSJson(STORAGE_KEYS.palettes, this.state.palettes)
      if (!localStorage.getItem(STORAGE_KEYS.elevation)) writeLSJson(STORAGE_KEYS.elevation, this.state.elevation)
    }

    // Initial CSS apply (Light mode palettes + layers + typography)
    this.recomputeAndApplyAll()

    // React to token override changes and type choice changes (centralized)
    const onOverrides = () => { this.bumpVersion(); this.recomputeAndApplyAll() }
    const onTypeChoices = () => { this.bumpVersion(); this.recomputeAndApplyAll() }
    window.addEventListener('tokenOverridesChanged', onOverrides as any)
    window.addEventListener('typeChoicesChanged', onTypeChoices as any)
  }

  getState(): VarsState { return this.state }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private emit() { this.listeners.forEach((l) => l()) }

  private writeState(next: Partial<VarsState>) {
    this.state = { ...this.state, ...next }
    if (this.lsAvailable) {
      if (next.tokens) writeLSJson(STORAGE_KEYS.tokens, this.state.tokens)
      if (next.theme) writeLSJson(STORAGE_KEYS.theme, this.state.theme)
      if (next.uikit) writeLSJson(STORAGE_KEYS.uikit, this.state.uikit)
      if (next.palettes) writeLSJson(STORAGE_KEYS.palettes, this.state.palettes)
      if (next.elevation) writeLSJson(STORAGE_KEYS.elevation, this.state.elevation)
    }
    this.emit()
    this.recomputeAndApplyAll()
  }

  private bumpVersion() { this.state = { ...this.state, version: (this.state.version || 0) + 1 }; this.emit() }

  setTokens(next: JsonLike) { this.writeState({ tokens: next }) }
  setTheme(next: JsonLike) { this.writeState({ theme: next }) }
  setUiKit(next: JsonLike) { this.writeState({ uikit: next }) }
  setPalettes(next: PaletteStore) { this.writeState({ palettes: next }) }
  setElevation(next: ElevationState) { this.writeState({ elevation: next }) }
  updateElevation(mutator: (prev: ElevationState) => ElevationState) { this.writeState({ elevation: mutator(this.state.elevation) }) }

  resetAll() {
    const normalizedTheme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
    if (this.lsAvailable) {
      writeLSJson(STORAGE_KEYS.tokens, tokensImport)
      writeLSJson(STORAGE_KEYS.theme, normalizedTheme)
      writeLSJson(STORAGE_KEYS.uikit, uikitImport)
      writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
      // Ensure elevation storage is cleared so stale values aren't reapplied by the UI
      try { localStorage.removeItem(STORAGE_KEYS.elevation) } catch {}
      try {
        const colors: any = (tokensImport as any)?.tokens?.color || {}
        const names: Record<string, string> = {}
        Object.keys(colors).forEach((fam) => { if (fam !== 'translucent') names[fam] = toTitleCase(fam) })
        writeLSJson('family-friendly-names', names)
      } catch {}
      localStorage.setItem(STORAGE_KEYS.version, computeBundleVersion(tokensImport, themeImport, uikitImport))
    }
    // Remove legacy palette primary level keys
    try {
      const toRemove: string[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i) || ''
        if (k.startsWith('palette-primary-level:')) toRemove.push(k)
      }
      toRemove.forEach((k) => { try { localStorage.removeItem(k) } catch {} })
    } catch {}
    // Clear elevation-related keys so pages reseed from JSON
    try {
      ['elevation-controls','shadow-color-control','elevation-color-tokens','elevation-alpha-tokens','elevation-palette-selections','elevation-directions','offset-x-direction','offset-y-direction']
        .forEach((k) => { try { localStorage.removeItem(k) } catch {} })
    } catch {}
    this.state = { tokens: tokensImport as any, theme: normalizedTheme as any, uikit: uikitImport as any, palettes: migratePaletteLocalKeys(), elevation: this.initElevationState(normalizedTheme as any), version: (this.state.version || 0) + 1 }
    // Persist freshly initialized elevation defaults so future reads are consistent
    if (this.lsAvailable) {
      try { writeLSJson(STORAGE_KEYS.elevation, this.state.elevation) } catch {}
    }
    this.emit()
    this.recomputeAndApplyAll()
    // Notify legacy listeners so UI components can force refresh where needed
    try { window.dispatchEvent(new CustomEvent('paletteReset')) } catch {}
  }

  private initElevationState(theme: any): ElevationState {
    // Try consolidated key first
    if (this.lsAvailable) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.elevation)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    // Build defaults from theme
    const brand: any = (theme as any)?.brand || (theme as any)
    const light: any = brand?.light?.elevations || {}
    const toSize = (ref?: any): string => {
      const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
      if (!s) return 'size/none'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
        const key = parts.slice(2).join('.')
        return `size/${key}`
      }
      return 'size/none'
    }
    const controls: Record<string, ElevationControl> = {}
    for (let i = 0; i <= 4; i++) {
      const node: any = light[`elevation-${i}`]?.['$value'] || {}
      controls[`elevation-${i}`] = {
        blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
        spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
        offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
        offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
      }
    }
    const parseOpacity = (s?: string) => {
      if (!s) return 'opacity/veiled'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
      return 'opacity/veiled'
    }
    const parseColorToken = (s?: string) => {
      if (!s) return 'color/gray/900'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
      return 'color/gray/900'
    }
    const elev1: any = light?.['elevation-1']?.['$value'] || {}
    const shadowColorControl = { colorToken: parseColorToken(elev1?.color?.['$value'] ?? elev1?.color), alphaToken: parseOpacity(elev1?.opacity?.['$value'] ?? elev1?.opacity) }
    const baseX = Number((elev1?.['x-direction']?.['$value'] ?? 1))
    const baseY = Number((elev1?.['y-direction']?.['$value'] ?? 1))
    const baseXDirection: 'left' | 'right' = baseX >= 0 ? 'right' : 'left'
    const baseYDirection: 'up' | 'down' = baseY >= 0 ? 'down' : 'up'
    const directions: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
    for (let i = 1; i <= 4; i += 1) directions[`elevation-${i}`] = { x: baseXDirection, y: baseYDirection }
    // Migrate legacy keys
    let colorTokens: Record<string, string> = {}
    let alphaTokens: Record<string, string> = {}
    let paletteSelections: Record<string, { paletteKey: string; level: string }> = {}
    if (this.lsAvailable) {
      try { const raw = localStorage.getItem('elevation-color-tokens'); if (raw) colorTokens = JSON.parse(raw) } catch {}
      try { const raw = localStorage.getItem('elevation-alpha-tokens'); if (raw) alphaTokens = JSON.parse(raw) } catch {}
      try { const raw = localStorage.getItem('elevation-palette-selections'); if (raw) paletteSelections = JSON.parse(raw) } catch {}
      try { const raw = localStorage.getItem('elevation-directions'); if (raw) Object.assign(directions, JSON.parse(raw)) } catch {}
      try { const raw = localStorage.getItem('offset-x-direction'); if (raw === 'left' || raw === 'right') (baseXDirection as any) = raw } catch {}
      try { const raw = localStorage.getItem('offset-y-direction'); if (raw === 'up' || raw === 'down') (baseYDirection as any) = raw } catch {}
    }
    return { controls, colorTokens, alphaTokens, paletteSelections, baseXDirection, baseYDirection, directions, shadowColorControl }
  }

  private readTypeChoices(): TypographyChoices {
    try { const raw = localStorage.getItem('type-token-choices'); return raw ? JSON.parse(raw) : {} } catch { return {} }
  }

  private recomputeAndApplyAll() {
    const overrides = readOverrides()
    // Core palette bindings (black/white/alert/warning/success/interactive)
    try {
      const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
      const get = (name: string): string | undefined => {
        const parts = (name || '').split('/')
        if (parts[0] === 'color' && parts.length >= 3) return tokensRoot?.color?.[parts[1]]?.[parts[2]]?.$value
        return undefined
      }
      const defaults: Record<string, { token: string; hex: string }> = {
        '--palette-black': { token: 'color/gray/1000', hex: get('color/gray/1000') || '#000000' },
        '--palette-white': { token: 'color/gray/000', hex: get('color/gray/000') || '#ffffff' },
        '--palette-alert': { token: 'color/mandy/500', hex: get('color/mandy/500') || get('color/mandy/600') || '#d40d0d' },
        '--palette-warning': { token: 'color/mandarin/500', hex: get('color/mandarin/500') || '#fc7527' },
        '--palette-success': { token: 'color/greensheen/500', hex: get('color/greensheen/500') || '#008b38' },
        '--palette-interactive': { token: 'color/salmon/400', hex: get('color/salmon/400') || '#ff6b6b' },
      }
      const merged = { ...defaults, ...(this.state.palettes?.bindings || {}) }
      const colors: Record<string, string> = {}
      Object.entries(merged).forEach(([cssVar, info]) => { colors[cssVar] = info.hex })
      // Expose palette opacity bindings as CSS vars
      try {
        const normalizeOpacity = (v: any): string | undefined => {
          const n = typeof v === 'number' ? v : Number(v)
          if (!Number.isFinite(n)) return undefined
          return n <= 1 ? String(Math.max(0, Math.min(1, n))) : String(Math.max(0, Math.min(1, n / 100)))
        }
        const disabled = this.state.palettes?.opacity?.disabled
        const overlay = this.state.palettes?.opacity?.overlay
        const d = normalizeOpacity(disabled?.value)
        const o = normalizeOpacity(overlay?.value)
        if (typeof d === 'string') colors['--palette-opacity-disabled'] = d
        if (typeof o === 'string') colors['--palette-opacity-overlay'] = o
      } catch {}
      applyCssVarsDelta(this.lastCorePalette, colors); this.lastCorePalette = colors
    } catch {}
    // Palettes (Light mode default for now; dark can be toggled by UI where needed)
    const paletteVarsLight = buildPaletteVars(this.state.tokens, this.state.theme, 'Light')
    applyCssVarsDelta(this.lastPalettes, paletteVarsLight); this.lastPalettes = paletteVarsLight
    // Layers (from Brand)
    const layerVars = buildLayerVars(this.state.tokens, this.state.theme, overrides)
    applyCssVarsDelta(this.lastLayers, layerVars); this.lastLayers = layerVars
    // Typography
    const { vars: typeVars, familiesToLoad } = buildTypographyVars(this.state.tokens, this.state.theme, overrides, this.readTypeChoices())
    applyCssVarsDelta(this.lastTypography, typeVars); this.lastTypography = typeVars
    // Ensure web fonts load lazily
    familiesToLoad.forEach((family) => {
      try {
        const trimmed = String(family).trim()
        if (!trimmed) return
        const id = `gf-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        if (document.getElementById(id)) return
        const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(trimmed).replace(/%20/g, '+')}:wght@100..900&display=swap`
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      } catch {}
    })

    // Elevation CSS variables (apply for levels 0..4)
    try {
      const tokenIndex = {
        get: (path: string): any => {
          const parts = path.split('/')
          const root: any = (this.state.tokens as any)?.tokens || {}
          if (overrides && Object.prototype.hasOwnProperty.call(overrides, path)) return (overrides as any)[path]
          if (parts[0] === 'size' && parts[1]) return root?.size?.[parts[1]]?.$value
          if (parts[0] === 'opacity' && parts[1]) return root?.opacity?.[parts[1]]?.$value
          if (parts[0] === 'color' && parts[1] && parts[2]) return root?.color?.[parts[1]]?.[parts[2]]?.$value
          return undefined
        }
      }
      const toNumber = (v: any): number => {
        if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) return Number((v as any).value)
        return Number(v)
      }
      const getSize = (token: string): number => {
        const v = tokenIndex.get(token)
        const n = toNumber(v)
        return Number.isFinite(n) ? n : 0
      }
      // Build ordered list of size tokens by numeric value for stepped progression
      const sizeTokenOrder: Array<{ name: string; value: number }> = (() => {
        try {
          const src: any = (this.state.tokens as any)?.tokens?.size || {}
          const list: Array<{ name: string; value: number }> = []
          Object.keys(src).forEach((short) => {
            const raw = src[short]?.$value
            const val = toNumber(raw)
            if (Number.isFinite(val)) list.push({ name: `size/${short}`, value: val })
          })
          // sort by numeric ascending
          list.sort((a, b) => a.value - b.value)
          return list
        } catch { return [] }
      })()
      const nextSizeValue = (baseToken: string, steps: number): number => {
        if (!steps || steps < 0) return getSize(baseToken)
        const idx = sizeTokenOrder.findIndex((t) => t.name === baseToken)
        if (idx === -1) return getSize(baseToken)
        const nextIdx = Math.min(sizeTokenOrder.length - 1, idx + steps)
        return sizeTokenOrder[nextIdx]?.value ?? getSize(baseToken)
      }
      // Read scaling preferences (defaults match prior UI)
      const readBool = (k: string, def: boolean) => {
        try {
          const v = localStorage.getItem(k)
          if (v === null) return def
          return v === 'true'
        } catch { return def }
      }
      const scaleBlur = readBool('blur-scale-by-default', true)
      const scaleSpread = readBool('spread-scale-by-default', false)
      const scaleX = readBool('offset-x-scale-by-default', false)
      const scaleY = readBool('offset-y-scale-by-default', false)
      const parseAlphaValue = (v: any): number => {
        const n = toNumber(v)
        if (!Number.isFinite(n)) return 1
        return n <= 1 ? Math.max(0, Math.min(1, n)) : Math.max(0, Math.min(1, n / 100))
      }
      const hexToRgba = (hex: string, a: number): string => {
        try {
          let h = String(hex || '').trim()
          if (!h) return `rgba(0,0,0,${a})`
          if (!h.startsWith('#')) h = `#${h}`
          const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
          if (!m) return h
          const r = parseInt(m[1], 16)
          const g = parseInt(m[2], 16)
          const b = parseInt(m[3], 16)
          return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`
        } catch { return hex }
      }
      const familyForPalette: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
      const shadowColorForLevel = (level: number): string => {
        const key = `elevation-${level}`
        const sel = this.state.elevation.paletteSelections[key]
        if (sel) {
          const family = familyForPalette[sel.paletteKey] || 'gray'
          const hex = tokenIndex.get(`color/${family}/${sel.level}`)
          const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
          const alphaVal = parseAlphaValue(tokenIndex.get(alphaTok))
          return typeof hex === 'string' ? hexToRgba(hex, alphaVal) : `rgba(0,0,0,${alphaVal})`
        }
        const tok = this.state.elevation.colorTokens[key] || this.state.elevation.shadowColorControl.colorToken
        const hex = tokenIndex.get(tok)
        const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
        const alphaVal = parseAlphaValue(tokenIndex.get(alphaTok))
        return typeof hex === 'string' ? hexToRgba(hex, alphaVal) : `rgba(0,0,0,${alphaVal})`
      }
      const dirForLevel = (level: number): { x: 'left' | 'right'; y: 'up' | 'down' } => {
        const key = `elevation-${level}`
        return this.state.elevation.directions[key] || { x: this.state.elevation.baseXDirection, y: this.state.elevation.baseYDirection }
      }
      const vars: Record<string, string> = {}
      const baseCtrl = this.state.elevation.controls['elevation-0']
      for (let i = 0; i <= 4; i += 1) {
        const k = `elevation-${i}`
        const ctrl = this.state.elevation.controls[k]
        if (!ctrl) continue
        const blur = (() => {
          if (i > 0 && scaleBlur && ctrl.blurToken === baseCtrl?.blurToken) return nextSizeValue(ctrl.blurToken, i)
          return getSize(ctrl.blurToken)
        })()
        const spread = (() => {
          if (i > 0 && scaleSpread && ctrl.spreadToken === baseCtrl?.spreadToken) return nextSizeValue(ctrl.spreadToken, i)
          return getSize(ctrl.spreadToken)
        })()
        const x = (() => {
          if (i > 0 && scaleX && ctrl.offsetXToken === baseCtrl?.offsetXToken) return nextSizeValue(ctrl.offsetXToken, i)
          return getSize(ctrl.offsetXToken)
        })()
        const y = (() => {
          if (i > 0 && scaleY && ctrl.offsetYToken === baseCtrl?.offsetYToken) return nextSizeValue(ctrl.offsetYToken, i)
          return getSize(ctrl.offsetYToken)
        })()
        const dir = dirForLevel(i)
        const sx = dir.x === 'right' ? x : -x
        const sy = dir.y === 'down' ? y : -y
        const color = shadowColorForLevel(i)
        vars[`--elevation-elevation-${i}-shadow-color`] = String(color)
        vars[`--elevation-elevation-${i}-blur`] = `${blur}px`
        vars[`--elevation-elevation-${i}-spread`] = `${spread}px`
        vars[`--elevation-elevation-${i}-x-axis`] = `${sx}px`
        vars[`--elevation-elevation-${i}-y-axis`] = `${sy}px`
      }
      if (Object.keys(vars).length) applyCssVarsDelta(null, vars)
    } catch {}
  }
}

let singleton: VarsStore | null = null
export function getVarsStore(): VarsStore { if (!singleton) singleton = new VarsStore(); return singleton }


