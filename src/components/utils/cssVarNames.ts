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
  category: 'colors' | 'size',
  property: string,
  layer?: ComponentLayer
): string {
  // Properties that are direct children of the component (not under a category)
  // These are siblings of 'size' and 'color' in UIKit.json
  const componentLevelProperties = ['font-size', 'text-size', 'border-radius', 'max-width', 'elevation', 'label-switch-gap', 'thumb-height', 'thumb-width', 'thumb-border-radius', 'track-border-radius', 'thumb-icon-size', 'track-width', 'thumb-icon-selected', 'thumb-icon-unselected', 'thumb-elevation', 'track-elevation', 'track-inner-padding', 'padding', 'border-size']
  
  // Check if this is a component-level property (not under size/color category)
  // Exception: For Toast, max-width is under size, so don't treat it as component-level when category is 'size'
  const isComponentLevel = componentLevelProperties.includes(property.toLowerCase()) && 
    !(component.toLowerCase() === 'toast' && category === 'size' && property.toLowerCase() === 'max-width')
  
  if (isComponentLevel) {
    const parts = ['components', component.toLowerCase()]
    const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
    parts.push(normalizedProperty)
    return toCssVarName(parts.join('.'))
  }
  
  const parts = ['components', component.toLowerCase()]
  
  // For size category, use the old structure: size.variants.default.height
  if (category === 'size') {
    parts.push(category)
    const variantMatch = property.match(/^(default|small|large)-(.+)$/)
    if (variantMatch) {
      const [, variantName, propName] = variantMatch
      parts.push('variants', variantName, propName)
    } else if (/^(default|small|large)$/.test(property)) {
      // Property is just a variant name (e.g., "default", "small", "large")
      // UIKit.json structure: size.variants.default (direct dimension value)
      parts.push('variants', property)
    } else {
      // Non-variant size property (e.g., "icon", "border-radius", "font-size")
      const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
      parts.push(normalizedProperty)
    }
  } else {
    // For colors category, use NEW STRUCTURE: variants.{variant-name}.colors.{layer}.{property}
    // For nested variants (Avatar): variants.text.variants.solid.colors.layer-0.background
    // For single variants (Button/Switch): variants.solid.colors.layer-0.background
    
    // Check for nested variants (e.g., "text-solid-background" for Avatar)
    const nestedVariantMatch = property.match(/^(text|icon)-(solid|ghost)-(.+)$/)
    if (nestedVariantMatch) {
      // NEW STRUCTURE: variants.{primary-variant}.variants.{secondary-variant}.colors.{layer}.{property}
      const [, primaryVariant, secondaryVariant, propName] = nestedVariantMatch
      parts.push('variants', primaryVariant, 'variants', secondaryVariant, 'colors')
      if (layer) {
        parts.push(layer)
      }
      parts.push(propName)
    } else {
      // Check for image variant (e.g., "image-background")
      const imageVariantMatch = property.match(/^image-(.+)$/)
      if (imageVariantMatch) {
        const [, propName] = imageVariantMatch
        parts.push('variants', 'image', 'colors')
        if (layer) {
          parts.push(layer)
        }
        parts.push(propName)
      } else {
        // Single-level variant (e.g., "solid-background", "outline-text", "default-thumb-selected")
        // Check if property starts with a known variant name followed by a hyphen
        const knownVariants = ['solid', 'text', 'outline', 'default', 'primary', 'ghost', 'success', 'error']
        let variantName: string | null = null
        let propName: string | null = null
        
        // Try to match known variants at the start of the property
        for (const variant of knownVariants) {
          if (property.startsWith(`${variant}-`)) {
            variantName = variant
            propName = property.substring(variant.length + 1) // +1 for the hyphen
            break
          }
        }
        
        if (variantName && propName) {
          // Use new structure: variants.{name}.colors.{layer}.{property}
          parts.push('variants', variantName, 'colors')
          if (layer) {
            parts.push(layer)
          }
          parts.push(propName)
        } else {
          // Non-variant color property (legacy support)
          parts.push(category)
          const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
          parts.push(normalizedProperty)
        }
      }
    }
  }
  
  return toCssVarName(parts.join('.'))
}

/**
 * Generates CSS variable name for a UIKit global/form property
 */
export function getGlobalCssVar(
  category: 'globals' | 'form',
  ...path: string[]
): string {
  const parts = ['ui-kit', category, ...path]
  return toCssVarName(parts.join('.'))
}

/**
 * Generates CSS variable name for form component properties
 */
export function getFormCssVar(
  component: 'field' | 'label' | 'indicator' | 'assistive-elements',
  category: 'colors' | 'size',
  ...path: string[]
): string {
  return getGlobalCssVar('form', component, category, ...path)
}

/**
 * Generates CSS variable name for component-level properties (elevation, etc.)
 * 
 * @example
 * getComponentLevelCssVar('Button', 'elevation')
 * => '--recursica-ui-kit-components-button-elevation'
 */
export function getComponentLevelCssVar(
  component: ComponentName,
  property: string
): string {
  const parts = ['components', component.toLowerCase(), property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()]
  return toCssVarName(parts.join('.'))
}

