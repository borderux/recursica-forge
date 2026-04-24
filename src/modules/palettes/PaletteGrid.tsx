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
import { parseTokenReference, resolveTokenReferenceToCssVar, resolveTokenReferenceToValue, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getVarsStore } from '../../core/store/varsStore'

import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { Menu } from '../../components/adapters/Menu'
import { MenuItem } from '../../components/adapters/MenuItem'
import { DotsThreeOutline, Trash } from '@phosphor-icons/react'
import { genericLayerProperty, genericLayerText, palette, paletteCore, layerText, textEmphasis } from '../../core/css/cssVarBuilder'

type PaletteGridProps = {
  paletteKey: string
  title?: string
  descriptiveLabel?: string
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

export default function PaletteGrid({ paletteKey, title, descriptiveLabel, defaultLevel = 200, initialFamily, mode, deletable, onDelete }: PaletteGridProps) {
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
    } catch { }
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
        // Use centralized parser to check for token references
        const tokenIndex = buildTokenIndex(tokensJson)
        const context: TokenReferenceContext = {
          currentMode: mode.toLowerCase() === 'dark' ? 'dark' : 'light',
          tokenIndex
        }
        const parsed = parseTokenReference(toneRaw, context)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'color') {
          // Extract family name from token path (e.g., color/gray/100 -> gray)
          const detectedFamily = parsed.path[1]
          if (detectedFamily && families.includes(detectedFamily)) {
            return detectedFamily
          }
        }
      }
    }
    return null
  }, [themeIndex, mode, paletteKey, families])

  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    if (typeof initialFamily === 'string' && initialFamily) return initialFamily
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
    try { window.dispatchEvent(new CustomEvent('paletteFamilyChanged', { detail: { key: paletteKey, family: selectedFamily } })) } catch { }
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
    } catch { }
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

      // Use centralized parser
      const context: TokenReferenceContext = {
        currentMode: modeLabel.toLowerCase() === 'dark' ? 'dark' : 'light',
        tokenIndex: buildTokenIndex(tokensJson),
        theme: themeJson
      }
      const parsed = parseTokenReference(s, context)

      if (parsed && parsed.type === 'token') {
        // Token reference: resolve to value
        const path = parsed.path.join('/')
        return getTokenValueByName(path)
      }

      if (parsed && parsed.type === 'brand') {
        // Brand/theme reference: resolve using theme index
        const mode = parsed.mode === 'dark' ? 'Dark' : 'Light'
        const path = parsed.path.join('/')
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
    // 1. Check localStorage first — persists across navigation without fragile JSON writes
    try {
      const stored = localStorage.getItem(`rf:palette-default:${paletteKey}:${mode}`)
      if (stored) return stored
    } catch { }

    // 2. Try both plural ('palettes/') and singular ('palette/') themeIndex prefixes
    const entry =
      (themeIndex as any)[`${mode}::palettes/${paletteKey}/default/tone`] ??
      (themeIndex as any)[`${mode}::palette/${paletteKey}/default/tone`]
    const ref = entry?.value
    // Figma variable ref: { name: 'palettes/palette-1/400/color/tone' }
    const name: string | undefined = typeof ref === 'object' ? ref?.name : undefined
    if (name && /\/\d{3}\//.test(name)) {
      const m = name.match(/\/(\d{3})\//)
      if (m) return m[1]
    }
    // DTCG string ref: '{brand.themes.light.palettes.palette-1.400.color.tone}'
    if (typeof ref === 'string') {
      const m = ref.match(/\.?(\d{3})\.color\.tone/)
      if (m) return m[1]
    }
    return defaultLevelStr
  }, [paletteKey, themeIndex, defaultLevelStr, mode])
  const [primaryLevelStr, setPrimaryLevelStr] = useState<string>(resolveDefaultLevelForPalette)

  // Update primary level when mode changes or when palettePrimaryLevelChanged event fires
  useEffect(() => {
    // On mode/palette change, reset to the theme default
    setPrimaryLevelStr(resolveDefaultLevelForPalette)

    // Listen for palettePrimaryLevelChanged events
    const handlePrimaryLevelChanged = ((ev: CustomEvent) => {
      const detail = ev.detail
      const eventMode = detail?.mode?.toLowerCase()
      const componentMode = mode?.toLowerCase()

      if (detail && (
        (detail.paletteKey === paletteKey && eventMode === componentMode) ||
        (detail.allPalettes === true && eventMode === componentMode) ||
        (detail.reset === true && eventMode === componentMode)
      )) {
        if (detail.reset) {
          setPrimaryLevelStr(resolveDefaultLevelForPalette)
        } else if (detail.level) {
          const newLevel = String(detail.level).padStart(3, '0')
          setPrimaryLevelStr(newLevel)
        }
      }
    }) as EventListener

    window.addEventListener('palettePrimaryLevelChanged', handlePrimaryLevelChanged)
    return () => {
      window.removeEventListener('palettePrimaryLevelChanged', handlePrimaryLevelChanged)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paletteKey]) // Only update when mode or paletteKey changes, not when primaryLevelStr changes

  const [hoverLevelStr, setHoverLevelStr] = useState<string | null>(null)
  const applyThemeMappingsFromJson = (modeLabel: 'Light' | 'Dark') => {
    // Don't run during reset - recomputeAndApplyAll handles everything
    if (isResettingRef.current) return

    const levels = headerLevels
    const modeLower = modeLabel.toLowerCase()
    levels.forEach((lvl) => {
      const onToneCssVar = palette(modeLower, paletteKey, lvl, 'color_on-tone')

      // Set on-tone CSS vars from theme JSON for the current mode.
      // Since palettes are independent per mode, we always update from the theme JSON
      // to ensure the correct on-tone values are applied when switching modes.

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
          coreRef = `var(${paletteCore(modeLower, 'white')})`
        } else if (s === '#000000' || s === 'black') {
          coreRef = `var(${paletteCore(modeLower, 'black')})`
        } else {
          // Handle JSON references like {brand.themes.light.palettes.core-colors.white}
          const context: TokenReferenceContext = {
            currentMode: modeLabel.toLowerCase() as 'light' | 'dark',
            tokenIndex: buildTokenIndex(tokensJson),
            theme: themeJson
          }
          const parsed = parseTokenReference(onToneRaw, context)
          if (parsed && parsed.type === 'brand') {
            const pathParts = parsed.path
            // Check if it's a core color reference (palettes.core-colors.white or palettes.core.white or palettes.white)
            if (pathParts.length >= 2 && pathParts[0] === 'palettes' && (pathParts[1] === 'core-colors' || pathParts[1] === 'core')) {
              const colorName = pathParts[pathParts.length - 1] // Last part is the color name
              if (colorName === 'white') {
                coreRef = `var(${paletteCore(modeLower, 'white')})`
              } else if (colorName === 'black') {
                coreRef = `var(${paletteCore(modeLower, 'black')})`
              }
            } else if (pathParts.length >= 2 && pathParts[0] === 'palettes' && (pathParts[1] === 'white' || pathParts[1] === 'black')) {
              // Handle {brand.palettes.white} or {brand.palettes.black}
              const colorName = pathParts[1]
              coreRef = `var(${paletteCore(modeLower, colorName)})`
            }
          }

          // Handle token references like {tokens.colors.scale-01.000}
          // These are set by compliance fixes that point directly to token values
          if (!coreRef && parsed && parsed.type === 'token') {
            const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
            if (cssVar) {
              coreRef = cssVar
            }
          }

          // If we still don't have a coreRef, try to resolve as theme reference (handles var() references)
          if (!coreRef) {
            // Also try resolveTokenReferenceToCssVar as a general fallback
            const cssVar = resolveTokenReferenceToCssVar(onToneRaw, context)
            if (cssVar) {
              coreRef = cssVar
            } else {
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
                    coreRef = `var(${paletteCore(modeLower, 'white')})`
                  } else if (resolvedLower === '#000000' || resolvedLower === 'black') {
                    coreRef = `var(${paletteCore(modeLower, 'black')})`
                  }
                }
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

    // Apply theme mappings from JSON for the current mode
    // This ensures on-tones are correct when navigating from another page
    applyThemeMappingsFromJson(mode)

    // Dispatch event to notify components that palette vars may have changed
    // This ensures components re-render with correct on-tones when navigating
    try {
      window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
    } catch { }
  }, [mode, overrideVersion])
  // Track last primary level to only update when user explicitly changes it
  const lastPrimaryLevel = useRef<string | null>(null)
  const lastMode = useRef<string | null>(null)

  useEffect(() => {
    // Only update when primary level or mode actually changes (user action), not on every render
    if (lastPrimaryLevel.current === primaryLevelStr && lastMode.current === mode) return

    const lvl = primaryLevelStr
    const modeKey = mode.toLowerCase()
    try {
      // 1. Update CSS vars so primary reflects the chosen level immediately
      updateCssVar(
        palette(modeKey, paletteKey, 'primary', 'color_tone'),
        `var(${palette(modeKey, paletteKey, lvl, 'color_tone')})`
      )
      updateCssVar(
        palette(modeKey, paletteKey, 'primary', 'color_on-tone'),
        `var(${palette(modeKey, paletteKey, lvl, 'color_on-tone')})`
      )

      // 2. Persist chosen level to localStorage so it survives navigation / remount
      try {
        localStorage.setItem(`rf:palette-default:${paletteKey}:${mode}`, lvl)
      } catch { }

      // Notify dependents only when this is a real user-initiated change
      if (lastPrimaryLevel.current !== null || lastMode.current !== null) {
        try { window.dispatchEvent(new CustomEvent('paletteVarsChanged')) } catch { }
      }

      lastPrimaryLevel.current = primaryLevelStr
      lastMode.current = mode
    } catch { }
  }, [primaryLevelStr, mode, paletteKey])

  const { mode: themeMode } = useThemeMode()
  // layer0Base and layer1Base removed — use builder functions directly


  const [menuOpen, setMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      className="palette-container"
      data-palette-key={paletteKey}
      data-recursica-layer="1"
      style={{
        backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
        border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
        borderRadius: `var(--recursica_brand_dimensions_border-radii_xl)`,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: `var(--recursica_brand_dimensions_gutters_horizontal)`,
        paddingTop: 'var(--recursica_brand_dimensions_general_xl)',
        paddingBottom: 'var(--recursica_brand_dimensions_general_xl)',
        paddingLeft: 'var(--recursica_brand_dimensions_general_xl)',
        paddingRight: 'var(--recursica_brand_dimensions_general_xl)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `var(--recursica_brand_dimensions_general_sm)` }}>
          <h2 style={{
            margin: 0,
            fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
            fontSize: 'var(--recursica_brand_typography_h2-font-size)',
            fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
            letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
            lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
            color: `var(${genericLayerText(0, 'color')})`,
          }}>{title ?? paletteKey}</h2>
          {descriptiveLabel && (
            <div style={{
              margin: 0,
              fontFamily: 'var(--recursica_brand_typography_subtitle-font-family)',
              fontSize: 'var(--recursica_brand_typography_subtitle-font-size)',
              fontWeight: 'var(--recursica_brand_typography_subtitle-font-weight)',
              letterSpacing: 'var(--recursica_brand_typography_subtitle-font-letter-spacing)',
              lineHeight: 'var(--recursica_brand_typography_subtitle-line-height)',
              color: `var(${genericLayerText(0, 'color')})`,
              opacity: `var(${textEmphasis(themeMode, 'low')})`,
            }}>{descriptiveLabel}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: `var(--recursica_brand_dimensions_gutters_horizontal)` }}>
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
          {deletable && (
            <div ref={menuContainerRef} style={{ position: 'relative' }}>
              <Button
                variant="text"
                size="small"
                layer="layer-1"
                icon={<DotsThreeOutline size={16} weight="fill" />}
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  zIndex: 100,
                }}>
                  <Menu layer="layer-1">
                    <MenuItem
                      layer="layer-1"
                      leadingIcon={<Trash size={14} />}
                      leadingIconType="icon"
                      onClick={() => {
                        if (onDelete) onDelete()
                        setMenuOpen(false)
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <table className="color-palettes" style={{ tableLayout: 'fixed', width: '100%', borderSpacing: 0 }}>
        <thead>
          <tr style={{ display: 'flex', alignItems: 'center' }}>
            <th style={{
              width: 80,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              transform: 'translateY(20px)',
            }}>
              <Label
                size="small"
                layer="layer-1"
                style={{
                  paddingBottom: 0,
                  color: `var(${layerText(mode.toLowerCase(), 1, 'color')})`,
                }}
              >
                Emphasis
              </Label>
            </th>
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
          <tr className="high-emphasis" style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
            <td style={{ width: 80, flexShrink: 0, height: '50px', display: 'flex', alignItems: 'center' }}>
              <Label
                size="small"
                layer="layer-1"
                style={{
                  color: `var(${layerText(mode.toLowerCase(), 1, 'color')})`,
                }}
              >
                High
              </Label>
            </td>
            {headerLevels.map((lvl, index) => {
              const toneCssVar = palette(mode.toLowerCase(), paletteKey, lvl, 'color_tone')
              const onToneCssVar = palette(mode.toLowerCase(), paletteKey, lvl, 'color_on-tone')
              const emphasisCssVar = textEmphasis(mode.toLowerCase(), 'high')
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
                  emphasisType="high"
                  isFirst={index === 0}
                  isLast={index === headerLevels.length - 1}
                />
              )
            })}
          </tr>
          <tr className="low-emphasis" style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <td style={{ width: 80, flexShrink: 0, height: '50px', display: 'flex', alignItems: 'center' }}>
              <Label
                size="small"
                layer="layer-1"
                style={{
                  color: `var(${layerText(mode.toLowerCase(), 1, 'color')})`,
                }}
              >
                Low
              </Label>
            </td>
            {headerLevels.map((lvl, index) => {
              const toneCssVar = palette(mode.toLowerCase(), paletteKey, lvl, 'color_tone')
              const onToneCssVar = palette(mode.toLowerCase(), paletteKey, lvl, 'color_on-tone')
              const emphasisCssVar = textEmphasis(mode.toLowerCase(), 'low')
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
                  emphasisType="low"
                  isFirst={index === 0}
                  isLast={index === headerLevels.length - 1}
                />
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

