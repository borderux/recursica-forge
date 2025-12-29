/**
 * Utilities for parsing component structure from UIKit.json
 */

import uikitJson from '../../../vars/UIKit.json'
import { toCssVarName } from '../../../components/utils/cssVarNames'

export interface ComponentVariant {
  propName: string // e.g., "color", "size"
  variants: string[] // e.g., ["solid", "text", "outline"]
}

export interface ComponentProp {
  name: string // e.g., "font-size", "border-radius"
  category: string // e.g., "color", "size", or root level
  type: string // e.g., "color", "dimension", "number"
  cssVar: string
  path: string[] // Path in JSON structure
  isVariantSpecific: boolean // Whether this prop is under a variant
  variantProp?: string // If variant-specific, which variant prop (e.g., "color", "size")
  hoverProp?: ComponentProp // If there's a corresponding "-hover" prop, reference it here
  trackSelectedProp?: ComponentProp // For combined "track" prop, reference to track-selected
  trackUnselectedProp?: ComponentProp // For combined "track" prop, reference to track-unselected
  thumbProps?: Map<string, ComponentProp> // For combined "thumb" prop, map of all thumb-related props
  borderProps?: Map<string, ComponentProp> // For combined "border" prop, map of all border-related props
}

export interface ComponentStructure {
  variants: ComponentVariant[]
  props: ComponentProp[]
}

/**
 * Converts kebab-case to sentence case
 * e.g., "border-radius" -> "Border radius"
 */
export function toSentenceCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Parses a component's structure from UIKit.json
 */
export function parseComponentStructure(componentName: string): ComponentStructure {
  const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
  const uikitRoot: any = uikitJson
  const components = uikitRoot?.['ui-kit']?.components || {}
  const component = components[componentKey]

  if (!component) {
    return { variants: [], props: [] }
  }

  const variants: ComponentVariant[] = []
  const props: ComponentProp[] = []
  const seenVariants = new Set<string>()

  /**
   * Traverses the component structure to find variants and props
   */
  function traverse(obj: any, prefix: string[], variantProp?: string): void {
    if (obj == null || typeof obj !== 'object') return

    Object.entries(obj).forEach(([key, value]) => {
      if (key.startsWith('$')) return

      const currentPath = [...prefix, key]

      // Check if this is a "variants" node
      if (key === 'variants' && typeof value === 'object' && !('$value' in value)) {
        // This is a variant container - extract variant names
        const variantNames = Object.keys(value).filter(k => !k.startsWith('$'))
        if (variantNames.length > 0) {
          // NEW STRUCTURE: variants.text.variants.solid.colors.layer-0.background (nested - Avatar)
          // NEW STRUCTURE: variants.solid.colors.layer-0.background (single - Button/Switch)
          // OLD STRUCTURE: colors.layer-0.variants.text.variants.solid.background
          // Check if this is a nested variant (variants inside variants)
          const variantCount = currentPath.filter(p => p === 'variants').length
          const isNestedVariant = variantCount > 1
          
          // In new structure, variants are at the top level OR under a category (like size.variants)
          // For nested variants (Avatar): First level (text, icon, image) -> "style", Second level (solid, ghost) -> "style-secondary"
          // For single variants (Button/Switch): variants name -> "color" (or component-specific name)
          // For size variants: size.variants -> "size"
          let finalPropName: string
          
          // Check if parent is a category name (like "size")
          if (prefix.length > 0) {
            const parentName = prefix[prefix.length - 1]
            if (parentName === 'size') {
              // This is a size variant (e.g., size.variants.small)
              finalPropName = 'size'
            } else if (isNestedVariant) {
              // This is a nested variant (e.g., variants.text.variants.solid)
              finalPropName = 'style-secondary'
            } else {
              // This is a color variant at root level (e.g., variants.solid)
              if (componentKey === 'avatar') {
                finalPropName = 'style'
              } else {
                finalPropName = 'color'
              }
            }
          } else {
            // Root level variant (new structure)
            if (isNestedVariant) {
              finalPropName = 'style-secondary'
            } else {
              if (componentKey === 'avatar') {
                finalPropName = 'style'
              } else {
                finalPropName = 'color'
              }
            }
          }
          
          // Only add variant if we haven't seen this finalPropName before
          if (!seenVariants.has(finalPropName)) {
            seenVariants.add(finalPropName)
            variants.push({
              propName: finalPropName,
              variants: variantNames,
            })
          }
        }
        // Continue traversing into variants
        // In new structure, variantProp depends on component, nesting level, and parent category
        let variantPropName = variantProp
        if (!variantPropName) {
          // Check if parent is a category name (like "size")
          if (prefix.length > 0) {
            const parentName = prefix[prefix.length - 1]
            if (parentName === 'size') {
              variantPropName = 'size'
            } else {
              const variantCount = currentPath.filter(p => p === 'variants').length
              if (variantCount > 1) {
                // Nested variant (Avatar only)
                variantPropName = 'style-secondary'
              } else {
                // Single-level variant
                if (componentKey === 'avatar') {
                  variantPropName = 'style'
                } else {
                  // Button, Switch, etc.
                  variantPropName = 'color'
                }
              }
            }
          } else {
            const variantCount = currentPath.filter(p => p === 'variants').length
            if (variantCount > 1) {
              // Nested variant (Avatar only)
              variantPropName = 'style-secondary'
            } else {
              // Single-level variant
              if (componentKey === 'avatar') {
                variantPropName = 'style'
              } else {
                // Button, Switch, etc.
                variantPropName = 'color'
              }
            }
          }
        }
        traverse(value, currentPath, variantPropName)
        return
      }

      // Check if this is a value object with $type and $value
      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        // Skip if this is a variant value (e.g., "small", "default", "large" inside size.variants)
        // Variant values should not be treated as props - they're the variant options themselves
        // Check if the immediate parent in the path is "variants"
        const isDirectVariantValue = prefix.length > 0 && prefix[prefix.length - 1] === 'variants'
        
        if (isDirectVariantValue) {
          // This is a variant value (like size.variants.small, or variants.solid)
          // In NEW STRUCTURE: variants.solid is an object containing colors, not a value
          // In OLD STRUCTURE: size.variants.small could be a direct dimension value
          // Check if this is actually a value (has $type and $value) or an object to traverse
          // If it's a value, it's a variant option itself (like size variants)
          // If it's an object, continue traversing (like color variants in new structure)
          if ('$type' in value && '$value' in value) {
            // This is a direct variant value (e.g., size.variants.small = dimension value)
            // Don't add as prop, but continue traversing in case there are nested properties
            traverse(value, currentPath, variantProp)
            return
          }
        }
        
        const type = (value as any).$type
        const fullPath = ['components', componentKey, ...currentPath]
        const cssVar = toCssVarName(fullPath.join('.'))
        
        // Determine if this is variant-specific
        // A prop is variant-specific if "variants" appears in its path
        const isVariantSpecific = currentPath.includes('variants')
        
        // In new structure, variantProp is already set correctly (style or style-secondary or color)
        let variantPropName: string | undefined = undefined
        if (isVariantSpecific && variantProp) {
          variantPropName = variantProp
        }
        
        // Determine category - in new structure, "colors" is inside variants
        // Path: ['variants', 'text', 'variants', 'solid', 'colors', 'layer-0', 'background']
        // Category should be "colors" if it appears in the path, otherwise use prefix[0]
        let category = prefix[0] || 'root'
        if (currentPath.includes('colors')) {
          category = 'colors'
        } else if (currentPath.includes('size')) {
          category = 'size'
        }
        
        props.push({
          name: key,
          category,
          type,
          cssVar,
          path: currentPath,
          isVariantSpecific,
          variantProp: variantPropName,
        })
      } else {
        // Continue traversing - this is an object (not a value)
        // In new structure, variant values like "solid" are objects containing "color"
        traverse(value, currentPath, variantProp)
      }
    })
  }

  traverse(component, [])

  return { variants, props }
}

