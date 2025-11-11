/**
 * PaletteGrid
 * Copied from modules/theme/PaletteGrid.tsx and adapted for the palettes module.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { contrastRatio, pickAAOnTone } from '../theme/contrastUtil'

type PaletteGridProps = {
  paletteKey: string
  title?: string
  defaultLevel?: string | number
  initialFamily?: string
  mode: 'Light' | 'Dark'
  deletable?: boolean
  onDelete?: () => void
}

const LEVELS: Array<number> = [1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50, 0]

function toLevelString(level: number): string {
  if (level === 50) return '050'
  if (level === 0) return '000'
  return String(level)
}

function toTokenLevel(levelStr: string): string {
  return levelStr
}

export default function PaletteGrid({ paletteKey, title, defaultLevel = 200, initialFamily, mode, deletable, onDelete }: PaletteGridProps) {
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const defaultLevelStr = typeof defaultLevel === 'number' ? toLevelString(defaultLevel) : String(defaultLevel).padStart(3, '0')
  const headerLevels = LEVELS.map(toLevelString)
  const [overrideVersion, forceOverrideVersion] = useState(0)
  useEffect(() => {
    const handler = () => forceOverrideVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const families = useMemo(() => {
    const fams = new Set<string>(Object.keys((tokensJson as any)?.tokens?.color || {}))
    try {
      const overrides = readOverrides() as Record<string, any>
      Object.keys(overrides || {}).forEach((name) => {
        if (typeof name !== 'string') return
        if (!name.startsWith('color/')) return
        const parts = name.split('/')
        const fam = parts[1]
        if (fam && fam !== 'translucent') fams.add(fam)
      })
    } catch {}
    fams.delete('translucent')
    const list = Array.from(fams)
    list.sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [tokensJson, overrideVersion])
  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    if (typeof initialFamily === 'string' && initialFamily) return initialFamily
    try {
      const raw = localStorage.getItem(`palette-grid-family:${paletteKey}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (paletteKey === 'neutral') return 'gray'
    if (paletteKey === 'palette-1') return 'salmon'
    if (paletteKey === 'palette-2') return 'mandarin'
    return families[0] || ''
  })
  useEffect(() => {
    try { localStorage.setItem(`palette-grid-family:${paletteKey}`, JSON.stringify(selectedFamily)) } catch {}
    try { window.dispatchEvent(new CustomEvent('paletteFamilyChanged', { detail: { key: paletteKey, family: selectedFamily } })) } catch {}
  }, [paletteKey, selectedFamily])
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
    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    if (root?.light?.palette) visit(root.light.palette, 'palette', 'Light')
    if (root?.dark?.palette) visit(root.dark.palette, 'palette', 'Dark')
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
  // Use shared AA util for on-tone selection
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
        let entry = (themeIndex as any)[`${mode}::${path}`]
        if (!entry && /\/high-emphasis$/.test(path)) {
          const alt = path.replace(/\/high-emphasis$/, '/text/high-emphasis')
          entry = (themeIndex as any)[`${mode}::${alt}`]
        }
        if (!entry && /\/low-emphasis$/.test(path)) {
          const alt = path.replace(/\/low-emphasis$/, '/text/low-emphasis')
          entry = (themeIndex as any)[`${mode}::${alt}`]
        }
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
    return 1
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
  }, [paletteKey, themeIndex, defaultLevelStr, mode])
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
  const getSelectedFamilyHexForLevel = (lvl: string): string | undefined => {
    if (!selectedFamily) return undefined
    return getTokenValueByName(`color/${selectedFamily}/${toTokenLevel(lvl)}`)
  }
  const applyThemeMappingsFromJson = (modeLabel: 'Light' | 'Dark') => {
    const root = document.documentElement
    const levels = headerLevels
    levels.forEach((lvl) => {
      const onToneName = `palette/${paletteKey}/${lvl}/on-tone`
      const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
      // map on-tone to core brand vars (white/black) rather than raw hex
      if (typeof onTone === 'string') {
        const s = String(onTone).trim().toLowerCase()
        const coreRef = (s === '#ffffff' || s === 'white')
          ? `var(--recursica-brand-${modeLabel.toLowerCase()}-palettes-core-white)`
          : (s === '#000000' || s === 'black')
          ? `var(--recursica-brand-${modeLabel.toLowerCase()}-palettes-core-black)`
          : undefined
        if (coreRef) root.style.setProperty(`--recursica-brand-${modeLabel.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`, coreRef)
      }
    })
  }
  const applyFamilyToCssVars = (family: string, modeLabel: 'Light' | 'Dark') => {
    const root = document.documentElement
    headerLevels.forEach((lvl) => {
      const tokenName = `color/${family}/${toTokenLevel(lvl)}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        // set tone to a token color reference instead of hex
        root.style.setProperty(`--recursica-brand-${modeLabel.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone`, `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`)
      }
      const onToneName = `palette/${paletteKey}/${lvl}/on-tone`
      const onTone = resolveThemeRef((themeIndex as any)[`${modeLabel}::${onToneName}`]?.value ?? { collection: 'Theme', name: onToneName }, modeLabel)
      // on-tone → core brand refs
      const aa = typeof hex === 'string' ? pickAAOnTone(hex) : (typeof onTone === 'string' ? String(onTone) : '#000000')
      const aaCore = aa.toLowerCase() === '#ffffff' ? 'white' : 'black'
      root.style.setProperty(`--recursica-brand-${modeLabel.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`, `var(--recursica-brand-${modeLabel.toLowerCase()}-palettes-core-${aaCore})`)
    })
  }
  useEffect(() => {
    applyThemeMappingsFromJson(mode)
    if (selectedFamily) applyFamilyToCssVars(selectedFamily, mode)
    // Notify dependents (e.g., layer resolver) that palette CSS vars have changed
    try { window.dispatchEvent(new CustomEvent('paletteVarsChanged')) } catch {}
  }, [selectedFamily, mode, overrideVersion])
  useEffect(() => {
    const lvl = primaryLevelStr
    try {
      const root = document.documentElement
      // Reference the level-specific brand vars directly so primary is not hardcoded
      root.style.setProperty(
        `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-primary-tone`,
        `var(--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone)`
      )
      root.style.setProperty(
        `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-primary-on-tone`,
        `var(--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone)`
      )
      // Notify dependents that primary-level derived vars changed
      try { window.dispatchEvent(new CustomEvent('paletteVarsChanged')) } catch {}
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
              style={{ padding: '6px 10px', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
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
            titleCase={(s) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()}
            getSwatchHex={(fam) => {
              const lvl = primaryLevelStr
              return getTokenValueByName(`color/${fam}/${lvl}`)
            }}
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
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1200, background: 'var(--layer-layer-0-property-surface, #ffffff)', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 6, minWidth: 200 }}>
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

