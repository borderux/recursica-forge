/**
 * CSS Variable Name Utilities
 * 
 * Generates CSS variable names for UIKit components following the pattern:
 * --recursica-ui-kit-components-{component}-{path-segments}
 * 
 * This module provides generic utilities that work with any component structure.
 * Component-specific logic (like variant parsing) should be handled in component code.
 */

import type { ComponentName, ComponentLayer } from '../registry/types'

/**
 * Converts PascalCase component name to kebab-case
 * Examples: 'MenuItem' -> 'menu-item', 'TextField' -> 'text-field', 'Button' -> 'button'
 * Also handles spaces: 'Accordion item' -> 'accordion-item'
 */
function pascalToKebabCase(str: string): string {
  return str
    .replace(/\s+/g, '-') // Replace spaces with hyphens first
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Insert hyphen before capital letters
    .toLowerCase()
}

/**
 * Converts a UIKit.json path to a CSS variable name
 * 
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid')
 * => '--recursica-ui-kit-components-button-color-layer-0-background-solid'
 * 
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid', 'light')
 * => '--recursica-ui-kit-themes-light-components-button-color-layer-0-background-solid'
 */
export function toCssVarName(path: string, mode?: 'light' | 'dark'): string {
  // Remove leading/trailing dots and split
  const parts = path.replace(/^\.+|\.+$/g, '').split('.')
  
  // Build CSS variable name
  const varName = parts
    .map(part => part.replace(/-/g, '-')) // Keep hyphens
    .join('-')
  
  // Include mode in the name if provided (like palette vars: --recursica-brand-themes-light-...)
  if (mode) {
    return `--recursica-ui-kit-themes-${mode}-${varName}`
  }
  
  return `--recursica-ui-kit-${varName}`
}

/**
 * Builds a CSS variable name from explicit path segments.
 * This is the generic, component-agnostic way to generate CSS var names.
 * 
 * @example
 * buildComponentCssVarPath('Button', 'variants', 'styles', 'solid', 'properties', 'colors', 'layer-0', 'background')
 * => '--recursica-ui-kit-themes-light-components-button-variants-styles-solid-properties-colors-layer-0-background'
 * 
 * @example
 * buildComponentCssVarPath('Chip', 'properties', 'horizontal-padding', 'dark')
 * => '--recursica-ui-kit-themes-dark-components-chip-properties-horizontal-padding'
 * 
 * @param component - Component name (e.g., 'Button', 'Chip')
 * @param pathSegments - Path segments from UIKit.json structure (e.g., ['variants', 'styles', 'solid', 'properties', 'colors', 'layer-0', 'background'])
 * @param mode - Optional theme mode ('light' | 'dark'). If not provided, reads from document.documentElement.getAttribute('data-theme-mode')
 * @returns CSS variable name
 */
export function buildComponentCssVarPath(
  component: ComponentName,
  ...args: string[]
): string {
  // Extract mode if it's the last argument and is 'light' or 'dark'
  let mode: 'light' | 'dark' | undefined
  let pathSegments: string[]
  
  const lastArg = args[args.length - 1]
  if (lastArg === 'light' || lastArg === 'dark') {
    mode = lastArg
    pathSegments = args.slice(0, -1).filter((s): s is string => typeof s === 'string')
  } else {
    pathSegments = args.filter((s): s is string => typeof s === 'string')
    // Read mode from document if not provided
    if (typeof document !== 'undefined') {
      const docMode = document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null
      mode = docMode ?? 'light'
    } else {
      mode = 'light'
    }
  }
  
  // Guard against invalid segments
  const validSegments = pathSegments.filter(segment => 
    segment && 
    !segment.includes('undefined') && 
    !segment.includes('null')
  )
  
  if (validSegments.length === 0) {
    console.warn(`[buildComponentCssVarPath] No valid path segments for ${component}`)
    const componentKebab = pascalToKebabCase(component)
    return `--recursica-ui-kit-themes-${mode}-components-${componentKebab}-invalid-path`
  }
  
  // Normalize segments: replace dots/spaces with hyphens, lowercase
  const normalizedSegments = validSegments.map(segment => 
    segment.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  )
  
  // Build path: components.{component}.{path-segments}
  // Convert component name from PascalCase to kebab-case (e.g., 'MenuItem' -> 'menu-item')
  const componentKebab = pascalToKebabCase(component)
  const parts = ['components', componentKebab, ...normalizedSegments]
  return toCssVarName(parts.join('.'), mode)
}

/**
 * Generates CSS variable name for a UIKit component property
 * 
 * @deprecated This function contains component-specific logic. 
 * Prefer using `buildComponentCssVarPath` with explicit path segments.
 * 
 * This function attempts to parse variant names from property strings,
 * which requires hardcoded knowledge of component variants.
 * 
 * @example
 * // Instead of:
 * getComponentCssVar('Chip', 'colors', 'unselected-background', 'layer-0')
 * 
 * // Use:
 * buildComponentCssVarPath('Chip', 'variants', 'styles', 'unselected', 'properties', 'colors', 'layer-0', 'background')
 */
