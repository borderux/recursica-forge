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
import { updateBrandValue } from '../../core/css/updateBrandValue'

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
    const themes = root?.themes || root
    // Canonical structure: brand.themes.light.palettes → prefix 'palette' (singular, DTCG path)
    if (themes?.light?.palettes) visit(themes.light.palettes, 'palette', 'Light')
    if (themes?.dark?.palettes) visit(themes.dark.palettes, 'palette', 'Dark')
    return out
  }, [themeJson])
  const detectFamilyFromTheme = useMemo(() => {
    // Try to detect the actual family from theme JSON by checking a few levels
    const checkLevels = ['200', '500', '400', '300']
    for (const lvl of checkLevels) {
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
  const [paletteFamilyChangedVersion, setPaletteFamilyChangedVersion] = useState(0)
  useEffect(() => {
    const onFamilyChanged = () => {
      forceVersion((v) => v + 1)
      setPaletteFamilyChangedVersion((v) => v + 1)
    }
    const onVarsChanged = () => forceVersion((v) => v + 1)
    window.addEventListener('paletteFamilyChanged', onFamilyChanged as any)
    window.addEventListener('paletteVarsChanged', onVarsChanged as any)
    return () => {
      window.removeEventListener('paletteFamilyChanged', onFamilyChanged as any)
      window.removeEventListener('paletteVarsChanged', onVarsChanged as any)
    }
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
    // Read the user-chosen default level from the brand JSON (via themeIndex).
    // updateBrandValue() writes the chosen level into state.theme when the user sets a default,
    // so themeIndex is always up-to-date without needing a separate localStorage key.
    //
    // The JSON structure is default.color.tone — themeIndex keys use the full path:
    // 'palettes/pk/default/color/tone'. Singular 'palette' prefix is kept as fallback
    // for any JSON using the old key name.
    const entry =
      (themeIndex as any)[`${mode}::palettes/${paletteKey}/default/color/tone`] ??
      (themeIndex as any)[`${mode}::palette/${paletteKey}/default/color/tone`] ??
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
  // Keep a ref that always mirrors the latest memo value so event handlers
  // (which close over stale values) can read the current resolved default.
  const resolveDefaultRef = useRef(resolveDefaultLevelForPalette)
  resolveDefaultRef.current = resolveDefaultLevelForPalette

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

  // After a full theme reset the store re-emits (themeJson updates) and fires
  // 'themeReset'. By deferring with setTimeout(0) we allow React to finish
  // re-rendering so resolveDefaultRef.current reflects the fresh themeIndex
  // (localStorage keys already cleared by resetAll before emit).
  useEffect(() => {
    const handleThemeReset = () => {
      setTimeout(() => setPrimaryLevelStr(resolveDefaultRef.current), 0)
    }
    window.addEventListener('themeReset', handleThemeReset)
    return () => window.removeEventListener('themeReset', handleThemeReset)
  }, [])

  const [hoverLevelStr, setHoverLevelStr] = useState<string | null>(null)

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

    // Dispatch event to notify components that palette vars may have changed
    // This ensures components re-render with correct on-tones when navigating
    try {
      window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
    } catch { }
  }, [mode, overrideVersion, paletteFamilyChangedVersion])
  const handleSetPrimary = (lvl: string) => {
    setPrimaryLevelStr(lvl)

    // Explicit user action: update CSS vars and write to JSON for the CURRENT mode
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

      // 2. Write the new default into the brand JSON and the CSS delta so it persists across reloads.
      // updateCssVar handles syncing the DOM, tracking the delta, and updating the JSON (via updateBrandValue internally).
      updateCssVar(
        palette(modeKey, paletteKey, 'default', 'color_tone'),
        `var(${palette(modeKey, paletteKey, lvl, 'color_tone')})`
      )
      updateCssVar(
        palette(modeKey, paletteKey, 'default', 'color_on-tone'),
        `var(${palette(modeKey, paletteKey, lvl, 'color_on-tone')})`
      )

      try { window.dispatchEvent(new CustomEvent('paletteVarsChanged')) } catch { }
    } catch { }
  }

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
                onSetPrimary={() => handleSetPrimary(lvl)}
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
                  onSetPrimary={() => handleSetPrimary(lvl)}
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
                  onSetPrimary={() => handleSetPrimary(lvl)}
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

