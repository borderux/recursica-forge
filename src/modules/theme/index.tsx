import './index.css'
import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { applyCssVars } from './varsUtil'

type ThemeVars = Record<string, string>

// const HSL = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`

const LIGHT_MODE: ThemeVars = {
  "--temp-disabled": "rgba(0,0,0,0.38)",
  "--temp-overlay": "rgba(0,0,0,0.68)",
  "--temp-elevation-0": "rgba(0,0,0,0.14)",

  "--palette-alert": "#000000",
  "--palette-black": "#000000",
  "--palette-success": "#000000",
  "--palette-warning": "#000000",
  "--palette-white": "#000000",
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

  // extractCssVarsFromObject helper retained in varsUtil in app shells

  // Upload moved to header shells

  

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
    } catch {}
  }, [])

  useEffect(() => {
    const base = isDarkMode ? DARK_MODE : LIGHT_MODE
    const merged = customVars ? { ...base, ...customVars } : base
    applyTheme(merged)
  }, [isDarkMode, customVars])

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

        <div className="section">
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
              <tr>
              <td>{(paletteBindings['--palette-black']?.hex ?? '').toUpperCase()}<br />{paletteBindings['--palette-black']?.token ?? ''}</td>
              <td>{(paletteBindings['--palette-white']?.hex ?? '').toUpperCase()}<br />{paletteBindings['--palette-white']?.token ?? ''}</td>
              <td>{(paletteBindings['--palette-alert']?.hex ?? '').toUpperCase()}<br />{paletteBindings['--palette-alert']?.token ?? ''}</td>
              <td>{(paletteBindings['--palette-warning']?.hex ?? '').toUpperCase()}<br />{paletteBindings['--palette-warning']?.token ?? ''}</td>
              <td>{(paletteBindings['--palette-success']?.hex ?? '').toUpperCase()}<br />{paletteBindings['--palette-success']?.token ?? ''}</td>
              {(() => {
                const faintRaw: any = opacityBindings.disabled?.value ?? getTokenValue('opacity/faint')
                const veiledRaw: any = opacityBindings.overlay?.value ?? getTokenValue('opacity/veiled')
                const pct = (v: any) => {
                  const n = typeof v === 'number' ? v : parseFloat(String(v))
                  if (!Number.isFinite(n)) return ''
                  return `${Math.round(n <= 1 ? n * 100 : n)}%`
                }
                return (
                  <>
                    <td>{pct(faintRaw)}<br />{opacityBindings.disabled?.token ?? 'opacity/faint'}</td>
                    <td>{pct(veiledRaw)}<br />{opacityBindings.overlay?.token ?? 'opacity/veiled'}</td>
                  </>
                )
              })()}
              </tr>
            </tbody>
          </table>

          <div className="palette-container">
            <h3>Neutral (Grayscale)</h3>
            <table className="color-palettes">
              <thead>
                <tr>
                  <th>Emphasis</th>
                  <th>900</th>
                  <th>800</th>
                  <th>700</th>
                  <th>600</th>
                  <th>500</th>
                  <th>400</th>
                  <th>300</th>
                  <th className="default">200</th>
                  <th>100</th>
                  <th>050</th>
                </tr>
              </thead>
              <tbody>
                <tr className="high-emphasis">
                  <td>High</td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-900-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-900-on-tone)', opacity: 'var(--palette-neutral-900-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-800-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-800-on-tone)', opacity: 'var(--palette-neutral-800-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-700-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-700-on-tone)', opacity: 'var(--palette-neutral-700-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-600-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-600-on-tone)', opacity: 'var(--palette-neutral-600-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-500-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-500-on-tone)', opacity: 'var(--palette-neutral-500-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-400-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-400-on-tone)', opacity: 'var(--palette-neutral-400-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-300-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-300-on-tone)', opacity: 'var(--palette-neutral-300-high-emphasis)' }} />
                  </td>
                  <td className="palette-box default" style={{ backgroundColor: 'var(--palette-neutral-200-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-200-on-tone)', opacity: 'var(--palette-neutral-200-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-100-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-100-on-tone)', opacity: 'var(--palette-neutral-100-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-050-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-050-on-tone)', opacity: 'var(--palette-neutral-050-high-emphasis)' }} />
                  </td>
                </tr>
                <tr className="low-emphasis">
                  <td>Low</td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-900-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-900-on-tone)', opacity: 'var(--palette-neutral-900-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-800-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-800-on-tone)', opacity: 'var(--palette-neutral-800-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-700-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-700-on-tone)', opacity: 'var(--palette-neutral-700-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-600-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-600-on-tone)', opacity: 'var(--palette-neutral-600-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-500-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-500-on-tone)', opacity: 'var(--palette-neutral-500-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-400-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-400-on-tone)', opacity: 'var(--palette-neutral-400-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-300-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-300-on-tone)', opacity: 'var(--palette-neutral-300-low-emphasis)' }} />
                  </td>
                  <td className="palette-box default" style={{ backgroundColor: 'var(--palette-neutral-200-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-200-on-tone)', opacity: 'var(--palette-neutral-200-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-100-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-100-on-tone)', opacity: 'var(--palette-neutral-100-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-050-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-050-on-tone)', opacity: 'var(--palette-neutral-050-low-emphasis)' }} />
                  </td>
                </tr>
                <tr>
                  <td>Tone</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td className="default">#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* palette swatch picker menu */}
        <SwatchPicker onSelect={(cssVar: string, tokenName: string, hex: string) => {
          document.documentElement.style.setProperty(cssVar, hex)
          writeBindings({ ...paletteBindings, [cssVar]: { token: tokenName, hex } })
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


