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
 * => '--recursica-ui-kit-components-button-color-layer-0-variant-solid-background'
 * 
 * @example
 * getComponentCssVar('Button', 'size', 'default-height', undefined)
 * => '--recursica-ui-kit-components-button-size-variant-default-height'
 * 
 * @example
 * getComponentCssVar('Button', 'size', 'font-size', undefined)
 * => '--recursica-ui-kit-components-button-font-size'
 * Note: font-size and border-radius are siblings of 'size', not children
 */
export function getComponentCssVar(
  component: ComponentName,
  category: 'color' | 'size',
  property: string,
  layer?: ComponentLayer
): string {
  // Properties that are direct children of the component (not under a category)
  // These are siblings of 'size' and 'color' in UIKit.json
  const componentLevelProperties = ['font-size', 'border-radius', 'max-width', 'elevation', 'alternative-layer', 'label-switch-gap', 'thumb-height', 'thumb-width', 'thumb-border-radius', 'track-border-radius', 'thumb-icon-size', 'track-width', 'thumb-icon-selected', 'thumb-icon-unselected', 'thumb-elevation', 'track-elevation', 'track-inner-padding']
  
  // Check if this is a component-level property (not under size/color category)
  if (componentLevelProperties.includes(property.toLowerCase())) {
    const parts = ['components', component.toLowerCase()]
    const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
    parts.push(normalizedProperty)
    return toCssVarName(parts.join('.'))
  }
  
  const parts = ['components', component.toLowerCase(), category]
  
  // For color category, layer comes before the property
  if (category === 'color' && layer) {
    parts.push(layer)
  }
  
  // For size category, check if property contains variant name (e.g., "default-height", "small-height")
  // Or if property is just a variant name (e.g., "default", "small", "large") - used by Avatar
  // If it does, we need to insert "variant" into the path
  if (category === 'size') {
    const variantMatch = property.match(/^(default|small|large)-(.+)$/)
    if (variantMatch) {
      const [, variantName, propName] = variantMatch
      parts.push('variant', variantName, propName)
    } else if (/^(default|small|large)$/.test(property)) {
      // Property is just a variant name (e.g., "default", "small", "large")
      // UIKit.json structure: size.variant.default (direct dimension value)
      parts.push('variant', property)
    } else {
      // Non-variant size property (e.g., "icon", "border-radius", "font-size")
      const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
      parts.push(normalizedProperty)
    }
  } else {
    // For color category, check if property contains variant name (e.g., "solid-text", "outline-background")
    // Color variants are now nested under "variant" nodes in UIKit.json
    // If it does, we need to insert "variant" into the path
    // Pattern: {variant-name}-{property-name} where variant-name is a word and property-name follows
    const colorVariantMatch = property.match(/^([a-z]+)-(.+)$/)
    if (colorVariantMatch) {
      const [, variantName, propName] = colorVariantMatch
      // Known color variants: solid, text, outline, default, primary, ghost
      // If it matches a known variant pattern, insert "variant" segment
      const knownVariants = ['solid', 'text', 'outline', 'default', 'primary', 'ghost']
      if (knownVariants.includes(variantName)) {
        parts.push('variant', variantName, propName)
      } else {
        // Unknown variant pattern - treat as regular property
        const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
        parts.push(normalizedProperty)
      }
    } else {
      // Non-variant color property
  const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  parts.push(normalizedProperty)
    }
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

/**
 * Generates CSS variable name for component-level properties (elevation, alternative-layer, etc.)
 * 
 * @example
 * getComponentLevelCssVar('Button', 'elevation')
 * => '--recursica-ui-kit-components-button-elevation'
 * 
 * @example
 * getComponentLevelCssVar('Button', 'alternative-layer')
 * => '--recursica-ui-kit-components-button-alternative-layer'
 */
export function getComponentLevelCssVar(
  component: ComponentName,
  property: string
): string {
  const parts = ['components', component.toLowerCase(), property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()]
  return toCssVarName(parts.join('.'))
}

