import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'

type PaletteColorSelectorProps = {
  paletteKey: string
  mode: 'Light' | 'Dark'
  primaryLevel: string
  headerLevels: string[]
  onFamilyChange?: (family: string) => void
}

// Blend a foreground color over a background color with opacity
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

// readCssVarNumber is now imported from centralized utility

// Determine the correct on-tone color (white or black) considering opacity for AA compliance
function pickOnToneWithOpacity(toneHex: string, modeLabel: 'Light' | 'Dark'): 'white' | 'black' {
  const AA = 4.5
  const modeLower = modeLabel.toLowerCase()
  
  // Read actual core black and white colors from CSS variables (not hardcoded)
  const coreBlackVar = `--recursica-brand-themes-${modeLower}-palettes-core-black`
  const coreWhiteVar = `--recursica-brand-themes-${modeLower}-palettes-core-white`
  const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
  const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'
  
  // Normalize hex values (ensure they start with # and are lowercase)
  const black = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
  const white = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`
  
  // First, check contrast without opacity (baseline)
  const whiteBaseContrast = contrastRatio(toneHex, white)
  const blackBaseContrast = contrastRatio(toneHex, black)
  
  // Get emphasis opacity values from CSS variables
  const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-high`)
  const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-low`)
  
  // Blend white and black with tone using both opacity values
  const whiteHighBlended = blendHexOver(white, toneHex, highEmphasisOpacity)
  const whiteLowBlended = blendHexOver(white, toneHex, lowEmphasisOpacity)
  const blackHighBlended = blendHexOver(black, toneHex, highEmphasisOpacity)
  const blackLowBlended = blendHexOver(black, toneHex, lowEmphasisOpacity)
  
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
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const [overrideVersion, setOverrideVersion] = useState(0)

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
    
    // Check all palettes in theme to see which families they use
    const checkLevels = ['200', '500', '400', '300']
    const paletteKeys = new Set<string>()
    
    // First, find all palette keys
    // Note: theme index uses 'palette' prefix (singular) to match resolver
    Object.keys(themeIndex).forEach((key) => {
      const match = key.match(/^(?:Light|Dark)::palette\/([^/]+)\//)
      if (match && match[1]) {
        paletteKeys.add(match[1])
      }
    })
    
    // Then detect family for each palette
    // Note: theme index uses 'palette' prefix (singular) to match resolver
    for (const pk of paletteKeys) {
      for (const lvl of checkLevels) {
        const toneName = `palette/${pk}/${lvl}/color/tone`
        const toneRaw = themeIndex[`Light::${toneName}`]?.value || themeIndex[`Dark::${toneName}`]?.value
        if (typeof toneRaw === 'string') {
          const match = toneRaw.match(/\{tokens\.color\.([a-z0-9_-]+)\./)
          if (match && match[1]) {
            usedBy[pk] = match[1]
            break // Found family for this palette, move to next
          }
        }
      }
    }
    
    return usedBy
  }, [themeJson])

  // Get available color families
  const allFamilies = useMemo(() => {
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

  // Filter families to exclude those used by other palettes
  const families = useMemo(() => {
    const familiesUsedByOthers = new Set<string>()
    Object.entries(familiesUsedByPalettes).forEach(([pk, fam]) => {
      if (pk !== paletteKey) {
        familiesUsedByOthers.add(fam)
      }
    })
    
    return allFamilies.filter((fam) => {
      // Include if not used by others, or if it's the current palette's family
      return !familiesUsedByOthers.has(fam) || familiesUsedByPalettes[paletteKey] === fam
    })
  }, [allFamilies, familiesUsedByPalettes, paletteKey])

  // Get token value by name - memoize to prevent unnecessary recalculations
  const getTokenValueByName = useCallback((tokenName: string): string | number | undefined => {
    const parts = tokenName.split('/')
    if (parts[0] === 'color' && parts.length >= 3) {
      const family = parts[1]
      const level = parts[2]
      const overrideMap = readOverrides()
      if ((overrideMap as any)[tokenName]) return (overrideMap as any)[tokenName]
      return (tokensJson as any)?.tokens?.color?.[family]?.[level]?.$value
    }
    return undefined
  }, [tokensJson, overrideVersion])

  // Detect current family from theme (use the already computed familiesUsedByPalettes)
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
  }, [detectFamilyFromTheme])

  // Build theme index to read token levels from Brand.json (needed for recheckAACompliance)
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

  // Helper to get token level from Brand.json for a given palette level
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
    
    headerLevels.forEach((lvl) => {
      // Get the actual token level from Brand.json (not the palette level)
      const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
      const tokenName = `color/${familyToUse}/${tokenLevel}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        const onToneCssVar = `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`
        
        // Get actual core color values (read from CSS variables to get current values)
        const coreBlackVar = `--recursica-brand-themes-${modeLower}-palettes-core-black`
        const coreWhiteVar = `--recursica-brand-themes-${modeLower}-palettes-core-white`
        const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
        const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'
        const normalizedBlack = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
        const normalizedWhite = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`
        
        // Get emphasis opacity values
        const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-high`)
        const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeLower}-text-emphasis-low`)
        const AA = 4.5
        
        // Check both core colors with opacity blending
        const whiteHighBlended = blendHexOver(normalizedWhite, hex, highEmphasisOpacity)
        const whiteLowBlended = blendHexOver(normalizedWhite, hex, lowEmphasisOpacity)
        const blackHighBlended = blendHexOver(normalizedBlack, hex, highEmphasisOpacity)
        const blackLowBlended = blendHexOver(normalizedBlack, hex, lowEmphasisOpacity)
        
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
        
        // Update CSS variable with verified on-tone
        updateCssVar(
          onToneCssVar,
          `var(--recursica-brand-themes-${modeLower}-palettes-core-${onToneCore})`
        )
        
        // Store verified value for theme JSON update
        verifiedOnTones[lvl] = onToneCore
      }
    })
    
    // Don't dispatch paletteVarsChanged here - it will be dispatched by the explicit user action that triggered this
    // (e.g., when user changes family via dropdown)
    
    // Also update theme JSON for both modes to persist the new on-tone values
    // Use verified on-tone values for current mode, recalculate for other mode
    if (setTheme && themeJson) {
      try {
        const themeCopy = JSON.parse(JSON.stringify(themeJson))
        const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
        
        for (const modeKey of ['light', 'dark']) {
          const modeLabel = modeKey === 'light' ? 'Light' : 'Dark'
          const modeKeyLower = modeKey.toLowerCase()
          if (!root[modeKey]?.palettes?.[paletteKey]) continue
          
          headerLevels.forEach((lvl) => {
            // Get the actual token level from Brand.json (not the palette level)
            const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
            const tokenName = `color/${familyToUse}/${tokenLevel}`
            const hex = getTokenValueByName(tokenName)
            if (typeof hex === 'string') {
              // Use verified value for current mode, recalculate for other mode
              let onToneCore: 'white' | 'black'
              if (modeKeyLower === modeLower && verifiedOnTones[lvl]) {
                onToneCore = verifiedOnTones[lvl]
              } else {
                // Recalculate for other mode using same verification logic
                const otherCoreBlackVar = `--recursica-brand-${modeKeyLower}-palettes-core-black`
                const otherCoreWhiteVar = `--recursica-brand-${modeKeyLower}-palettes-core-white`
                const otherBlackHex = readCssVarResolved(otherCoreBlackVar) || '#000000'
                const otherWhiteHex = readCssVarResolved(otherCoreWhiteVar) || '#ffffff'
                const otherNormalizedBlack = otherBlackHex.startsWith('#') ? otherBlackHex.toLowerCase() : `#${otherBlackHex.toLowerCase()}`
                const otherNormalizedWhite = otherWhiteHex.startsWith('#') ? otherWhiteHex.toLowerCase() : `#${otherWhiteHex.toLowerCase()}`
                
                const otherHighEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeKeyLower}-text-emphasis-high`)
                const otherLowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${modeKeyLower}-text-emphasis-low`)
                
                const otherWhiteHighBlended = blendHexOver(otherNormalizedWhite, hex, otherHighEmphasisOpacity)
                const otherWhiteLowBlended = blendHexOver(otherNormalizedWhite, hex, otherLowEmphasisOpacity)
                const otherBlackHighBlended = blendHexOver(otherNormalizedBlack, hex, otherHighEmphasisOpacity)
                const otherBlackLowBlended = blendHexOver(otherNormalizedBlack, hex, otherLowEmphasisOpacity)
                
                const otherWhiteHighContrast = contrastRatio(hex, otherWhiteHighBlended)
                const otherWhiteLowContrast = contrastRatio(hex, otherWhiteLowBlended)
                const otherBlackHighContrast = contrastRatio(hex, otherBlackHighBlended)
                const otherBlackLowContrast = contrastRatio(hex, otherBlackLowBlended)
                
                const otherWhitePassesHigh = otherWhiteHighContrast >= 4.5
                const otherWhitePassesLow = otherWhiteLowContrast >= 4.5
                const otherWhitePassesBoth = otherWhitePassesHigh && otherWhitePassesLow
                
                const otherBlackPassesHigh = otherBlackHighContrast >= 4.5
                const otherBlackPassesLow = otherBlackLowContrast >= 4.5
                const otherBlackPassesBoth = otherBlackPassesHigh && otherBlackPassesLow
                
                if (otherWhitePassesBoth && otherBlackPassesBoth) {
                  onToneCore = otherWhiteLowContrast >= otherBlackLowContrast ? 'white' : 'black'
                } else if (otherWhitePassesBoth) {
                  onToneCore = 'white'
                } else if (otherBlackPassesBoth) {
                  onToneCore = 'black'
                } else if (otherWhitePassesLow || otherBlackPassesLow) {
                  onToneCore = otherWhitePassesLow ? 'white' : 'black'
                } else if (otherWhitePassesHigh || otherBlackPassesHigh) {
                  onToneCore = otherWhitePassesHigh ? 'white' : 'black'
                } else {
                  const otherWhiteBaseContrast = contrastRatio(hex, otherNormalizedWhite)
                  const otherBlackBaseContrast = contrastRatio(hex, otherNormalizedBlack)
                  onToneCore = otherWhiteBaseContrast >= otherBlackBaseContrast ? 'white' : 'black'
                }
              }
              
              if (!root[modeKey].palettes[paletteKey][lvl]) root[modeKey].palettes[paletteKey][lvl] = {}
              root[modeKey].palettes[paletteKey][lvl]['on-tone'] = {
                $value: `{brand.${modeKey}.palettes.core-colors.${onToneCore}}`
              }
            }
          })
        }
        
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

  // Set CSS vars only on mount and when mode changes (not when selectedFamily changes from theme)
  // Use a ref to track if we've initialized to avoid unnecessary updates
  const hasInitialized = useRef(false)
  const lastMode = useRef<string | null>(null)
  useEffect(() => {
    // Only initialize once or when mode changes, not on every selectedFamily change
    if (!selectedFamily) return
    if (hasInitialized.current && lastMode.current === mode) return
    
    const rootEl = document.documentElement
    const modeLower = mode.toLowerCase()
    headerLevels.forEach((lvl) => {
      // Get the actual token level from Brand.json (not the palette level)
      const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
      const tokenName = `color/${selectedFamily}/${tokenLevel}`
      const hex = getTokenValueByName(tokenName)
      if (typeof hex === 'string') {
        // Set tone CSS variable - only for this specific palette
        updateCssVar(
          `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-tone`,
          `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`
        )
        
        // Determine on-tone color considering opacity for AA compliance - only for this palette
        const onToneCore = pickOnToneWithOpacity(hex, mode)
        updateCssVar(
          `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`,
          `var(--recursica-brand-themes-${modeLower}-palettes-core-${onToneCore})`
        )
      }
    })
    hasInitialized.current = true
    lastMode.current = mode
    // Only depend on mode and paletteKey - CSS vars are set via updatePaletteForFamily when user changes family
  }, [mode, paletteKey, headerLevels, getTokenValueByName, getTokenLevelForPaletteLevel])

  // Update theme JSON and CSS variables when family changes
  const updatePaletteForFamily = (family: string) => {
    if (!setTheme || !themeJson) return

    try {
      const themeCopy = JSON.parse(JSON.stringify(themeJson))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      
      // Update for both light and dark modes
      for (const modeKey of ['light', 'dark']) {
        const modeLabel = modeKey === 'light' ? 'Light' : 'Dark'
        // Use themes structure if available, otherwise fall back to root structure
        const targetRoot = themes !== root ? themes : root
        if (!targetRoot[modeKey]) targetRoot[modeKey] = {}
        if (!targetRoot[modeKey].palettes) targetRoot[modeKey].palettes = {}
        if (!targetRoot[modeKey].palettes[paletteKey]) targetRoot[modeKey].palettes[paletteKey] = {}
        
        headerLevels.forEach((lvl) => {
          if (!targetRoot[modeKey].palettes[paletteKey][lvl]) targetRoot[modeKey].palettes[paletteKey][lvl] = {}
          if (!targetRoot[modeKey].palettes[paletteKey][lvl].color) targetRoot[modeKey].palettes[paletteKey][lvl].color = {}
          
          // Get the actual token level from Brand.json (preserve the mapping, e.g., 1000 -> 050 for dark mode)
          // For the current mode, use getTokenLevelForPaletteLevel; for other mode, read from theme index
          let tokenLevel = lvl
          if (modeKey === mode.toLowerCase()) {
            tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
          } else {
            // For other mode, read from theme index
            const otherModeLabel = modeKey === 'light' ? 'Light' : 'Dark'
            const toneName = `palette/${paletteKey}/${lvl}/color/tone`
            const toneRaw = themeIndex[`${otherModeLabel}::${toneName}`]?.value
            if (typeof toneRaw === 'string') {
              const context: TokenReferenceContext = {
                currentMode: otherModeLabel.toLowerCase() as 'light' | 'dark',
                tokenIndex: buildTokenIndex(tokensJson),
                theme: themeJson
              }
              const parsed = parseTokenReference(toneRaw, context)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color') {
                tokenLevel = parsed.path[2]
              }
            }
          }
          
          // Update tone to reference the new family token (using the correct token level)
          targetRoot[modeKey].palettes[paletteKey][lvl].color.tone = {
            $value: `{tokens.color.${family}.${tokenLevel}}`
          }
          
          // Determine on-tone color considering opacity for AA compliance
          const tokenName = `color/${family}/${tokenLevel}`
          const hex = getTokenValueByName(tokenName)
          if (typeof hex === 'string') {
            const onToneCore = pickOnToneWithOpacity(hex, modeLabel)
            // Update on-tone to reference the correct core color (white or black)
            // Use themes structure in reference if available
            const refPrefix = themes !== root ? 'brand.themes' : 'brand'
            targetRoot[modeKey].palettes[paletteKey][lvl]['on-tone'] = {
              $value: `{${refPrefix}.${modeKey}.palettes.core-colors.${onToneCore}}`
            }
          }
        })
      }
      
      // Update CSS variables FIRST (before setTheme) to avoid flicker
      // This ensures CSS vars are set before theme update triggers re-renders
      const modeLower = mode.toLowerCase()
      headerLevels.forEach((lvl) => {
        // Get the actual token level from Brand.json (not the palette level)
        const tokenLevel = getTokenLevelForPaletteLevel(lvl) || lvl
        const tokenName = `color/${family}/${tokenLevel}`
        const hex = getTokenValueByName(tokenName)
        if (typeof hex === 'string') {
          // Set tone CSS variable - only for this specific palette
          updateCssVar(
            `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-tone`,
            `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`
          )
          
          // Determine on-tone color considering opacity for AA compliance - only for this palette
          const onToneCore = pickOnToneWithOpacity(hex, mode)
          updateCssVar(
            `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${lvl}-on-tone`,
            `var(--recursica-brand-themes-${modeLower}-palettes-core-${onToneCore})`
          )
        }
      })
      
      // Update theme AFTER CSS vars are set to minimize flicker
      // Other palettes will re-render but CSS vars are already correct
      setTheme(themeCopy)
      
      // Dispatch event to notify that palette vars changed (user-initiated action)
      try {
        window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
      } catch {}
      
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

  return (
    <FamilyDropdown
      paletteKey={paletteKey}
      families={families}
      selectedFamily={selectedFamily}
      onSelect={handleFamilySelect}
      getSwatchHex={(fam) => {
        return getTokenValueByName(`color/${fam}/${primaryLevel}`) as string | undefined
      }}
    />
  )
}

