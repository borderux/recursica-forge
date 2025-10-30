import { useEffect, useMemo, useRef, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from './tokenOverrides'

type PaletteGridProps = {
  paletteKey: string
  title?: string
  defaultLevel?: string | number
  initialFamily?: string
  mode: 'Light' | 'Dark'
  deletable?: boolean
  onDelete?: () => void
}

const LEVELS: Array<number> = [900, 800, 700, 600, 500, 400, 300, 200, 100, 50]

function toLevelString(level: number): string {
  if (level === 50) return '050'
  return String(level)
}

function toTokenLevel(levelStr: string): string {
  // Tokens use 50 (no leading zero), but CSS vars use 050
  return levelStr === '050' ? '50' : levelStr
}

export default function PaletteGrid({ paletteKey, title, defaultLevel = 200, initialFamily, mode, deletable, onDelete }: PaletteGridProps) {
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const defaultLevelStr = typeof defaultLevel === 'number' ? toLevelString(defaultLevel) : String(defaultLevel).padStart(3, '0')
  const headerLevels = LEVELS.map(toLevelString)

  // Track token override changes and re-apply palette mapping (declared early for dependencies below)
  const [overrideVersion, forceOverrideVersion] = useState(0)
  useEffect(() => {
    const handler = () => forceOverrideVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])

  const families = useMemo(() => {
    const fams = new Set<string>(Object.keys((tokensJson as any)?.tokens?.color || {}))
    fams.delete('translucent')
    const list = Array.from(fams)
    list.sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [overrideVersion])

  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    if (typeof initialFamily === 'string' && initialFamily) return initialFamily
    try {
      const raw = localStorage.getItem(`palette-grid-family:${paletteKey}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    // sensible fallbacks
    if (paletteKey === 'neutral') return 'gray'
    if (paletteKey === 'palette-1') return 'salmon'
    if (paletteKey === 'palette-2') return 'mandarin'
    return families[0] || ''
  })

  useEffect(() => {
    try { localStorage.setItem(`palette-grid-family:${paletteKey}`, JSON.stringify(selectedFamily)) } catch {}
    try { window.dispatchEvent(new CustomEvent('paletteFamilyChanged', { detail: { key: paletteKey, family: selectedFamily } })) } catch {}
  }, [paletteKey, selectedFamily])

  // Track changes from other palette grids
  const [, forceVersion] = useState(0)
  useEffect(() => {
    const handler = () => forceVersion((v) => v + 1)
    window.addEventListener('paletteFamilyChanged', handler as any)
    return () => window.removeEventListener('paletteFamilyChanged', handler as any)
  }, [])

  const readAllSelections = (): Record<string, string> => {
    const out: Record<string, string> = {}
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i) || ''
        if (k.startsWith('palette-grid-family:')) {
          const key = k.slice('palette-grid-family:'.length)
          try {
            const v = JSON.parse(localStorage.getItem(k) || '""')
            if (typeof v === 'string' && v) out[key] = v
          } catch {}
        }
      }
    } catch {}
    return out
  }

  const selections = readAllSelections()
  const usedByOthers = new Set(Object.entries(selections).filter(([k]) => k !== paletteKey).map(([, v]) => v))
  const availableFamilies = families.filter((f) => f === selectedFamily || !usedByOthers.has(f))

  const themeIndex = useMemo(() => {
    const out: Record<string, { value: any }> = {}
    const visit = (node: any, prefix: string, mode: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        out[`${mode}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, mode))
    }
    if ((themeJson as any)?.light?.palette) visit((themeJson as any).light.palette, 'palette', 'Light')
    if ((themeJson as any)?.dark?.palette) visit((themeJson as any).dark.palette, 'palette', 'Dark')
    return out
  }, [])

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    let h = (hex || '').trim()
    if (!h) return null
    if (!h.startsWith('#')) h = '#' + h
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    if (!m) return null
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  }

  function relativeLuminance(hex: string): number {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0
    const srgb = [rgb.r, rgb.g, rgb.b].map((c) => c / 255)
    const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as number[]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }

  function contrastRatio(hex1: string, hex2: string): number {
    const L1 = relativeLuminance(hex1)
    const L2 = relativeLuminance(hex2)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  function rgbToHexSafe(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
    const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  function blendHexOver(hexFg: string, hexBg: string, alpha: number): string {
    const fg = hexToRgb(hexFg) || { r: 0, g: 0, b: 0 }
    const bg = hexToRgb(hexBg) || { r: 255, g: 255, b: 255 }
    const a = Math.max(0, Math.min(1, alpha))
    const r = a * fg.r + (1 - a) * bg.r
    const g = a * fg.g + (1 - a) * bg.g
    const b = a * fg.b + (1 - a) * bg.b
    return rgbToHexSafe(r, g, b)
  }

  // kept for potential future local contrast calc needs
  // function pickOnTone(toneHex: string): string {
  //   const rgb = hexToRgb(toneHex)
  //   if (!rgb) return '#000000'
  //   const srgb = ['r','g','b'].map((k) => (rgb as any)[k] / 255)
  //   const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as number[]
  //   const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  //   return luminance < 0.5 ? '#ffffff' : '#000000'
  // }

  const getTokenValueByName = (name: string): string | undefined => {
    try {
      const overrides = readOverrides() as Record<string, any>
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
        const ov = overrides[name]
        if (ov != null) return String(ov)
      }
    } catch {}
    const parts = (name || '').split('/')
    if (parts[0] === 'color' && parts.length >= 3) return (tokensJson as any)?.tokens?.color?.[parts[1]]?.[parts[2]]?.$value
    if (parts[0] === 'opacity' && parts[1]) return String((tokensJson as any)?.tokens?.opacity?.[parts[1]]?.$value)
    return undefined
  }

  const resolveThemeRef = (ref: any, modeLabel: 'Light' | 'Dark'): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'number') return ref
    if (typeof ref === 'string') {
      const s = ref.trim()
      if (!s.startsWith('{')) return s
      const inner = s.slice(1, -1)
      if (inner.startsWith('token.')) return getTokenValueByName(inner.replace(/^token\./, '').replace(/\./g, '/'))
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
      if (coll === 'Tokens' && typeof name === 'string') return getTokenValueByName(name)
      if (coll === 'Theme' && typeof name === 'string') {
        const entry = (themeIndex as any)[`${modeLabel}::${name}`]
        return resolveThemeRef(entry?.value, modeLabel)
      }
    }
    return undefined
  }

  const normalizeOpacity = (v: any): string | undefined => {
    if (v == null) return undefined
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    if (!Number.isFinite(n)) return undefined
    return n <= 1 ? String(n) : String(n / 100)
  }

  const getOpacityToken = (name: string): number => {
    const v = getTokenValueByName(name)
    const n = v == null ? NaN : Number(v)
    if (!Number.isFinite(n)) return 1
    return n <= 1 ? n : n / 100
  }

  const opacityTokenValuesAsc = useMemo(() => {
    const vals: number[] = []
    const src = (tokensJson as any)?.tokens?.opacity || {}
    Object.values(src).forEach((entry: any) => {
      const raw = Number(entry?.$value)
      if (!Number.isFinite(raw)) return
      const v = raw <= 1 ? raw : raw / 100
      if (v > 0 && v <= 1) vals.push(v)
    })
    if (!vals.some((v) => Math.abs(v - 1) < 1e-6)) vals.push(1)
    return Array.from(new Set(vals)).sort((a, b) => a - b)
  }, [tokensJson])

  function pickMinAlphaForAA(toneHex: string, dotHex: string): number {
    const AA = 4.5
    for (const a of opacityTokenValuesAsc) {
      const blended = blendHexOver(dotHex, toneHex, a)
      if (contrastRatio(blended, toneHex) >= AA) return a
    }
    // fallback: solid
    return 1
  }

  // getCssVarNumber removed (unused)

  const titleCase = (s: string): string => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  // Choose black/white text that best satisfies WCAG AA (4.5:1). If neither meets, choose max contrast.
  function pickAATextColor(toneHex: string): string {
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

  const resolveDefaultLevelForPalette = useMemo(() => {
    const key = `palette/${paletteKey}/default/tone`
    const entry = (themeIndex as any)[`${mode}::${key}`]
    const ref = entry?.value
    const name: string | undefined = typeof ref === 'object' ? ref?.name : undefined
    if (name && /\/\d{3}\//.test(name)) {
      const m = name.match(/\/(\d{3})\//)
      if (m) return m[1]
    }
    return defaultLevelStr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey, themeIndex, defaultLevelStr, mode])

  // Primary level: initialize from Theme.json default, allow user override per palette
  const [primaryLevelStr, setPrimaryLevelStr] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(`palette-primary-level:${paletteKey}`)
      if (raw) {
        const v = JSON.parse(raw)
        if (typeof v === 'string') return v.padStart(3, '0')
      }
    } catch {}
    return resolveDefaultLevelForPalette
  })

  useEffect(() => {
    try { localStorage.setItem(`palette-primary-level:${paletteKey}`, JSON.stringify(primaryLevelStr)) } catch {}
  }, [paletteKey, primaryLevelStr])

  const [hoverLevelStr, setHoverLevelStr] = useState<string | null>(null)

  const optionSwatchHex = (family: string): string | undefined => {
    const lvl = primaryLevelStr
    return getTokenValueByName(`color/${family}/${lvl}`)
  }

  const getSelectedFamilyHexForLevel = (lvl: string): string | undefined => {
    if (!selectedFamily) return undefined
    return getTokenValueByName(`color/${selectedFamily}/${toTokenLevel(lvl)}`)
  }

  const applyThemeMappingsFromJson = (modeLabel: 'Light' | 'Dark') => {
    const root = document.documentElement
    const levels = headerLevels
    levels.forEach((lvl) => {
      const onToneName = `palette/${paletteKey}/${lvl}/on-tone`
      const hiName = `palette/${paletteKey}/${lvl}/high-emphasis`
      const loName = `palette/${paletteKey}/${lvl}/low-emphasis`
      const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
      const hi = resolveThemeRef((themeIndex as any)[`${modeLabel}::${hiName}`]?.value ?? { collection: 'Theme', name: hiName }, modeLabel)
      const lo = resolveThemeRef((themeIndex as any)[`${modeLabel}::${loName}`]?.value ?? { collection: 'Theme', name: loName }, modeLabel)
      if (typeof onTone === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-on-tone`, onTone)
      const hiNorm = normalizeOpacity(hi)
      if (typeof hiNorm === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-high-emphasis`, hiNorm)
      const loNorm = normalizeOpacity(lo)
      if (typeof loNorm === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-low-emphasis`, loNorm)
    })
  }

  const applyFamilyToCssVars = (family: string, modeLabel: 'Light' | 'Dark') => {
    const root = document.documentElement
    headerLevels.forEach((lvl) => {
      const tokenName = `color/${family}/${toTokenLevel(lvl)}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        root.style.setProperty(`--palette-${paletteKey}-${lvl}-tone`, hex)
      }
      // map on-tone and emphasis from Theme.json definitions
      const onToneName = `palette/${paletteKey}/${lvl}/on-tone`
      const hiName = `palette/${paletteKey}/${lvl}/high-emphasis`
      const loName = `palette/${paletteKey}/${lvl}/low-emphasis`
      const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
      const hi = resolveThemeRef((themeIndex as any)[`${modeLabel}::${hiName}`]?.value ?? { collection: 'Theme', name: hiName }, modeLabel)
      const lo = resolveThemeRef((themeIndex as any)[`${modeLabel}::${loName}`]?.value ?? { collection: 'Theme', name: loName }, modeLabel)
      // Enforce AA on-tone against the current tone hex when available
      if (typeof hex === 'string') {
        const aa = pickAATextColor(hex)
        let finalOnTone: string | undefined = typeof onTone === 'string' ? onTone : aa
        if (typeof finalOnTone === 'string') {
          if (contrastRatio(hex, finalOnTone) < 4.5) finalOnTone = aa
          root.style.setProperty(`--palette-${paletteKey}-${lvl}-on-tone`, finalOnTone)
        }
      } else if (typeof onTone === 'string') {
        root.style.setProperty(`--palette-${paletteKey}-${lvl}-on-tone`, onTone)
      }
      const hiNorm = normalizeOpacity(hi)
      if (typeof hiNorm === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-high-emphasis`, hiNorm)
      const loNorm = normalizeOpacity(lo)
      if (typeof loNorm === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-low-emphasis`, loNorm)
    })
  }

  useEffect(() => {
    // First apply Theme.json mappings (ensures on-tone and opacity are consistent)
    applyThemeMappingsFromJson(mode)
    // Then, if a family is selected, map tones from that family onto this palette
    if (selectedFamily) applyFamilyToCssVars(selectedFamily, mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFamily, mode, overrideVersion])

  // Expose a primary alias CSS variable for this palette
  useEffect(() => {
    const lvl = primaryLevelStr
    const hex = getSelectedFamilyHexForLevel(lvl) || '#ffffff'
    try {
      const root = document.documentElement
      const computed = getComputedStyle(root)
      root.style.setProperty(`--palette-${paletteKey}-primary-tone`, hex)
      const onTone = (computed.getPropertyValue(`--palette-${paletteKey}-${lvl}-on-tone`) || '').trim()
      if (onTone) root.style.setProperty(`--palette-${paletteKey}-primary-on-tone`, onTone)
      const hi = (computed.getPropertyValue(`--palette-${paletteKey}-${lvl}-high-emphasis`) || '').trim()
      if (hi) root.style.setProperty(`--palette-${paletteKey}-primary-high-emphasis`, hi)
      const lo = (computed.getPropertyValue(`--palette-${paletteKey}-${lvl}-low-emphasis`) || '').trim()
      if (lo) root.style.setProperty(`--palette-${paletteKey}-primary-low-emphasis`, lo)
    } catch {}
  }, [primaryLevelStr, selectedFamily, overrideVersion, mode, paletteKey])

  return (
    <div className="palette-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title ?? paletteKey}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {deletable && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete palette"
              style={{ padding: '6px 10px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
            >Delete</button>
          )}
          <FamilyDropdown
            paletteKey={paletteKey}
            families={availableFamilies}
            selectedFamily={selectedFamily}
            onSelect={(fam) => {
              if (fam !== selectedFamily && usedByOthers.has(fam)) return
              setSelectedFamily(fam)
            }}
            titleCase={titleCase}
            getSwatchHex={optionSwatchHex}
          />
        </div>
      </div>
      <table className="color-palettes" style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 80 }}>Emphasis</th>
            {headerLevels.map((lvl) => (
              <th
                key={lvl}
                className={lvl === primaryLevelStr ? 'default' : undefined}
                onMouseEnter={() => setHoverLevelStr(lvl)}
                onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                onClick={() => setPrimaryLevelStr(lvl)}
                title={lvl === primaryLevelStr ? 'Primary' : 'Set as Primary'}
                style={{ cursor: 'pointer', width: lvl === primaryLevelStr ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%' }}
              >{lvl}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="high-emphasis">
            <td>High</td>
            {headerLevels.map((lvl) => {
              const toneHex = getSelectedFamilyHexForLevel(lvl) || '#ffffff'
              const hiOpacity = getOpacityToken('opacity/solid')
              // choose dot color for AA 4.5:1 when possible
              const black = '#000000'
              const white = '#ffffff'
              const cBlack = contrastRatio(toneHex, black)
              const cWhite = contrastRatio(toneHex, white)
              const hiDot = (cBlack >= 4.5 || cBlack >= cWhite) ? black : white
              return (
                <td
                  key={`high-${lvl}`}
                  className={`palette-box${lvl === primaryLevelStr ? ' default' : ''}`}
                  style={{ backgroundColor: toneHex, cursor: 'pointer', width: lvl === primaryLevelStr ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%' }}
                  title={lvl === primaryLevelStr ? 'Primary' : 'Set as Primary'}
                  onMouseEnter={() => setHoverLevelStr(lvl)}
                  onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                  onClick={() => setPrimaryLevelStr(lvl)}
                >
                  <div className="palette-dot" style={{ backgroundColor: hiDot, opacity: hiOpacity }} />
                </td>
              )
            })}
          </tr>
          <tr className="low-emphasis">
            <td>Low</td>
            {headerLevels.map((lvl) => {
              const toneHex = getSelectedFamilyHexForLevel(lvl) || '#ffffff'
              // Use same dot color as high (ensuring contrast choice is consistent)
              const black = '#000000'
              const white = '#ffffff'
              const cBlack = contrastRatio(toneHex, black)
              const cWhite = contrastRatio(toneHex, white)
              const hiDot = (cBlack >= 4.5 || cBlack >= cWhite) ? black : white
              const chosenOpacity = pickMinAlphaForAA(toneHex, hiDot)
              return (
                <td
                  key={`low-${lvl}`}
                  className={`palette-box${lvl === primaryLevelStr ? ' default' : ''}`}
                  style={{ backgroundColor: toneHex, cursor: 'pointer', width: lvl === primaryLevelStr ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%' }}
                  title={lvl === primaryLevelStr ? 'Primary' : 'Set as Primary'}
                  onMouseEnter={() => setHoverLevelStr(lvl)}
                  onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                  onClick={() => setPrimaryLevelStr(lvl)}
                >
                  <div className="palette-dot" style={{ backgroundColor: hiDot, opacity: chosenOpacity }} />
                </td>
              )
            })}
          </tr>
          <tr>
            <td></td>
            {headerLevels.map((lvl) => (
              <td key={`primary-${lvl}`} className={lvl === primaryLevelStr ? 'default' : undefined} style={{ textAlign: 'center', verticalAlign: 'top', height: 28 }}>
                {lvl === primaryLevelStr ? (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      lineHeight: '14px',
                      padding: '2px 8px',
                      border: '1px solid var(--layer-layer-1-property-border-color)',
                      borderRadius: 999,
                      background: 'transparent',
                      textTransform: 'capitalize',
                    }}
                  >primary</span>
                ) : hoverLevelStr === lvl ? (
                  <button
                    onClick={() => setPrimaryLevelStr(lvl)}
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      lineHeight: '14px',
                      padding: '2px 8px',
                      border: '1px dashed var(--layer-layer-1-property-border-color)',
                      borderRadius: 999,
                      background: 'transparent',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                    title="Set as Primary"
                  >Set as Primary</button>
                ) : null}
              </td>
            ))}
          </tr>
          {/* Removed tone hex row per request */}
        </tbody>
      </table>
    </div>
  )
}

function FamilyDropdown({
  paletteKey,
  families,
  selectedFamily,
  onSelect,
  titleCase,
  getSwatchHex,
}: {
  paletteKey: string
  families: string[]
  selectedFamily: string
  onSelect: (fam: string) => void
  titleCase: (s: string) => string
  getSwatchHex: (fam: string) => string | undefined
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const [tokenVersion, setTokenVersion] = useState(0)

  // ntc loader for friendly naming fallback
  let ntcReadyPromise: Promise<void> | null = null
  function ensureNtcLoaded(): Promise<void> {
    if ((window as any).ntc) return Promise.resolve()
    if (ntcReadyPromise) return ntcReadyPromise
    ntcReadyPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://chir.ag/projects/ntc/ntc.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load ntc.js'))
      document.head.appendChild(s)
    })
    return ntcReadyPromise
  }
  async function getNtcName(hex: string): Promise<string | null> {
    try {
      await ensureNtcLoaded()
      const res = (window as any).ntc?.name?.(hex)
      if (Array.isArray(res) && typeof res[1] === 'string' && res[1]) return res[1]
    } catch {}
    return null
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    const handler = () => setTokenVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    window.addEventListener('familyNamesChanged', handler as any)
    return () => {
      window.removeEventListener('tokenOverridesChanged', handler as any)
      window.removeEventListener('familyNamesChanged', handler as any)
    }
  }, [])

  // Auto-generate friendly names for any families missing labels
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem('family-friendly-names')
        const map = raw ? JSON.parse(raw || '{}') || {} : {}
        let changed = false
        for (const fam of families) {
          if (map[fam]) continue
          const hex = getSwatchHex(fam)
          if (typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex.trim())) {
            const normalized = hex.startsWith('#') ? hex : `#${hex}`
            const label = await getNtcName(normalized)
            if (label && label.trim()) {
              map[fam] = label.trim()
              changed = true
            }
          }
        }
        if (changed) {
          try { localStorage.setItem('family-friendly-names', JSON.stringify(map)) } catch {}
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
          setTokenVersion((v) => v + 1)
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [families])

  const getFriendlyName = (family: string): string => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) {
        const map = JSON.parse(raw)
        const v = map?.[family]
        if (typeof v === 'string' && v.trim()) return v
      }
    } catch {}
    return titleCase(family)
  }

  const currentHex = getSwatchHex(selectedFamily)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-token-version={tokenVersion}>
      <label htmlFor={`family-${paletteKey}`} style={{ fontSize: 12, opacity: 0.8 }}>Color Token</label>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          id={`family-${paletteKey}`}
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer', minWidth: 160, justifyContent: 'space-between' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: currentHex || 'transparent' }} />
            <span>{getFriendlyName(selectedFamily)}</span>
          </span>
          <span aria-hidden style={{ opacity: 0.6 }}>▾</span>
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1200, background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 6, minWidth: 200 }}>
            <div style={{ maxHeight: 280, overflow: 'auto', display: 'grid' }}>
              {families.map((fam) => {
                const hex = getSwatchHex(fam)
                return (
                  <button
                    key={fam}
                    onClick={() => { onSelect(fam); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: hex || 'transparent' }} />
                    <span>{getFriendlyName(fam)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


