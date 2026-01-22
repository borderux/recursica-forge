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

// Update on-tone colors for AA compliance with stepping logic
function updateOnToneColors(
  interactiveHex: string, 
  hoverHex: string, 
  tokens: JsonLike, 
  mode: 'light' | 'dark' = 'light',
  theme?: JsonLike,
  setTheme?: (theme: JsonLike) => void
): void {
  const tokenIndex = buildTokenIndex(tokens)
  const AA = 4.5
  const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
  
  // Helper to find AA-compliant on-tone using stepping logic
  const findAACompliantOnTone = (toneHex: string, startHex: string): string => {
    // Step 1: Try the interactive tone color itself
    const startContrast = contrastRatio(toneHex, startHex)
    if (startContrast >= AA) {
      // Check if startHex is in the token scale
      const found = findColorFamilyAndLevel(startHex, tokens)
      if (found) {
        const normalizedLevel = found.level === '000' ? '050' : found.level
        // found.family is now always a scale key (e.g., "scale-01"), not an alias
        const tokenHex = tokenIndex.get(`colors/${found.family}/${normalizedLevel}`)
        if (typeof tokenHex === 'string') {
          const hex = tokenHex.startsWith('#') ? tokenHex.toLowerCase() : `#${tokenHex.toLowerCase()}`
          if (hex === startHex.toLowerCase()) {
            // It's a token color, use scale key directly
            return `{tokens.colors.${found.family}.${normalizedLevel}}`
          }
        }
      }
      // Not a token, but passes AA - use it directly (will need to convert to CSS var)
      return startHex
    }
    
    // Step 2: Step up and down through the associated token scale
    const interactiveFamily = findColorFamilyAndLevel(startHex, tokens)
    if (interactiveFamily) {
      const { family, level } = interactiveFamily
      const normalizedLevel = level === '000' ? '050' : level
      const startIdx = LEVELS.indexOf(normalizedLevel)
      
      // Helper to build correct token reference for interactive family
      // family is now always a scale key (e.g., "scale-01"), not an alias
      const buildInteractiveTokenRef = (testLevel: string): string => {
        return `{tokens.colors.${family}.${testLevel}}`
      }
      
      if (startIdx !== -1) {
        // Try stepping lighter first (lower index = lighter)
        for (let i = startIdx - 1; i >= 0; i--) {
          const testLevel = LEVELS[i]
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // family is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${family}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(toneHex, hex)
            if (testContrast >= AA) {
              return buildInteractiveTokenRef(normalizedTestLevel)
            }
          }
        }
        
        // Try stepping darker (higher index = darker)
        for (let i = startIdx + 1; i < LEVELS.length; i++) {
          const testLevel = LEVELS[i]
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // family is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${family}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(toneHex, hex)
            if (testContrast >= AA) {
              return buildInteractiveTokenRef(normalizedTestLevel)
            }
          }
        }
      }
    }
    
    // Step 3: Try white and step up and down through white's token scale
    const whiteToneVar = `--recursica-brand-themes-${mode}-palettes-core-white-tone`
    const whiteToneValue = readCssVar(whiteToneVar)
    let whiteHex = '#ffffff'
    if (whiteToneValue) {
      const resolved = resolveCssVarToHex(whiteToneValue, tokenIndex)
      if (resolved) whiteHex = resolved
    }
    
    const whiteFamily = findColorFamilyAndLevel(whiteHex, tokens)
    if (whiteFamily) {
      const { family: whiteScaleKey, level: whiteLevel } = whiteFamily
      const normalizedWhiteLevel = whiteLevel === '000' ? '050' : whiteLevel
      const whiteStartIdx = LEVELS.indexOf(normalizedWhiteLevel)
      
      // Helper to build correct token reference for white family
      // whiteScaleKey is now always a scale key (e.g., "scale-01"), not an alias
      const buildWhiteTokenRef = (level: string): string => {
        return `{tokens.colors.${whiteScaleKey}.${level}}`
      }
      
      if (whiteStartIdx !== -1) {
        // Try stepping lighter first
        for (let i = whiteStartIdx - 1; i >= 0; i--) {
          const testLevel = LEVELS[i]
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // whiteScaleKey is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${whiteScaleKey}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(toneHex, hex)
            if (testContrast >= AA) {
              return buildWhiteTokenRef(normalizedTestLevel)
            }
          }
        }
        
        // Try stepping darker
        for (let i = whiteStartIdx + 1; i < LEVELS.length; i++) {
          const testLevel = LEVELS[i]
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // whiteScaleKey is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${whiteScaleKey}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(toneHex, hex)
            if (testContrast >= AA) {
              return buildWhiteTokenRef(normalizedTestLevel)
            }
          }
        }
      }
    }
    
    // Try white directly
    const whiteContrast = contrastRatio(toneHex, whiteHex)
    if (whiteContrast >= AA) {
      return `{brand.themes.${mode}.palettes.core-colors.white}`
    }
    
    // Step 4: Try black
    const blackToneVar = `--recursica-brand-themes-${mode}-palettes-core-black-tone`
    const blackToneValue = readCssVar(blackToneVar)
    let blackHex = '#000000'
    if (blackToneValue) {
      const resolved = resolveCssVarToHex(blackToneValue, tokenIndex)
      if (resolved) blackHex = resolved
    }
    
    const blackContrast = contrastRatio(toneHex, blackHex)
    if (blackContrast >= AA) {
      return `{brand.themes.${mode}.palettes.core-colors.black}`
    }
    
    // Fallback: use the one with higher contrast
    return whiteContrast >= blackContrast 
      ? `{brand.themes.${mode}.palettes.core-colors.white}`
      : `{brand.themes.${mode}.palettes.core-colors.black}`
  }
  
  // Get the interactive tone hex for default and hover
  const defaultToneVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`
  const hoverToneVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`
  const defaultToneHex = resolveCssVarToHex(`var(${defaultToneVar})`, tokenIndex) || interactiveHex
  const hoverToneHex = resolveCssVarToHex(`var(${hoverToneVar})`, tokenIndex) || hoverHex
  
  // Find AA-compliant on-tone for default
  const defaultOnToneRef = findAACompliantOnTone(defaultToneHex, interactiveHex)
  
  // Find AA-compliant on-tone for hover
  const hoverOnToneRef = findAACompliantOnTone(hoverToneHex, hoverHex)
  
  // Convert references to CSS vars if needed
  let defaultOnToneVar: string
  let hoverOnToneVar: string
  
  if (defaultOnToneRef.startsWith('{')) {
    // It's a token or brand reference, resolve it
    const context: TokenReferenceContext = {
      currentMode: mode,
      tokenIndex,
      theme: {}
    }
    const resolved = resolveTokenReferenceToCssVar(defaultOnToneRef, context)
    defaultOnToneVar = resolved || `var(--recursica-brand-themes-${mode}-palettes-core-white)`
  } else if (defaultOnToneRef.startsWith('#')) {
    // It's a hex color, convert to CSS var reference
    const cssVarRef = hexToCssVarRef(defaultOnToneRef, tokens)
    defaultOnToneVar = cssVarRef || `var(--recursica-brand-themes-${mode}-palettes-core-white)`
  } else {
    defaultOnToneVar = defaultOnToneRef
  }
  
  if (hoverOnToneRef.startsWith('{')) {
    const context: TokenReferenceContext = {
      currentMode: mode,
      tokenIndex,
      theme: {}
    }
    const resolved = resolveTokenReferenceToCssVar(hoverOnToneRef, context)
    hoverOnToneVar = resolved || `var(--recursica-brand-themes-${mode}-palettes-core-white)`
  } else if (hoverOnToneRef.startsWith('#')) {
    const cssVarRef = hexToCssVarRef(hoverOnToneRef, tokens)
    hoverOnToneVar = cssVarRef || `var(--recursica-brand-themes-${mode}-palettes-core-white)`
  } else {
    hoverOnToneVar = hoverOnToneRef
  }
  
  updateCssVar(`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`, defaultOnToneVar, tokens)
  updateCssVar(`--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone`, hoverOnToneVar, tokens)
  
  // Update theme JSON if provided
  if (theme && setTheme) {
    try {
      const themeCopy = JSON.parse(JSON.stringify(theme))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const themes = root?.themes || root
      
      // Ensure structure exists
      if (!themes[mode]) themes[mode] = {}
      if (!themes[mode].palettes) themes[mode].palettes = {}
      if (!themes[mode].palettes['core-colors']) themes[mode].palettes['core-colors'] = {}
      if (!themes[mode].palettes['core-colors'].$value) themes[mode].palettes['core-colors'].$value = {}
      const coreColors = themes[mode].palettes['core-colors'].$value
      if (!coreColors.interactive) coreColors.interactive = {}
      if (!coreColors.interactive.default) coreColors.interactive.default = {}
      if (!coreColors.interactive.hover) coreColors.interactive.hover = {}
      
      // Update default on-tone in theme JSON
      coreColors.interactive.default['on-tone'] = {
        $value: defaultOnToneRef
      }
      
      // Update hover on-tone in theme JSON
      coreColors.interactive.hover['on-tone'] = {
        $value: hoverOnToneRef
      }
      
      setTheme(themeCopy)
    } catch (err) {
      console.error('Failed to update theme JSON for interactive on-tone:', err)
    }
  }
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
  mode: 'light' | 'dark' = 'light',
  theme?: JsonLike,
  setTheme?: (theme: JsonLike) => void
): void {
  const normalizedHex = newInteractiveHex.startsWith('#') ? newInteractiveHex.toLowerCase() : `#${newInteractiveHex.toLowerCase()}`
  
  // Update default tone
  const defaultToneRef = hexToCssVarRef(normalizedHex, tokens)
  updateCssVar(
    `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`,
    defaultToneRef,
    tokens
  )
  // Also update the main interactive var for backward compatibility
  updateCssVar(
    `--recursica-brand-themes-${mode}-palettes-core-interactive`,
    defaultToneRef,
    tokens
  )
  
  // Update hover tone based on option
  let hoverHex: string
  if (hoverOption === 'keep') {
    // Keep current hover color
    const currentHover = readCssVar(`--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`)
    if (currentHover && !currentHover.startsWith('var(')) {
      hoverHex = currentHover
    } else {
      // Resolve to hex
      const tokenIndex = buildTokenIndex(tokens)
      hoverHex = resolveCssVarToHex(`var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
    }
  } else {
    hoverHex = getSteppedColor(normalizedHex, hoverOption, tokens) || normalizedHex
  }
  
  // Update hover tone CSS var
  const hoverToneRef = hexToCssVarRef(hoverHex, tokens)
  updateCssVar(
    `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`,
    hoverToneRef,
    tokens
  )
  
  // Update on-tone colors for AA compliance
  updateOnToneColors(normalizedHex, hoverHex, tokens, mode, theme, setTheme)
  
  // Update layer interactive colors with proper stepping
  updateLayerInteractiveColors(normalizedHex, tokens, mode)
  
  // Update interactive on-tones for all core colors (black, white, alert, warning, success)
  if (theme && setTheme) {
    updateCoreColorInteractiveOnTones(normalizedHex, tokens, theme, setTheme, mode)
  }
}

// Update core color interactive on-tone values for AA compliance
// For each core color (black, white, alert, warning, success), the interactive on-tone
// should start with the interactive tone color, then step through scales if needed
export function updateCoreColorInteractiveOnTones(
  interactiveHex: string,
  tokens: JsonLike,
  theme: JsonLike,
  setTheme: (theme: JsonLike) => void,
  mode: 'light' | 'dark'
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
    
    // Get the interactive tone color (this is our starting point)
    const interactiveToneVar = `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`
    const interactiveToneValue = readCssVar(interactiveToneVar)
    const interactiveToneHex = interactiveToneValue 
      ? (resolveCssVarToHex(interactiveToneValue, tokenIndex) || interactiveHex)
      : interactiveHex
    
    // Helper function to find AA-compliant on-tone using stepping logic
    // This is similar to findAACompliantOnTone but specifically for core color interactive on-tone
    const findCoreColorInteractiveOnTone = (coreColorToneHex: string, coreColorName: string): string => {
      // Step 1: Always try the interactive tone color itself first
      const startContrast = contrastRatio(coreColorToneHex, interactiveToneHex)
      if (startContrast >= AA) {
        // Check if interactiveToneHex is in the token scale
        const found = findColorFamilyAndLevel(interactiveToneHex, tokens)
        if (found) {
          const normalizedLevel = found.level === '000' ? '050' : found.level
          // found.family is now always a scale key (e.g., "scale-01"), not an alias
          return `{tokens.colors.${found.family}.${normalizedLevel}}`
        }
        // Not a token, but passes AA - use it directly (will need to convert to CSS var)
        return interactiveToneHex
      }
      
      // Step 2: Try ALL levels (000->1000) of the interactive token scale
      const interactiveFamily = findColorFamilyAndLevel(interactiveToneHex, tokens)
      if (interactiveFamily) {
        const { family } = interactiveFamily
        
        // Helper to build correct token reference
        // family is now always a scale key (e.g., "scale-01"), not an alias
        const buildTokenRef = (testLevel: string): string => {
          return `{tokens.colors.${family}.${testLevel}}`
        }
        
        // Try ALL levels in order: 000, 050, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000
        for (const testLevel of LEVELS) {
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          const testHex = tokenIndex.get(`colors/${family}/${normalizedTestLevel}`) || tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(coreColorToneHex, hex)
            if (testContrast >= AA) {
              return buildTokenRef(normalizedTestLevel)
            }
          }
        }
      }
      
      // Step 3: Try the opposite of the high emphasis on-tone (the tone's own scale)
      // Get the high emphasis on-tone for this core color to determine the "opposite"
      const highEmphasisOnToneVar = `--recursica-brand-themes-${mode}-palettes-core-${coreColorName}-on-tone`
      const highEmphasisOnToneValue = readCssVar(highEmphasisOnToneVar)
      
      // Find what scale the core color tone belongs to
      const coreColorToneFamily = findColorFamilyAndLevel(coreColorToneHex, tokens)
      if (coreColorToneFamily) {
        // Determine if we should try the tone's own scale
        // If high emphasis on-tone exists, check if it's different from the tone's scale
        let shouldTryToneScale = true
        if (highEmphasisOnToneValue) {
          const highEmphasisOnToneHex = resolveCssVarToHex(highEmphasisOnToneValue, tokenIndex)
          if (highEmphasisOnToneHex) {
            const highEmphasisFamily = findColorFamilyAndLevel(highEmphasisOnToneHex, tokens)
            // Only try tone's scale if it's different from the high emphasis scale (the "opposite")
            if (highEmphasisFamily && coreColorToneFamily.family === highEmphasisFamily.family) {
              shouldTryToneScale = false
            }
          }
        }
        
        // Also skip if tone's scale is the same as interactive scale (already tried in Step 2)
        if (interactiveFamily && coreColorToneFamily.family === interactiveFamily.family) {
          shouldTryToneScale = false
        }
        
        if (shouldTryToneScale) {
          const { family: toneScaleKey } = coreColorToneFamily
          
          // Helper to build correct token reference
          // toneScaleKey is now always a scale key (e.g., "scale-01"), not an alias
          const buildToneTokenRef = (testLevel: string): string => {
            return `{tokens.colors.${toneScaleKey}.${testLevel}}`
          }
          
          // Try ALL levels of the tone's own scale
          for (const testLevel of LEVELS) {
            const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
            // toneScaleKey is now always a scale key, use colors/scale-XX/level format
            const testHex = tokenIndex.get(`colors/${toneScaleKey}/${normalizedTestLevel}`)
            if (typeof testHex === 'string') {
              const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
              const testContrast = contrastRatio(coreColorToneHex, hex)
              if (testContrast >= AA) {
                return buildToneTokenRef(normalizedTestLevel)
              }
            }
          }
        }
      }
      
      // Step 4: Try ALL levels (000->1000) of the white scale
      const whiteToneVar = `--recursica-brand-themes-${mode}-palettes-core-white-tone`
      const whiteToneValue = readCssVar(whiteToneVar)
      let whiteHex = '#ffffff'
      if (whiteToneValue) {
        const resolved = resolveCssVarToHex(whiteToneValue, tokenIndex)
        if (resolved) whiteHex = resolved
      }
      
      const whiteFamily = findColorFamilyAndLevel(whiteHex, tokens)
      if (whiteFamily) {
        const { family: whiteScaleKey } = whiteFamily
        
        // Helper to build correct token reference
        // whiteScaleKey is now always a scale key (e.g., "scale-01"), not an alias
        const buildWhiteTokenRef = (level: string): string => {
          return `{tokens.colors.${whiteScaleKey}.${level}}`
        }
        
        // Try ALL levels of white scale (000->1000)
        for (const testLevel of LEVELS) {
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // whiteScaleKey is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${whiteScaleKey}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(coreColorToneHex, hex)
            if (testContrast >= AA) {
              return buildWhiteTokenRef(normalizedTestLevel)
            }
          }
        }
      }
      
      // Step 5: Try ALL levels (000->1000) of the black scale
      const blackToneVar = `--recursica-brand-themes-${mode}-palettes-core-black-tone`
      const blackToneValue = readCssVar(blackToneVar)
      let blackHex = '#000000'
      if (blackToneValue) {
        const resolved = resolveCssVarToHex(blackToneValue, tokenIndex)
        if (resolved) blackHex = resolved
      }
      
      const blackFamily = findColorFamilyAndLevel(blackHex, tokens)
      if (blackFamily) {
        const { family: blackScaleKey } = blackFamily
        
        // Helper to build correct token reference
        // blackScaleKey is now always a scale key (e.g., "scale-01"), not an alias
        const buildBlackTokenRef = (level: string): string => {
          return `{tokens.colors.${blackScaleKey}.${level}}`
        }
        
        // Try ALL levels of black scale (000->1000)
        for (const testLevel of LEVELS) {
          const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
          // blackScaleKey is now always a scale key, use colors/scale-XX/level format
          const testHex = tokenIndex.get(`colors/${blackScaleKey}/${normalizedTestLevel}`)
          if (typeof testHex === 'string') {
            const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
            const testContrast = contrastRatio(coreColorToneHex, hex)
            if (testContrast >= AA) {
              return buildBlackTokenRef(normalizedTestLevel)
            }
          }
        }
      }
      
      // If both white and black scales failed, try white and black directly as fallback
      // For core-colors interactive, use {brand.palettes.core-colors.white/black} format
      const whiteContrast = contrastRatio(coreColorToneHex, whiteHex)
      const blackContrast = contrastRatio(coreColorToneHex, blackHex)
      
      if (whiteContrast >= AA) {
        return `{brand.palettes.core-colors.white}`
      }
      if (blackContrast >= AA) {
        return `{brand.palettes.core-colors.black}`
      }
      
      // Both white and black scales failed - return a fallback (this will show as 'x' in UI)
      // Use the one with higher contrast even if it doesn't pass AA
      // Use core-colors format to match source structure
      return whiteContrast >= blackContrast 
        ? `{brand.palettes.core-colors.white}`
        : `{brand.palettes.core-colors.black}`
    }
    
    // Process each core color
    for (const colorName of coreColors) {
      const colorDef = coreColorsPath[colorName]
      if (!colorDef) continue
      
      // Get the core color's tone hex
      const toneRef = colorDef.tone?.$value
      if (!toneRef) continue
      
      // Resolve tone to hex using centralized parser
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
      
      const coreColorToneHex = resolveRef(toneRef)
      if (!coreColorToneHex) continue
      
      // Find AA-compliant interactive color starting from interactive tone color
      // For individual core colors (black, white, alert, success, warning), interactive should be $value, not on-tone
      // Only update if interactive value doesn't exist or is a brand palette reference (should be token reference)
      const existingInteractive = colorDef.interactive?.$value
      const isBrandPaletteRef = existingInteractive && typeof existingInteractive === 'string' && 
        (existingInteractive.includes('{brand.palettes.') || existingInteractive.includes('{brand.themes.'))
      
      // Ensure interactive structure exists - keep $value format (not on-tone)
      if (!colorDef.interactive) {
        colorDef.interactive = {}
      }
      // Remove any incorrectly placed on-tone property
      if (colorDef.interactive['on-tone']) {
        delete colorDef.interactive['on-tone']
      }
      
      // Only update if no existing value or if existing is a brand palette reference (should be token reference)
      let interactiveRef: string
      if (!existingInteractive || isBrandPaletteRef) {
        interactiveRef = findCoreColorInteractiveOnTone(coreColorToneHex, colorName)
        // Update the interactive $value in theme JSON (not on-tone)
        colorDef.interactive.$value = interactiveRef
      } else {
        // Use existing interactive value
        interactiveRef = existingInteractive
      }
      
      // Update CSS variable immediately for visual feedback
      // Use the updated theme copy for proper resolution of brand references
      const interactiveCssVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}-interactive`
      const contextForCssVar: TokenReferenceContext = {
        currentMode: mode,
        tokenIndex: buildTokenIndex(tokens),
        theme: themeCopy // Use the updated theme copy so brand references resolve correctly
      }
      const cssVar = resolveTokenReferenceToCssVar(interactiveRef, contextForCssVar)
      if (cssVar) {
        updateCssVar(interactiveCssVar, cssVar, tokens)
      }
    }
    
    // Update theme - this will trigger recomputeAndApplyAll which regenerates all CSS vars from theme JSON
    // The resolver will pick up the updated interactive.on-tone values and generate the correct CSS variables
    // This ensures consistency even if the direct update above had any issues
    setTheme(themeCopy)
    
    // After setTheme triggers recompute, dispatch event to notify UI components to refresh
    // The recompute happens synchronously in writeState, but we add a small delay to ensure
    // all CSS variables are fully applied before UI components read them
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
      window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones'))
    }, 10)
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

