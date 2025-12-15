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

      // Check if this is a "variant" node
      if (key === 'variant' && typeof value === 'object' && !('$value' in value)) {
        // This is a variant container - extract variant names
        const variantNames = Object.keys(value).filter(k => !k.startsWith('$'))
        if (variantNames.length > 0 && prefix.length > 0) {
          // The parent of "variant" is the prop name (e.g., "color", "size")
          // But we need to go up further to find the actual prop name (skip layer-X)
          let propName = prefix[prefix.length - 1]
          // If the parent is a layer (layer-0, layer-1, etc.), go up one more level
          if (propName.startsWith('layer-') && prefix.length > 1) {
            propName = prefix[prefix.length - 2]
          }
          
          // Only add variant if we haven't seen this propName before
          if (!seenVariants.has(propName)) {
            seenVariants.add(propName)
            variants.push({
              propName,
              variants: variantNames,
            })
          }
        }
        // Continue traversing into variants
        // Use propName (the actual variant prop like "color" or "size") instead of prefix[prefix.length - 1]
        // which would be the layer name for color properties
        let variantPropName = prefix[prefix.length - 1]
        if (variantPropName.startsWith('layer-') && prefix.length > 1) {
          variantPropName = prefix[prefix.length - 2]
        }
        traverse(value, currentPath, variantPropName)
        return
      }

      // Check if this is a value object with $type and $value
      if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
        const type = (value as any).$type
        const fullPath = ['components', componentKey, ...currentPath]
        const cssVar = toCssVarName(fullPath.join('.'))

        // Determine if this is variant-specific
        // A prop is variant-specific if "variant" appears in its path
        const isVariantSpecific = currentPath.includes('variant')
        const variantPropName = isVariantSpecific ? variantProp : undefined

        props.push({
          name: key,
          category: prefix[0] || 'root',
          type,
          cssVar,
          path: currentPath,
          isVariantSpecific,
          variantProp: variantPropName,
        })
      } else {
        // Continue traversing
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
  layer: string, // e.g., "layer-0"
  altLayer: string | null // e.g., "high-contrast" or null
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
    if (prop.category === 'color' && prop.path.includes('layer-')) {
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
