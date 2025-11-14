import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { contrastRatio, pickAAOnTone } from '../theme/contrastUtil'
import { hexToHsv, hsvToHex } from '../tokens/colors/colorUtils'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import type { JsonLike } from '../../core/resolvers/tokens'

const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']

// Helper to resolve CSS var to hex
function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      const value = readCssVar(varName)
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    
    const tokenMatch = trimmed.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      const normalizedLevel = level === '000' ? '050' : level
      const hex = tokenIndex.get(`color/${family}/${normalizedLevel}`)
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }
  } catch {}
  return null
}

// Find the color family and level for a given hex value
function findColorFamilyAndLevel(hex: string, tokens: JsonLike): { family: string; level: string } | null {
  const tokenIndex = buildTokenIndex(tokens)
  const normalizedHex = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
  
  // Search through all color families and levels
  const jsonColors: any = (tokens as any)?.tokens?.color || {}
  for (const [family, levels] of Object.entries(jsonColors)) {
    if (family === 'translucent') continue
    const familyObj = levels as any
    for (const [level, value] of Object.entries(familyObj)) {
      const tokenValue = (value as any)?.$value || value
      if (typeof tokenValue === 'string') {
        const tokenHex = tokenValue.startsWith('#') ? tokenValue.toLowerCase() : `#${tokenValue.toLowerCase()}`
        if (tokenHex === normalizedHex) {
          return { family, level }
        }
      }
    }
  }
  return null
}

// Get one step darker or lighter color
function getSteppedColor(
  hex: string,
  direction: 'darker' | 'lighter',
  tokens: JsonLike
): string | null {
  const found = findColorFamilyAndLevel(hex, tokens)
  if (!found) {
    // If not found in tokens, adjust HSV directly
    const hsv = hexToHsv(hex)
    if (direction === 'darker') {
      hsv.v = Math.max(0, hsv.v - 0.1)
    } else {
      hsv.v = Math.min(1, hsv.v + 0.1)
    }
    return hsvToHex(hsv.h, hsv.s, hsv.v)
  }
  
  const { family, level } = found
  const normalizedLevel = level === '000' ? '050' : level
  const currentIdx = LEVELS.indexOf(normalizedLevel)
  
  if (currentIdx === -1) {
    // Fallback to HSV adjustment
    const hsv = hexToHsv(hex)
    if (direction === 'darker') {
      hsv.v = Math.max(0, hsv.v - 0.1)
    } else {
      hsv.v = Math.min(1, hsv.v + 0.1)
    }
    return hsvToHex(hsv.h, hsv.s, hsv.v)
  }
  
  let targetIdx: number
  if (direction === 'darker') {
    targetIdx = Math.min(LEVELS.length - 1, currentIdx + 1)
  } else {
    targetIdx = Math.max(0, currentIdx - 1)
  }
  
  const targetLevel = LEVELS[targetIdx]
  const tokenIndex = buildTokenIndex(tokens)
  const targetHex = tokenIndex.get(`color/${family}/${targetLevel}`)
  
  if (typeof targetHex === 'string') {
    return targetHex.startsWith('#') ? targetHex.toLowerCase() : `#${targetHex.toLowerCase()}`
  }
  
  // Fallback to HSV adjustment
  const hsv = hexToHsv(hex)
  if (direction === 'darker') {
    hsv.v = Math.max(0, hsv.v - 0.1)
  } else {
    hsv.v = Math.min(1, hsv.v + 0.1)
  }
  return hsvToHex(hsv.h, hsv.s, hsv.v)
}

// Update on-tone colors for AA compliance
function updateOnToneColors(interactiveHex: string, hoverHex: string, tokens: JsonLike): void {
  const defaultOnTone = pickAAOnTone(interactiveHex)
  const hoverOnTone = pickAAOnTone(hoverHex)
  
  const defaultOnToneVar = defaultOnTone === '#ffffff' 
    ? 'var(--recursica-brand-light-palettes-core-white)'
    : 'var(--recursica-brand-light-palettes-core-black)'
  
  const hoverOnToneVar = hoverOnTone === '#ffffff'
    ? 'var(--recursica-brand-light-palettes-core-white)'
    : 'var(--recursica-brand-light-palettes-core-black)'
  
  updateCssVar('--recursica-brand-light-palettes-core-interactive-default-on-tone', defaultOnToneVar, tokens)
  updateCssVar('--recursica-brand-light-palettes-core-interactive-hover-on-tone', hoverOnToneVar, tokens)
}

