import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { contrastRatio, hexToRgb, blendHexWithOpacity } from '../theme/contrastUtil'

import { readCssVar, readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { getVarsStore } from '../../core/store/varsStore'
import { Dropdown } from '../../components/adapters/Dropdown'


type PaletteColorSelectorProps = {
  paletteKey: string
  mode: 'Light' | 'Dark'
  primaryLevel: string
  headerLevels: string[]
  onFamilyChange?: (family: string) => void
}

// Dark mode reverses the palette levels: palette 1000 = lightest token (000),
// palette 000 = darkest token (1000). This map defines the reversal.
const DARK_MODE_LEVEL_MAP: Record<string, string> = {
  '000': '1000',
  '050': '900',
  '100': '800',
  '200': '700',
  '300': '600',
  '400': '500',
  '500': '400',
  '600': '300',
  '700': '200',
  '800': '100',
  '900': '050',
  '1000': '000',
}

/**
 * Get the token level to use for a given palette level.
 * In light mode, palette levels map 1:1 to token levels.
 * In dark mode, they are reversed (e.g., palette 1000 → token 000).
 */
export function getTokenLevelForMode(paletteLevel: string, mode: 'Light' | 'Dark' | 'light' | 'dark'): string {
  const modeLower = mode.toLowerCase()
  if (modeLower === 'dark') {
    return DARK_MODE_LEVEL_MAP[paletteLevel] || paletteLevel
  }
  return paletteLevel
}



// readCssVarNumber is now imported from centralized utility

// Determine the correct on-tone color (white or black) considering opacity for AA compliance
function pickOnToneWithOpacity(toneHex: string, modeLabel: 'Light' | 'Dark'): 'white' | 'black' {
  const AA = 4.5
  const modeLower = modeLabel.toLowerCase()

  // Read actual core black and white colors from CSS variables (not hardcoded)
  const coreBlackVar = `--recursica_brand_themes_${modeLower}_palettes_core-black`
  const coreWhiteVar = `--recursica_brand_themes_${modeLower}_palettes_core-white`
  const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
  const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'

  // Normalize hex values (ensure they start with # and are lowercase)
  const black = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
  const white = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`

  // First, check contrast without opacity (baseline)
  const whiteBaseContrast = contrastRatio(toneHex, white)
  const blackBaseContrast = contrastRatio(toneHex, black)

  // Get emphasis opacity values from CSS variables
  const highEmphasisOpacity = readCssVarNumber(`--recursica_brand_themes_${modeLower}_text-emphasis_high`)
  const lowEmphasisOpacity = readCssVarNumber(`--recursica_brand_themes_${modeLower}_text-emphasis_low`)

  // Blend white and black with tone using both opacity values
  const whiteHighBlended = blendHexWithOpacity(white, toneHex, highEmphasisOpacity)
  const whiteLowBlended = blendHexWithOpacity(white, toneHex, lowEmphasisOpacity)
  const blackHighBlended = blendHexWithOpacity(black, toneHex, highEmphasisOpacity)
  const blackLowBlended = blendHexWithOpacity(black, toneHex, lowEmphasisOpacity)

  // Calculate contrast ratios with opacity applied
  const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
  const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
  const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
  const blackLowContrast = contrastRatio(toneHex, blackLowBlended)

  // Check which option meets AA for both emphasis levels
  const whiteMeetsHighAA = whiteHighContrast >= AA
  const whiteMeetsLowAA = whiteLowContrast >= AA
  const whiteMeetsBothAA = whiteMeetsHighAA && whiteMeetsLowAA

  const blackMeetsHighAA = blackHighContrast >= AA
  const blackMeetsLowAA = blackLowContrast >= AA
  const blackMeetsBothAA = blackMeetsHighAA && blackMeetsLowAA

  // Priority 1: Both meet AA - choose based on baseline contrast first
  if (whiteMeetsBothAA && blackMeetsBothAA) {
    if (Math.abs(whiteBaseContrast - blackBaseContrast) > 1.0) {
      return whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
    }
    return whiteLowContrast >= blackLowContrast ? 'white' : 'black'
  }

  // Priority 2: Only one meets both AA levels
  if (whiteMeetsBothAA) return 'white'
  if (blackMeetsBothAA) return 'black'

  // Priority 3: Check low emphasis (harder case) - prioritize this
  if (whiteMeetsLowAA && !blackMeetsLowAA) return 'white'
  if (blackMeetsLowAA && !whiteMeetsLowAA) return 'black'

  // Priority 4: Check high emphasis
  if (whiteMeetsHighAA && !blackMeetsHighAA) return 'white'
  if (blackMeetsHighAA && !whiteMeetsHighAA) return 'black'

  // Priority 5: Neither meets AA - choose based on baseline contrast
  if (Math.abs(whiteBaseContrast - blackBaseContrast) > 0.5) {
    return whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
  }
  return whiteLowContrast >= blackLowContrast ? 'white' : 'black'
}

export default function PaletteColorSelector({
  paletteKey,
  mode,
  primaryLevel,
  headerLevels,
  onFamilyChange,
}: PaletteColorSelectorProps) {
  const { tokens: tokensJson, theme: themeJson, setTheme, palettes: palettesState } = useVars()
  const [overrideVersion, setOverrideVersion] = useState(0)
  const [paletteChangeVersion, setPaletteChangeVersion] = useState(0)

  // Listen for palette deletion events to force recalculation of available families
  useEffect(() => {
    const handlePaletteDeleted = () => {
      setPaletteChangeVersion(v => v + 1)
    }
    window.addEventListener('paletteDeleted', handlePaletteDeleted as any)
    return () => {
      window.removeEventListener('paletteDeleted', handlePaletteDeleted as any)
    }
  }, [])

  // Detect which families are used by which palettes from theme JSON
  const familiesUsedByPalettes = useMemo(() => {
    const usedBy: Record<string, string> = {} // paletteKey -> family
    const themeIndex: Record<string, { value: any }> = {}

    const visit = (node: any, prefix: string, modeLabel: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        themeIndex[`${modeLabel}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, modeLabel))
    }

    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    // Use 'palette' prefix (singular) to match resolver's buildThemeIndex
    if (themes?.light?.palettes) visit(themes.light.palettes, 'palette', 'Light')
    if (themes?.dark?.palettes) visit(themes.dark.palettes, 'palette', 'Dark')
    // Also support old structure for backward compatibility
    if (root?.light?.palettes) visit(root.light.palettes, 'palette', 'Light')
    if (root?.dark?.palettes) visit(root.dark.palettes, 'palette', 'Dark')

    // Build a deterministic map of aliases to scale keys
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    const aliasToScaleKey: Record<string, string> = {}
    Object.entries(colorsRoot).forEach(([scaleKey, scale]) => {
      if (!scaleKey.startsWith('scale-')) return
      const scaleObj = scale as any
      if (scaleObj?.alias && typeof scaleObj.alias === 'string') {
        aliasToScaleKey[scaleObj.alias] = scaleKey
      }
    })

    // Get existing palette keys from palettesState in deterministic order
    // Use array instead of Set to preserve order and ensure correct mapping
    const existingPaletteKeys: string[] = []
    if (palettesState?.dynamic) {
      palettesState.dynamic.forEach((p: any) => {
        if (p?.key) existingPaletteKeys.push(p.key)
      })
    }
    // Also include static palettes like 'neutral'
    if (!existingPaletteKeys.includes('neutral')) {
      existingPaletteKeys.push('neutral')
    }

    const checkLevels = ['200', '500', '400', '300']

    // Iterate through existing palettes in deterministic order (from palettesState)
    // This ensures each palette key maps to its correct family
    // Only detect families from the current mode — palettes are independent per mode
    const currentModeKey = mode.toLowerCase()
    const currentModeLabel = mode

    for (const pk of existingPaletteKeys) {
      // Check the current mode only
      for (const lvl of checkLevels) {
        const toneName = `palette/${pk}/${lvl}/color/tone`
        const toneRaw = themeIndex[`${currentModeLabel}::${toneName}`]?.value

        if (typeof toneRaw === 'string') {
          // Use centralized parser to check for token references
          const tokenIndex = buildTokenIndex(tokensJson)
          const context: TokenReferenceContext = { currentMode: currentModeKey as 'light' | 'dark', tokenIndex }
          const parsed = parseTokenReference(toneRaw, context)
          if (parsed && parsed.type === 'token') {
            let familyName: string | null = null

            // Handle new colors format (colors.scale-XX.level or colors.alias.level)
            if (parsed.path.length >= 2 && parsed.path[0] === 'colors') {
              const scaleOrAlias = parsed.path[1]
              // If it's a scale key, use it directly
              if (scaleOrAlias.startsWith('scale-')) {
                familyName = scaleOrAlias
              } else {
                // It's an alias - look up the scale key
                familyName = aliasToScaleKey[scaleOrAlias] || scaleOrAlias
              }
            }
            // Handle old color format (color.family.level)
            else if (parsed.path.length >= 2 && parsed.path[0] === 'color') {
              familyName = parsed.path[1]
            }

            if (familyName) {
              // Store the mapping for this specific palette key
              usedBy[pk] = familyName
              break // Found family for this palette, move to next palette
            }
          }
        }
      }
    }

    return usedBy
  }, [themeJson, tokensJson, paletteChangeVersion, palettesState, mode])

  // Get available color families
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

    // Add from overrides
    try {
      const overrides = readOverrides() as Record<string, any>
      Object.keys(overrides || {}).forEach((name) => {
        if (typeof name !== 'string') return
        if (name.startsWith('color/')) {
          const parts = name.split('/')
          const fam = parts[1]
          if (fam && fam !== 'translucent') fams.add(fam)
        } else if (name.startsWith('colors/')) {
          const parts = name.split('/')
          const scaleOrAlias = parts[1]
          if (scaleOrAlias && scaleOrAlias.startsWith('scale-')) {
            fams.add(scaleOrAlias)
          }
        }
      })
    } catch { }

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
  }, [tokensJson, overrideVersion])

  // Filter families to exclude those used by other palettes
  const families = useMemo(() => {
    const familiesUsedByOthers = new Set<string>()

    Object.entries(familiesUsedByPalettes).forEach(([pk, fam]) => {
      if (pk !== paletteKey) {
        familiesUsedByOthers.add(fam)
      }
    })

    const currentPaletteFamily = familiesUsedByPalettes[paletteKey]

    return allFamilies.filter((fam) => {
      // Include if not used by others, or if it's the current palette's family
      return !familiesUsedByOthers.has(fam) || currentPaletteFamily === fam
    })
  }, [allFamilies, familiesUsedByPalettes, paletteKey])

  // Get token value by name - memoize to prevent unnecessary recalculations
  const getTokenValueByName = useCallback((tokenName: string): string | number | undefined => {
    const parts = tokenName.split('/')
    const overrideMap = readOverrides()

    // Check overrides first
    if ((overrideMap as any)[tokenName]) return (overrideMap as any)[tokenName]

    // Handle new format: colors/scale-XX/level or colors/alias/level
    if (parts[0] === 'colors' && parts.length >= 3) {
      const scaleOrAlias = parts[1]
      const level = parts[2]
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}

      // If it's a scale key (starts with "scale-"), get directly
      if (scaleOrAlias.startsWith('scale-')) {
        return colorsRoot?.[scaleOrAlias]?.[level]?.$value
      } else {
        // It's an alias - find the scale that has this alias
        for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
          if (!scaleKey.startsWith('scale-')) continue
          const scaleObj = scale as any
          if (scaleObj?.alias === scaleOrAlias) {
            return scaleObj?.[level]?.$value
          }
        }
      }
    }

    // Handle old format: color/family/level
    if (parts[0] === 'color' && parts.length >= 3) {
      const family = parts[1]
      const level = parts[2]
      return (tokensJson as any)?.tokens?.color?.[family]?.[level]?.$value
    }

    return undefined
  }, [tokensJson, overrideVersion])

  // Detect current family from theme (use the already computed familiesUsedByPalettes)
  // Convert scale keys to aliases for display
  const detectFamilyFromTheme = useMemo(() => {
    return familiesUsedByPalettes[paletteKey] || null
  }, [familiesUsedByPalettes, paletteKey])

  const [selectedFamily, setSelectedFamily] = useState<string>(() => {
    const detected = detectFamilyFromTheme
    if (detected) return detected
    return families[0] || ''
  })

  // Sync selectedFamily when theme changes (but don't update CSS vars here)
  useEffect(() => {
    const detected = detectFamilyFromTheme
    if (detected && detected !== selectedFamily) {
      setSelectedFamily(detected)
    }
  }, [detectFamilyFromTheme, selectedFamily])

  // Also listen for theme reset to force refresh
  useEffect(() => {
    const handleThemeReset = () => {
      // Force recalculation - the theme has been reset, so re-read from theme
      // Use a small delay to ensure theme state has updated
      setTimeout(() => {
        const currentDetected = familiesUsedByPalettes[paletteKey]
        if (currentDetected) {
          setSelectedFamily(currentDetected)
        } else if (families.length > 0) {
          setSelectedFamily(families[0])
        }
      }, 50)
    }
    window.addEventListener('themeReset', handleThemeReset)
    return () => window.removeEventListener('themeReset', handleThemeReset)
  }, [familiesUsedByPalettes, paletteKey, tokensJson, families])

  // Build theme index to read token levels from recursica_brand.json (needed for recheckAACompliance)
  const themeIndex = useMemo(() => {
    const out: Record<string, { value: any }> = {}
    const visit = (node: any, prefix: string, modeLabel: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        out[`${modeLabel}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, modeLabel))
    }
    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    const themes = root?.themes || root
    if (themes?.light?.palettes) visit(themes.light.palettes, 'palette', 'Light')
    if (themes?.dark?.palettes) visit(themes.dark.palettes, 'palette', 'Dark')
    return out
  }, [themeJson])

  // Helper to get token level from recursica_brand.json for a given palette level
  const getTokenLevelForPaletteLevel = useCallback((paletteLevel: string): string | null => {
    const toneName = `palette/${paletteKey}/${paletteLevel}/color/tone`
    const toneRaw = themeIndex[`${mode}::${toneName}`]?.value
    if (typeof toneRaw === 'string') {
      const context: TokenReferenceContext = {
        currentMode: mode.toLowerCase() as 'light' | 'dark',
        tokenIndex: buildTokenIndex(tokensJson),
        theme: themeJson
      }
      const parsed = parseTokenReference(toneRaw, context)
      if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color') {
        return parsed.path[2] // Return the token level (e.g., '050' for dark mode neutral 1000)
      }
    }
    return null
  }, [themeIndex, mode, paletteKey, tokensJson, themeJson])

  // Re-check AA compliance for a palette when token values change
  // If family is provided, only re-check if this palette uses that family
  // If family is not provided (e.g., when core colors or opacities change), always re-check
  const recheckAACompliance = useCallback((family?: string) => {
    if (family !== undefined && family !== selectedFamily) return

    // Use selectedFamily if family is not provided
    const familyToUse = family || selectedFamily
    if (!familyToUse) return

    const rootEl = document.documentElement
    const modeLower = mode.toLowerCase()

    // Store verified on-tone values for theme JSON update
    const verifiedOnTones: Record<string, 'white' | 'black'> = {}

    // Calculate on-tone values for all levels first
    headerLevels.forEach((lvl) => {
      // Get the actual token level from recursica_brand.json (not the palette level)
      const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
      const tokenName = `color/${familyToUse}/${tokenLevel}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        // Get actual core color values (read from CSS variables to get current values)
        const coreBlackVar = `--recursica_brand_themes_${modeLower}_palettes_core-black`
        const coreWhiteVar = `--recursica_brand_themes_${modeLower}_palettes_core-white`
        const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
        const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'
        const normalizedBlack = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
        const normalizedWhite = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`

        // Get emphasis opacity values
        const highEmphasisOpacity = readCssVarNumber(`--recursica_brand_themes_${modeLower}_text-emphasis_high`)
        const lowEmphasisOpacity = readCssVarNumber(`--recursica_brand_themes_${modeLower}_text-emphasis_low`)
        const AA = 4.5

        // Check both core colors with opacity blending
        const whiteHighBlended = blendHexWithOpacity(normalizedWhite, hex, highEmphasisOpacity)
        const whiteLowBlended = blendHexWithOpacity(normalizedWhite, hex, lowEmphasisOpacity)
        const blackHighBlended = blendHexWithOpacity(normalizedBlack, hex, highEmphasisOpacity)
        const blackLowBlended = blendHexWithOpacity(normalizedBlack, hex, lowEmphasisOpacity)

        const whiteHighContrast = contrastRatio(hex, whiteHighBlended)
        const whiteLowContrast = contrastRatio(hex, whiteLowBlended)
        const blackHighContrast = contrastRatio(hex, blackHighBlended)
        const blackLowContrast = contrastRatio(hex, blackLowBlended)

        const whitePassesHigh = whiteHighContrast >= AA
        const whitePassesLow = whiteLowContrast >= AA
        const whitePassesBoth = whitePassesHigh && whitePassesLow

        const blackPassesHigh = blackHighContrast >= AA
        const blackPassesLow = blackLowContrast >= AA
        const blackPassesBoth = blackPassesHigh && blackPassesLow

        // Determine best on-tone color based on AA compliance
        // Priority: both pass > low emphasis > high emphasis > baseline contrast
        let onToneCore: 'white' | 'black'
        if (whitePassesBoth && blackPassesBoth) {
          // Both pass - choose based on contrast
          onToneCore = whiteLowContrast >= blackLowContrast ? 'white' : 'black'
        } else if (whitePassesBoth) {
          onToneCore = 'white'
        } else if (blackPassesBoth) {
          onToneCore = 'black'
        } else if (whitePassesLow || blackPassesLow) {
          // At least one passes low emphasis
          onToneCore = whitePassesLow ? 'white' : 'black'
        } else if (whitePassesHigh || blackPassesHigh) {
          // At least one passes high emphasis
          onToneCore = whitePassesHigh ? 'white' : 'black'
        } else {
          // Neither passes - choose based on baseline contrast
          const whiteBaseContrast = contrastRatio(hex, normalizedWhite)
          const blackBaseContrast = contrastRatio(hex, normalizedBlack)
          onToneCore = whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
        }

        // Store verified value for theme JSON update
        verifiedOnTones[lvl] = onToneCore
      }
    })

    // Update theme JSON — recomputeAndApplyAll will generate CSS vars via buildPaletteVars
    if (setTheme && themeJson) {
      try {
        const themeCopy = getVarsStore().getLatestThemeCopy()
        const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy

        // Only update on-tone values for the current mode — palettes are independent per mode
        const currentModeKey = modeLower
        if (root[currentModeKey]?.palettes?.[paletteKey]) {
          headerLevels.forEach((lvl) => {
            // Get the actual token level from recursica_brand.json (not the palette level)
            const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
            const tokenName = `color/${familyToUse}/${tokenLevel}`
            const hex = getTokenValueByName(tokenName)
            if (typeof hex === 'string') {
              // Use verified value for current mode
              const onToneCore: 'white' | 'black' = verifiedOnTones[lvl] || 'white'

              if (!root[currentModeKey].palettes[paletteKey][lvl]) root[currentModeKey].palettes[paletteKey][lvl] = {}
              if (!root[currentModeKey].palettes[paletteKey][lvl].color) {
                root[currentModeKey].palettes[paletteKey][lvl].color = {}
              }
              root[currentModeKey].palettes[paletteKey][lvl].color['on-tone'] = {
                $type: 'color',
                $value: `{brand.palettes.${onToneCore}}`
              }
            }
          })
        }

        // setTheme triggers recomputeAndApplyAll → buildPaletteVars → applyCssVars
        // No direct updateCssVar calls needed — buildPaletteVars is the single source
        setTheme(themeCopy)
      } catch (err) {
        console.error('Failed to update theme for AA compliance:', err)
      }
    }
  }, [selectedFamily, mode, paletteKey, headerLevels, getTokenValueByName, setTheme, themeJson, getTokenLevelForPaletteLevel])

  // Listen for requests to re-check all palette on-tone colors
  useEffect(() => {
    const handler = () => {
      // Re-check AA compliance for this palette when core colors or emphasis opacities change
      // Don't pass family parameter so it re-checks regardless of family
      if (selectedFamily) {
        recheckAACompliance()
      }
    }
    window.addEventListener('recheckAllPaletteOnTones', handler as any)
    return () => {
      window.removeEventListener('recheckAllPaletteOnTones', handler as any)
    }
  }, [selectedFamily, recheckAACompliance])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) {
        setOverrideVersion((v) => v + 1)
        return
      }

      // Check if a color token was changed
      const tokenName = detail.name
      if (tokenName && typeof tokenName === 'string' && tokenName.startsWith('color/')) {
        const parts = tokenName.split('/')
        if (parts.length >= 3) {
          const changedFamily = parts[1]
          // If this palette uses the changed family, re-check AA compliance
          if (selectedFamily === changedFamily) {
            recheckAACompliance(changedFamily)
          }
        }
      }

      setOverrideVersion((v) => v + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [selectedFamily, recheckAACompliance])

  // Set CSS vars on mount and when mode changes
  // When mode changes, read the correct family for the TARGET mode directly from theme JSON,
  // because selectedFamily state may still reflect the previous mode during React's batched update cycle.
  const hasInitialized = useRef(false)
  const lastMode = useRef<string | null>(null)
  useEffect(() => {
    // Only initialize once or when mode changes, not on every selectedFamily change
    if (hasInitialized.current && lastMode.current === mode) return

    // Determine the correct family for THIS mode by reading from theme JSON directly
    // (Don't rely on selectedFamily which might still be from the previous mode)
    let familyForMode = selectedFamily
    const modeLower = mode.toLowerCase()
    const modeLabel = mode
    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    const themes = root?.themes || root
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    const paletteTheme = themes?.[modeLower]?.palettes?.[paletteKey]

    try {
      if (paletteTheme) {
        const checkLevels = ['200', '500', '400', '300']
        for (const lvl of checkLevels) {
          const toneRaw = paletteTheme?.[lvl]?.color?.tone?.$value
          if (typeof toneRaw === 'string') {
            const tokenIndex = buildTokenIndex(tokensJson)
            const context: TokenReferenceContext = { currentMode: modeLower as 'light' | 'dark', tokenIndex }
            const parsed = parseTokenReference(toneRaw, context)
            if (parsed && parsed.type === 'token' && parsed.path.length >= 2) {
              if (parsed.path[0] === 'colors') {
                const scaleOrAlias = parsed.path[1]
                if (scaleOrAlias.startsWith('scale-')) {
                  familyForMode = scaleOrAlias
                } else {
                  // Resolve alias to scale key
                  for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
                    if (!scaleKey.startsWith('scale-')) continue
                    if ((scale as any)?.alias === scaleOrAlias) {
                      familyForMode = scaleKey
                      break
                    }
                  }
                }
              } else if (parsed.path[0] === 'color') {
                familyForMode = parsed.path[1]
              }
              break
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to detect family for mode:', err)
    }

    if (!familyForMode) return

    // For each palette level, read the ACTUAL token reference from theme JSON to get the
    // correct token level. This is critical because in dark mode, palette levels are reversed:
    // palette level 1000 maps to the lightest token (e.g., token level 000), not 1000.
    headerLevels.forEach((lvl) => {
      // Read the tone reference for THIS specific level from the theme JSON
      // to determine the actual token level (which may differ from the palette level in dark mode)
      let tokenName: string | null = null
      const toneRef = paletteTheme?.[lvl]?.color?.tone?.$value
      if (typeof toneRef === 'string') {
        const tokenIndex = buildTokenIndex(tokensJson)
        const context: TokenReferenceContext = { currentMode: modeLower as 'light' | 'dark', tokenIndex }
        const parsed = parseTokenReference(toneRef, context)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 2) {
          // Build the token name from the parsed reference (e.g., colors/scale-01/000)
          tokenName = parsed.path.join('/')
        }
      }

      // Fallback: if we couldn't read from theme JSON, use the palette level directly
      if (!tokenName) {
        if (familyForMode.startsWith('scale-')) {
          tokenName = `colors/${familyForMode}/${lvl}`
        } else {
          let foundScale = false
          for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
            if (!scaleKey.startsWith('scale-')) continue
            const scaleObj = scale as any
            if (scaleObj?.alias === familyForMode) {
              tokenName = `colors/${scaleKey}/${lvl}`
              foundScale = true
              break
            }
          }
          if (!foundScale) {
            tokenName = `color/${familyForMode}/${lvl}`
          }
        }
      }

      // CSS vars are generated by buildPaletteVars from theme JSON
      // No direct updateCssVar calls — recomputeAndApplyAll handles this
    })
    hasInitialized.current = true
    lastMode.current = mode
  }, [mode, paletteKey, headerLevels, getTokenValueByName, themeJson, tokensJson])

  // Update theme JSON and CSS variables when family changes
  const updatePaletteForFamily = (family: string) => {
    if (!setTheme || !themeJson) return

    try {
      const themeCopy = getVarsStore().getLatestThemeCopy()
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root

      // Only update the current mode — palettes are independent per mode
      const currentModeKey = mode.toLowerCase()
      const currentModeLabel = mode
      // Use themes structure if available, otherwise fall back to root structure
      const targetRoot = themes !== root ? themes : root
      if (!targetRoot[currentModeKey]) targetRoot[currentModeKey] = {}
      if (!targetRoot[currentModeKey].palettes) targetRoot[currentModeKey].palettes = {}
      if (!targetRoot[currentModeKey].palettes[paletteKey]) targetRoot[currentModeKey].palettes[paletteKey] = {}

      headerLevels.forEach((lvl) => {
        if (!targetRoot[currentModeKey].palettes[paletteKey][lvl]) targetRoot[currentModeKey].palettes[paletteKey][lvl] = {}
        if (!targetRoot[currentModeKey].palettes[paletteKey][lvl].color) targetRoot[currentModeKey].palettes[paletteKey][lvl].color = {}

        // In dark mode, palette levels are reversed (1000 = lightest token, 000 = darkest)
        const tokenLevel = getTokenLevelForMode(lvl, mode)

        // Determine the correct token reference format based on family type
        // If family is a scale key (starts with "scale-"), use colors format
        // Otherwise, check if it's an alias that maps to a scale, or use old color format
        let tokenRef: string = `{tokens.color.${family}.${tokenLevel}}` // Default fallback
        const tokensRoot: any = (tokensJson as any)?.tokens || {}
        const colorsRoot: any = tokensRoot?.colors || {}

        if (family.startsWith('scale-')) {
          // Direct scale reference: use colors format
          tokenRef = `{tokens.colors.${family}.${tokenLevel}}`
        } else {
          // Check if it's an alias that maps to a scale
          let isScaleAlias = false
          for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
            if (!scaleKey.startsWith('scale-')) continue
            const scaleObj = scale as any
            if (scaleObj?.alias === family) {
              // Use the scale key for the reference
              tokenRef = `{tokens.colors.${scaleKey}.${tokenLevel}}`
              isScaleAlias = true
              break
            }
          }
          if (!isScaleAlias) {
            // Fallback to old color format
            tokenRef = `{tokens.color.${family}.${tokenLevel}}`
          }
        }

        // Update tone to reference the new family token
        targetRoot[currentModeKey].palettes[paletteKey][lvl].color.tone = {
          $type: 'color',
          $value: tokenRef
        }

        // Determine on-tone color considering opacity for AA compliance
        let tokenName: string = `color/${family}/${tokenLevel}` // Default fallback
        if (family.startsWith('scale-')) {
          tokenName = `colors/${family}/${tokenLevel}`
        } else {
          // Check if it's an alias that maps to a scale
          let isScaleAlias = false
          for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
            if (!scaleKey.startsWith('scale-')) continue
            const scaleObj = scale as any
            if (scaleObj?.alias === family) {
              tokenName = `colors/${scaleKey}/${tokenLevel}`
              isScaleAlias = true
              break
            }
          }
          if (!isScaleAlias) {
            tokenName = `color/${family}/${tokenLevel}`
          }
        }
        const hex = getTokenValueByName(tokenName)
        if (typeof hex === 'string') {
          const onToneCore = pickOnToneWithOpacity(hex, currentModeLabel)
          // Update on-tone to reference the correct core color (white or black)
          // Use short alias format (no theme path)
          targetRoot[currentModeKey].palettes[paletteKey][lvl].color['on-tone'] = {
            $type: 'color',
            $value: `{brand.palettes.${onToneCore}}`
          }
        }
      })

      // setTheme triggers recomputeAndApplyAll → buildPaletteVars → applyCssVars
      // No direct updateCssVar calls — buildPaletteVars is the single source
      setTheme(themeCopy)


      // Compliance scan runs via scheduleComplianceScan after setTheme → recomputeAndApplyAll

      // Dispatch event to notify that palette vars changed (user-initiated action)
      try {
        window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
      } catch { }

      // Call optional callback
      onFamilyChange?.(family)


    } catch (err) {
      console.error('Failed to update palette for family:', err)
    }
  }

  const handleFamilySelect = (family: string) => {
    if (family !== selectedFamily) {
      setSelectedFamily(family)
      updatePaletteForFamily(family)
    }
  }

  // Helper to get alias name and 500 tone color for a family/scale
  const getFamilyInfo = useCallback((fam: string): { alias: string; primaryHex: string | undefined } => {
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    const overrideMap = readOverrides()
    const level500 = '500' // Always use 500 tone for the swatch

    // Check if it's a scale key (starts with "scale-")
    if (fam.startsWith('scale-')) {
      const scale = colorsRoot?.[fam]
      if (scale && typeof scale === 'object') {
        const alias = scale.alias || fam
        // Try to get 500 tone color from overrides first
        const overrideTokenName = `colors/${fam}/${level500}`
        const overrideValue = (overrideMap as any)[overrideTokenName]
        if (overrideValue && typeof overrideValue === 'string' && /^#?[0-9a-f]{6}$/i.test(overrideValue)) {
          return { alias, primaryHex: (overrideValue.startsWith('#') ? overrideValue : `#${overrideValue}`).toLowerCase() }
        }
        // Get 500 tone color from the scale
        const tone500Value = scale[level500]?.$value || scale[level500]
        const primaryHex = typeof tone500Value === 'string' && /^#?[0-9a-f]{6}$/i.test(tone500Value)
          ? (tone500Value.startsWith('#') ? tone500Value : `#${tone500Value}`).toLowerCase()
          : getTokenValueByName(`colors/${fam}/${level500}`) as string | undefined
        return { alias, primaryHex }
      }
    } else {
      // It's an alias or old format family - find the scale that has this alias
      for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
        if (!scaleKey.startsWith('scale-')) continue
        const scaleObj = scale as any
        if (scaleObj?.alias === fam) {
          // Try to get 500 tone color from overrides first
          const overrideTokenName = `colors/${scaleKey}/${level500}`
          const overrideValue = (overrideMap as any)[overrideTokenName]
          if (overrideValue && typeof overrideValue === 'string' && /^#?[0-9a-f]{6}$/i.test(overrideValue)) {
            return { alias: fam, primaryHex: (overrideValue.startsWith('#') ? overrideValue : `#${overrideValue}`).toLowerCase() }
          }
          const tone500Value = scaleObj[level500]?.$value || scaleObj[level500]
          const primaryHex = typeof tone500Value === 'string' && /^#?[0-9a-f]{6}$/i.test(tone500Value)
            ? (tone500Value.startsWith('#') ? tone500Value : `#${tone500Value}`).toLowerCase()
            : getTokenValueByName(`colors/${scaleKey}/${level500}`) as string | undefined
          return { alias: fam, primaryHex }
        }
      }
    }

    // Fallback to old structure
    const overrideTokenName = `color/${fam}/${level500}`
    const overrideValue = (overrideMap as any)[overrideTokenName]
    if (overrideValue && typeof overrideValue === 'string' && /^#?[0-9a-f]{6}$/i.test(overrideValue)) {
      return { alias: fam, primaryHex: (overrideValue.startsWith('#') ? overrideValue : `#${overrideValue}`).toLowerCase() }
    }
    const primaryHex = getTokenValueByName(`color/${fam}/${level500}`) as string | undefined
    return { alias: fam, primaryHex }
  }, [tokensJson, getTokenValueByName])

  return (
    <FamilyDropdown
      paletteKey={paletteKey}
      families={families}
      selectedFamily={selectedFamily}
      onSelect={handleFamilySelect}
      getFamilyInfo={getFamilyInfo}
    />
  )
}

