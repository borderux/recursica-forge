/**
 * Shared utility for resolving component color CSS variables
 * 
 * This utility extracts the common logic for determining which CSS variables
 * to use for component colors based on variants and layers.
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
  src?: string
  imageError?: boolean
}

/**
 * Gets the CSS variable names for component colors based on variant and layer
 */
export function getComponentColorVars({
  componentName,
  colorVariant,
  layer,
  mode,
  src,
  imageError,
}: GetComponentColorVarsOptions): ComponentColorVars {
  // Use UIKit.json component colors for standard layers
  // For nested variants: text-solid-background, text-ghost-background, icon-solid-background, icon-ghost-background, image-background
  // UIKit.json structure: variant.text.variant.solid.background
  // If variant is just "text" or "icon" (without secondary), default to "solid"
  let variantPath = colorVariant
  if (colorVariant === 'text' || colorVariant === 'icon') {
    variantPath = `${colorVariant}-solid`
  }
  
  const bgVar = getComponentCssVar(componentName, 'color', `${variantPath}-background`, layer)
  const borderVar = getComponentCssVar(componentName, 'color', `${variantPath}-border`, layer)
  
  // Use text-color for text variants, icon-color for icon variants
  let labelVar: string
  if (colorVariant.startsWith('text')) {
    labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-text-color`, layer)
  } else if (colorVariant.startsWith('icon')) {
    labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-icon-color`, layer)
  } else {
    // For image variant, there's no label/color property
    labelVar = getComponentCssVar(componentName, 'color', `${variantPath}-background`, layer) // Fallback
  }
  
  // For images, use the image variant's border instead of the current variant's border
  let finalBorderVar = borderVar
  if ((src && !imageError) || colorVariant === 'image') {
    finalBorderVar = getComponentCssVar(componentName, 'color', 'image-border', layer)
  }
  
  return { bgVar, borderVar: finalBorderVar, labelVar }
}
