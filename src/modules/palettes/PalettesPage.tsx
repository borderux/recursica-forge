import '../theme/index.css'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import PaletteGrid from './PaletteGrid'
import { getTokenLevelForMode } from './PaletteColorSelector'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { Button } from '../../components/adapters/Button'
import { Toast } from '../../components/adapters/Toast'
import { iconNameToReactComponent } from '../components/iconUtils'
import { hexToRgb, contrastRatio, blendHexWithOpacity } from '../theme/contrastUtil'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../../core/css/readCssVar'
import { genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'

import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'


type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

// Component for core on-tone cell with AA compliance checking
function CoreOnToneCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  pickerCssVar: string
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const AA = 4.5

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }

    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    window.addEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    window.addEventListener('recheckAllPaletteOnTones', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
      window.removeEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
      window.removeEventListener('recheckAllPaletteOnTones', handleVarsChanged)
    }
  }, [])

  // Check AA compliance with opacity consideration
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null

    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)
    const emphasisValue = readCssVar(emphasisCssVar)

    if (!toneValue || !onToneValue) return null

    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)

    if (!toneHex || !onToneHex) return null

    // Get emphasis opacity using readCssVarNumber (resolves var() references via computed style)
    const opacity = readCssVarNumber(emphasisCssVar, 1)

    // Blend on-tone color over tone color with opacity
    const onToneBlended = blendHexWithOpacity(onToneHex, toneHex, opacity) ?? onToneHex
    const currentRatio = contrastRatio(toneHex, onToneBlended)
    const passesAA = currentRatio >= AA

    // Check if black and white pass AA with opacity
    const black = '#000000'
    const white = '#ffffff'
    const blackBlended = blendHexWithOpacity(black, toneHex, opacity) ?? black
    const whiteBlended = blendHexWithOpacity(white, toneHex, opacity) ?? white
    const blackContrast = contrastRatio(toneHex, blackBlended)
    const whiteContrast = contrastRatio(toneHex, whiteBlended)
    const blackPasses = blackContrast >= AA
    const whitePasses = whiteContrast >= AA

    return {
      passesAA,
      blackPasses,
      whitePasses,
      currentRatio,
      toneHex,
      onToneHex,
      opacity,
    }
  }, [toneCssVar, onToneCssVar, emphasisCssVar, tokensJson, refreshKey, mode])

  // Show "x" whenever the on-tone doesn't pass AA compliance with the underlying tone
  const showAAWarning = aaStatus ? !aaStatus.passesAA : false

  return (
    <td>
      <div
        className="palette-box"
        style={{
          backgroundColor: `var(${toneCssVar})`,
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={(e) => (window as any).openPicker?.(e.currentTarget, pickerCssVar)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAAWarning ? (
          <div
            className="palette-x"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: `var(${onToneCssVar})`,
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: `var(${emphasisCssVar})`
            }}
          >
            ✕
          </div>
        ) : (
          <div
            className="palette-dot"
            style={{
              backgroundColor: `var(${onToneCssVar})`,
              opacity: `var(${emphasisCssVar})`
            }}
          />
        )}         {showAAWarning && isHovered && (
          <div
            data-recursica-layer="1"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
              border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
              borderRadius: '6px',
              boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              AA Compliance Issue
            </div>
            <div style={{ marginBottom: '8px', color: `var(${genericLayerText(1, 'color')})` }}>
              Both black and white don't pass contrast (≥4.5:1)
            </div>
            <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(${genericLayerText(1, 'color')})`, opacity: 0.8 }}>
              Current: {aaStatus?.currentRatio.toFixed(2)}:1
            </div>
          </div>
        )}
      </div>
    </td>
  )
}

// Component for interactive row cell with AA compliance checking
function CoreInteractiveCell({
  toneCssVar,
  interactiveCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  interactiveCssVar: string
  pickerCssVar: string
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const AA = 4.5

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }

    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    window.addEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
      window.removeEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    }
  }, [])

  // Check AA compliance
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null

    const toneValue = readCssVar(toneCssVar)
    const interactiveValue = readCssVar(interactiveCssVar)

    if (!toneValue || !interactiveValue) return null

    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const interactiveHex = resolveCssVarToHex(interactiveValue, tokenIndex)

    if (!toneHex || !interactiveHex) return null

    const currentRatio = contrastRatio(toneHex, interactiveHex)
    const passesAA = currentRatio >= AA

    return {
      passesAA,
      currentRatio,
      toneHex,
      interactiveHex,
    }
  }, [toneCssVar, interactiveCssVar, tokensJson, refreshKey])

  const showAAWarning = aaStatus ? !aaStatus.passesAA : false

  return (
    <td>
      <div
        className="palette-box"
        style={{
          backgroundColor: `var(${toneCssVar})`,
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={(e) => (window as any).openPicker?.(e.currentTarget, pickerCssVar)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAAWarning ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: 'bold',
              color: `var(${interactiveCssVar})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </div>
        ) : (
          <div
            className="palette-dot"
            style={{
              backgroundColor: `var(${interactiveCssVar})`,
            }}
          />
        )}

        {showAAWarning && isHovered && (
          <div
            data-recursica-layer="1"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
              border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
              borderRadius: '6px',
              boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              AA Compliance Issue
            </div>
            <div style={{ marginBottom: '8px', color: `var(${genericLayerText(1, 'color')})` }}>
              Interactive color contrast ratio {aaStatus?.currentRatio.toFixed(2)}:1 {'<'} 4.5:1
            </div>
          </div>
        )}
      </div>
    </td>
  )
}

