/**
 * CSS Variable Name Utilities
 * 
 * Generates CSS variable names for UIKit components following the pattern:
 * --recursica-ui-kit-components-{component}-{category}-{layer?}-{property}
 */

import type { ComponentName, ComponentLayer } from '../registry/types'

/**
 * Converts a UIKit.json path to a CSS variable name
 * 
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid')
 * => '--recursica-ui-kit-components-button-color-layer-0-background-solid'
 */
export function toCssVarName(path: string): string {
  // Remove leading/trailing dots and split
  const parts = path.replace(/^\.+|\.+$/g, '').split('.')
  
  // Build CSS variable name
  const varName = parts
    .map(part => part.replace(/-/g, '-')) // Keep hyphens
    .join('-')
  
  return `--recursica-ui-kit-${varName}`
}

/**
 * Generates CSS variable name for a UIKit component property
 * 
 * @example
 * getComponentCssVar('Button', 'color', 'background-solid', 'layer-0')
 * => '--recursica-ui-kit-components-button-color-layer-0-background-solid'
 * 
 * @example
 * getComponentCssVar('Button', 'size', 'default-height', undefined)
 * => '--recursica-ui-kit-components-button-size-variant-default-height'
 */
export function getComponentCssVar(
  component: ComponentName,
  category: 'color' | 'size',
  property: string,
  layer?: ComponentLayer
): string {
  const parts = ['components', component.toLowerCase(), category]
  
  // For color category, layer comes before the property
  if (category === 'color' && layer) {
    parts.push(layer)
  }
  
  // For size category, check if property contains variant name (e.g., "default-height", "small-height")
  // If it does, we need to insert "variant" into the path
  if (category === 'size') {
    const variantMatch = property.match(/^(default|small)-(.+)$/)
    if (variantMatch) {
      const [, variantName, propName] = variantMatch
      parts.push('variant', variantName, propName)
    } else {
      // Non-variant size property (e.g., "font-size", "border-radius")
      const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
      parts.push(normalizedProperty)
    }
  } else {
    // For color category, handle nested properties
    const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
    parts.push(normalizedProperty)
  }
  
  return toCssVarName(parts.join('.'))
}

/**
 * Generates CSS variable name for a UIKit global/form property
 */
export function getGlobalCssVar(
  category: 'global' | 'form',
  ...path: string[]
): string {
  const parts = ['ui-kit', category, ...path]
  return toCssVarName(parts.join('.'))
}

/**
 * Generates CSS variable name for form component properties
 */
export function getFormCssVar(
  component: 'field' | 'label' | 'indicator' | 'assistive-element',
  category: 'color' | 'size',
  ...path: string[]
): string {
  return getGlobalCssVar('form', component, category, ...path)
}

