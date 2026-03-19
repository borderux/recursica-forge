import { PaletteEmphasisCell, PalettePrimaryIndicatorCell } from './PaletteGridCell'
import type { JsonLike } from '../../core/resolvers/tokens'
import { readCssVar } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb, blendHexWithOpacity } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { getVarsStore } from '../../core/store/varsStore'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { useState, useRef, useEffect } from 'react'
import { ColorPickerOverlay } from '../pickers/ColorPickerOverlay'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { useThemeMode } from '../theme/ThemeModeContext'
import { genericLayerText, paletteCore, extractColorToken } from '../../core/css/cssVarBuilder'
import { updateCssVar } from '../../core/css/updateCssVar'
import { getAllFamilyNames, setFamilyNameByAlias } from '../../core/utils/familyNames'



// Helper to extract token name from CSS variable value
function extractTokenNameFromCssVar(cssVarValue: string | undefined): string | null {
  if (!cssVarValue) return null
  const parsed = extractColorToken(cssVarValue)
  if (!parsed) return null
  return `color/${parsed.family}/${parsed.level}`
}

export type PaletteScaleProps = {
  level: string
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  isHovered: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSetPrimary: () => void
  paletteKey?: string
  tokens?: JsonLike
}

export function PaletteScaleHeader({
  level,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  tokens,
}: Pick<PaletteScaleProps, 'level' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'tokens'>) {
  // No fixed width - cells will size naturally with padding
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; anchorElement: HTMLElement } | null>(null)
  const { mode: themeMode } = useThemeMode()
  // layer bases removed — use builder functions directly

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setOpenPicker(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const headerRef = useRef<HTMLTableCellElement>(null)
  const { updateToken, theme } = useVars()

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

  // Check AA compliance for this level - check both high and low emphasis
  let isNonCompliant = false
  // Detect mode by checking which CSS variable exists
  let mode: 'light' | 'dark' = 'light'
  if (tokens && paletteKey) {
    const lightToneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_tone`
    const darkToneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_tone`
    const lightToneValue = readCssVar(lightToneCssVar)
    const darkToneValue = readCssVar(darkToneCssVar)
    mode = lightToneValue ? 'light' : (darkToneValue ? 'dark' : 'light')

    const toneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_tone`
    const onToneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_on-tone`
    const highEmphasisCssVar = `--recursica_brand_text-emphasis_high`
    const lowEmphasisCssVar = `--recursica_brand_text-emphasis_low`

    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)

    if (toneValue && onToneValue) {
      const tokenIndex = buildTokenIndex(tokens)
      const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
      const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)

      if (toneHex && onToneHex) {
        const highOpacity = readCssVarNumber(highEmphasisCssVar, 1)
        const lowOpacity = readCssVarNumber(lowEmphasisCssVar, 1)

        // Check if black and white pass AA for BOTH high and low emphasis
        const black = '#000000'
        const white = '#ffffff'

        // Check high emphasis
        const blackHighBlended = blendHexWithOpacity(black, toneHex, highOpacity) ?? black
        const whiteHighBlended = blendHexWithOpacity(white, toneHex, highOpacity) ?? white
        const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
        const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
        const blackHighPasses = blackHighContrast >= 4.5
        const whiteHighPasses = whiteHighContrast >= 4.5

        // Check low emphasis
        const blackLowBlended = blendHexWithOpacity(black, toneHex, lowOpacity) ?? black
        const whiteLowBlended = blendHexWithOpacity(white, toneHex, lowOpacity) ?? white
        const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
        const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
        const blackLowPasses = blackLowContrast >= 4.5
        const whiteLowPasses = whiteLowContrast >= 4.5

        // Tone fails AA if both black and white fail for EITHER emphasis level
        isNonCompliant = (!blackHighPasses && !whiteHighPasses) || (!blackLowPasses && !whiteLowPasses)
      }
    }
  }

  return (
    <>
      <th
        ref={headerRef}
        className={isPrimary ? 'default' : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          if (isNonCompliant) {
            e.preventDefault()
            e.stopPropagation()
            // Extract token name from the tone CSS variable
            const toneCssVar = `--recursica_brand_palettes_${paletteKey}_${level}_color_tone`
            const toneValue = readCssVar(toneCssVar)
            const tokenName = extractTokenNameFromCssVar(toneValue)

            if (tokenName && tokens && headerRef.current) {
              // Open ColorPickerOverlay
              window.dispatchEvent(new CustomEvent('closeAllPickersAndPanels'))
              setOpenPicker({ tokenName, anchorElement: headerRef.current })
            }
            return
          }
          onSetPrimary()
        }}
        title={isNonCompliant ? 'On-tone color fails contrast' : (isPrimary ? undefined : `Set ${level} as default`)}
        style={{
          cursor: 'pointer',
          padding: `0 var(--recursica_brand_dimensions_general_md)`,
          boxSizing: 'border-box',
          fontFamily: 'var(--recursica_brand_typography_body-small-font-family)',
          fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
          fontWeight: 'var(--recursica_brand_typography_body-small-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_body-small-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_body-small-line-height)',
          color: `var(${genericLayerText(0, 'color')})`,
          width: isPrimary ? '20%' : undefined,
          flex: isPrimary ? '0 0 20%' : 1,
          marginLeft: isPrimary ? `var(--recursica_brand_dimensions_general_sm)` : undefined,
          marginRight: isPrimary ? `var(--recursica_brand_dimensions_general_sm)` : undefined,
          transform: 'translateY(20px)',
        }}
      >
        {isPrimary ? null : level}
      </th>

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
              updateToken(tokenName, hex)

              if (cascadeDown || cascadeUp) {
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

              try {
                window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
              } catch { }
            }}
          />
        )
      })()}
    </>
  )
}

export function PaletteScaleHighEmphasis({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  level,
  tokens,
  emphasisType,
  isFirst,
  isLast,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'level' | 'tokens'> & { emphasisType?: 'high' | 'low'; isFirst?: boolean; isLast?: boolean }) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      paletteKey={paletteKey}
      level={level}
      tokens={tokens}
      emphasisType={emphasisType}
      isFirst={isFirst}
      isLast={isLast}
    />
  )
}

export function PaletteScaleLowEmphasis({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  level,
  tokens,
  emphasisType,
  isFirst,
  isLast,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'level' | 'tokens'> & { emphasisType?: 'high' | 'low'; isFirst?: boolean; isLast?: boolean }) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      paletteKey={paletteKey}
      level={level}
      tokens={tokens}
      emphasisType={emphasisType}
      isFirst={isFirst}
      isLast={isLast}
    />
  )
}

export function PaletteScalePrimaryIndicator({
  isPrimary,
  isHovered,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'isPrimary' | 'isHovered' | 'onSetPrimary'>) {
  return (
    <PalettePrimaryIndicatorCell
      isPrimary={isPrimary}
      isHovered={isHovered}
      onSetPrimary={onSetPrimary}
    />
  )
}

