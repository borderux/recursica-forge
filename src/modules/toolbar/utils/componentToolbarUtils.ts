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

      // Check if this is a "properties" node at component level (for Switch which has properties.colors)
      if (key === 'properties' && typeof value === 'object' && value !== null && !('$value' in value)) {
        // For Switch: properties.colors is at component level (not under variants)
        // Continue traversing into properties
        traverse(value, currentPath, variantProp)
        return
      }

      // Check if this key is a category container (styles, sizes, layouts, orientation, fill-width, types, states) when traversing nested variants
      // This handles cases like variants.layouts.stacked.variants.sizes where we traverse directly into the nested variants object
      const isCategoryContainer = (key === 'styles' || key === 'sizes' || key === 'layouts' || key === 'orientation' || key === 'fill-width' || key === 'types' || key === 'states') && 
                                   typeof value === 'object' && 
                                   value !== null &&
                                   !('$value' in value) &&
                                   variantProp !== undefined // Only check this when we're inside a variant
      
      if (isCategoryContainer) {
        // This is a category container inside nested variants (e.g., sizes inside layouts.stacked.variants)
        const categoryKey = key
        const categoryObj = value
        const variantNames = Object.keys(categoryObj).filter(k => !k.startsWith('$'))
        
        if (variantNames.length > 0) {
            const finalPropName = categoryKey === 'styles' ? 'style' 
              : categoryKey === 'sizes' ? 'size' 
              : categoryKey === 'layouts' ? 'layout'
              : categoryKey === 'orientation' ? 'orientation'
              : categoryKey === 'fill-width' ? 'fill-width'
              : categoryKey === 'types' ? 'types'
              : categoryKey === 'states' ? 'states'
              : categoryKey
            const isNestedSize = finalPropName === 'size' && variantProp === 'layout'
          const shouldAdd = isNestedSize || !seenVariants.has(finalPropName)
          
          if (shouldAdd) {
            if (!isNestedSize) {
              seenVariants.add(finalPropName)
            }
            
            const existingVariant = variants.find(v => v.propName === finalPropName)
            if (existingVariant) {
              const mergedVariants = Array.from(new Set([...existingVariant.variants, ...variantNames]))
              existingVariant.variants = mergedVariants
            } else {
              variants.push({
                propName: finalPropName,
                variants: variantNames,
              })
            }
          }
        }
        
        // Continue traversing into the category container
        const variantPropName = categoryKey === 'styles' ? 'style' 
          : categoryKey === 'sizes' ? 'size' 
          : categoryKey === 'layouts' ? 'layout'
          : categoryKey === 'orientation' ? 'orientation'
          : categoryKey === 'fill-width' ? 'fill-width'
          : categoryKey === 'types' ? 'types'
          : categoryKey === 'states' ? 'states'
          : categoryKey
        traverse(categoryObj, currentPath, variantPropName)
        return
      }

      // Check if this is a "variants" node
      if (key === 'variants' && typeof value === 'object' && value !== null && !('$value' in value)) {
        // Check if this variants object contains category containers (styles, sizes, layouts, types, states)
        // NEW STRUCTURE: variants.styles.solid or variants.sizes.default or variants.layouts.stacked-left or variants.types.help or variants.states.default
        // Also handles nested: variants.layouts.side-by-side.variants.sizes.default
        const categoryKeys = Object.keys(value).filter(k => !k.startsWith('$') && (k === 'styles' || k === 'sizes' || k === 'layouts' || k === 'types' || k === 'states'))
        
        if (categoryKeys.length > 0) {
          // NEW STRUCTURE: variants.styles, variants.sizes, and variants.layouts are category containers
          // Extract variants from each category, not the category names themselves
          categoryKeys.forEach(categoryKey => {
            const categoryObj = (value as any)[categoryKey]
            if (categoryObj && typeof categoryObj === 'object' && !('$value' in categoryObj)) {
              // Extract variant names from inside this category (e.g., "solid", "text", "outline" from styles)
              const variantNames = Object.keys(categoryObj).filter(k => !k.startsWith('$'))
              
              if (variantNames.length > 0) {
                // Determine prop name based on category
                const finalPropName = categoryKey === 'styles' ? 'style' 
                  : categoryKey === 'sizes' ? 'size' 
                  : categoryKey === 'layouts' ? 'layout'
                  : categoryKey === 'orientation' ? 'orientation'
                  : categoryKey === 'fill-width' ? 'fill-width'
                  : categoryKey === 'types' ? 'types'
                  : categoryKey === 'states' ? 'states'
                  : categoryKey
                
                // For nested variants (e.g., size inside layout), check if we should add it
                // If we're already inside a layout variant, and this is a size category, add it
                // Otherwise, only add if we haven't seen this finalPropName before
                const isNestedSize = finalPropName === 'size' && variantProp === 'layout'
                const shouldAdd = isNestedSize || !seenVariants.has(finalPropName)
                
                if (shouldAdd) {
                  // For nested size variants, don't add to seenVariants so we can merge from multiple layouts
                  if (!isNestedSize) {
                    seenVariants.add(finalPropName)
                  }
                  
                  // Check if we already have a variant entry for this propName (for nested variants)
                  const existingVariant = variants.find(v => v.propName === finalPropName)
                  if (existingVariant) {
                    // Merge variant names, keeping unique values
                    const mergedVariants = Array.from(new Set([...existingVariant.variants, ...variantNames]))
                    existingVariant.variants = mergedVariants
                  } else {
                    variants.push({
                      propName: finalPropName,
                      variants: variantNames,
                    })
                  }
                }
              }
            }
          })
          
          // Continue traversing with appropriate variant prop names
          categoryKeys.forEach(categoryKey => {
            const categoryObj = (value as any)[categoryKey]
            const variantPropName = categoryKey === 'styles' ? 'style' 
              : categoryKey === 'sizes' ? 'size' 
              : categoryKey === 'layouts' ? 'layout'
              : categoryKey === 'types' ? 'types'
              : categoryKey === 'states' ? 'states'
              : categoryKey
            if (categoryObj && typeof categoryObj === 'object') {
              // Traverse each variant within the category
              Object.keys(categoryObj).forEach(variantKey => {
                if (variantKey.startsWith('$')) return
                const variantObj = (categoryObj as any)[variantKey]
                if (variantObj && typeof variantObj === 'object') {
                  // Check if variant has nested "variants" key first (for nested variant structures)
                  if ('variants' in variantObj && typeof variantObj.variants === 'object') {
                    // Nested variants: variants.layouts.side-by-side.variants.sizes
                    // OR: variants.styles.text.variants.solid (Avatar case)
                    const nestedVariantsPath = [...currentPath, categoryKey, variantKey, 'variants']
                    const nestedVariantsObj = variantObj.variants
                    
                    // Check if nested variants contain category containers (sizes, layouts, styles)
                    const nestedCategoryKeys = Object.keys(nestedVariantsObj).filter(k => !k.startsWith('$') && (k === 'styles' || k === 'sizes' || k === 'layouts'))
                    
                    if (nestedCategoryKeys.length > 0) {
                      // Nested variants with category containers: variants.layouts.side-by-side.variants.sizes
                      traverse(nestedVariantsObj, nestedVariantsPath, variantPropName)
                    } else {
                      // Nested variants without category containers: variants.styles.text.variants.solid (Avatar)
                      // Extract variant names directly (solid, text)
                      const nestedVariantNames = Object.keys(nestedVariantsObj).filter(k => !k.startsWith('$'))
                      
                      if (nestedVariantNames.length > 0) {
                        // This is a nested variant structure like Avatar's style-secondary
                        const nestedVariantPropName = 'style-secondary'
                        
                        // Check if we already have this variant prop
                        const existingNestedVariant = variants.find(v => v.propName === nestedVariantPropName)
                        if (existingNestedVariant) {
                          // Merge variant names, keeping unique values
                          const mergedVariants = Array.from(new Set([...existingNestedVariant.variants, ...nestedVariantNames]))
                          existingNestedVariant.variants = mergedVariants
                        } else {
                          variants.push({
                            propName: nestedVariantPropName,
                            variants: nestedVariantNames,
                          })
                          seenVariants.add(nestedVariantPropName)
                        }
                      }
                      
                      // Continue traversing into the nested variants to extract props
                      traverse(nestedVariantsObj, nestedVariantsPath, 'style-secondary')
                    }
                    
                    // Also traverse any properties if they exist
                    if ('properties' in variantObj && typeof variantObj.properties === 'object') {
                      traverse(variantObj.properties, [...currentPath, categoryKey, variantKey, 'properties'], variantPropName)
                    }
                  } else if ('properties' in variantObj && typeof variantObj.properties === 'object') {
                    // New structure: variants.styles.solid.properties.colors...
                    traverse(variantObj.properties, [...currentPath, categoryKey, variantKey, 'properties'], variantPropName)
                  } else {
                    // Old structure or nested variants: traverse directly
                    traverse(variantObj, [...currentPath, categoryKey, variantKey], variantPropName)
                  }
                }
              })
            }
          })
          
          // Also traverse any other keys that aren't styles/sizes/layouts (for backward compatibility)
          const otherKeys = Object.keys(value).filter(k => !k.startsWith('$') && k !== 'styles' && k !== 'sizes' && k !== 'layouts')
          otherKeys.forEach(otherKey => {
            const otherObj = (value as any)[otherKey]
            if (otherObj && typeof otherObj === 'object') {
              // For backward compatibility, treat direct variants as style variants
              const variantPropName = variantProp || 'style'
              traverse(otherObj, [...currentPath, otherKey], variantPropName)
            }
          })
          return // Early return to avoid processing as old structure
        } else {
          // OLD STRUCTURE or direct variants (no styles/sizes categories)
          // This handles cases like variants.solid or variants.text.variants.solid (Avatar)
        const variantNames = Object.keys(value).filter(k => !k.startsWith('$'))
        if (variantNames.length > 0) {
          // Check if this is a nested variant (variants inside variants)
          const variantCount = currentPath.filter(p => p === 'variants').length
          const isNestedVariant = variantCount > 1
          
            // Determine prop name
          let finalPropName: string
          if (prefix.length > 0) {
            const parentName = prefix[prefix.length - 1]
            if (parentName === 'size') {
              finalPropName = 'size'
            } else if (isNestedVariant) {
              finalPropName = 'style-secondary'
            } else {
              if (componentKey === 'avatar') {
                finalPropName = 'style'
              } else {
                finalPropName = 'color'
              }
            }
          } else {
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
        let variantPropName = variantProp
        if (!variantPropName) {
          if (prefix.length > 0) {
            const parentName = prefix[prefix.length - 1]
            if (parentName === 'size') {
              variantPropName = 'size'
            } else {
              const variantCount = currentPath.filter(p => p === 'variants').length
              if (variantCount > 1) {
                variantPropName = 'style-secondary'
              } else {
                if (componentKey === 'avatar') {
                  variantPropName = 'style'
                } else {
                  variantPropName = 'color'
                }
              }
            }
          } else {
            const variantCount = currentPath.filter(p => p === 'variants').length
            if (variantCount > 1) {
              variantPropName = 'style-secondary'
            } else {
              if (componentKey === 'avatar') {
                variantPropName = 'style'
              } else {
                variantPropName = 'color'
              }
            }
          }
        }
        traverse(value, currentPath, variantPropName)
        }
        return // Early return after handling variants
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
        // Read mode from document to generate mode-specific CSS var names
        const mode = typeof document !== 'undefined' 
          ? (document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null) ?? 'light'
          : 'light'
        const cssVar = toCssVarName(fullPath.join('.'), mode)
        
        // Determine if this is variant-specific
        // A prop is variant-specific if "variants" appears in its path
        const isVariantSpecific = currentPath.includes('variants')
        
        // In new structure, variantProp is already set correctly (style or style-secondary or color)
        let variantPropName: string | undefined = undefined
        if (isVariantSpecific && variantProp) {
          variantPropName = variantProp
        }
        
        // Determine category - in new structure, "colors" can be:
        // 1. Inside variants.properties: ['variants', 'styles', 'solid', 'properties', 'colors', 'layer-0', 'background']
        // 2. Inside component properties: ['properties', 'colors', 'layer-0', 'thumb-selected'] (Switch)
        // 3. Size properties: ['variants', 'sizes', 'default', 'properties', 'height'] or ['properties', 'border-radius']
        let category = prefix[0] || 'root'
        if (currentPath.includes('colors')) {
          category = 'colors'
        } else if (currentPath.includes('size') || currentPath.includes('sizes')) {
          category = 'size'
        } else if (prefix.includes('properties') && !currentPath.includes('colors')) {
          // Component-level properties (not colors) - default to size category
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
        
        // Special case: Check if this is a text property group (text, header-text, content-text, label-text, optional-text, supporting-text, min-max-label, read-only-value, value, placeholder)
        // Text property groups are objects containing text-related properties (font-family, font-size, etc.)
        // We need to create a prop for the parent group so it shows up in the toolbar
        const textPropertyGroupNames = ['text', 'header-text', 'content-text', 'label-text', 'optional-text', 'supporting-text', 'min-max-label', 'read-only-value', 'value', 'placeholder']
        const isTextPropertyGroup = textPropertyGroupNames.includes(key.toLowerCase()) && 
                                     typeof value === 'object' && 
                                     value !== null &&
                                     !('$type' in value) &&
                                     prefix.includes('properties')
        
        if (isTextPropertyGroup) {
          // Check if this object contains text-related properties
          const textPropertyNames = ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-decoration', 'text-transform', 'font-style']
          const hasTextProperties = textPropertyNames.some(textPropName => 
            (value as any)[textPropName] !== undefined
          )
          
          if (hasTextProperties) {
            // Create a prop for the text property group itself
            // Use a special type 'text-group' to identify it
            const fullPath = ['components', componentKey, ...currentPath]
            // Read mode from document to generate mode-specific CSS var names
            const mode = typeof document !== 'undefined' 
              ? (document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null) ?? 'light'
              : 'light'
            const cssVar = toCssVarName(fullPath.join('.'), mode)
            
            props.push({
              name: key,
              category: 'size', // Text properties are component-level, use 'size' category
              type: 'text-group', // Special type to identify text property groups
              cssVar, // This will be the base CSS var path, individual properties will have their own vars
              path: currentPath,
              isVariantSpecific: false,
              variantProp: undefined,
            })
          }
        }
        
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
        // Read mode from document to generate mode-specific CSS var names
        const mode = typeof document !== 'undefined' 
          ? (document.documentElement.getAttribute('data-theme-mode') as 'light' | 'dark' | null) ?? 'light'
          : 'light'
        const cssVar = toCssVarName(fullPath.join('.'), mode)
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