export function getComponentCssVar(
  component: ComponentName,
  category: 'colors' | 'size',
  property: string,
  layer?: ComponentLayer
): string {
  // Guard against undefined/null values being stringified into property names
  if (!property || property.includes('undefined') || property.includes('null')) {
    console.warn(`[getComponentCssVar] Invalid property value for ${component}: "${property}"`)
    const componentKebab = pascalToKebabCase(component)
    return `--recursica-ui-kit-components-${componentKebab}-invalid-property`
  }
  
  // Normalize 'color' (singular) to 'colors' (plural) for backward compatibility
  if (category === 'color' as any) {
    category = 'colors'
  }
  
  // Component-specific logic - this should be moved to component code
  // For now, we maintain backward compatibility by attempting to parse variants
  
  // Properties that are direct children of the component (not under a category)
  const componentLevelProperties = ['font-size', 'text-size', 'border-radius', 'max-width', 'elevation', 'label-switch-gap', 'thumb-height', 'thumb-width', 'thumb-border-radius', 'track-border-radius', 'thumb-icon-size', 'track-width', 'thumb-icon-selected', 'thumb-icon-unselected', 'thumb-elevation', 'track-elevation', 'track-inner-padding', 'padding', 'border-size']
  
  // Toast-specific: size properties are directly under toast (not under toast.size)
  const toastSizeProperties = ['vertical-padding', 'horizontal-padding', 'spacing', 'min-width', 'max-width', 'icon']
  const isToastSizeProperty = component.toLowerCase() === 'toast' && category === 'size' && toastSizeProperties.includes(property.toLowerCase())
  
  // Check if this is a component-level property
  const isComponentLevel = componentLevelProperties.includes(property.toLowerCase()) || isToastSizeProperty
  
  if (isComponentLevel) {
    return buildComponentCssVarPath(component, 'properties', property)
  }
  
  // For size category
  if (category === 'size') {
    const variantMatch = property.match(/^(default|small|large)-(.+)$/)
    if (variantMatch) {
      const [, variantName, propName] = variantMatch
      return buildComponentCssVarPath(component, 'variants', 'sizes', variantName, 'properties', propName)
    } else if (/^(default|small|large)$/.test(property)) {
      return buildComponentCssVarPath(component, 'variants', 'sizes', property, 'properties', 'size')
    } else {
      return buildComponentCssVarPath(component, 'properties', property)
    }
  }
  
  // For colors category
  // Switch has colors directly under properties (not under variants)
  if (component.toLowerCase() === 'switch') {
    let propName = property
    // Strip variant prefix if present
    const variantPrefixMatch = property.match(/^(default|small|large|solid|text|outline|primary|success|error|warning|alert)-(.+)$/)
    if (variantPrefixMatch) {
      propName = variantPrefixMatch[2]
    }
    const pathSegments: string[] = ['properties', 'colors']
    if (layer) pathSegments.push(layer)
    pathSegments.push(propName)
    return buildComponentCssVarPath(component, ...pathSegments)
  }
  
  // Check for nested variants (e.g., "text-solid-background" for Avatar)
  const nestedVariantMatch = property.match(/^(text|icon)-(solid|ghost)-(.+)$/)
  if (nestedVariantMatch) {
    const [, primaryVariant, secondaryVariant, propName] = nestedVariantMatch
    const pathSegments: string[] = ['variants', 'styles', primaryVariant, 'variants', secondaryVariant, 'properties', 'colors']
    if (layer) pathSegments.push(layer)
    pathSegments.push(propName)
    return buildComponentCssVarPath(component, ...pathSegments)
  }
  
  // Check for image variant
  const imageVariantMatch = property.match(/^image-(.+)$/)
  if (imageVariantMatch) {
    const [, propName] = imageVariantMatch
    const pathSegments: string[] = ['variants', 'styles', 'image', 'properties', 'colors']
    if (layer) pathSegments.push(layer)
    pathSegments.push(propName)
    return buildComponentCssVarPath(component, ...pathSegments)
  }
  
  // Try to parse single-level variant from property string
  // NOTE: This requires hardcoded variant names - components should use buildComponentCssVarPath directly
  const knownVariants = ['solid', 'text', 'outline', 'default', 'primary-color', 'primary', 'success', 'error-selected', 'error', 'warning', 'alert', 'unselected', 'selected', 'hover', 'focused', 'disabled']
  const sortedVariants = knownVariants.sort((a, b) => b.length - a.length)
  for (const variant of sortedVariants) {
    if (property.startsWith(`${variant}-`)) {
      const propName = property.substring(variant.length + 1)
      const pathSegments: string[] = ['variants', 'styles', variant, 'properties', 'colors']
      if (layer) pathSegments.push(layer)
      pathSegments.push(propName)
      return buildComponentCssVarPath(component, ...pathSegments)
    }
  }
  
  // Fallback: legacy support
  return buildComponentCssVarPath(component, category, property)
}