// FamilyDropdown component
function FamilyDropdown({
  paletteKey,
  families,
  selectedFamily,
  onSelect,
  getSwatchHex,
}: {
  paletteKey: string
  families: string[]
  selectedFamily: string
  onSelect: (fam: string) => void
  getSwatchHex: (fam: string) => string | undefined
}) {
  const { mode } = useThemeMode()
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
  }, [families, getSwatchHex])
  
  const titleCase = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  
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
            <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid var(--recursica-brand-${mode.toLowerCase()}-layer-layer-1-property-border-color)`, background: currentHex || 'transparent' }} />
            <span>{getFriendlyName(selectedFamily)}</span>
          </span>
          <span aria-hidden style={{ opacity: 0.6 }}>▾</span>
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1200, background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: `var(--recursica-brand-${mode.toLowerCase()}-elevations-elevation-3-shadow-color)`, padding: 6, minWidth: 200 }}>
            <div style={{ maxHeight: 280, overflow: 'auto', display: 'grid' }}>
              {families.map((fam) => {
                const hex = getSwatchHex(fam)
                return (
                  <button
                    key={fam}
                    onClick={() => { onSelect(fam); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid var(--recursica-brand-${mode.toLowerCase()}-layer-layer-1-property-border-color)`, background: hex || 'transparent' }} />
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

