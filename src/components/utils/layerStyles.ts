/**
 * Layer Styles Utilities
 * 
 * Handles CSS cascading for layer-based component styling.
 * When a layer prop is provided, it overrides default values using CSS variables.
 */

import type { ComponentLayer } from '../registry/types'
import { getComponentCssVar } from './cssVarNames'
import { readCssVar } from '../hooks/useCssVar'

/**
 * Creates style object with layer-based CSS variable overrides
 * 
 * Uses CSS custom properties with layer-specific variables that override defaults
 * through CSS cascading.
 */
export function createLayerStyles(
  component: string,
  layer: ComponentLayer | undefined,
  baseStyles: Record<string, string> = {}
): Record<string, string> {
  const styles = { ...baseStyles }
  
  if (layer && layer !== 'layer-0') {
    // For non-default layers, we'll use CSS custom properties
    // that can be overridden via CSS cascading
    // The actual override happens via CSS variable names that include the layer
    
    // Example: If we have a background color, we check for layer-specific override
    if (baseStyles.backgroundColor) {
      const layerVar = getComponentCssVar(
        component as any,
        'colors',
        'background-solid',
        layer
      )
      const layerValue = readCssVar(layerVar)
      if (layerValue) {
        styles.backgroundColor = layerValue
      }
    }
    
    // Similar for other color properties
    if (baseStyles.color) {
      const layerVar = getComponentCssVar(
        component as any,
        'colors',
        'text-solid',
        layer
      )
      const layerValue = readCssVar(layerVar)
      if (layerValue) {
        styles.color = layerValue
      }
    }
  }
  
  return styles
}

/**
 * Creates a CSS class or style that uses CSS custom properties
 * with layer-specific overrides via CSS cascading
 */
export function createLayerCssVars(
  component: string,
  layer: ComponentLayer | undefined,
  properties: Record<string, string>
): Record<string, string> {
  const vars: Record<string, string> = {}
  
  // Set base CSS variables
  Object.entries(properties).forEach(([key, value]) => {
    vars[`--component-${key}`] = value
  })
  
  // If layer is specified and not default, add layer-specific overrides
  if (layer && layer !== 'layer-0') {
    // These will be used via CSS custom properties in the component styles
    Object.keys(properties).forEach((key) => {
      if (key.includes('color') || key.includes('background')) {
        const layerVar = getComponentCssVar(
          component as any,
          'colors',
          key.replace(/(color|background)/, '').replace(/-/g, '') || 'background-solid',
          layer
        )
        const layerValue = readCssVar(layerVar)
        if (layerValue) {
          vars[`--component-${key}`] = layerValue
        }
      }
    })
  }
  
  return vars
}

