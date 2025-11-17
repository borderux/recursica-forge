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
  
  // Update alternative layers
  const altLayers = ['primary-color', 'success', 'warning', 'alert', 'high-contrast']
  for (const altKey of altLayers) {
    const surfaceVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-surface`
    const interactiveVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-element-interactive-color`
    
    const surfaceHex = resolveCssVarToHex(`var(${surfaceVar})`, tokenIndex) || '#ffffff'
    const contrast = contrastRatio(surfaceHex, interactiveHex)
    
    // Determine the best color to use for this alternative layer
    let colorHex = interactiveHex
    
    if (contrast < AA) {
      // Need to find a darker/lighter version that meets AA
      // For colored backgrounds, try darker first (usually better contrast)
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
  tokens: JsonLike
): void {
  const normalizedHex = newInteractiveHex.startsWith('#') ? newInteractiveHex.toLowerCase() : `#${newInteractiveHex.toLowerCase()}`
  
  // Update default tone
  const defaultToneRef = hexToCssVarRef(normalizedHex, tokens)
  updateCssVar(
    '--recursica-brand-light-palettes-core-interactive-default-tone',
    defaultToneRef,
    tokens
  )
  // Also update the main interactive var for backward compatibility
  updateCssVar(
    '--recursica-brand-light-palettes-core-interactive',
    defaultToneRef,
    tokens
  )
  
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
  const hoverToneRef = hexToCssVarRef(hoverHex, tokens)
  updateCssVar(
    '--recursica-brand-light-palettes-core-interactive-hover-tone',
    hoverToneRef,
    tokens
  )
  
  // Update on-tone colors for AA compliance
  updateOnToneColors(normalizedHex, hoverHex, tokens)
  
  // Update layer interactive colors with proper stepping
  updateLayerInteractiveColors(normalizedHex, tokens)
}