// Update layer interactive colors with AA compliance
function updateLayerInteractiveColors(interactiveHex: string, tokens: JsonLike): void {
  const tokenIndex = buildTokenIndex(tokens)
  const AA = 4.5
  
  // Update layers 0-3
  for (let layer = 0; layer <= 3; layer++) {
    const surfaceVar = `--recursica-brand-light-layer-layer-${layer}-property-surface`
    const interactiveVar = `--recursica-brand-light-layer-layer-${layer}-property-element-interactive-color`
    
    const surfaceHex = resolveCssVarToHex(`var(${surfaceVar})`, tokenIndex) || '#ffffff'
    const contrast = contrastRatio(surfaceHex, interactiveHex)
    
    // Determine the best color to use for this layer
    let colorToUse = interactiveHex
    let colorHex = interactiveHex
    
    if (contrast < AA) {
      // Need to find a darker/lighter version that meets AA
      // Try stepping darker first
      let steppedHex = getSteppedColor(interactiveHex, 'darker', tokens)
      if (steppedHex) {
        const steppedContrast = contrastRatio(surfaceHex, steppedHex)
        if (steppedContrast >= AA) {
          colorToUse = steppedHex
          colorHex = steppedHex
        }
      }
      
      // If darker didn't work or didn't meet AA, try lighter
      if (colorToUse === interactiveHex) {
        steppedHex = getSteppedColor(interactiveHex, 'lighter', tokens)
        if (steppedHex) {
          const steppedContrast = contrastRatio(surfaceHex, steppedHex)
          if (steppedContrast >= AA) {
            colorToUse = steppedHex
            colorHex = steppedHex
          }
        }
      }
    }
    
    // Update the CSS var - prefer token reference if available, otherwise use hex
    const found = findColorFamilyAndLevel(colorHex, tokens)
    if (found) {
      const normalizedLevel = found.level === '000' ? '050' : found.level
      updateCssVar(interactiveVar, `var(--recursica-tokens-color-${found.family}-${normalizedLevel})`, tokens)
    } else {
      // Custom color - use hex directly
      updateCssVar(interactiveVar, colorHex, tokens)
    }
  }
  
  // Update alternative layers
  const altLayers = ['primary-color', 'success', 'warning', 'alert', 'high-contrast']
  for (const altKey of altLayers) {
    const surfaceVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-surface`
    const interactiveVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-element-interactive-color`
    
    const surfaceHex = resolveCssVarToHex(`var(${surfaceVar})`, tokenIndex) || '#ffffff'
    const contrast = contrastRatio(surfaceHex, interactiveHex)
    
    // Determine the best color to use for this alternative layer
    let colorToUse = interactiveHex
    let colorHex = interactiveHex
    
    if (contrast < AA) {
      // Need to find a darker/lighter version that meets AA
      // Try stepping darker first
      let steppedHex = getSteppedColor(interactiveHex, 'darker', tokens)
      if (steppedHex) {
        const steppedContrast = contrastRatio(surfaceHex, steppedHex)
        if (steppedContrast >= AA) {
          colorToUse = steppedHex
          colorHex = steppedHex
        }
      }
      
      // If darker didn't work or didn't meet AA, try lighter
      if (colorToUse === interactiveHex) {
        steppedHex = getSteppedColor(interactiveHex, 'lighter', tokens)
        if (steppedHex) {
          const steppedContrast = contrastRatio(surfaceHex, steppedHex)
          if (steppedContrast >= AA) {
            colorToUse = steppedHex
            colorHex = steppedHex
          }
        }
      }
    }
    
    // Update the CSS var - prefer token reference if available, otherwise use hex
    const found = findColorFamilyAndLevel(colorHex, tokens)
    if (found) {
      const normalizedLevel = found.level === '000' ? '050' : found.level
      updateCssVar(interactiveVar, `var(--recursica-tokens-color-${found.family}-${normalizedLevel})`, tokens)
    } else {
      // Custom color - use hex directly
      updateCssVar(interactiveVar, colorHex, tokens)
    }
  }
}

export function updateInteractiveColor(
  newInteractiveHex: string,
  hoverOption: 'keep' | 'darker' | 'lighter',
  tokens: JsonLike
): void {
  const normalizedHex = newInteractiveHex.startsWith('#') ? newInteractiveHex.toLowerCase() : `#${newInteractiveHex.toLowerCase()}`
  
  // Update default tone
  const found = findColorFamilyAndLevel(normalizedHex, tokens)
  if (found) {
    const normalizedLevel = found.level === '000' ? '050' : found.level
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive-default-tone',
      `var(--recursica-tokens-color-${found.family}-${normalizedLevel})`,
      tokens
    )
    // Also update the main interactive var for backward compatibility
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive',
      `var(--recursica-tokens-color-${found.family}-${normalizedLevel})`,
      tokens
    )
  } else {
    // Custom color not in tokens - set hex directly
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive-default-tone',
      normalizedHex,
      tokens
    )
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive',
      normalizedHex,
      tokens
    )
  }
  
  // Update hover tone based on option
  let hoverHex: string
  if (hoverOption === 'keep') {
    // Keep current hover color
    const currentHover = readCssVar('--recursica-brand-light-palettes-core-interactive-hover-tone')
    if (currentHover && !currentHover.startsWith('var(')) {
      hoverHex = currentHover
    } else {
      // Resolve to hex
      const tokenIndex = buildTokenIndex(tokens)
      hoverHex = resolveCssVarToHex(`var(--recursica-brand-light-palettes-core-interactive-hover-tone)`, tokenIndex) || normalizedHex
    }
  } else {
    hoverHex = getSteppedColor(normalizedHex, hoverOption, tokens) || normalizedHex
  }
  
  // Update hover tone CSS var
  const hoverFound = findColorFamilyAndLevel(hoverHex, tokens)
  if (hoverFound) {
    const normalizedLevel = hoverFound.level === '000' ? '050' : hoverFound.level
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive-hover-tone',
      `var(--recursica-tokens-color-${hoverFound.family}-${normalizedLevel})`,
      tokens
    )
  } else {
    // Custom hover color not in tokens - set hex directly
    updateCssVar(
      '--recursica-brand-light-palettes-core-interactive-hover-tone',
      hoverHex,
      tokens
    )
  }
  
  // Update on-tone colors for AA compliance
  updateOnToneColors(normalizedHex, hoverHex, tokens)
  
  // Update layer interactive colors with proper stepping
  updateLayerInteractiveColors(normalizedHex, tokens)
}

