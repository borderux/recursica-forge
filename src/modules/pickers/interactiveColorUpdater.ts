import { readCssVar, readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { pickAAOnTone, contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import type { JsonLike } from '../../core/resolvers/tokens'
import { resolveTokenReferenceToValue, resolveTokenReferenceToCssVar, extractBraceContent, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import {
  resolveCssVarToHex,
  findColorFamilyAndLevel,
  getSteppedColor,
  stepUntilAACompliant,
  hexToCssVarRef
} from '../../core/compliance/layerColorStepping'

// Helper to blend foreground over background with opacity
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

// Update on-tone colors for AA compliance
function updateOnToneColors(interactiveHex: string, hoverHex: string, tokens: JsonLike, mode: 'light' | 'dark' = 'light'): void {
  const defaultOnTone = pickAAOnTone(interactiveHex)
  const hoverOnTone = pickAAOnTone(hoverHex)
  
  const defaultOnToneVar = defaultOnTone === '#ffffff' 
    ? `var(--recursica-brand-${mode}-palettes-core-white)`
    : `var(--recursica-brand-${mode}-palettes-core-black)`
  
  const hoverOnToneVar = hoverOnTone === '#ffffff'
    ? `var(--recursica-brand-${mode}-palettes-core-white)`
    : `var(--recursica-brand-${mode}-palettes-core-black)`
  
  updateCssVar(`--recursica-brand-${mode}-palettes-core-interactive-default-on-tone`, defaultOnToneVar, tokens)
  updateCssVar(`--recursica-brand-${mode}-palettes-core-interactive-hover-on-tone`, hoverOnToneVar, tokens)
}

// Update layer interactive colors with AA compliance
function updateLayerInteractiveColors(interactiveHex: string, tokens: JsonLike, mode: 'light' | 'dark' = 'light'): void {
  const tokenIndex = buildTokenIndex(tokens)
  const AA = 4.5
  
  // Update layers 0-3
  for (let layer = 0; layer <= 3; layer++) {
    const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${layer}-property-surface`
    const interactiveVar = `--recursica-brand-themes-${mode}-layer-layer-${layer}-property-element-interactive-color`
    
    const surfaceHex = resolveCssVarToHex(`var(${surfaceVar})`, tokenIndex) || '#ffffff'
    const contrast = contrastRatio(surfaceHex, interactiveHex)
    
    // Determine the best color to use for this layer
    let colorHex = interactiveHex
    
    if (contrast < AA) {
      // Need to find a darker/lighter version that meets AA
      // Try stepping darker first (usually better for light surfaces)
      colorHex = stepUntilAACompliant(interactiveHex, surfaceHex, 'darker', tokens)
    }
    
    // Update the CSS var - prefer token reference if available, otherwise use hex
    const cssVarRef = hexToCssVarRef(colorHex, tokens)
    updateCssVar(interactiveVar, cssVarRef, tokens)
  }
  
}

export function updateInteractiveColor(
  newInteractiveHex: string,
  hoverOption: 'keep' | 'darker' | 'lighter',
  tokens: JsonLike,
  mode: 'light' | 'dark' = 'light'
): void {
  const normalizedHex = newInteractiveHex.startsWith('#') ? newInteractiveHex.toLowerCase() : `#${newInteractiveHex.toLowerCase()}`
  
  // Update default tone
  const defaultToneRef = hexToCssVarRef(normalizedHex, tokens)
  updateCssVar(
    `--recursica-brand-${mode}-palettes-core-interactive-default-tone`,
    defaultToneRef,
    tokens
  )
  // Also update the main interactive var for backward compatibility
  updateCssVar(
    `--recursica-brand-${mode}-palettes-core-interactive`,
    defaultToneRef,
    tokens
  )
  
  // Update hover tone based on option
  let hoverHex: string
  if (hoverOption === 'keep') {
    // Keep current hover color
    const currentHover = readCssVar(`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`)
    if (currentHover && !currentHover.startsWith('var(')) {
      hoverHex = currentHover
    } else {
      // Resolve to hex
      const tokenIndex = buildTokenIndex(tokens)
      hoverHex = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
    }
  } else {
    hoverHex = getSteppedColor(normalizedHex, hoverOption, tokens) || normalizedHex
  }
  
  // Update hover tone CSS var
  const hoverToneRef = hexToCssVarRef(hoverHex, tokens)
  updateCssVar(
    `--recursica-brand-${mode}-palettes-core-interactive-hover-tone`,
    hoverToneRef,
    tokens
  )
  
  // Update on-tone colors for AA compliance
  updateOnToneColors(normalizedHex, hoverHex, tokens, mode)
  
  // Update layer interactive colors with proper stepping
  updateLayerInteractiveColors(normalizedHex, tokens, mode)
}

// Update core color interactive on-tone values for AA compliance
// When interactive color changes, updates on-tone values for other core colors by stepping through interactive token scale
// If skipSetTheme is true, only updates CSS variables without calling setTheme (to avoid triggering recomputeAndApplyAll)
export function updateCoreColorInteractiveOnTones(
  interactiveHex: string,
  tokens: JsonLike,
  theme: JsonLike,
  setTheme: (theme: JsonLike) => void,
  mode: 'light' | 'dark',
  skipSetTheme: boolean = false
): void {
  const tokenIndex = buildTokenIndex(tokens)
  const AA = 4.5
  const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
  const coreColors = ['black', 'white', 'alert', 'warning', 'success']
  
  try {
    const themeCopy = JSON.parse(JSON.stringify(theme))
    const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    const themes = root?.themes || root
    const coreColorsPath = themes?.[mode]?.palettes?.['core-colors']?.$value
    
    if (!coreColorsPath) return
    
    // Find the interactive color's family and level for stepping
    const interactiveFamily = findColorFamilyAndLevel(interactiveHex, tokens)
    if (!interactiveFamily) {
      console.warn('Could not find interactive color family/level for stepping')
      return
    }
    
    const { family: interactiveFamilyName, level: interactiveLevel } = interactiveFamily
    const normalizedInteractiveLevel = interactiveLevel === '000' ? '050' : interactiveLevel
    const startIdx = LEVELS.indexOf(normalizedInteractiveLevel)
    
    if (startIdx === -1) {
      console.warn(`Interactive level ${normalizedInteractiveLevel} not found in LEVELS`)
      return
    }
    
    // Helper to resolve tone reference to hex
    const context: TokenReferenceContext = {
      currentMode: mode,
      tokenIndex,
      theme: { brand: { themes: themes } }
    }
    const resolveRef = (ref: string): string | null => {
      const resolved = resolveTokenReferenceToValue(ref, context)
      if (typeof resolved === 'string') {
        const hex = resolved.trim()
        if (/^#?[0-9a-f]{6}$/i.test(hex)) {
          return hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        }
        if (resolved.startsWith('{') && resolved.endsWith('}')) {
          return resolveRef(resolved)
        }
      }
      return null
    }
    
    // For each core color, update both its on-tone and interactive values by stepping through interactive scale
    for (const colorName of coreColors) {
      const colorDef = coreColorsPath[colorName]
      if (!colorDef) continue
      
      // Get tone hex for this core color
      const toneRef = colorDef.tone?.$value
      if (!toneRef) continue
      
      const toneHex = resolveRef(toneRef)
      if (!toneHex) continue
      
      // Step through interactive color scale to find AA-compliant color for interactive property
      let interactiveRef: string | null = null
      
      // Try stepping lighter first (lower index = lighter)
      for (let i = startIdx - 1; i >= 0; i--) {
        const testLevel = LEVELS[i]
        const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
        const testHex = tokenIndex.get(`color/${interactiveFamilyName}/${normalizedTestLevel}`)
        if (typeof testHex === 'string') {
          const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
          const testContrast = contrastRatio(toneHex, hex)
          if (testContrast >= AA) {
            interactiveRef = `{tokens.color.${interactiveFamilyName}.${normalizedTestLevel}}`
            break
          }
        }
      }
      
      // Try stepping darker if lighter didn't work (higher index = darker)
      if (!interactiveRef) {
        for (let i = startIdx + 1; i < LEVELS.length; i++) {
          const testLevel = LEVELS[i]
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          const testHex = tokenIndex.get(`color/${interactiveFamilyName}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(toneHex, hex)
            if (testContrast >= AA) {
              interactiveRef = `{tokens.color.${interactiveFamilyName}.${normalizedTestLevel}}`
              break
            }
          }
        }
      }
      
      // Check the current interactive color itself
      if (!interactiveRef) {
        const currentContrast = contrastRatio(toneHex, interactiveHex)
        if (currentContrast >= AA) {
          interactiveRef = `{tokens.color.${interactiveFamilyName}.${normalizedInteractiveLevel}}`
        }
      }
      
      // Fallback to white or black if no interactive scale color works
      if (!interactiveRef) {
        const whiteToneVar = `--recursica-brand-themes-${mode}-palettes-core-white-tone`
        const whiteToneValue = readCssVar(whiteToneVar)
        let whiteHex = '#ffffff'
        if (whiteToneValue) {
          const resolved = resolveCssVarToHex(whiteToneValue, tokenIndex)
          if (resolved) whiteHex = resolved
        }
        
        const blackToneVar = `--recursica-brand-themes-${mode}-palettes-core-black-tone`
        const blackToneValue = readCssVar(blackToneVar)
        let blackHex = '#000000'
        if (blackToneValue) {
          const resolved = resolveCssVarToHex(blackToneValue, tokenIndex)
          if (resolved) blackHex = resolved
        }
        
        const whiteContrast = contrastRatio(toneHex, whiteHex)
        const blackContrast = contrastRatio(toneHex, blackHex)
        
        if (whiteContrast >= AA && blackContrast >= AA) {
          // Both pass, use higher contrast
          interactiveRef = whiteContrast >= blackContrast
            ? `{brand.themes.${mode}.palettes.core-colors.white}`
            : `{brand.themes.${mode}.palettes.core-colors.black}`
        } else if (whiteContrast >= AA) {
          interactiveRef = `{brand.themes.${mode}.palettes.core-colors.white}`
        } else if (blackContrast >= AA) {
          interactiveRef = `{brand.themes.${mode}.palettes.core-colors.black}`
        } else {
          // Neither passes, use higher contrast
          interactiveRef = whiteContrast >= blackContrast
            ? `{brand.themes.${mode}.palettes.core-colors.white}`
            : `{brand.themes.${mode}.palettes.core-colors.black}`
        }
      }
      
      // Update interactive property in Brand.json (always update, even if it doesn't exist)
      if (interactiveRef) {
        if (!colorDef.interactive) {
          colorDef.interactive = {}
        }
        colorDef.interactive.$value = interactiveRef
      }
      
      // Also update on-tone value using the same logic (for consistency)
      // The on-tone should also use a color from the interactive scale that passes AA
      if (interactiveRef) {
        if (!colorDef['on-tone']) {
          colorDef['on-tone'] = {}
        }
        colorDef['on-tone'].$value = interactiveRef
      }
    }
    
    // Only call setTheme if not skipping (to avoid triggering recomputeAndApplyAll multiple times)
    if (!skipSetTheme) {
      setTheme(themeCopy)
    }
    
    // Update CSS variables for both on-tone and interactive values
    // Re-read from updated themeCopy to ensure we have the latest values
    const updatedCoreColorsPath = themes?.[mode]?.palettes?.['core-colors']?.$value
    if (updatedCoreColorsPath) {
      for (const colorName of coreColors) {
        const colorDef = updatedCoreColorsPath[colorName]
        if (!colorDef) continue
        
        // Update on-tone CSS variable
        const onToneVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}-on-tone`
        const onToneRef = colorDef['on-tone']?.$value
        if (onToneRef) {
          const context: TokenReferenceContext = {
            currentMode: mode,
            tokenIndex: buildTokenIndex(tokens),
            theme: { brand: { themes: themes } }
          }
          const cssVar = resolveTokenReferenceToCssVar(onToneRef, context)
          if (cssVar) {
            updateCssVar(onToneVar, cssVar, tokens)
          }
        }
        
        // Update interactive CSS variable (this is the main one we're updating)
        const interactiveVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}-interactive`
        const interactiveRef = colorDef.interactive?.$value
        if (interactiveRef) {
          const context: TokenReferenceContext = {
            currentMode: mode,
            tokenIndex: buildTokenIndex(tokens),
            theme: { brand: { themes: themes } }
          }
          const cssVar = resolveTokenReferenceToCssVar(interactiveRef, context)
          if (cssVar) {
            updateCssVar(interactiveVar, cssVar, tokens)
          } else {
            console.warn(`Failed to resolve CSS var for ${interactiveVar} from reference: ${interactiveRef}`)
          }
        } else {
          console.warn(`No interactive reference found for core color: ${colorName}`)
        }
      }
    }
  } catch (err) {
    console.error('Failed to update core color interactive on-tones:', err)
  }
}

// Update core color on-tone values for AA compliance (for black, white, alert, warning, success)
export function updateCoreColorOnTones(
  tokens: JsonLike,
  theme: JsonLike,
  setTheme: (theme: JsonLike) => void,
  mode: 'light' | 'dark'
): void {
  const tokenIndex = buildTokenIndex(tokens)
  const AA = 4.5
  const coreColors = ['black', 'white', 'alert', 'warning', 'success']
  
  try {
    const themeCopy = JSON.parse(JSON.stringify(theme))
    const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    const themes = root?.themes || root
    const coreColorsPath = themes?.[mode]?.palettes?.['core-colors']?.$value
    
    if (!coreColorsPath) return
    
    // Get emphasis opacity values
    const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${mode}-text-emphasis-high`) || 1
    const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${mode}-text-emphasis-low`) || 0.6
    
    // Get core black and white hex values
    const coreBlackVar = `--recursica-brand-themes-${mode}-palettes-core-black-tone`
    const coreWhiteVar = `--recursica-brand-themes-${mode}-palettes-core-white-tone`
    const blackHex = readCssVarResolved(coreBlackVar) || readCssVar(coreBlackVar) || '#000000'
    const whiteHex = readCssVarResolved(coreWhiteVar) || readCssVar(coreWhiteVar) || '#ffffff'
    const normalizedBlack = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
    const normalizedWhite = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`
    
    // Helper to resolve tone reference to hex using centralized parser
    const context: TokenReferenceContext = {
      currentMode: mode,
      tokenIndex,
      theme: { brand: { themes: themes } }
    }
    const resolveToneRef = (ref: string): string | null => {
      const resolved = resolveTokenReferenceToValue(ref, context)
      if (typeof resolved === 'string') {
        // Check if it's a hex color
        const hex = resolved.trim()
        if (/^#?[0-9a-f]{6}$/i.test(hex)) {
          return hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        }
        // If it's still a reference, recurse
        if (resolved.startsWith('{') && resolved.endsWith('}')) {
          return resolveToneRef(resolved)
        }
      }
      return null
    }
    
    for (const colorName of coreColors) {
      const colorDef = coreColorsPath[colorName]
      if (!colorDef) continue
      
      // Get tone hex
      const toneRef = colorDef.tone?.$value
      if (!toneRef) continue
      
      const toneHex = resolveToneRef(toneRef)
      if (!toneHex) continue
      
      // Check contrast with opacity blending for both high and low emphasis
      const whiteHighBlended = blendHexOver(normalizedWhite, toneHex, highEmphasisOpacity)
      const whiteLowBlended = blendHexOver(normalizedWhite, toneHex, lowEmphasisOpacity)
      const blackHighBlended = blendHexOver(normalizedBlack, toneHex, highEmphasisOpacity)
      const blackLowBlended = blendHexOver(normalizedBlack, toneHex, lowEmphasisOpacity)
      
      const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
      const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
      const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
      const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
      
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
        const whiteBaseContrast = contrastRatio(toneHex, normalizedWhite)
        const blackBaseContrast = contrastRatio(toneHex, normalizedBlack)
        onToneCore = whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
      }
      
      // Update Brand.json
      if (!colorDef['on-tone']) colorDef['on-tone'] = {}
      colorDef['on-tone'].$value = `{brand.themes.${mode}.palettes.core-colors.${onToneCore}}`
      
      // Update CSS variable
      const onToneCssVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}-on-tone`
      const onToneCoreVar = `--recursica-brand-themes-${mode}-palettes-core-${onToneCore}`
      updateCssVar(onToneCssVar, `var(${onToneCoreVar})`, tokens)
    }
    
    setTheme(themeCopy)
  } catch (err) {
    console.error('Failed to update core color on-tones:', err)
  }
}