/**
 * Generates CSS variable name for a UIKit global/form property
 */
export function getGlobalCssVar(
  category: 'globals' | 'form',
  ...args: string[]
): string {
  // Extract mode if it's the last argument and is 'light' or 'dark'
  let mode: 'light' | 'dark' | undefined
  let path: string[]
  
  const lastArg = args[args.length - 1]
  if (lastArg === 'light' || lastArg === 'dark') {
    mode = lastArg
    path = args.slice(0, -1).filter((s): s is string => typeof s === 'string')
  } else {
    path = args.filter((s): s is string => typeof s === 'string')
    // Read mode from document if not provided
    if (typeof document !== 'undefined') {
      const docMode = document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null
      mode = docMode ?? 'light'
    } else {
      mode = 'light'
    }
  }
  
  // UIKit structure: ui-kit.globals.form.field.size.single-line-input-height
  // So for 'form' category, we need: globals.form.field.size.single-line-input-height
  // For 'globals' category, we need: globals.{path}
  const parts = category === 'form' 
    ? ['globals', 'form', ...path]
    : ['globals', ...path]
  return toCssVarName(parts.join('.'), mode)
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
 * This is a convenience wrapper around `buildComponentCssVarPath` for component-level properties.
 * 
 * @example
 * getComponentLevelCssVar('Button', 'elevation')
 * => '--recursica-ui-kit-components-button-properties-elevation'
 * 
 * @example
 * getComponentLevelCssVar('Toast', 'text-size')
 * => '--recursica-ui-kit-components-toast-properties-text-size'
 * 
 * @example
 * getComponentLevelCssVar('Chip', 'colors.error.text-color')
 * => '--recursica-ui-kit-components-chip-properties-colors-error-text-color'
 */
export function getComponentLevelCssVar(
  component: ComponentName,
  property: string
): string {
  // Handle nested properties (e.g., 'colors.error.text-color')
  const propertyParts = property.split('.').filter(Boolean)
  return buildComponentCssVarPath(component, 'properties', ...propertyParts)
}

/**
 * Helper function to build CSS var path for variant color properties
 * 
 * @example
 * buildVariantColorCssVar('Chip', 'unselected', 'background', 'layer-0')
 * => '--recursica-ui-kit-components-chip-variants-styles-unselected-properties-colors-layer-0-background'
 */
export function buildVariantColorCssVar(
  component: ComponentName,
  variant: string,
  property: string,
  layer?: ComponentLayer
): string {
  const pathSegments: string[] = ['variants', 'styles', variant, 'properties', 'colors']
  if (layer) pathSegments.push(layer)
  pathSegments.push(property)
  return buildComponentCssVarPath(component, ...pathSegments)
}

/**
 * Helper function to build CSS var path for variant size properties
 * 
 * @example
 * buildVariantSizeCssVar('Button', 'default', 'height')
 * => '--recursica-ui-kit-components-button-variants-sizes-default-properties-height'
 */
export function buildVariantSizeCssVar(
  component: ComponentName,
  variant: string,
  property: string
): string {
  return buildComponentCssVarPath(component, 'variants', 'sizes', variant, 'properties', property)
}

/**
 * Generates CSS variable name for component text properties
 * 
 * @example
 * getComponentTextCssVar('Button', 'text', 'font-size')
 * => '--recursica-ui-kit-components-button-properties-text-font-size'
 * 
 * @example
 * getComponentTextCssVar('AccordionItem', 'header-text', 'font-weight')
 * => '--recursica-ui-kit-components-accordion-item-properties-header-text-font-weight'
 * 
 * @example
 * getComponentTextCssVar('Avatar', 'text', 'font-size', 'small')
 * => '--recursica-ui-kit-components-avatar-variants-sizes-small-properties-text-font-size'
 * 
 * @param componentName - Component name (e.g., 'Button', 'Label')
 * @param textElementName - Text element name (e.g., 'text', 'header-text', 'content-text', 'label-text', 'optional-text')
 * @param property - Text property (e.g., 'font-size', 'font-weight', 'font-family', 'letter-spacing', 'line-height', 'text-decoration', 'text-transform')
 * @param sizeVariant - Optional size variant (e.g., 'small', 'default', 'large'). If provided, text properties are looked up in the variant.
 * @returns CSS variable name
 */
export function getComponentTextCssVar(
  componentName: ComponentName,
  textElementName: string,
  property: string,
  sizeVariant?: string
): string {
  if (sizeVariant) {
    return buildComponentCssVarPath(componentName, 'variants', 'sizes', sizeVariant, 'properties', textElementName, property)
  }
  return buildComponentCssVarPath(componentName, 'properties', textElementName, property)
}