/**
 * Gets all CSS variables for a component that match the selected variants and layer
 */
export function getComponentCssVarsForVariants(
  componentName: string,
  selectedVariants: Record<string, string>, // e.g., { color: "solid", size: "default" }
  layer: string // e.g., "layer-0"
): Array<{ cssVar: string; value: string; type: string; prop: ComponentProp }> {
  const structure = parseComponentStructure(componentName)
  const vars: Array<{ cssVar: string; value: string; type: string; prop: ComponentProp }> = []
  const { readCssVar } = require('../../core/css/readCssVar')

  structure.props.forEach(prop => {
    // Skip variant-specific props that don't match selected variants
    if (prop.isVariantSpecific && prop.variantProp) {
      const selectedVariant = selectedVariants[prop.variantProp]
      if (!selectedVariant) return

      // Check if this prop belongs to the selected variant
      // The path should include the variant name
      const variantInPath = prop.path.find(p => p === selectedVariant)
      if (!variantInPath) return
    }

    // For color props, check if layer matches
    // NEW STRUCTURE: variants.text.variants.solid.colors.layer-0.background
    // Layer comes after "colors" in the path
    if (prop.category === 'colors' && prop.path.includes('layer-')) {
      const layerIndex = prop.path.findIndex(p => p.startsWith('layer-'))
      if (layerIndex >= 0) {
        const propLayer = prop.path[layerIndex]
        if (propLayer !== layer) return
      }
    }

    const value = readCssVar(prop.cssVar)
    if (value !== undefined) {
      vars.push({
        cssVar: prop.cssVar,
        value,
        type: prop.type,
        prop,
      })
    }
  })

  return vars
}

/**
 * Gets the default values from UIKit.json for reset functionality
 */
export function getComponentDefaultValues(componentName: string): Record<string, string> {
  const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
  const uikitRoot: any = uikitJson
  const components = uikitRoot?.['ui-kit']?.components || {}
  const component = components[componentKey]

  if (!component) return {}

  const defaults: Record<string, string> = {}

  function traverse(obj: any, prefix: string[]): void {
    if (obj == null || typeof obj !== 'object') return

    Object.entries(obj).forEach(([key, value]) => {
      if (key.startsWith('$')) return

      const currentPath = [...prefix, key]

      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const fullPath = ['components', componentKey, ...currentPath]
        const cssVar = toCssVarName(fullPath.join('.'))
        const rawValue = (value as any).$value

        // Extract the actual value (could be a token reference)
        let extractedValue: any = rawValue
        if ((value as any).$type === 'dimension' && rawValue && typeof rawValue === 'object' && 'value' in rawValue) {
          extractedValue = rawValue.value
        }

        // Store the original JSON value (which may be a token reference)
        defaults[cssVar] = typeof extractedValue === 'string' && extractedValue.startsWith('{')
          ? extractedValue
          : JSON.stringify(extractedValue)
      } else {
        traverse(value, currentPath)
      }
    })
  }

  traverse(component, [])

  return defaults
}
