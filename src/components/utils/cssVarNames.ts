/**
 * CSS Variable Name Utilities
 * 
 * Generates CSS variable names for UIKit components following the pattern:
 * --recursica_ui-kit_components_{component}_{path-segments}
 * 
 * Uses underscore (_) as segment separator and --recursica_ as prefix.
 * Underscores within segment names are escaped as __ to avoid ambiguity.
 * Hyphens within segment names (e.g. layer-0, scale-02) are preserved.
 * 
 * This module provides generic utilities that work with any component structure.
 * Component-specific logic (like variant parsing) should be handled in component code.
 */

import type { ComponentName, ComponentLayer } from '../registry/types'

/**
 * Escapes underscores within a single path segment.
 * Underscores in segment names become __ so they don't collide with the _ separator.
 */
function escapeSegment(segment: string): string {
  return segment.replace(/_/g, '__')
}

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
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid')
 * => '--recursica_ui-kit_components_button_color_layer-0_background-solid'
 *
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid', 'light')
 * => '--recursica_ui-kit_themes_light_components_button_color_layer-0_background-solid'
 */
export function toCssVarName(path: string, mode?: 'light' | 'dark'): string {
  // Remove leading/trailing dots and split
  const parts = path.replace(/^\.+|\.+$/g, '').split('.').filter(Boolean)

  // Lowercase each segment and escape underscores — lowercasing matches the resolver's
  // toCssVarName so both functions produce identical var names for the same path.
  const varName = parts.map(part => escapeSegment(part.replace(/\s+/g, '-').toLowerCase())).join('_')

  // Include mode in the name if provided (like the resolver: --recursica_ui-kit_themes_light_...)
  if (mode) {
    return `--recursica_ui-kit_themes_${mode}_${varName}`
  }

  return `--recursica_ui-kit_${varName}`
}

/**
 * Builds a CSS variable name from explicit path segments.
 * This is the generic, component-agnostic way to generate CSS var names.
 * 
 * @example
 * buildComponentCssVarPath('Button', 'variants', 'styles', 'solid', 'properties', 'colors', 'layer-0', 'background')
 * => '--recursica_ui-kit_themes_light_components_button_variants_styles_solid_properties_colors_layer-0_background'
 * 
 * @example
 * buildComponentCssVarPath('Chip', 'properties', 'horizontal-padding', 'dark')
 * => '--recursica_ui-kit_themes_dark_components_chip_properties_horizontal-padding'
 * 
 * @param component - Component name (e.g., 'Button', 'Chip')
 * @param pathSegments - Path segments from recursica_ui-kit.json structure (e.g., ['variants', 'styles', 'solid', 'properties', 'colors', 'layer-0', 'background'])
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
    const componentKebab = pascalToKebabCase(component)
    return `--recursica_ui-kit_components_${escapeSegment(componentKebab)}_invalid-path`
  }

  // Normalize segments: replace dots/spaces with hyphens, lowercase
  const normalizedSegments = validSegments.map(segment =>
    segment.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  )

  // Build path: components.{component}.{path-segments}
  // Convert component name from PascalCase to kebab-case (e.g., 'MenuItem' -> 'menu-item')
  // Normalize display names that differ from recursica_ui-kit.json keys
  const componentNameMap: Record<string, string> = {
    'checkbox-group-item': 'checkbox-item',
    'radio-button-group-item': 'radio-button-item',
    'hover-card-/-popover': 'hover-card-popover',
  }
  let componentKebab = pascalToKebabCase(component)
  if (componentNameMap[componentKebab]) {
    componentKebab = componentNameMap[componentKebab]
  }
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
    const componentKebab = pascalToKebabCase(component)
    return `--recursica_ui-kit_components_${escapeSegment(componentKebab)}_invalid-property`
  }

  // Normalize 'color' (singular) to 'colors' (plural) for backward compatibility
  if (category === 'color' as any) {
    category = 'colors'
  }

  // Component-specific logic - this should be moved to component code
  // For now, we maintain backward compatibility by attempting to parse variants

  // Properties that are direct children of the component (not under a category)
  const componentLevelProperties = ['font-size', 'text-size', 'border-radius', 'max-width', 'elevation', 'label-switch-gap', 'thumb-height', 'thumb-width', 'thumb-border-radius', 'track-border-radius', 'thumb-icon-size', 'track-width', 'thumb-elevation', 'track-elevation', 'track-inner-padding', 'padding', 'border-size']

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
    // Match "{variantName}-{propertyName}" where propertyName is a known size property.
    // Anchor on known property names (sorted longest→shortest to avoid premature matches)
    // so custom variant names like 'newsize', 'medium', 'xlarge' are handled correctly.
    const knownSizeProps = [
      'icon-text-gap', 'horizontal-padding', 'vertical-padding',
      'min-width', 'max-width', 'min-height', 'max-height',
      'height', 'spacing', 'icon', 'size',
    ]
    for (const knownProp of knownSizeProps) {
      if (property === knownProp) {
        // Direct property without a variant prefix → component-level
        return buildComponentCssVarPath(component, 'properties', property)
      }
      if (property.endsWith('-' + knownProp)) {
        const variantName = property.slice(0, -(knownProp.length + 1))
        return buildComponentCssVarPath(component, 'variants', 'sizes', variantName, 'properties', knownProp)
      }
    }
    // Fallback: treat as component-level property
    return buildComponentCssVarPath(component, 'properties', property)
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
  const nestedVariantMatch = property.match(/^(text|icon)-(solid|outline|ghost)-(.+)$/)
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
  const pathSegments: string[] = [category]
  if (layer) pathSegments.push(layer)
  pathSegments.push(property)
  return buildComponentCssVarPath(component, ...pathSegments)
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
 * => '--recursica_ui-kit_themes_light_components_button_properties_elevation'
 * 
 * @example
 * getComponentLevelCssVar('Toast', 'text-size')
 * => '--recursica_ui-kit_themes_light_components_toast_properties_text-size'
 * 
 * @example
 * getComponentLevelCssVar('Chip', 'colors.error.text-color')
 * => '--recursica_ui-kit_themes_light_components_chip_properties_colors_error_text-color'
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
 * => '--recursica_ui-kit_themes_light_components_chip_variants_styles_unselected_properties_colors_layer-0_background'
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
 * => '--recursica_ui-kit_themes_light_components_button_variants_sizes_default_properties_height'
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
 * => '--recursica_ui-kit_themes_light_components_button_properties_text_font-size'
 * 
 * @example
 * getComponentTextCssVar('AccordionItem', 'header-text', 'font-weight')
 * => '--recursica_ui-kit_themes_light_components_accordion-item_properties_header-text_font-weight'
 * 
 * @example
 * getComponentTextCssVar('Avatar', 'text', 'font-size', 'small')
 * => '--recursica_ui-kit_themes_light_components_avatar_variants_sizes_small_properties_text_font-size'
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