// FamilyDropdown component
function FamilyDropdown({
  paletteKey,
  families,
  selectedFamily,
  onSelect,
  getFamilyInfo,
}: {
  paletteKey: string
  families: string[]
  selectedFamily: string
  onSelect: (fam: string) => void
  getFamilyInfo: (fam: string) => { alias: string; primaryHex: string | undefined }
}) {
  const { mode } = useThemeMode()
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
    } catch { }
    return null
  }

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
          const { alias, primaryHex } = getFamilyInfo(fam)
          // Use alias as the key for friendly names
          if (map[alias]) continue
          if (typeof primaryHex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(primaryHex.trim())) {
            const normalized = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`
            const label = await getNtcName(normalized)
            if (label && label.trim()) {
              map[alias] = label.trim()
              changed = true
            }
          }
        }
        if (changed) {
          try { localStorage.setItem('family-friendly-names', JSON.stringify(map)) } catch { }
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch { }
          setTokenVersion((v) => v + 1)
        }
      } catch { }
    })()
  }, [families, getFamilyInfo])

  const titleCase = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const getFriendlyName = (family: string): string => {
    const { alias } = getFamilyInfo(family)
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) {
        const map = JSON.parse(raw)
        const v = map?.[alias]
        if (typeof v === 'string' && v.trim()) return v
      }
    } catch { }
    return titleCase(alias)
  }

  const selectedInfo = getFamilyInfo(selectedFamily)
  const currentHex = selectedInfo.primaryHex

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-token-version={tokenVersion}>
      <Dropdown
        items={families.map((fam) => {
          const { alias, primaryHex } = getFamilyInfo(fam)
          return {
            value: fam,
            label: getFriendlyName(fam),
            leadingIcon: (
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: `1px solid var(--recursica_brand_themes_${mode.toLowerCase()}_layers_layer-1_properties_border-color)`,
                  background: primaryHex || 'transparent',
                  display: 'inline-block'
                }}
              />
            )
          }
        })}
        value={selectedFamily}
        onChange={(value) => onSelect(value)}
        placeholder="Select color family..."
        layer="layer-1"
        layout="stacked"
        disableTopBottomMargin={true}
        zIndex={1200}
      />
    </div>
  )
}

