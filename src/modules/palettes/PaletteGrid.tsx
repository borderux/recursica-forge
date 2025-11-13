/**
 * PaletteGrid
 * Copied from modules/theme/PaletteGrid.tsx and adapted for the palettes module.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { pickAAOnTone } from '../theme/contrastUtil'
import {
  PaletteScaleHeader,
  PaletteScaleHighEmphasis,
  PaletteScaleLowEmphasis,
  PaletteScalePrimaryIndicator,
} from './PaletteScale'

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
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
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
    // Check both 'palette' (singular) and 'palettes' (plural) to handle different JSON structures
    if (root?.light?.palettes) visit(root.light.palettes, 'palettes', 'Light')
    else if (root?.light?.palette) visit(root.light.palette, 'palette', 'Light')
    if (root?.dark?.palettes) visit(root.dark.palettes, 'palettes', 'Dark')
    else if (root?.dark?.palette) visit(root.dark.palette, 'palette', 'Dark')
    return out
  }, [themeJson])
  const detectFamilyFromTheme = useMemo(() => {
    // Try to detect the actual family from theme JSON by checking a few levels
    const checkLevels = ['200', '500', '400', '300']
    for (const lvl of checkLevels) {
      // The themeIndex uses 'palette' prefix even though JSON has 'palettes'
      const toneName = `palette/${paletteKey}/${lvl}/color/tone`
      const toneRaw = (themeIndex as any)[`${mode}::${toneName}`]?.value
      if (typeof toneRaw === 'string') {
        // Check for token reference format: {tokens.color.{family}.{level}}
        const match = toneRaw.match(/\{tokens\.color\.([a-z0-9_-]+)\./)
        if (match && match[1]) {
          const detectedFamily = match[1]
          if (families.includes(detectedFamily)) {
            return detectedFamily
          }
        }
      }
    }
    return null
  }, [themeIndex, mode, paletteKey, families])

  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    if (typeof initialFamily === 'string' && initialFamily) return initialFamily
    // Try to detect from theme first (but themeIndex isn't available in initializer, so we'll update via useEffect)
    // Fall back to localStorage
    try {
      const raw = localStorage.getItem(`palette-grid-family:${paletteKey}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    // Fall back to defaults
    if (paletteKey === 'neutral') return 'gray'
    return families[0] || ''
  })
  
  // Track if this is the initial mount to only sync on first load
  const isInitialMount = useRef(true)
  const userChangedFamily = useRef(false)
  
  // Update selectedFamily when theme changes to reflect actual family being used
  // Only sync on initial mount (not when user changes dropdown)
  useEffect(() => {
    if (isInitialMount.current) {
      const detected = detectFamilyFromTheme
      if (detected) {
        setSelectedFamily(detected)
      }
      isInitialMount.current = false
    }
  }, [detectFamilyFromTheme])
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
  
  const updateThemeForFamily = (family: string, modeLabel: 'Light' | 'Dark') => {
    if (!setTheme) return
    try {
      const themeCopy = JSON.parse(JSON.stringify(themeJson))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const modeKey = modeLabel.toLowerCase()
      if (!root[modeKey]) root[modeKey] = {}
      if (!root[modeKey].palettes) root[modeKey].palettes = {}
      if (!root[modeKey].palettes[paletteKey]) root[modeKey].palettes[paletteKey] = {}
      
      headerLevels.forEach((lvl) => {
        if (!root[modeKey].palettes[paletteKey][lvl]) root[modeKey].palettes[paletteKey][lvl] = {}
        if (!root[modeKey].palettes[paletteKey][lvl].color) root[modeKey].palettes[paletteKey][lvl].color = {}
        // Update tone to reference the new family token
        root[modeKey].palettes[paletteKey][lvl].color.tone = {
          $value: `{tokens.color.${family}.${toTokenLevel(lvl)}}`
        }
      })
      
      setTheme(themeCopy)
    } catch (err) {
      console.error('Failed to update theme for family:', err)
    }
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
              userChangedFamily.current = true
              setSelectedFamily(fam)
              // Update theme JSON to use the new family
              updateThemeForFamily(fam, mode)
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
              <PaletteScaleHeader
                key={`header-${lvl}`}
                level={lvl}
                isPrimary={lvl === primaryLevelStr}
                headerLevels={headerLevels}
                onMouseEnter={() => setHoverLevelStr(lvl)}
                onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                onSetPrimary={() => setPrimaryLevelStr(lvl)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="high-emphasis">
            <td>High</td>
            {headerLevels.map((lvl) => {
              const toneCssVar = `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone`
              const onToneCssVar = `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`
              const emphasisCssVar = `--recursica-brand-${mode.toLowerCase()}-text-emphasis-high`
              return (
                <PaletteScaleHighEmphasis
                  key={`high-${lvl}`}
                  toneCssVar={toneCssVar}
                  onToneCssVar={onToneCssVar}
                  emphasisCssVar={emphasisCssVar}
                  isPrimary={lvl === primaryLevelStr}
                  headerLevels={headerLevels}
                  onMouseEnter={() => setHoverLevelStr(lvl)}
                  onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                  onSetPrimary={() => setPrimaryLevelStr(lvl)}
                />
              )
            })}
          </tr>
          <tr className="low-emphasis">
            <td>Low</td>
            {headerLevels.map((lvl) => {
              const toneCssVar = `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone`
              const onToneCssVar = `--recursica-brand-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`
              const emphasisCssVar = `--recursica-brand-${mode.toLowerCase()}-text-emphasis-low`
              return (
                <PaletteScaleLowEmphasis
                  key={`low-${lvl}`}
                  toneCssVar={toneCssVar}
                  onToneCssVar={onToneCssVar}
                  emphasisCssVar={emphasisCssVar}
                  isPrimary={lvl === primaryLevelStr}
                  headerLevels={headerLevels}
                  onMouseEnter={() => setHoverLevelStr(lvl)}
                  onMouseLeave={() => setHoverLevelStr((v) => (v === lvl ? null : v))}
                  onSetPrimary={() => setPrimaryLevelStr(lvl)}
                />
              )
            })}
          </tr>
          <tr>
            <td></td>
            {headerLevels.map((lvl) => (
              <PaletteScalePrimaryIndicator
                key={`primary-${lvl}`}
                isPrimary={lvl === primaryLevelStr}
                isHovered={hoverLevelStr === lvl}
                onSetPrimary={() => setPrimaryLevelStr(lvl)}
              />
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

