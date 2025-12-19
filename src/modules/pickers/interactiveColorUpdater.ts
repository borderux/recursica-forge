import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { pickAAOnTone, contrastRatio } from '../theme/contrastUtil'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import type { JsonLike } from '../../core/resolvers/tokens'
import {
  resolveCssVarToHex,
  findColorFamilyAndLevel,
  getSteppedColor,
  stepUntilAACompliant,
  hexToCssVarRef
} from '../../core/compliance/layerColorStepping'

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
    const surfaceVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-surface`
    const interactiveVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-element-interactive-color`
    
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
    
    for (const colorName of coreColors) {
      const colorDef = coreColorsPath[colorName]
      if (!colorDef) continue
      
      // Get tone hex
      const toneRef = colorDef.tone?.$value
      if (!toneRef) continue
      
      // Resolve tone to hex
      const resolveRef = (ref: string): string | null => {
        if (ref.startsWith('{') && ref.endsWith('}')) {
          const inner = ref.slice(1, -1).trim()
          if (inner.startsWith('tokens.color.')) {
            const path = inner.replace('tokens.color.', '').replace(/\./g, '/')
            const hex = tokenIndex.get(`color/${path}`)
            if (typeof hex === 'string') {
              return hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
            }
          } else if (inner.startsWith('brand.themes.')) {
            const parts = inner.split('.')
            let node: any = themes
            for (const p of parts.slice(2)) {
              if (!node) break
              node = node[p]
            }
            if (node && typeof node === 'object' && '$value' in node) {
              return resolveRef(node.$value)
            }
          }
        }
        return null
      }
      
      const toneHex = resolveRef(toneRef)
      if (!toneHex) continue
      
      // Check contrast between tone and interactive
      const contrast = contrastRatio(toneHex, interactiveHex)
      
      // Find accessible color by stepping through scale
      let accessibleRef: string | null = null
      
      if (contrast >= AA) {
        // Current is accessible, find what it maps to
        const found = findColorFamilyAndLevel(interactiveHex, tokens)
        if (found) {
          const normalizedLevel = found.level === '000' ? '050' : found.level
          accessibleRef = `{tokens.color.${found.family}.${normalizedLevel}}`
        } else {
          // Check if it's white or black
          const normalizedHex = interactiveHex.startsWith('#') ? interactiveHex.toLowerCase() : `#${interactiveHex.toLowerCase()}`
          if (normalizedHex === '#ffffff' || normalizedHex === '#fff') {
            accessibleRef = `{brand.themes.${mode}.palettes.core-colors.white}`
          } else if (normalizedHex === '#000000' || normalizedHex === '#000') {
            accessibleRef = `{brand.themes.${mode}.palettes.core-colors.black}`
          }
        }
      } else {
        // Step through color scale
        const interactiveFamily = findColorFamilyAndLevel(interactiveHex, tokens)
        
        if (interactiveFamily) {
          const { family, level } = interactiveFamily
          const normalizedLevel = level === '000' ? '050' : level
          const startIdx = LEVELS.indexOf(normalizedLevel)
          
          if (startIdx !== -1) {
            // Try lighter first
            for (let i = startIdx - 1; i >= 0; i--) {
              const testLevel = LEVELS[i]
              const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
              const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
              if (typeof testHex === 'string') {
                const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                const testContrast = contrastRatio(toneHex, hex)
                if (testContrast >= AA) {
                  accessibleRef = `{tokens.color.${family}.${normalizedTestLevel}}`
                  break
                }
              }
            }
            
            // Try darker if lighter didn't work
            if (!accessibleRef) {
              for (let i = startIdx + 1; i < LEVELS.length; i++) {
                const testLevel = LEVELS[i]
                const normalizedTestLevel = testLevel === '000' ? '050' : testLevel
                const testHex = tokenIndex.get(`color/${family}/${normalizedTestLevel}`)
                if (typeof testHex === 'string') {
                  const hex = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                  const testContrast = contrastRatio(toneHex, hex)
                  if (testContrast >= AA) {
                    accessibleRef = `{tokens.color.${family}.${normalizedTestLevel}}`
                    break
                  }
                }
              }
            }
          }
        }
        
        // Try white
        if (!accessibleRef) {
          const whiteRef = `{brand.themes.${mode}.palettes.core-colors.white}`
          // Try to resolve white tone
          const whiteToneVar = `--recursica-brand-${mode}-palettes-core-white-tone`
          const whiteToneValue = readCssVar(whiteToneVar)
          let whiteHex = '#ffffff'
          if (whiteToneValue) {
            const resolved = resolveCssVarToHex(whiteToneValue, tokenIndex)
            if (resolved) whiteHex = resolved
          } else {
            // Fallback to core-white
            const resolved = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-white)`, tokenIndex)
            if (resolved) whiteHex = resolved
          }
          const whiteContrast = contrastRatio(toneHex, whiteHex)
          if (whiteContrast >= AA) {
            accessibleRef = whiteRef
          }
        }
        
        // Try black
        if (!accessibleRef) {
          const blackRef = `{brand.themes.${mode}.palettes.core-colors.black}`
          // Try to resolve black tone
          const blackToneVar = `--recursica-brand-${mode}-palettes-core-black-tone`
          const blackToneValue = readCssVar(blackToneVar)
          let blackHex = '#000000'
          if (blackToneValue) {
            const resolved = resolveCssVarToHex(blackToneValue, tokenIndex)
            if (resolved) blackHex = resolved
          } else {
            // Fallback to core-black
            const resolved = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-black)`, tokenIndex)
            if (resolved) blackHex = resolved
          }
          const blackContrast = contrastRatio(toneHex, blackHex)
          if (blackContrast >= AA) {
            accessibleRef = blackRef
          } else {
            // Use the one with higher contrast
            const whiteToneVar = `--recursica-brand-${mode}-palettes-core-white-tone`
            const whiteToneValue = readCssVar(whiteToneVar)
            let whiteHex = '#ffffff'
            if (whiteToneValue) {
              const resolved = resolveCssVarToHex(whiteToneValue, tokenIndex)
              if (resolved) whiteHex = resolved
            } else {
              const resolved = resolveCssVarToHex(`var(--recursica-brand-${mode}-palettes-core-white)`, tokenIndex)
              if (resolved) whiteHex = resolved
            }
            const whiteContrast = contrastRatio(toneHex, whiteHex)
            accessibleRef = whiteContrast >= blackContrast ? `{brand.themes.${mode}.palettes.core-colors.white}` : blackRef
          }
        }
      }
      
      // Update Brand.json
      if (accessibleRef && colorDef.interactive) {
        colorDef.interactive.$value = accessibleRef
      }
    }
    
    setTheme(themeCopy)
    
    // Update CSS variables
    for (const colorName of coreColors) {
      const interactiveVar = `--recursica-brand-${mode}-palettes-core-${colorName}-interactive`
      const interactiveRef = coreColorsPath[colorName]?.interactive?.$value
      if (interactiveRef) {
        // Resolve reference to CSS var
        if (interactiveRef.startsWith('{tokens.color.')) {
          const match = interactiveRef.match(/\{tokens\.color\.([a-z0-9_-]+)\.(\d+|000|050|1000)\}/)
          if (match) {
            const [, family, level] = match
            const normalizedLevel = level === '000' ? '050' : level
            const tokenCssVar = `--recursica-tokens-color-${family}-${normalizedLevel}`
            updateCssVar(interactiveVar, `var(${tokenCssVar})`, tokens)
          }
        } else if (interactiveRef.startsWith('{brand.themes.')) {
          const match = interactiveRef.match(/\{brand\.themes\.(light|dark)\.palettes\.core-colors\.([a-z]+)\}/)
          if (match) {
            const [, refMode, color] = match
            const coreColorVar = `--recursica-brand-${refMode}-palettes-core-${color}`
            updateCssVar(interactiveVar, `var(${coreColorVar})`, tokens)
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to update core color interactive on-tones:', err)
  }
}

