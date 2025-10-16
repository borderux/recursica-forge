import { useEffect, useMemo, useRef, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import themeJson from '../../vars/Theme.json'

type PaletteGridProps = {
  paletteKey: string
  title?: string
  defaultLevel?: string | number
  initialFamily?: string
  mode: 'Light' | 'Dark'
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

export default function PaletteGrid({ paletteKey, title, defaultLevel = 200, initialFamily, mode }: PaletteGridProps) {
  const defaultLevelStr = typeof defaultLevel === 'number' ? toLevelString(defaultLevel) : String(defaultLevel).padStart(3, '0')
  const headerLevels = LEVELS.map(toLevelString)

  const families = useMemo(() => {
    const fams = new Set<string>()
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('color/')) {
        const parts = e.name.split('/')
        if (parts.length === 3) fams.add(parts[1])
      }
    })
    const list = Array.from(fams).filter((f) => f !== 'translucent')
    list.sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [])

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
  }, [paletteKey, selectedFamily])

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

  // function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  //   let h = hex.trim()
  //   if (!h.startsWith('#')) h = '#' + h
  //   const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
  //   if (!m) return null
  //   return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  // }

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
    const entry: any = Object.values(tokensJson as Record<string, any>).find((e: any) => e && e.name === name)
    return entry ? String(entry.value) : undefined
  }

  const resolveThemeRef = (ref: any, modeLabel: 'Light' | 'Dark'): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'string' || typeof ref === 'number') return ref
    if (typeof ref === 'object') {
      const coll = ref.collection
      const name = ref.name
      if (coll === 'Tokens' && typeof name === 'string') {
        return getTokenValueByName(name)
      }
      if (coll === 'Theme' && typeof name === 'string') {
        const entry = (themeIndex as any)[`${modeLabel}::${name}`]
        if (!entry) return undefined
        return resolveThemeRef(entry.value, modeLabel)
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

  const titleCase = (s: string): string => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

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

  const optionSwatchHex = (family: string): string | undefined => {
    const lvl = resolveDefaultLevelForPalette
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
      if (typeof onTone === 'string') root.style.setProperty(`--palette-${paletteKey}-${lvl}-on-tone`, onTone)
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
  }, [selectedFamily, mode])

  return (
    <div className="palette-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title ?? paletteKey}</h3>
        <FamilyDropdown paletteKey={paletteKey} families={families} selectedFamily={selectedFamily} onSelect={(fam) => setSelectedFamily(fam)} titleCase={titleCase} getSwatchHex={optionSwatchHex} />
      </div>
      <table className="color-palettes">
        <thead>
          <tr>
            <th>Emphasis</th>
            {headerLevels.map((lvl) => (
              <th key={lvl} className={lvl === defaultLevelStr ? 'default' : undefined}>{lvl}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="high-emphasis">
            <td>High</td>
            {headerLevels.map((lvl) => {
              const onToneVar = `--palette-${paletteKey}-${lvl}-on-tone`
              const emphVar = `--palette-${paletteKey}-${lvl}-high-emphasis`
              const toneHex = getSelectedFamilyHexForLevel(lvl) || '#ffffff'
              return (
                <td key={`high-${lvl}`} className={`palette-box${lvl === defaultLevelStr ? ' default' : ''}`} style={{ backgroundColor: toneHex }}>
                  <div className="palette-dot" style={{ backgroundColor: `var(${onToneVar})`, opacity: `var(${emphVar})` }} />
                </td>
              )
            })}
          </tr>
          <tr className="low-emphasis">
            <td>Low</td>
            {headerLevels.map((lvl) => {
              const onToneVar = `--palette-${paletteKey}-${lvl}-on-tone`
              const emphVar = `--palette-${paletteKey}-${lvl}-low-emphasis`
              const toneHex = getSelectedFamilyHexForLevel(lvl) || '#ffffff'
              return (
                <td key={`low-${lvl}`} className={`palette-box${lvl === defaultLevelStr ? ' default' : ''}`} style={{ backgroundColor: toneHex }}>
                  <div className="palette-dot" style={{ backgroundColor: `var(${onToneVar})`, opacity: `var(${emphVar})` }} />
                </td>
              )
            })}
          </tr>
          <tr>
            <td>Tone</td>
            {headerLevels.map((lvl) => (
              <td key={`tone-${lvl}`} className={lvl === defaultLevelStr ? 'default' : undefined}>#ffffff<br />@varname</td>
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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const currentHex = getSwatchHex(selectedFamily)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <span>{titleCase(selectedFamily)}</span>
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
                    <span>{titleCase(fam)}</span>
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


