import './index.css'
import { useEffect, useMemo, useState } from 'react'
import PaletteGrid from './PaletteGrid'
import tokensJson from '../../vars/Tokens.json'
import { applyCssVars } from './varsUtil'
import themeJson from '../../vars/Theme.json'

type ThemeVars = Record<string, string>

type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

// const HSL = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`

const LIGHT_MODE: ThemeVars = {
  "--temp-disabled": "rgba(0,0,0,0.38)",
  "--temp-overlay": "rgba(0,0,0,0.68)",
  "--temp-elevation-0": "rgba(0,0,0,0.14)",
  
  // palette vars are seeded at startup; avoid overriding here
  "--palette-overlay": "0.38",
  "--palette-disabled": "0.38",
  
  "--palette-neutral-900-tone": "#000000",
  "--palette-neutral-800-tone": "#000000",
  "--palette-neutral-700-tone": "#000000",
  "--palette-neutral-600-tone": "#000000",
  "--palette-neutral-500-tone": "#000000",
  "--palette-neutral-400-tone": "#000000",
  "--palette-neutral-300-tone": "#000000",
  "--palette-neutral-200-tone": "#000000",
  "--palette-neutral-100-tone": "#000000",
  "--palette-neutral-050-tone": "#000000",
  
  "--palette-neutral-900-on-tone": "#000000",
  "--palette-neutral-800-on-tone": "#000000",
  "--palette-neutral-700-on-tone": "#000000",
  "--palette-neutral-600-on-tone": "#000000",
  "--palette-neutral-500-on-tone": "#000000",
  "--palette-neutral-400-on-tone": "#000000",
  "--palette-neutral-300-on-tone": "#000000",
  "--palette-neutral-200-on-tone": "#000000",
  "--palette-neutral-100-on-tone": "#000000",
  "--palette-neutral-050-on-tone": "#000000",
  
  "--palette-neutral-900-high-emphasis": "1",
  "--palette-neutral-800-high-emphasis": "1",
  "--palette-neutral-700-high-emphasis": "1",
  "--palette-neutral-600-high-emphasis": "1",
  "--palette-neutral-500-high-emphasis": "1",
  "--palette-neutral-400-high-emphasis": "1",
  "--palette-neutral-300-high-emphasis": "1",
  "--palette-neutral-200-high-emphasis": "1",
  "--palette-neutral-100-high-emphasis": "1",
  "--palette-neutral-050-high-emphasis": "1",
  
  "--palette-neutral-900-low-emphasis": "0.38",
  "--palette-neutral-800-low-emphasis": "0.38",
  "--palette-neutral-700-low-emphasis": "0.38",
  "--palette-neutral-600-low-emphasis": "0.38",
  "--palette-neutral-500-low-emphasis": "0.38",
  "--palette-neutral-400-low-emphasis": "0.38",
  "--palette-neutral-300-low-emphasis": "0.38",
  "--palette-neutral-200-low-emphasis": "0.38",
  "--palette-neutral-100-low-emphasis": "0.38",
  "--palette-neutral-050-low-emphasis": "0.38",
  
  "--elevation-elevation-0-shadow-color": "#000000",
  "--elevation-elevation-0-blur": "0px",
  "--elevation-elevation-0-spread": "0px",
  "--elevation-elevation-0-x-axis": "0px",
  "--elevation-elevation-0-y-axis": "0px",
  
  "--elevation-elevation-1-shadow-color": "#000000",
  "--elevation-elevation-1-blur": "4px",
  "--elevation-elevation-1-spread": "4px",
  "--elevation-elevation-1-x-axis": "4px",
  "--elevation-elevation-1-y-axis": "4px",
  
  "--elevation-elevation-2-shadow-color": "#000000",
  "--elevation-elevation-2-blur": "8px",
  "--elevation-elevation-2-spread": "8px",
  "--elevation-elevation-2-x-axis": "8px",
  "--elevation-elevation-2-y-axis": "8px",
  
  "--elevation-elevation-3-shadow-color": "#000000",
  "--elevation-elevation-3-blur": "12px",
  "--elevation-elevation-3-spread": "12px",
  "--elevation-elevation-3-x-axis": "12px",
  "--elevation-elevation-3-y-axis": "12px",
  
  "--elevation-elevation-4-shadow-color": "#000000",
  "--elevation-elevation-4-blur": "16px",
  "--elevation-elevation-4-spread": "16px",
  "--elevation-elevation-4-x-axis": "16px",
  "--elevation-elevation-4-y-axis": "16px",
  
  "--font-h1-font-family": "lexend",
  "--font-h1-font-size": "64",
  "--font-h1-font-weight": "bold",
  "--font-h1-font-letter-spacing": "0",
  
  "--font-h2-font-family": "lexend",
  "--font-h2-font-size": "64",
  "--font-h2-font-weight": "bold",
  "--font-h2-font-letter-spacing": "0",
  
  "--font-h3-font-family": "lexend",
  "--font-h3-font-size": "64",
  "--font-h3-font-weight": "bold",
  "--font-h3-font-letter-spacing": "0",
  
  "--font-h4-font-family": "lexend",
  "--font-h4-font-size": "64",
  "--font-h4-font-weight": "bold",
  "--font-h4-font-letter-spacing": "0",
  
  "--font-h5-font-family": "lexend",
  "--font-h5-font-size": "64",
  "--font-h5-font-weight": "bold",
  "--font-h5-font-letter-spacing": "0",
  
  "--font-h6-font-family": "lexend",
  "--font-h6-font-size": "64",
  "--font-h6-font-weight": "bold",
  "--font-h6-font-letter-spacing": "0",
  
  "--font-button-font-family": "lexend",
  "--font-button-font-size": "16",
  "--font-button-font-weight": "regular",
  "--font-button-font-letter-spacing": "0",
  
  "--font-caption-font-family": "lexend",
  "--font-caption-font-size": "16",
  "--font-caption-font-weight": "regular",
  "--font-caption-font-letter-spacing": "0",
  
  "--font-overline-font-family": "lexend",
  "--font-overline-font-size": "16",
  "--font-overline-font-weight": "regular",
  "--font-overline-font-letter-spacing": "0",
  
  "--font-body-1-font-family": "lexend",
  "--font-body-1-font-size": "16",
  "--font-body-1-font-weight-normal": "regular",
  "--font-body-1-font-weight-strong": "bold",
  "--font-body-1-font-letter-spacing": "0",
  
  "--font-body-2-font-family": "lexend",
  "--font-body-2-font-size": "16",
  "--font-body-2-font-weight-normal": "regular",
  "--font-body-2-font-weight-strong": "bold",
  "--font-body-2-font-letter-spacing": "0",
  
  "--font-subtitle-1-font-family": "lexend",
  "--font-subtitle-1-font-size": "16",
  "--font-subtitle-1-font-weight-normal": "regular",
  "--font-subtitle-1-font-weight-strong": "bold",
  "--font-subtitle-1-font-letter-spacing": "0",
  
  "--font-subtitle-2-font-family": "lexend",
  "--font-subtitle-2-font-size": "16",
  "--font-subtitle-2-font-weight-normal": "regular",
  "--font-subtitle-2-font-weight-strong": "bold",
  "--font-subtitle-2-font-letter-spacing": "0",
  
  "--layer-layer-0-property-surface": "#FFFFFF",
  "--layer-layer-0-property-padding": "24px",
  "--layer-layer-0-property-element-text-alert": "#000000",
  "--layer-layer-0-property-element-text-warning": "#000000",
  "--layer-layer-0-property-element-text-success": "#000000",
  "--layer-layer-0-property-element-text-color": "#000000",
  "--layer-layer-0-property-element-text-high-emphasis": "1",
  "--layer-layer-0-property-element-text-low-emphasis": "0.5",
  "--layer-layer-0-property-element-interactive-color": "#000000",
  "--layer-layer-0-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-1-property-surface": "#FFFFFF",
  "--layer-layer-1-property-border-color": "#000000",
  "--layer-layer-1-property-border-thickness": "1px",
  "--layer-layer-1-property-border-radius": "4px",
  "--layer-layer-1-property-padding": "24px",
  "--layer-layer-1-property-elevation": "1",
  "--layer-layer-1-property-element-text-alert": "#000000",
  "--layer-layer-1-property-element-text-warning": "#000000",
  "--layer-layer-1-property-element-text-success": "#000000",
  "--layer-layer-1-property-element-text-color": "#000000",
  "--layer-layer-1-property-element-text-high-emphasis": "1",
  "--layer-layer-1-property-element-text-low-emphasis": "0.5",
  "--layer-layer-1-property-element-interactive-color": "#000000",
  "--layer-layer-1-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-2-property-surface": "#FFFFFF",
  "--layer-layer-2-property-border-color": "#000000",
  "--layer-layer-2-property-border-thickness": "1px",
  "--layer-layer-2-property-border-radius": "4px",
  "--layer-layer-2-property-padding": "24px",
  "--layer-layer-2-property-elevation": "1",
  "--layer-layer-2-property-element-text-alert": "#000000",
  "--layer-layer-2-property-element-text-warning": "#000000",
  "--layer-layer-2-property-element-text-success": "#000000",
  "--layer-layer-2-property-element-text-color": "#000000",
  "--layer-layer-2-property-element-text-high-emphasis": "1",
  "--layer-layer-2-property-element-text-low-emphasis": "0.5",
  "--layer-layer-2-property-element-interactive-color": "#000000",
  "--layer-layer-2-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-3-property-surface": "#FFFFFF",
  "--layer-layer-3-property-border-color": "#000000",
  "--layer-layer-3-property-border-thickness": "1px",
  "--layer-layer-3-property-border-radius": "4px",
  "--layer-layer-3-property-padding": "24px",
  "--layer-layer-3-property-elevation": "1",
  "--layer-layer-3-property-element-text-alert": "#000000",
  "--layer-layer-3-property-element-text-warning": "#000000",
  "--layer-layer-3-property-element-text-success": "#000000",
  "--layer-layer-3-property-element-text-color": "#000000",
  "--layer-layer-3-property-element-text-high-emphasis": "1",
  "--layer-layer-3-property-element-text-low-emphasis": "0.5",
  "--layer-layer-3-property-element-interactive-color": "#000000",
  "--layer-layer-3-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-alternative-warning-property-surface": "gray",
  "--layer-layer-alternative-warning-property-padding": "24px",
  "--layer-layer-alternative-warning-property-element-text-color": "#000000",
  "--layer-layer-alternative-warning-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-warning-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-warning-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-warning-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-alternative-high-contrast-property-surface": "gray",
  "--layer-layer-alternative-high-contrast-property-padding": "24px",
  "--layer-layer-alternative-high-contrast-property-element-text-color": "#000000",
  "--layer-layer-alternative-high-contrast-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-high-contrast-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-high-contrast-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-high-contrast-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-alternative-primary-color-property-surface": "gray",
  "--layer-layer-alternative-primary-color-property-padding": "24px",
  "--layer-layer-alternative-primary-color-property-element-text-color": "#000000",
  "--layer-layer-alternative-primary-color-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-primary-color-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-primary-color-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-primary-color-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-alternative-alert-property-surface": "gray",
  "--layer-layer-alternative-alert-property-padding": "24px",
  "--layer-layer-alternative-alert-property-element-text-color": "#000000",
  "--layer-layer-alternative-alert-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-alert-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-alert-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-alert-property-element-interactive-high-emphasis": "1",
  
  "--layer-layer-alternative-success-property-surface": "gray",
  "--layer-layer-alternative-success-property-padding": "24px",
  "--layer-layer-alternative-success-property-element-text-color": "#000000",
  "--layer-layer-alternative-success-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-success-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-success-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-success-property-element-interactive-high-emphasis": "1",
}

