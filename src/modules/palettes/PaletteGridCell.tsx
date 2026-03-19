import { useState, useMemo, useEffect, useRef } from 'react'
import { readCssVar, readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb, blendHexWithOpacity } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { getAllFamilyNames, setFamilyNameByAlias } from '../../core/utils/familyNames'
import { getVarsStore } from '../../core/store/varsStore'
import type { JsonLike } from '../../core/resolvers/tokens'
import { ColorPickerOverlay } from '../pickers/ColorPickerOverlay'
import { updateCssVar } from '../../core/css/updateCssVar'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Chip } from '../../components/adapters/Chip'
import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'
import { genericLayerProperty, genericLayerText, paletteCore, extractColorToken } from '../../core/css/cssVarBuilder'



// Helper to extract token name from CSS variable value
function extractTokenNameFromCssVar(cssVarValue: string | undefined): string | null {
  if (!cssVarValue) return null
  const parsed = extractColorToken(cssVarValue)
  if (!parsed) return null
  return `color/${parsed.family}/${parsed.level}`
}

export type PaletteEmphasisCellProps = {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  paletteKey?: string
  level?: string
  tokens?: JsonLike
  emphasisType?: 'high' | 'low'
  isFirst?: boolean
  isLast?: boolean
}

export function PaletteEmphasisCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onClick,
  paletteKey,
  level,
  tokens,
  emphasisType,
  isFirst,
  isLast,
}: PaletteEmphasisCellProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; anchorElement: HTMLElement } | null>(null)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setOpenPicker(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const cellRef = useRef<HTMLTableCellElement>(null)
  const { updateToken, theme } = useVars()
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  const AA = 4.5

  // Load family names from CSS vars
  useEffect(() => {
    try {
      const names = getAllFamilyNames()
      if (Object.keys(names).length > 0) setFamilyNames(names)
    } catch { }
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          return
        }
        setFamilyNames(getAllFamilyNames())
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])

  // Listen for palette variable changes to force re-render
  useEffect(() => {
    const handler = () => {
      setUpdateTrigger((prev) => prev + 1)
    }
    window.addEventListener('paletteVarsChanged', handler as any)
    window.addEventListener('recheckAllPaletteOnTones', handler as any)
    return () => {
      window.removeEventListener('paletteVarsChanged', handler as any)
      window.removeEventListener('recheckAllPaletteOnTones', handler as any)
    }
  }, [])

  // Check AA compliance with opacity consideration
  // Check both high and low emphasis to determine if tone fails AA for either
  const aaStatus = useMemo(() => {
    if (!tokens || !paletteKey || !level) return null

    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)
    const emphasisValue = readCssVar(emphasisCssVar)

    if (!toneValue || !onToneValue) return null

    const tokenIndex = buildTokenIndex(tokens)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)

    if (!toneHex || !onToneHex) return null

    // Get emphasis opacity using readCssVarNumber (resolves var() references via computed style)
    const opacity = readCssVarNumber(emphasisCssVar, 1)

    // Also get high and low emphasis opacities to check both
    const highEmphasisCssVar = `--recursica_brand_text-emphasis_high`
    const lowEmphasisCssVar = `--recursica_brand_text-emphasis_low`
    const highOpacity = readCssVarNumber(highEmphasisCssVar, 1)
    const lowOpacity = readCssVarNumber(lowEmphasisCssVar, 1)

    // Blend on-tone with tone using current emphasis opacity
    const blendedOnTone = blendHexWithOpacity(onToneHex, toneHex, opacity) ?? onToneHex
    const currentRatio = contrastRatio(toneHex, blendedOnTone)
    const passesAA = currentRatio >= AA

    // Read actual core black and white colors from CSS variables (not hardcoded)
    const coreBlackVar = `--recursica_brand_palettes_core_black`
    const coreWhiteVar = `--recursica_brand_palettes_core_white`
    const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
    const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'
    const black = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
    const white = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`

    // Check high emphasis
    const blackHighBlended = blendHexWithOpacity(black, toneHex, highOpacity) ?? black
    const whiteHighBlended = blendHexWithOpacity(white, toneHex, highOpacity) ?? white
    const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
    const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
    const blackHighPasses = blackHighContrast >= AA
    const whiteHighPasses = whiteHighContrast >= AA

    // Check low emphasis
    const blackLowBlended = blendHexWithOpacity(black, toneHex, lowOpacity) ?? black
    const whiteLowBlended = blendHexWithOpacity(white, toneHex, lowOpacity) ?? white
    const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
    const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
    const blackLowPasses = blackLowContrast >= AA
    const whiteLowPasses = whiteLowContrast >= AA

    // Check current on-tone at each emphasis level individually
    const currentHighBlended = blendHexWithOpacity(onToneHex, toneHex, highOpacity) ?? onToneHex
    const currentLowBlended = blendHexWithOpacity(onToneHex, toneHex, lowOpacity) ?? onToneHex
    const currentHighPasses = contrastRatio(toneHex, currentHighBlended) >= AA
    const currentLowPasses = contrastRatio(toneHex, currentLowBlended) >= AA

    // Per-emphasis failure flags: a cell fails ONLY if black, white, AND the current on-tone all fail
    // This prevents false-positive warnings when compliance fixes use non-black/non-white tokens
    const highFailsAA = !currentHighPasses && !blackHighPasses && !whiteHighPasses
    const lowFailsAA = !currentLowPasses && !blackLowPasses && !whiteLowPasses

    // For current emphasis level
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
      highFailsAA,
      lowFailsAA,
    }
  }, [toneCssVar, onToneCssVar, emphasisCssVar, tokens, paletteKey, level, updateTrigger, mode])

  // Show "x" only if:
  // 1. Current on-tone doesn't pass AA (with opacity considered)
  // 2. AND both black and white (with opacity) don't pass AA
  // This means auto-fix has been attempted (trying both black and white) and failed
  // Show dot if current on-tone passes AA OR if black or white would pass (auto-fix would work)
  // If aaStatus is null (can't check), default to showing dot
  const showAAWarning = aaStatus
    ? (!aaStatus.passesAA && !aaStatus.blackPasses && !aaStatus.whitePasses)
    : false

  // If THIS cell's emphasis level fails AA, show color picker instead of set-primary
  const shouldOpenColorPicker = aaStatus
    ? (emphasisType === 'high' ? aaStatus.highFailsAA : aaStatus.lowFailsAA)
    : false


  return (
    <td
      className={`palette-box${isPrimary ? ' default' : ''}`}
      style={{
        backgroundColor: `var(${toneCssVar})`,
        cursor: 'pointer',
        position: 'relative',
        boxSizing: 'border-box',
        padding: isPrimary ? 'var(--recursica_brand_dimensions_general_md)' : `0 var(--recursica_brand_dimensions_general_md)`,
        width: isPrimary ? '20%' : undefined,
        flex: isPrimary ? '0 0 20%' : 1,
        minHeight: isPrimary ? '80px' : undefined,
        borderRadius: isPrimary
          ? (emphasisType === 'high'
            ? 'var(--recursica_brand_dimensions_border-radii_default) var(--recursica_brand_dimensions_border-radii_default) 0 0'
            : '0 0 var(--recursica_brand_dimensions_border-radii_default) var(--recursica_brand_dimensions_border-radii_default)')
          : (() => {
            if (emphasisType === 'high' && isFirst) {
              return 'var(--recursica_brand_dimensions_border-radii_default) 0 0 0'
            }
            if (emphasisType === 'high' && isLast) {
              return '0 var(--recursica_brand_dimensions_border-radii_default) 0 0'
            }
            if (emphasisType === 'low' && isLast) {
              return '0 0 var(--recursica_brand_dimensions_border-radii_default) 0'
            }
            if (emphasisType === 'low' && isFirst) {
              return '0 0 0 var(--recursica_brand_dimensions_border-radii_default)'
            }
            return undefined
          })(),
        marginLeft: isPrimary ? `var(--recursica_brand_dimensions_general_sm)` : undefined,
        marginRight: isPrimary ? `var(--recursica_brand_dimensions_general_sm)` : undefined,
        display: isPrimary ? 'flex' : 'flex',
        flexDirection: isPrimary ? 'column' : 'column',
        alignItems: isPrimary ? 'center' : 'center',
        justifyContent: isPrimary ? (emphasisType === 'high' ? 'flex-start' : 'flex-end') : 'center',
        alignContent: isPrimary ? undefined : 'space-around',
        gap: isPrimary ? 'var(--recursica_brand_dimensions_general_md)' : undefined,
      }}
      title={shouldOpenColorPicker ? 'On-tone color fails contrast' : (isPrimary ? undefined : `Set ${level} as default`)}
      onMouseEnter={(e) => {
        setIsHovered(true)
        if (!shouldOpenColorPicker) {
          onMouseEnter()
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        if (!shouldOpenColorPicker) {
          onMouseLeave()
        }
      }}
      ref={cellRef}
      onClick={(e) => {
        if (shouldOpenColorPicker) {
          e.preventDefault()
          e.stopPropagation()
          // Extract token name from the tone CSS variable
          const toneValue = readCssVar(toneCssVar)
          const tokenName = extractTokenNameFromCssVar(toneValue)

          if (tokenName && tokens && cellRef.current) {
            // Get current hex value for the token
            const overrideMap = readOverrides()
            const jsonColors: any = (tokens as any)?.tokens?.color || {}
            const parts = tokenName.split('/')
            const family = parts[1]
            const level = parts[2]
            const overrideValue = (overrideMap as any)[tokenName]
            const tokenValue = overrideValue ?? jsonColors?.[family]?.[level]?.$value ?? jsonColors?.[family]?.[level]
            const currentHex = typeof tokenValue === 'string' && /^#?[0-9a-f]{6}$/i.test(tokenValue)
              ? (tokenValue.startsWith('#') ? tokenValue : `#${tokenValue}`).toLowerCase()
              : '#000000'

            // Open ColorPickerOverlay
            window.dispatchEvent(new CustomEvent('closeAllPickersAndPanels'))
            setOpenPicker({ tokenName, anchorElement: cellRef.current })
          }
          return
        }
        // Only allow setting primary if tone passes AA
        onClick()
      }}
    >
      {isPrimary ? (
        // For primary tone, show both high and low emphasis dots vertically stacked
        (() => {
          const highEmphasisCssVar = `--recursica_brand_text-emphasis_high`
          const lowEmphasisCssVar = `--recursica_brand_text-emphasis_low`
          const highOnToneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_on-tone`
          const lowOnToneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_on-tone`

          if (shouldOpenColorPicker) {
            const WarningIcon = iconNameToReactComponent('warning')
            return (
              <>
                <div style={{
                  color: `var(${highOnToneCssVar})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: `var(${highEmphasisCssVar})`
                }}>
                  {WarningIcon && <WarningIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} />}
                </div>
                <div style={{
                  color: `var(${lowOnToneCssVar})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: `var(${lowEmphasisCssVar})`
                }}>
                  {WarningIcon && <WarningIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} />}
                </div>
              </>
            )
          }

          return (
            <>
              {emphasisType === 'high' && (
                <>
                  <div style={{
                    color: `var(${highOnToneCssVar})`,
                    opacity: `var(${highEmphasisCssVar})`,
                    fontFamily: 'var(--recursica_brand_typography_body-small-font-family)',
                    fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                    fontWeight: 'var(--recursica_brand_typography_body-small-font-weight)',
                    letterSpacing: 'var(--recursica_brand_typography_body-small-font-letter-spacing)',
                    lineHeight: 'var(--recursica_brand_typography_body-small-line-height)',
                  }}>
                    {level}
                  </div>
                  <div className="palette-dot" style={{
                    position: 'relative',
                    width: '16px',
                    height: '16px',
                    backgroundColor: `var(${highOnToneCssVar})`,
                    opacity: `var(${highEmphasisCssVar})`
                  }} />
                </>
              )}
              {emphasisType === 'low' && (
                <>
                  <div className="palette-dot" style={{
                    position: 'relative',
                    width: '16px',
                    height: '16px',
                    backgroundColor: `var(${lowOnToneCssVar})`,
                    opacity: `var(${lowEmphasisCssVar})`
                  }} />
                  <Chip
                    variant="unselected"
                    size="small"
                    layer="layer-0"
                  >
                    Default
                  </Chip>
                </>
              )}
            </>
          )
        })()
      ) : shouldOpenColorPicker ? (
        (() => {
          const WarningIcon = iconNameToReactComponent('warning')
          return (
            <div
              className="palette-warning"
              style={{
                color: `var(${onToneCssVar})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: `var(${emphasisCssVar})`
              }}
            >
              {WarningIcon && <WarningIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} />}
            </div>
          )
        })()
      ) : (
        <div className="palette-dot" style={{
          position: 'relative',
          width: '16px',
          height: '16px',
          backgroundColor: `var(${onToneCssVar})`,
          opacity: `var(${emphasisCssVar})`
        }} />
      )}

      {shouldOpenColorPicker && isHovered && (
        <div
          data-recursica-layer="1"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 'var(--recursica_brand_dimensions_general_sm)',
            padding: `var(--recursica_brand_dimensions_general_md) var(--recursica_brand_dimensions_general_lg)`,
            backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            borderRadius: `var(--recursica_brand_dimensions_border-radii_default)`,
            boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ color: `var(${genericLayerText(1, 'color')})` }}>
            On-tone color fails contrast
          </div>
        </div>
      )}

      {!shouldOpenColorPicker && !isPrimary && isHovered && (
        <div
          data-recursica-layer="1"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 'var(--recursica_brand_dimensions_general_sm)',
            padding: `var(--recursica_brand_dimensions_general_md) var(--recursica_brand_dimensions_general_lg)`,
            backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            borderRadius: `var(--recursica_brand_dimensions_border-radii_default)`,
            boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ color: `var(${genericLayerText(1, 'color')})` }}>
            Set {level} as default
          </div>
        </div>
      )}

      {/* ColorPickerOverlay for updating token color */}
      {openPicker && openPicker.tokenName && tokens && (() => {
        const tokenName = openPicker.tokenName
        const parts = tokenName.split('/')
        const family = parts[1]
        const overrideMap = readOverrides()
        const jsonColors: any = (tokens as any)?.tokens?.color || {}
        const overrideValue = (overrideMap as any)[tokenName]
        const tokenValue = overrideValue ?? jsonColors?.[family]?.[parts[2]]?.$value ?? jsonColors?.[family]?.[parts[2]]
        const currentHex = typeof tokenValue === 'string' && /^#?[0-9a-f]{6}$/i.test(tokenValue)
          ? (tokenValue.startsWith('#') ? tokenValue : `#${tokenValue}`).toLowerCase()
          : '#000000'
        const displayFamilyName = familyNames[family] || family

        return (
          <ColorPickerOverlay
            tokenName={tokenName}
            currentHex={currentHex}
            anchorElement={openPicker.anchorElement}
            onClose={() => setOpenPicker(null)}
            onNameFromHex={async (fam: string, hex: string) => {
              // Optional: Update family name from hex
              try {
                const { getFriendlyNamePreferNtc } = await import('../utils/colorNaming')
                const label = await getFriendlyNamePreferNtc(hex)
                if (label) {
                  setFamilyNameByAlias(fam, label)
                }
              } catch { }
            }}
            displayFamilyName={displayFamilyName}
            onChange={(hex: string, cascadeDown: boolean, cascadeUp: boolean) => {
              // Update the token value
              updateToken(tokenName, hex)

              // Handle cascade if needed
              if (cascadeDown || cascadeUp) {
                // Import cascade function if needed
                import('../tokens/colors/colorCascade').then(({ cascadeColor }) => {
                  cascadeColor(tokenName, hex, cascadeDown, cascadeUp, (name: string, h: string) => {
                    updateToken(name, h)
                  })
                }).catch((err) => {
                  console.warn('Failed to cascade color:', err)
                })
              }

              // Update on-tone value in theme JSON for AA compliance
              if (paletteKey && level && theme) {
                try {
                  const themeCopy = getVarsStore().getLatestThemeCopy()
                  const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                  const themes = root?.themes || root
                  const modeKey = mode.toLowerCase()

                  if (themes?.[modeKey]?.palettes?.[paletteKey]?.[level]) {
                    // Read actual core colors from CSS vars
                    const coreBlackVar = paletteCore(modeKey, 'black')
                    const coreWhiteVar = paletteCore(modeKey, 'white')
                    const black = (readCssVarResolved(coreBlackVar) || '#000000').toLowerCase()
                    const white = (readCssVarResolved(coreWhiteVar) || '#ffffff').toLowerCase()
                    const cBlack = contrastRatio(hex, black)
                    const cWhite = contrastRatio(hex, white)
                    const AA = 4.5

                    let chosen: 'black' | 'white'
                    if (cBlack >= AA && cWhite >= AA) {
                      chosen = cBlack >= cWhite ? 'black' : 'white'
                    } else if (cBlack >= AA) {
                      chosen = 'black'
                    } else if (cWhite >= AA) {
                      chosen = 'white'
                    } else {
                      chosen = cBlack >= cWhite ? 'black' : 'white'
                    }

                    // Update the on-tone value in theme JSON - use short alias format (no theme path)
                    if (!themes[modeKey].palettes[paletteKey][level]) {
                      themes[modeKey].palettes[paletteKey][level] = {}
                    }
                    if (!themes[modeKey].palettes[paletteKey][level].color) {
                      themes[modeKey].palettes[paletteKey][level].color = {}
                    }
                    themes[modeKey].palettes[paletteKey][level].color['on-tone'] = {
                      $type: 'color',
                      $value: `{brand.palettes.${chosen}}`
                    }

                    // Set the CSS var directly for immediate visual feedback
                    const onToneCssVar = `--recursica_brand_themes_${modeKey}_palettes_${paletteKey}_${level}_color_on-tone`
                    updateCssVar(onToneCssVar, `var(${paletteCore(modeKey, chosen)})`)
                    getVarsStore().setThemeSilent(themeCopy)
                  }
                } catch (err) {
                  console.error('Failed to update on-tone in theme JSON:', err)
                }
              }

              // Trigger AA compliance re-check
              try {
                window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
              } catch { }
            }}
          />
        )
      })()}
    </td>
  )
}

export type PalettePrimaryIndicatorCellProps = {
  isPrimary: boolean
  isHovered: boolean
  onSetPrimary: () => void
}

export function PalettePrimaryIndicatorCell({
  isPrimary,
  isHovered,
  onSetPrimary,
}: PalettePrimaryIndicatorCellProps) {
  const { mode } = useThemeMode()
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')

  return (
    <td className={isPrimary ? 'default' : undefined} style={{ textAlign: 'center', verticalAlign: 'top', height: 28 }}>
      {isPrimary ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
            color: `var(${genericLayerText(0, 'color')})`,
          }}
        >Default</span>
      ) : isHovered ? (
        <button
          onClick={onSetPrimary}
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: `1px dashed var(${genericLayerProperty(1, 'border-color')})`,
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
            cursor: 'pointer',
            color: `var(${genericLayerText(0, 'color')})`,
          }}
          title="Set as default"
        >Set as default</button>
      ) : null}
    </td>
  )
}