// Component for core interactive swatch with AA compliance checking
function CoreInteractiveSwatch({
  toneCssVar,
  onToneCssVar,
  fallbackToneCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  onToneCssVar: string
  fallbackToneCssVar?: string
  pickerCssVar: string
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const AA = 4.5

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }

    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
    }
  }, [])

  // Check AA compliance (without opacity for core colors - they're fully opaque)
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null

    const toneValue = readCssVar(toneCssVar) || (fallbackToneCssVar ? readCssVar(fallbackToneCssVar) : null)
    const onToneValue = readCssVar(onToneCssVar)

    if (!toneValue || !onToneValue) return null

    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex) || (fallbackToneCssVar ? resolveCssVarToHex(readCssVar(fallbackToneCssVar) || '', tokenIndex) : null)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)

    if (!toneHex || !onToneHex) return null

    // Core colors are fully opaque, so no opacity blending needed
    const currentRatio = contrastRatio(toneHex, onToneHex)
    const passesAA = currentRatio >= AA

    // Check if black and white pass AA
    const black = '#000000'
    const white = '#ffffff'
    const blackContrast = contrastRatio(toneHex, black)
    const whiteContrast = contrastRatio(toneHex, white)
    const blackPasses = blackContrast >= AA
    const whitePasses = whiteContrast >= AA

    return {
      passesAA,
      blackPasses,
      whitePasses,
      currentRatio,
      toneHex,
      onToneHex,
    }
  }, [toneCssVar, fallbackToneCssVar, onToneCssVar, tokensJson, refreshKey])

  const showAAWarning = aaStatus
    ? (!aaStatus.passesAA && !aaStatus.blackPasses && !aaStatus.whitePasses)
    : false

  return (
    <td
      className="swatch-box"
      style={{
        position: 'relative',
        backgroundColor: `var(${toneCssVar}${fallbackToneCssVar ? `, var(${fallbackToneCssVar})` : ''})`,
        cursor: 'pointer'
      }}
      onClick={(e) => (window as any).openPicker?.(e.currentTarget, pickerCssVar)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showAAWarning ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            fontWeight: 'bold',
            color: `var(${onToneCssVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: `var(${onToneCssVar})`,
            // No border as requested
          }}
        />
      )}

      {showAAWarning && isHovered && (
        <div
          data-recursica-layer="1"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            padding: '8px 12px',
            backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            AA Compliance Issue
          </div>
          <div style={{ marginBottom: '8px', color: `var(${genericLayerText(1, 'color')})` }}>
            Both black and white don't pass contrast (≥4.5:1)
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(${genericLayerText(1, 'color')})`, opacity: 0.8 }}>
            Current: {aaStatus?.currentRatio.toFixed(2)}:1
          </div>
        </div>
      )}
    </td>
  )
}

