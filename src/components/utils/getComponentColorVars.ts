/**
 * Shared utility for resolving component color CSS variables
 * 
 * This utility extracts the common logic for determining which CSS variables
 * to use for component colors based on variants, layers, and alternative layers.
 * This pattern will be reused across all components.
 */

import { getComponentCssVar } from './cssVarNames'
import type { ComponentLayer } from '../registry/types'

export interface ComponentColorVars {
  bgVar: string
  borderVar: string
  labelVar: string
}

export interface GetComponentColorVarsOptions {
  componentName: string
  colorVariant: string
  layer: ComponentLayer
  mode: 'light' | 'dark'
  alternativeLayer?: string | null
  src?: string
  imageError?: boolean
}

/**
 * Gets the CSS variable names for component colors based on variant, layer, and alternative layer
 */
export function getComponentColorVars({
  componentName,
  colorVariant,
  layer,
  mode,
  alternativeLayer,
  src,
  imageError,
}: GetComponentColorVarsOptions): ComponentColorVars {
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  // Extract base variant (solid or ghost) from colorVariant for alternative layers
  // text-solid, icon-solid -> solid (primary-like)
  // text-ghost, icon-ghost -> ghost
  // text, icon (base) -> solid (primary-like)
  // image -> ghost (default)
  const baseVariant = colorVariant?.endsWith('-solid') || 
                      colorVariant === 'text' || 
                      colorVariant === 'icon' ? 'primary' : 
                      colorVariant?.endsWith('-ghost') || 
                      colorVariant === 'image' ? 'ghost' : 'ghost'
  
  let bgVar: string
  let borderVar: string
  let labelVar: string
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    
    if (baseVariant === 'primary') {
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-element-text-color`
      labelVar = `${layerBase}-element-text-color`
    } else {
      // ghost variant
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-property-border-color`
      labelVar = `${layerBase}-element-text-color`
    }
  } else if (layer.startsWith('layer-alternative-')) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    
    if (baseVariant === 'primary') {
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-element-text-color`
      labelVar = `${layerBase}-element-text-color`
    } else {
      // ghost variant
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-property-border-color`
      labelVar = `${layerBase}-element-text-color`
    }
  } else {
    // Use UIKit.json component colors for standard layers
    // For nested variants: text-solid-background, text-ghost-background, icon-solid-background, icon-ghost-background, image-background
    // UIKit.json structure: variant.text.variant.solid.background
    // If variant is just "text" or "icon" (without secondary), default to "solid"
    let variantPath = colorVariant
    if (colorVariant === 'text' || colorVariant === 'icon') {
      variantPath = `${colorVariant}-solid`
    }
    
    bgVar = getComponentCssVar(componentName, 'color', `${variantPath}-background`, layer)
    borderVar = getComponentCssVar(componentName, 'color', `${variantPath}-border`, layer)
    
    // Use text-color for text variants, icon-color for icon variants
    if (colorVariant.startsWith('text')) {
      labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-text-color`, layer)
    } else if (colorVariant.startsWith('icon')) {
      labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-icon-color`, layer)
    } else {
      // For image variant, there's no label/color property
      labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-background`, layer) // Fallback
    }
    
    // For images, use the image variant's border instead of the current variant's border
    if ((src && !imageError) || colorVariant === 'image') {
      borderVar = getComponentCssVar(componentName, 'color', 'image-border', layer)
    }
  }
  
  return { bgVar, borderVar, labelVar }
}
