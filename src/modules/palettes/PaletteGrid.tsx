/**
 * PaletteGrid
 * Copied from modules/theme/PaletteGrid.tsx and adapted for the palettes module.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import {
  PaletteScaleHeader,
  PaletteScaleHighEmphasis,
  PaletteScaleLowEmphasis,
  PaletteScalePrimaryIndicator,
} from './PaletteScale'
import PaletteColorSelector from './PaletteColorSelector'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { readOverrides } from '../theme/tokenOverrides'

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
      // Use mode-specific localStorage key
      const raw = localStorage.getItem(`palette-primary-level:${paletteKey}:${mode}`)
      if (raw) {
        const v = JSON.parse(raw)
        if (typeof v === 'string') return v.padStart(3, '0')
      }
    } catch {}
    return resolveDefaultLevelForPalette
  })
  
  // Update primary level when mode changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`palette-primary-level:${paletteKey}:${mode}`)
      if (raw) {
        const v = JSON.parse(raw)
        if (typeof v === 'string') {
          const newLevel = v.padStart(3, '0')
          setPrimaryLevelStr(newLevel)
        }
      } else {
        // If no mode-specific value exists, use the default
        setPrimaryLevelStr(resolveDefaultLevelForPalette)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paletteKey]) // Only update when mode or paletteKey changes, not when primaryLevelStr changes
  
  useEffect(() => {
    // Store mode-specific primary level
    try { localStorage.setItem(`palette-primary-level:${paletteKey}:${mode}`, JSON.stringify(primaryLevelStr)) } catch {}
  }, [paletteKey, primaryLevelStr, mode])
  const [hoverLevelStr, setHoverLevelStr] = useState<string | null>(null)
  const applyThemeMappingsFromJson = (modeLabel: 'Light' | 'Dark') => {
    // Don't run during reset - recomputeAndApplyAll handles everything
    if (isResettingRef.current) return
    
    const levels = headerLevels
    const modeLower = modeLabel.toLowerCase()
    levels.forEach((lvl) => {
      const onToneCssVar = `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`
      
      // Only set if the CSS var isn't already set (don't override values from buildPaletteVars)
      const existingValue = readCssVar(onToneCssVar)
      if (existingValue && existingValue.trim() !== '') {
        // Already set, don't override
        return
      }
      
      // Try both 'palettes' and 'palette' path formats
      const onToneNamePlural = `palettes/${paletteKey}/${lvl}/on-tone`
      const onToneNameSingular = `palette/${paletteKey}/${lvl}/on-tone`
      const onToneRaw = (themeIndex as any)[`${modeLabel}::${onToneNamePlural}`]?.value 
        || (themeIndex as any)[`${modeLabel}::${onToneNameSingular}`]?.value
      
      if (typeof onToneRaw === 'string') {
        const s = onToneRaw.trim().toLowerCase()
        let coreRef: string | undefined
        
        // Handle direct hex values
        if (s === '#ffffff' || s === 'white') {
          coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-white)`
        } else if (s === '#000000' || s === 'black') {
          coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-black)`
        }
        // Handle JSON references like {brand.themes.light.palettes.core-colors.white}
        else if (s.includes('core-colors.white') || s.includes('core.white') || s.includes('.white}')) {
          coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-white)`
        } else if (s.includes('core-colors.black') || s.includes('core.black') || s.includes('.black}')) {
          coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-black)`
        }
        // Try to resolve as theme reference (handles var() references)
        else {
          // Try both path formats
          const resolved = resolveThemeRef({ collection: 'Theme', name: onToneNamePlural }, modeLabel)
            || resolveThemeRef({ collection: 'Theme', name: onToneNameSingular }, modeLabel)
          if (typeof resolved === 'string') {
            // If it's already a var() reference, use it directly
            if (resolved.startsWith('var(')) {
              coreRef = resolved
            }
            // If it resolved to a hex or color name, map it
            else {
              const resolvedLower = resolved.trim().toLowerCase()
              if (resolvedLower === '#ffffff' || resolvedLower === 'white') {
                coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-white)`
              } else if (resolvedLower === '#000000' || resolvedLower === 'black') {
                coreRef = `var(--recursica-brand-themes-${modeLower}-palettes-core-black)`
              }
            }
          }
        }
        
        if (coreRef) {
          updateCssVar(onToneCssVar, coreRef)
        }
      }
    })
  }
  const isResettingRef = useRef(false)
  useEffect(() => {
    // Listen for reset events to prevent applyThemeMappingsFromJson from running during reset
    const handleReset = () => {
      isResettingRef.current = true
      // Reset flag after a delay to allow recomputeAndApplyAll to complete
      setTimeout(() => {
        isResettingRef.current = false
      }, 200)
    }
    window.addEventListener('paletteReset', handleReset as any)
    return () => window.removeEventListener('paletteReset', handleReset as any)
  }, [])
  
  useEffect(() => {
    // Skip if reset is in progress - recomputeAndApplyAll already sets everything from JSON
    if (isResettingRef.current) return
    
    // Apply theme mappings from JSON only for levels that aren't already set
    // This ensures all levels (including 050) are set from JSON, even if buildPaletteVars didn't process them
    applyThemeMappingsFromJson(mode)
    // Don't dispatch paletteVarsChanged here - CSS vars are managed by PaletteColorSelector
    // This prevents unnecessary re-renders of other palettes
  }, [mode, overrideVersion])
  // Track last primary level to only update when user explicitly changes it
  const lastPrimaryLevel = useRef<string | null>(null)
  const lastMode = useRef<string | null>(null)
  
  useEffect(() => {
    // Only update when primary level or mode actually changes (user action), not on every render
    if (lastPrimaryLevel.current === primaryLevelStr && lastMode.current === mode) return
    
    const lvl = primaryLevelStr
    try {
      // Reference the level-specific brand vars directly so primary is not hardcoded
      updateCssVar(
        `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-primary-tone`,
        `var(--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone)`
      )
      updateCssVar(
        `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-primary-on-tone`,
        `var(--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone)`
      )
      
      // Only notify if this is a user-initiated change (primary level or mode changed)
      if (lastPrimaryLevel.current !== null || lastMode.current !== null) {
        try { window.dispatchEvent(new CustomEvent('paletteVarsChanged')) } catch {}
      }
      
      lastPrimaryLevel.current = primaryLevelStr
      lastMode.current = mode
    } catch {}
  }, [primaryLevelStr, mode, paletteKey]) // Removed selectedFamily and overrideVersion from dependencies
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
              style={{ padding: '6px 10px', border: `1px solid var(--recursica-brand-${mode.toLowerCase()}-layer-layer-1-property-border-color)`, background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
            >Delete</button>
          )}
          <PaletteColorSelector
            paletteKey={paletteKey}
            mode={mode}
            primaryLevel={primaryLevelStr}
            headerLevels={headerLevels}
            onFamilyChange={(family) => {
              userChangedFamily.current = true
              setSelectedFamily(family)
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
                paletteKey={paletteKey}
                tokens={tokensJson}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="high-emphasis">
            <td>High</td>
            {headerLevels.map((lvl) => {
              const toneCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone`
              const onToneCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`
              const emphasisCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-text-emphasis-high`
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
                  paletteKey={paletteKey}
                  level={lvl}
                  tokens={tokensJson}
                />
              )
            })}
          </tr>
          <tr className="low-emphasis">
            <td>Low</td>
            {headerLevels.map((lvl) => {
              const toneCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-tone`
              const onToneCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-palettes-${paletteKey}-${lvl}-on-tone`
              const emphasisCssVar = `--recursica-brand-themes-${mode.toLowerCase()}-text-emphasis-low`
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
                  paletteKey={paletteKey}
                  level={lvl}
                  tokens={tokensJson}
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