export default function PalettesPage() {
  const { tokens: tokensJson, theme: themeJson, palettes: palettesState, setPalettes, setTheme } = useVars()
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')

  // Migrate legacy palette data: move brand.[mode].palettes → brand.themes.[mode].palettes
  // This handles palettes that were incorrectly saved at the wrong path before the fix
  useEffect(() => {
    if (!themeJson || !setTheme) return

    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      if (!root?.themes) return // No themes structure, nothing to migrate

      let migrated = false
      const themeCopy = getVarsStore().getLatestThemeCopy()
      const rootCopy: any = themeCopy?.brand ? themeCopy.brand : themeCopy

      for (const modeKey of ['light', 'dark'] as const) {
        const legacyPalettes = rootCopy[modeKey]?.palettes
        if (!legacyPalettes || typeof legacyPalettes !== 'object') continue

        // Only migrate if themes structure exists — skip core-colors/neutral
        // Those are expected in the themes path already
        if (!rootCopy.themes[modeKey]) rootCopy.themes[modeKey] = {}
        if (!rootCopy.themes[modeKey].palettes) rootCopy.themes[modeKey].palettes = {}

        for (const [paletteKey, paletteData] of Object.entries(legacyPalettes)) {
          // Only migrate palette-N keys that aren't already in the correct path
          if (!paletteKey.startsWith('palette-')) continue
          if (!rootCopy.themes[modeKey].palettes[paletteKey]) {
            rootCopy.themes[modeKey].palettes[paletteKey] = paletteData
            migrated = true
          }
        }

        // Clean up legacy path: remove migrated palette-N entries
        if (migrated) {
          for (const key of Object.keys(legacyPalettes)) {
            if (key.startsWith('palette-')) {
              delete rootCopy[modeKey].palettes[key]
            }
          }
          // If legacy palettes object is now empty, remove it
          if (Object.keys(rootCopy[modeKey].palettes).length === 0) {
            delete rootCopy[modeKey].palettes
          }
          // If legacy mode object is now empty, remove it
          if (rootCopy[modeKey] && Object.keys(rootCopy[modeKey]).length === 0) {
            delete rootCopy[modeKey]
          }
        }
      }

      if (migrated) {
        setTheme(themeCopy)
      }
    } catch (err) {
      console.error('Failed to migrate legacy palette data:', err)
    }
  }, []) // Run once on mount

  const allFamilies = useMemo(() => {
    const fams = new Set<string>()
    const tokensRoot: any = (tokensJson as any)?.tokens || {}

    // Add families from new colors structure (use scale keys, not aliases, for internal tracking)
    const colorsRoot: any = tokensRoot?.colors || {}
    if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
      Object.keys(colorsRoot).forEach((scaleKey) => {
        if (scaleKey.startsWith('scale-')) {
          fams.add(scaleKey) // Use scale key for internal tracking
        }
      })
    }

    // Also add from old color structure for backwards compatibility
    const oldColors = tokensRoot?.color || {}
    Object.keys(oldColors).forEach((fam) => {
      if (fam !== 'translucent') fams.add(fam)
    })

    fams.delete('translucent')
    const list = Array.from(fams)
    list.sort((a, b) => {
      // Sort scale keys together, then other families
      const aIsScale = a.startsWith('scale-')
      const bIsScale = b.startsWith('scale-')
      if (aIsScale && !bIsScale) return 1
      if (!aIsScale && bIsScale) return -1
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [tokensJson])

  // Removed automatic AA compliance check - let JSON values be set first

  const palettes = palettesState.dynamic
  const writePalettes = (next: PaletteEntry[]) => setPalettes({ ...palettesState, dynamic: next })

  // Track which families are already used by palettes
  // Use theme JSON as the source of truth (it reflects actual current usage)
  // Only fall back to initialFamily if theme JSON doesn't have the palette
  const [paletteFamilyChangeVersion, setPaletteFamilyChangeVersion] = useState(0)

  // Listen for palette family changes to force recalculation
  useEffect(() => {
    const handlePaletteFamilyChanged = () => {
      setPaletteFamilyChangeVersion(v => v + 1)
    }
    window.addEventListener('paletteFamilyChanged', handlePaletteFamilyChanged as any)
    return () => {
      window.removeEventListener('paletteFamilyChanged', handlePaletteFamilyChanged as any)
    }
  }, [])

  const usedFamilies = useMemo(() => {
    const set = new Set<string>()
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    const detectedFromTheme = new Set<string>() // Track which palettes we detected from theme

    // First, detect actual families from theme JSON for the CURRENT MODE ONLY
    // Palettes are independent per mode - each mode has its own family assignments
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const currentModeKey = mode === 'dark' ? 'dark' : 'light'

      palettes.forEach((p) => {
        const paletteKey = p.key

        // Only check the current mode
        // Try both possible paths
        const palette = themes?.[currentModeKey]?.palettes?.[paletteKey] || root?.[currentModeKey]?.palettes?.[paletteKey]

        if (palette) {
          // Check a few levels to detect the family
          const checkLevels = ['200', '500', '400', '300', '100', '600']
          for (const lvl of checkLevels) {
            const tone = palette?.[lvl]?.color?.tone?.$value
            if (typeof tone === 'string') {
              // Use centralized parser to check for token references
              const tokenIndex = buildTokenIndex(tokensJson)
              const context: TokenReferenceContext = { currentMode: currentModeKey as 'light' | 'dark', tokenIndex }
              const parsed = parseTokenReference(tone, context)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 2) {
                let detectedFamily: string | null = null

                // Handle new colors format (colors.scale-XX.level or colors.alias.level)
                if (parsed.path[0] === 'colors') {
                  const scaleOrAlias = parsed.path[1]
                  // If it's a scale key, use it directly
                  if (scaleOrAlias.startsWith('scale-')) {
                    detectedFamily = scaleOrAlias
                  } else {
                    // It's an alias - find the scale that has this alias
                    for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
                      if (!scaleKey.startsWith('scale-')) continue
                      const scaleObj = scale as any
                      if (scaleObj?.alias === scaleOrAlias) {
                        detectedFamily = scaleKey
                        break
                      }
                    }
                    // If not found, use the alias itself (fallback for old format)
                    if (!detectedFamily) {
                      detectedFamily = scaleOrAlias
                    }
                  }
                }
                // Handle old color format (color.family.level)
                else if (parsed.path[0] === 'color') {
                  detectedFamily = parsed.path[1]
                }

                if (detectedFamily) {
                  set.add(detectedFamily)
                  detectedFromTheme.add(paletteKey)
                  break // Found a family for this palette, move to next palette
                }
              }
            }
          }
        }
      })
    } catch (err) {
      console.error('Failed to detect used families from theme:', err)
    }

    // Only use initialFamily as fallback for palettes not found in theme JSON
    // This handles edge cases where a palette exists but theme JSON hasn't been initialized yet
    palettes.forEach((p) => {
      // Skip if we already detected this palette from theme JSON
      if (detectedFromTheme.has(p.key)) return

      if (p.initialFamily) {
        // If initialFamily is a scale key, use it directly
        // If it's an alias, find the corresponding scale key
        if (p.initialFamily.startsWith('scale-')) {
          set.add(p.initialFamily)
        } else {
          // Check if it's an alias that maps to a scale
          let foundScale = false
          for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
            if (!scaleKey.startsWith('scale-')) continue
            const scaleObj = scale as any
            if (scaleObj?.alias === p.initialFamily) {
              set.add(scaleKey)
              foundScale = true
              break
            }
          }
          // If not found as alias, use the family name directly (old format)
          if (!foundScale) {
            set.add(p.initialFamily)
          }
        }
      }
    })

    return set
  }, [palettes, themeJson, tokensJson, paletteFamilyChangeVersion, mode])

  const unusedFamilies = useMemo(() =>
    allFamilies.filter((f) => !usedFamilies.has(f)),
    [allFamilies, usedFamilies]
  )

  const canAddPalette = unusedFamilies.length > 0

  // Initialize theme JSON for a new palette with CSS var references
  const initializePaletteTheme = (paletteKey: string, family: string) => {
    if (!setTheme || !themeJson) return

    try {
      const themeCopy = getVarsStore().getLatestThemeCopy()
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const headerLevels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200']
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}

      // Determine the correct token reference format based on family type
      let tokenRef: string = `{tokens.color.${family}.${headerLevels[0]}}` // Default fallback

      if (family.startsWith('scale-')) {
        // Direct scale reference: use colors format
        tokenRef = `{tokens.colors.${family}.${headerLevels[0]}}`
      } else {
        // Check if it's an alias that maps to a scale
        let isScaleAlias = false
        for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
          if (!scaleKey.startsWith('scale-')) continue
          const scaleObj = scale as any
          if (scaleObj?.alias === family) {
            // Use the scale key for the reference
            tokenRef = `{tokens.colors.${scaleKey}.${headerLevels[0]}}`
            isScaleAlias = true
            break
          }
        }
        if (!isScaleAlias) {
          // Fallback to old color format
          tokenRef = `{tokens.color.${family}.${headerLevels[0]}}`
        }
      }

      // Initialize for BOTH modes — dark mode needs reversed level mapping
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const targetRoot = themes !== root ? themes : root

      // Find the scale key once (shared by both modes)
      let resolvedScaleKey: string | undefined
      if (family.startsWith('scale-')) {
        resolvedScaleKey = family
      } else {
        for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
          if (!scaleKey.startsWith('scale-')) continue
          const scaleObj = scale as any
          if (scaleObj?.alias === family) {
            resolvedScaleKey = scaleKey
            break
          }
        }
      }

      // Helper: detect which scale keys are already in use for a given mode
      const getFamiliesUsedInMode = (modeKey: 'light' | 'dark'): Set<string> => {
        const used = new Set<string>()
        const modePalettes = targetRoot[modeKey]?.palettes || {}
        for (const [pk, paletteData] of Object.entries(modePalettes)) {
          if (pk === paletteKey) continue // Skip the palette we're currently initializing
          const p = paletteData as any
          // Check a few levels to detect the family from token references
          const checkLevels = ['200', '500', '400', '300']
          for (const lvl of checkLevels) {
            const tone = p?.[lvl]?.color?.tone?.$value
            if (typeof tone === 'string') {
              // Extract scale key from token reference like {tokens.colors.scale-04.200}
              const match = tone.match(/\{tokens\.colors\.(scale-\d+)\./)
              if (match) {
                used.add(match[1])
                break
              }
              // Also handle old format {tokens.color.family.level}
              const oldMatch = tone.match(/\{tokens\.color\.([^.]+)\./)
              if (oldMatch) {
                used.add(oldMatch[1])
                break
              }
            }
          }
        }
        return used
      }

      // Get all available scale keys
      const allScaleKeys = Object.keys(colorsRoot).filter(k => k.startsWith('scale-'))

      for (const modeKey of ['light', 'dark'] as const) {
        if (!targetRoot[modeKey]) targetRoot[modeKey] = {}
        if (!targetRoot[modeKey].palettes) targetRoot[modeKey].palettes = {}
        if (!targetRoot[modeKey].palettes[paletteKey]) targetRoot[modeKey].palettes[paletteKey] = {}

        const modeLabel = modeKey === 'dark' ? 'Dark' : 'Light'

        // Determine which family/scale to use for THIS mode
        // If the chosen family is already used by another palette in this mode,
        // pick a random unused scale instead to avoid duplicates
        let scaleKeyForMode = resolvedScaleKey
        let familyForMode = family

        const usedInMode = getFamiliesUsedInMode(modeKey)
        if (scaleKeyForMode && usedInMode.has(scaleKeyForMode)) {
          // The chosen family is already used in this mode — pick a random unused one
          const availableScales = allScaleKeys.filter(k => !usedInMode.has(k))
          if (availableScales.length > 0) {
            scaleKeyForMode = availableScales[Math.floor(Math.random() * availableScales.length)]
            familyForMode = scaleKeyForMode
          }
        } else if (!scaleKeyForMode && usedInMode.has(family)) {
          // Old format family is already used — pick a random unused scale
          const availableScales = allScaleKeys.filter(k => !usedInMode.has(k))
          if (availableScales.length > 0) {
            scaleKeyForMode = availableScales[Math.floor(Math.random() * availableScales.length)]
            familyForMode = scaleKeyForMode
          }
        }

        headerLevels.forEach((lvl) => {
          if (!targetRoot[modeKey].palettes[paletteKey][lvl]) targetRoot[modeKey].palettes[paletteKey][lvl] = {}
          if (!targetRoot[modeKey].palettes[paletteKey][lvl].color) targetRoot[modeKey].palettes[paletteKey][lvl].color = {}

          // Determine the correct token reference for this level
          // In dark mode, palette levels are reversed (1000 = lightest, 000 = darkest)
          const tokenLevel = getTokenLevelForMode(lvl, modeLabel)
          let levelTokenRef: string
          if (scaleKeyForMode) {
            levelTokenRef = `{tokens.colors.${scaleKeyForMode}.${tokenLevel}}`
          } else {
            levelTokenRef = `{tokens.color.${familyForMode}.${tokenLevel}}`
          }

          // Set tone to reference the family token
          targetRoot[modeKey].palettes[paletteKey][lvl].color.tone = {
            $type: 'color',
            $value: levelTokenRef
          }

          // Set on-tone to reference white (will be updated by PaletteGrid based on contrast)
          targetRoot[modeKey].palettes[paletteKey][lvl].color['on-tone'] = {
            $type: 'color',
            $value: `{brand.palettes.white}`
          }
        })
      }

      setTheme(themeCopy)
    } catch (err) {
      console.error('Failed to initialize palette theme:', err)
    }
  }

  const addPalette = () => {
    if (!canAddPalette || unusedFamilies.length === 0) {
      console.warn('Cannot add palette:', { canAddPalette, unusedFamiliesLength: unusedFamilies.length })
      return
    }

    // Only use unused color scales - take the first available one
    // unusedFamilies already filters out used families, so we can trust it
    const family = unusedFamilies[0]

    if (!family) {
      console.warn('No family available to add palette')
      return
    }

    const existing = new Set(palettes.map((p) => p.key))
    let i = 1
    while (existing.has(`palette-${i}`)) i += 1
    const nextKey = `palette-${i}`

    try {
      // Initialize theme JSON for this palette using the unused color scale
      initializePaletteTheme(nextKey, family)

      // Add palette entry with the unused color scale as initialFamily
      const newPalette: PaletteEntry = { key: nextKey, title: `Palette ${i}`, defaultLevel: 500, initialFamily: family }
      const updatedPalettes = [...palettes, newPalette]
      writePalettes(updatedPalettes)

      // Show toast with scroll action
      showToast(`Palette ${i} added`, nextKey)


    } catch (err) {
      console.error('Failed to add palette:', err)
    }
  }

  const deletePalette = (key: string) => {
    if (key === 'neutral' || key === 'palette-1') return
    writePalettes(palettes.filter((p) => p.key !== key))
    // Dispatch event for AA compliance watcher
    try {
      window.dispatchEvent(new CustomEvent('paletteDeleted', { detail: { key } }))
    } catch { }

  }

  // Generate descriptive labels: Grayscale for neutral (index 0), then Primary, Secondary, etc.
  const getDescriptiveLabel = (paletteKey: string, index: number): string => {
    if (paletteKey === 'neutral' || index === 0) return 'Grayscale'
    const ordinalWords = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary', 'Senary', 'Septenary', 'Octonary']
    return ordinalWords[index - 1] || `Palette ${index}`
  }

  const PlusIcon = iconNameToReactComponent('plus')

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastPaletteKey, setToastPaletteKey] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, paletteKey: string) => {
    // Clear any existing timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToastMessage(message)
    setToastPaletteKey(paletteKey)
    // Auto-dismiss after 5 seconds
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
      setToastPaletteKey(null)
    }, 5000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToastMessage(null)
    setToastPaletteKey(null)
  }, [])

  const scrollToPalette = useCallback((paletteKey: string) => {
    const el = document.querySelector(`[data-palette-key="${paletteKey}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    dismissToast()
  }, [dismissToast])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(${genericLayerProperty(0, 'surface')})`, color: `var(${genericLayerText(0, 'color')})` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica_brand_dimensions_general_xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_gutters_horizontal)' }}>
          <h1 id="theme-mode-label" style={{
            margin: 0,
            fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
            fontSize: 'var(--recursica_brand_typography_h1-font-size)',
            fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
            letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
            lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
            color: `var(${genericLayerText(0, 'color')})`,
          }}>Palettes</h1>
          <Button
            variant="outline"
            size="small"
            onClick={addPalette}
            disabled={!canAddPalette}
            icon={PlusIcon ? <PlusIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null}
          >
            Add palette
          </Button>
        </div>

        <div className="section" style={{ marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)', display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)' }}>
          {palettes.map((p, index) => (
            <PaletteGrid
              key={p.key}
              paletteKey={p.key}
              title={p.title}
              descriptiveLabel={getDescriptiveLabel(p.key, index)}
              defaultLevel={p.defaultLevel}
              mode={mode === 'dark' ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        <ColorTokenPicker />

        <PaletteSwatchPicker />
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--recursica_brand_dimensions_general_xl)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
        }}>
          <Toast
            variant="success"
            onClose={dismissToast}
            action={
              toastPaletteKey ? (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => scrollToPalette(toastPaletteKey)}
                >
                  Scroll to palette
                </Button>
              ) : undefined
            }
          >
            {toastMessage}
          </Toast>
        </div>
      )}
    </div>
  )
}