const DARK_MODE: ThemeVars = {
  // Define dark mode overrides when available
}

function applyTheme(theme: ThemeVars) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value)
  }
}

export function CodePenPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [customVars] = useState<ThemeVars | null>(null)
  const [tokenVersion, setTokenVersion] = useState(0)
  useEffect(() => {
    const handler = () => setTokenVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const allFamilies = useMemo(() => {
    const fams = new Set<string>()
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('color/')) {
        const parts = e.name.split('/')
        if (parts.length === 3) fams.add(parts[1])
      }
    })
    try {
      const raw = localStorage.getItem('token-overrides')
      if (raw) {
        const overrides = JSON.parse(raw)
        if (overrides && typeof overrides === 'object') {
          Object.keys(overrides).forEach((name) => {
            if (typeof name === 'string' && name.startsWith('color/')) {
              const parts = name.split('/')
              if (parts.length === 3) fams.add(parts[1])
            }
          })
        }
      }
    } catch {}
    return Array.from(fams).filter((f) => f !== 'translucent').sort()
  }, [tokenVersion])
  const [palettes, setPalettes] = useState<PaletteEntry[]>(() => {
    const DEFAULTS: PaletteEntry[] = [
      { key: 'neutral', title: 'Neutral (Grayscale)', defaultLevel: 200 },
      { key: 'palette-1', title: 'Palette 1', defaultLevel: 500 },
      { key: 'palette-2', title: 'Palette 2', defaultLevel: 500 },
    ]
    try {
      const raw = localStorage.getItem('dynamic-palettes')
      if (raw) return JSON.parse(raw)
    } catch {}
    return DEFAULTS
  })
  const writePalettes = (next: PaletteEntry[]) => {
    setPalettes(next)
    try { localStorage.setItem('dynamic-palettes', JSON.stringify(next)) } catch {}
  }
  const getPersistedFamily = (key: string): string | undefined => {
    try {
      const raw = localStorage.getItem(`palette-grid-family:${key}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (key === 'neutral') return 'gray'
    if (key === 'palette-1') return 'salmon'
    if (key === 'palette-2') return 'mandarin'
    return undefined
  }
  const usedFamilies = useMemo(() => {
    const set = new Set<string>()
    palettes.forEach((p) => {
      const fam = p.initialFamily || getPersistedFamily(p.key)
      if (fam) set.add(fam)
    })
    return set
  }, [palettes, tokenVersion])
  const unusedFamilies = useMemo(() => allFamilies.filter((f) => !usedFamilies.has(f)), [allFamilies, usedFamilies])
  const canAddPalette = unusedFamilies.length > 0
  const addPalette = () => {
    if (!canAddPalette) return
    const family = unusedFamilies[0]
    const existing = new Set(palettes.map((p) => p.key))
    let i = 1
    while (existing.has(`palette-${i}`)) i += 1
    const nextKey = `palette-${i}`
    try { localStorage.setItem(`palette-grid-family:${nextKey}`, JSON.stringify(family)) } catch {}
    writePalettes([...palettes, { key: nextKey, title: `Palette ${i}`, defaultLevel: 500, initialFamily: family }])
  }
  const deletePalette = (key: string) => {
    if (key === 'neutral' || key === 'palette-1') return
    try { localStorage.removeItem(`palette-grid-family:${key}`) } catch {}
    writePalettes(palettes.filter((p) => p.key !== key))
  }
  const [paletteBindings, setPaletteBindings] = useState<Record<string, { token: string; hex: string }>>(() => {
    try {
      const raw = localStorage.getItem('palette-bindings')
      if (raw) return JSON.parse(raw)
    } catch {}
    return {}
  })
  const writeBindings = (next: Record<string, { token: string; hex: string }>) => {
    setPaletteBindings(next)
    try { localStorage.setItem('palette-bindings', JSON.stringify(next)) } catch {}
  }

  type OpacityBindingKey = 'disabled' | 'overlay'
  const [opacityBindings, setOpacityBindings] = useState<Record<OpacityBindingKey, { token: string; value: number }>>(() => {
    try {
      const raw = localStorage.getItem('palette-opacity-bindings')
      if (raw) return JSON.parse(raw)
    } catch {}
    return {} as any
  })
  const writeOpacityBindings = (next: Record<OpacityBindingKey, { token: string; value: number }>) => {
    setOpacityBindings(next)
    try { localStorage.setItem('palette-opacity-bindings', JSON.stringify(next)) } catch {}
  }

  const getToken = (name: string): any => Object.values(tokensJson as Record<string, any>).find((e: any) => e && e.name === name)
  const getTokenValue = (name: string): string | number | undefined => {
    const entry: any = getToken(name)
    return entry ? entry.value : undefined
  }
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let h = hex.trim()
    if (!h.startsWith('#')) h = '#' + h
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    if (!m) return { r: 0, g: 0, b: 0 }
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  }
  const alphaColor = (hex: string, alpha: number): string => {
    const { r, g, b } = hexToRgb(hex)
    const a = Math.max(0, Math.min(1, alpha))
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const relativeLuminance = (hex: string): number => {
    const { r, g, b } = hexToRgb(hex)
    const srgb = [r, g, b].map((v) => v / 255)
    const lin = srgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))) as [number, number, number]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }

  const contrastRatio = (hex1: string, hex2: string): number => {
    const L1 = relativeLuminance(hex1)
    const L2 = relativeLuminance(hex2)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const pickAATextColor = (toneHex: string): string => {
    const black = '#000000'
    const white = '#ffffff'
    const cBlack = contrastRatio(toneHex, black)
    const cWhite = contrastRatio(toneHex, white)
    const AA = 4.5
    if (cBlack >= AA && cWhite >= AA) return cBlack >= cWhite ? black : white
    if (cBlack >= AA) return black
    if (cWhite >= AA) return white
    return cBlack >= cWhite ? black : white
  }

  const applyAliasOnTones = () => {
    try {
      const style = getComputedStyle(document.documentElement)
      const read = (v: string): string | null => (style.getPropertyValue(v) || '').trim() || null
      const set = (k: string, v: string) => document.documentElement.style.setProperty(k, v)
      const alertHex = read('--palette-alert')
      const warnHex = read('--palette-warning')
      const successHex = read('--palette-success')
      if (alertHex) set('--palette-alert-on-tone', pickAATextColor(alertHex))
      if (warnHex) set('--palette-warning-on-tone', pickAATextColor(warnHex))
      if (successHex) set('--palette-success-on-tone', pickAATextColor(successHex))
      // Provide emphasis defaults (can be refined later if needed)
      set('--palette-alert-high-emphasis', '1')
      set('--palette-alert-low-emphasis', '0.5')
      set('--palette-warning-high-emphasis', '1')
      set('--palette-warning-low-emphasis', '0.5')
      set('--palette-success-high-emphasis', '1')
      set('--palette-success-low-emphasis', '0.5')
    } catch {}
  }

  // extractCssVarsFromObject helper retained in varsUtil in app shells

  // Upload moved to header shells

  

  // --- Theme.json resolver for palette scales ---
  const themeIndex = useMemo(() => {
    const bucket: Record<string, any> = {}
    const entries = (themeJson as any)?.RecursicaBrand ? Object.values((themeJson as any).RecursicaBrand as Record<string, any>) : []
    ;(entries as any[]).forEach((e) => {
      if (e && typeof e.name === 'string' && typeof e.mode === 'string') {
        bucket[`${e.mode}::${e.name}`] = e
      }
    })
    return bucket
  }, [])

  

  const resolveThemeRef = (ref: any, modeLabel: 'Light' | 'Dark'): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'string' || typeof ref === 'number') return ref
    if (typeof ref === 'object') {
      const coll = ref.collection
      const name = ref.name
      if (coll === 'Tokens' && typeof name === 'string') {
        return getTokenValue(name)
      }
      if (coll === 'Theme' && typeof name === 'string') {
        const entry = themeIndex[`${modeLabel}::${name}`]
        if (!entry) return undefined
        return resolveThemeRef(entry.value, modeLabel)
      }
    }
    return undefined
  }

  const applyThemePalettesFromJson = (modeLabel: 'Light' | 'Dark') => {
    const levels = ['900','800','700','600','500','400','300','200','100','050']
    const vars: Record<string, string> = {}
    palettes.forEach((p) => {
      const pk = p.key
      levels.forEach((lvl) => {
        const onToneName = `palette/${pk}/${lvl}/on-tone`
        const hiName = `palette/${pk}/${lvl}/high-emphasis`
        const loName = `palette/${pk}/${lvl}/low-emphasis`
        const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
        const hi = resolveThemeRef((themeIndex as any)[`${modeLabel}::${hiName}`]?.value ?? { collection: 'Theme', name: hiName }, modeLabel)
        const lo = resolveThemeRef((themeIndex as any)[`${modeLabel}::${loName}`]?.value ?? { collection: 'Theme', name: loName }, modeLabel)
        if (typeof onTone === 'string') vars[`--palette-${pk}-${lvl}-on-tone`] = onTone
        if (typeof hi === 'number' || typeof hi === 'string') vars[`--palette-${pk}-${lvl}-high-emphasis`] = String(hi)
        if (typeof lo === 'number' || typeof lo === 'string') vars[`--palette-${pk}-${lvl}-low-emphasis`] = String(lo)
      })
    })
    applyCssVars(vars)
  }

  useEffect(() => {
    applyTheme(LIGHT_MODE)
    // set initial switch background for light mode
    const el = document.getElementById('darkModeSwitch') as HTMLDivElement | null
    if (el) el.style.backgroundColor = 'var(--color-neutral-300)'
    // initialize palette swatches defaults from Tokens.json
    try {
      const colors: Record<string, string> = {}
      const get = (name: string): string | undefined => {
        const entry = Object.values(tokensJson as Record<string, any>).find((e: any) => e && e.name === name)
        return entry ? String(entry.value) : undefined
      }
      const defaults: Record<string, { token: string; hex: string }> = {
        '--palette-black': { token: 'color/gray/1000', hex: get('color/gray/1000') || '#000000' },
        '--palette-white': { token: 'color/gray/000', hex: get('color/gray/000') || '#ffffff' },
        '--palette-alert': { token: 'color/mandy/500', hex: get('color/mandy/500') || get('color/mandy/600') || '#d40d0d' },
        '--palette-warning': { token: 'color/mandarin/500', hex: get('color/mandarin/500') || '#fc7527' },
        '--palette-success': { token: 'color/greensheen/500', hex: get('color/greensheen/500') || '#008b38' },
      }
      const merged = { ...defaults, ...paletteBindings }
      Object.entries(merged).forEach(([cssVar, info]) => { colors[cssVar] = info.hex })
      writeBindings(merged)
      applyCssVars(colors)
      // Seed palette scale variables from Theme.json (Light mode)
      applyThemePalettesFromJson('Light')
      applyAliasOnTones()
    } catch {}
  }, [])

  useEffect(() => {
    const base = isDarkMode ? DARK_MODE : LIGHT_MODE
    const merged = customVars ? { ...base, ...customVars } : base
    applyTheme(merged)
    // Update palette scale variables for current mode
    applyThemePalettesFromJson(isDarkMode ? 'Dark' : 'Light')
  }, [isDarkMode, customVars, palettes])

  // Handle palette reset requests from shells (reset to defaults and clear primary selections)
  useEffect(() => {
    const DEFAULTS: PaletteEntry[] = [
      { key: 'neutral', title: 'Neutral (Grayscale)', defaultLevel: 200 },
      { key: 'palette-1', title: 'Palette 1', defaultLevel: 500 },
      { key: 'palette-2', title: 'Palette 2', defaultLevel: 500 },
    ]
    const onReset = () => {
      // Remove any custom primary selections
      try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i) || ''
          if (k.startsWith('palette-primary-level:')) keys.push(k)
        }
        keys.forEach((k) => localStorage.removeItem(k))
      } catch {}
      // Reset palettes to defaults (removes any extras)
      writePalettes(DEFAULTS)
    }
    window.addEventListener('paletteReset', onReset as any)
    return () => window.removeEventListener('paletteReset', onReset as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="theme-mode-label" style={{ margin: 0 }}>Palettes</h2>
          <div style={{ display: 'inline-flex', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setIsDarkMode(false)}
              style={{ padding: '6px 10px', border: 'none', background: !isDarkMode ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: !isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Light</button>
            <button
              onClick={() => setIsDarkMode(true)}
              style={{ padding: '6px 10px', border: 'none', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', background: isDarkMode ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Dark</button>
          </div>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Core</h3>
            <button type="button" onClick={addPalette} disabled={!canAddPalette} style={{ padding: '6px 10px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: canAddPalette ? 'pointer' : 'not-allowed', opacity: canAddPalette ? 1 : 0.5 }}>Add Palette</button>
          </div>

          <table className="color-swatches">
            <thead>
              <tr>
                <th>Black</th>
                <th>White</th>
                <th>Alert</th>
                <th>Warn</th>
                <th>Success</th>
                <th>
                  Disabled
                  <br />(opacity)
                </th>
                <th>
                  Overlay
                  <br />(opacity)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
              <td className="swatch-box" style={{ backgroundColor: paletteBindings['--palette-black']?.hex || 'var(--palette-black)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--palette-black')} />
              <td className="swatch-box" style={{ backgroundColor: paletteBindings['--palette-white']?.hex || 'var(--palette-white)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--palette-white')} />
              <td className="swatch-box" style={{ backgroundColor: paletteBindings['--palette-alert']?.hex || 'var(--palette-alert)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--palette-alert')} />
              <td className="swatch-box" style={{ backgroundColor: paletteBindings['--palette-warning']?.hex || 'var(--palette-warning)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--palette-warning')} />
              <td className="swatch-box" style={{ backgroundColor: paletteBindings['--palette-success']?.hex || 'var(--palette-success)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--palette-success')} />
              {(() => {
                const blackHex = (paletteBindings['--palette-black']?.hex) || String(getTokenValue('color/gray/1000') || '#000000')
                const faintDefault: any = getTokenValue('opacity/faint')
                const veiledDefault: any = getTokenValue('opacity/veiled')
                const toAlpha = (v: any) => {
                  const n = typeof v === 'number' ? v : parseFloat(String(v))
                  if (!Number.isFinite(n)) return 1
                  return n <= 1 ? n : n / 100
                }
                const faint = toAlpha(opacityBindings.disabled?.value ?? faintDefault)
                const veiled = toAlpha(opacityBindings.overlay?.value ?? veiledDefault)
                const disabledColor = alphaColor(blackHex, faint)
                const overlayColor = alphaColor(blackHex, veiled)
                return (
                  <>
                    <td className="swatch-box disabled" style={{ backgroundColor: disabledColor, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'disabled')} />
                    <td className="swatch-box overlay" style={{ backgroundColor: overlayColor, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'overlay')} />
                  </>
                )
              })()}
              </tr>
              {/* Removed hex values row under swatches per request */}
            </tbody>
          </table>

          {palettes.map((p) => (
            <PaletteGrid
              key={p.key}
              paletteKey={p.key}
              title={p.title}
              defaultLevel={p.defaultLevel}
              mode={isDarkMode ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        {/* palette swatch picker menu */}
        <SwatchPicker onSelect={(cssVar: string, tokenName: string, hex: string) => {
          document.documentElement.style.setProperty(cssVar, hex)
          writeBindings({ ...paletteBindings, [cssVar]: { token: tokenName, hex } })
          applyAliasOnTones()
        }} />

        <OpacityPicker onSelect={(slot: 'disabled' | 'overlay', tokenName: string, value: number) => {
          const next = { ...opacityBindings, [slot]: { token: tokenName, value } } as any
          writeOpacityBindings(next)
        }} />

        
        
        
        
        
      </div>
    </div>
  )
}

export { applyTheme, LIGHT_MODE }

function SwatchPicker({ onSelect }: { onSelect: (cssVar: string, tokenName: string, hex: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const options = useMemo(() => {
    const fams = new Set<string>()
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('color/')) {
        const parts = e.name.split('/')
        if (parts.length === 3) fams.add(parts[1])
      }
    })
    const families = Array.from(fams).filter((f) => f !== 'translucent').sort()
    const byFamily: Record<string, Array<{ level: string; name: string; value: string }>> = {}
    families.forEach((f) => { byFamily[f] = [] })
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('color/')) {
        const parts = e.name.split('/')
        if (parts.length === 3) {
          const fam = parts[1]
          const lvl = parts[2]
          if (!byFamily[fam]) byFamily[fam] = []
          byFamily[fam].push({ level: lvl, name: e.name, value: String(e.value) })
        }
      }
    })
    Object.values(byFamily).forEach((arr) => arr.sort((a, b) => Number(b.level) - Number(a.level)))
    return byFamily
  }, [])

  ;(window as any).openPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetVar(cssVar)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetVar) return null
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const labelCol = 110
  const swatch = 18
  const gap = 1
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32
  return (
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 1100 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { left: Math.max(0, Math.min(window.innerWidth - overlayWidth, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick color</div>
        <button onClick={() => { setAnchor(null); setTargetVar(null) }} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {Object.entries(options).map(([family, items]) => (
          <div key={family} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{toTitle(family)}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
              {items.map((it) => (
                <div key={it.name} title={it.name} onClick={() => {
                  onSelect(targetVar!, it.name, it.value)
                  setAnchor(null); setTargetVar(null)
                }} style={{ width: swatch, height: swatch, background: it.value, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flex: '0 0 auto' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpacityPicker({ onSelect }: { onSelect: (slot: 'disabled' | 'overlay', tokenName: string, value: number) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [slot, setSlot] = useState<'disabled' | 'overlay' | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const options = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('opacity/')) {
        const n = Number(e.value)
        if (Number.isFinite(n)) list.push({ name: e.name, value: n })
      }
    })
    list.sort((a, b) => a.value - b.value)
    return list
  }, [])

  ;(window as any).openOpacityPicker = (el: HTMLElement, s: 'disabled' | 'overlay') => {
    setAnchor(el)
    setSlot(s)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 260)
    setPos({ top, left })
  }

  if (!anchor || !slot) return null
  return (
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: 240, background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 1100 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { left: Math.max(0, Math.min(window.innerWidth - 240, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick opacity</div>
        <button onClick={() => { setAnchor(null); setSlot(null) }} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {options.map((opt) => (
          <button key={opt.name} onClick={() => { onSelect(slot, opt.name, opt.value); setAnchor(null); setSlot(null) }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
            <span style={{ textTransform: 'capitalize' }}>{opt.name.replace('opacity/','')}</span>
            <span>{`${Math.round(opt.value <= 1 ? opt.value * 100 : opt.value)}%`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


