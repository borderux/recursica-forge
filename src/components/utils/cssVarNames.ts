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
 * => '--recursica-ui-kit-components-button-size-default-height'
 */
export function getComponentCssVar(
  component: ComponentName,
  category: 'color' | 'size',
  property: string,
  layer?: ComponentLayer
): string {
  const parts = ['components', component.toLowerCase(), category]
  
  // For color category, layer comes before the property
  // For size category, layer is not used (size properties are at root level)
  if (category === 'color' && layer) {
    parts.push(layer)
  }
  
  // Handle nested properties like "default-height" -> stays as "default-height"
  const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  parts.push(normalizedProperty)
  
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

