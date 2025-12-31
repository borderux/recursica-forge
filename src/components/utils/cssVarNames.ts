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
  
  // Toast-specific: size properties are directly under toast (not under toast.size)
  // So they should be treated as component-level properties
  const toastSizeProperties = ['vertical-padding', 'horizontal-padding', 'spacing', 'min-width', 'max-width', 'icon']
  const isToastSizeProperty = component.toLowerCase() === 'toast' && category === 'size' && toastSizeProperties.includes(property.toLowerCase())
  
  // Check if this is a component-level property (not under size/color category)
  const isComponentLevel = componentLevelProperties.includes(property.toLowerCase()) || isToastSizeProperty
  
  if (isComponentLevel) {
    const parts = ['components', component.toLowerCase()]
    const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
    parts.push(normalizedProperty)
    return toCssVarName(parts.join('.'))
  }
  
  const parts = ['components', component.toLowerCase()]
  
  // For size category, use NEW STRUCTURE: variants.sizes.{variant-name}.properties.{property}
  // For Avatar: variants.sizes.variants.{variant-name}.properties.size
  if (category === 'size') {
    const variantMatch = property.match(/^(default|small|large)-(.+)$/)
    if (variantMatch) {
      const [, variantName, propName] = variantMatch
      parts.push('variants', 'sizes', variantName, 'properties', propName)
    } else if (/^(default|small|large)$/.test(property)) {
      // Property is just a variant name (e.g., "default", "small", "large")
      // NEW STRUCTURE: variants.sizes.{variant}.properties.size
      // This is used by Avatar where size variants have a "size" property inside "properties"
      parts.push('variants', 'sizes', property, 'properties', 'size')
    } else {
      // Non-variant size property (e.g., "icon", "border-radius", "font-size")
      // These are now in properties, not variants
      const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
      parts.push(normalizedProperty)
    }
  } else {
    // For colors category
    // Check if this is Switch which has colors directly under properties (not under variants)
    if (component.toLowerCase() === 'switch') {
      // Switch structure: properties.colors.{layer}.{property}
      // Note: Switch code may pass properties like "default-thumb-selected", but the actual structure
      // is just "thumb-selected" under properties.colors (no variant prefix)
      let propName = property
      // Strip variant prefix if present (e.g., "default-thumb-selected" -> "thumb-selected")
      const variantPrefixMatch = property.match(/^(default|small|large|solid|text|outline|primary|ghost|success|error|warning|alert)-(.+)$/)
      if (variantPrefixMatch) {
        propName = variantPrefixMatch[2]
      }
      parts.push('properties', 'colors')
      if (layer) {
        parts.push(layer)
      }
      const normalizedProperty = propName.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
      parts.push(normalizedProperty)
    } else {
      // For other components, use NEW STRUCTURE: variants.styles.{variant-name}.colors.{layer}.{property}
      // For nested variants (Avatar): variants.styles.text.variants.solid.colors.layer-0.background
      // For single variants (Button/Toast/Badge): variants.styles.solid.colors.layer-0.background
      
      // Check for nested variants (e.g., "text-solid-background" for Avatar)
      const nestedVariantMatch = property.match(/^(text|icon)-(solid|ghost)-(.+)$/)
      if (nestedVariantMatch) {
        // NEW STRUCTURE: variants.styles.{primary-variant}.variants.{secondary-variant}.properties.colors.{layer}.{property}
        const [, primaryVariant, secondaryVariant, propName] = nestedVariantMatch
        parts.push('variants', 'styles', primaryVariant, 'variants', secondaryVariant, 'properties', 'colors')
        if (layer) {
          parts.push(layer)
        }
        parts.push(propName)
      } else {
        // Check for image variant (e.g., "image-background")
        const imageVariantMatch = property.match(/^image-(.+)$/)
        if (imageVariantMatch) {
          const [, propName] = imageVariantMatch
          parts.push('variants', 'styles', 'image', 'properties', 'colors')
          if (layer) {
            parts.push(layer)
          }
          parts.push(propName)
        } else {
          // Single-level variant (e.g., "solid-background", "outline-text", "default-background", "success-background", "error-background")
          // Check if property starts with a known variant name followed by a hyphen
          const knownVariants = ['solid', 'text', 'outline', 'default', 'primary-color', 'primary', 'ghost', 'success', 'error', 'warning', 'alert']
          let variantName: string | null = null
          let propName: string | null = null
          
          // Try to match known variants at the start of the property (longest match first)
          const sortedVariants = knownVariants.sort((a, b) => b.length - a.length)
          for (const variant of sortedVariants) {
            if (property.startsWith(`${variant}-`)) {
              variantName = variant
              propName = property.substring(variant.length + 1) // +1 for the hyphen
              break
            }
          }
          
          if (variantName && propName) {
            // Use new structure: variants.styles.{name}.properties.colors.{layer}.{property}
            parts.push('variants', 'styles', variantName, 'properties', 'colors')
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
 * => '--recursica-ui-kit-components-button-properties-elevation'
 * 
 * @example
 * getComponentLevelCssVar('Toast', 'text-size')
 * => '--recursica-ui-kit-components-toast-properties-text-size'
 */
export function getComponentLevelCssVar(
  component: ComponentName,
  property: string
): string {
  // Component-level properties are under components.{component}.properties.{property}
  const parts = ['components', component.toLowerCase(), 'properties', property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()]
  return toCssVarName(parts.join('.'))
}

