/**
 * Randomize Variables Utility
 * 
 * Development-only utility to randomly modify all user-modifiable variables
 * for thorough testing of exports and validation.
 */

import { getVarsStore } from '../store/varsStore'
import type { JsonLike } from '../resolvers/tokens'
import type { RandomizeOptions } from './RandomizeOptionsModal'

/**
 * Recursively finds all $value properties in an object
 * Also finds nested value properties in dimension objects
 */
function findAllValuePaths(
  obj: any,
  prefix: string[] = [],
  paths: Array<{ path: string[]; value: any; parent: any; key: string; isDimension?: boolean }> = []
): Array<{ path: string[]; value: any; parent: any; key: string; isDimension?: boolean }> {
  if (obj == null || typeof obj !== 'object') return paths
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findAllValuePaths(item, [...prefix, String(index)], paths)
    })
    return paths
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip metadata keys
    if (key.startsWith('$')) {
      if (key === '$value') {
        // Check if this is a dimension object (has nested value and unit)
        const isDimension = value && typeof value === 'object' && 'value' in value && 'unit' in value
        if (isDimension) {
          // Add path to the nested value property
          paths.push({ path: [...prefix, '$value', 'value'], value: value.value, parent: value, key: 'value', isDimension: true })
        } else {
          paths.push({ path: prefix, value, parent: obj, key })
        }
      }
      return
    }
    
    if (value && typeof value === 'object') {
      findAllValuePaths(value, [...prefix, key], paths)
    }
  })
  
  return paths
}

/**
 * Gets a value at a given path in an object
 */
function getValueAtPath(obj: any, path: string[]): any {
  let current = obj
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[key]
  }
  return current
}

/**
 * Modifies a value at a given path in an object
 */
function modifyValueAtPath(obj: any, path: string[], newValue: any): void {
  let current = obj
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      // Last key - modify the value
      if (current[key] && typeof current[key] === 'object' && '$value' in current[key]) {
        current[key].$value = newValue
      } else if (current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])) {
        if ('$value' in current[key]) {
          current[key].$value = newValue
        } else {
          current[key] = { $value: newValue }
        }
      } else {
        current[key] = newValue
      }
      return
    }
    
    // Navigate deeper
    if (current[key] == null) {
      current[key] = {}
    }
    current = current[key]
  }
}

/**
 * List of fonts to randomly choose from for font family randomization
 */
const RANDOM_FONTS = [
  'Playwrite GB J Guides',
  'Roboto Mono',
  'Bitcount Single',
  'Special Gothic Expanded One',
  'Playfair Display'
]

/**
 * Generates a random valid value based on the original value type and context
 */
function generateRandomValue(originalValue: any, index: number, context: { isColor?: boolean; isSize?: boolean; isOpacity?: boolean; isLetterSpacing?: boolean; maxSize?: number; isFontFamily?: boolean } = {}): any {
  if (typeof originalValue === 'string') {
    // For color hex values
    if (/^#[0-9a-fA-F]{6}$/.test(originalValue)) {
      // Generate random valid hex color
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
    }
    // For token references, keep them but potentially change the referenced token
    if (originalValue.startsWith('{') && originalValue.endsWith('}')) {
      // Keep references as-is to maintain validity
      return originalValue
    }
    // For size strings like "16px", generate random size
    if (context.isSize && /^\d+(\.\d+)?px$/.test(originalValue)) {
      const num = Math.floor(Math.random() * 100) + 8 // 8-108px
      return `${num}px`
    }
    // For other strings, keep as-is or modify slightly
    return originalValue
  }
  
  if (typeof originalValue === 'number') {
    // For opacity (0-1)
    if (context.isOpacity) {
      return Math.round(Math.random() * 100) / 100 // 0.00 to 1.00
    }
    // For letter spacing (can be negative)
    if (context.isLetterSpacing) {
      // Generate random letter spacing between -0.1 and 0.5
      return Math.round((Math.random() * 0.6 - 0.1) * 100) / 100
    }
    // For dimension values (font sizes, sizes) - positive numbers
    if (context.isSize) {
      // Generate random size between 4 and maxSize (or 100 if not specified)
      const max = context.maxSize ?? 100
      const min = 4
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
    // For other numbers, modify within reasonable range
    const variation = originalValue * 0.2 // 20% variation
    return Math.max(0, originalValue + (Math.random() - 0.5) * variation * 2)
  }
  
  if (typeof originalValue === 'boolean') {
    return Math.random() > 0.5
  }
  
  // For font family arrays (e.g., ["Lexend", "sans-serif"])
  if (context.isFontFamily && Array.isArray(originalValue) && originalValue.length > 0 && typeof originalValue[0] === 'string') {
    // Remove existing fonts and randomly select two new fonts from the list
    const shuffled = [...RANDOM_FONTS].sort(() => Math.random() - 0.5)
    const selectedFonts = shuffled.slice(0, 2)
    // Return only the two newly selected fonts (replacing all existing fonts)
    return selectedFonts
  }
  
  return originalValue
}

/**
 * Randomizes user-modifiable variables in the app based on options
 */
export function randomizeAllVariables(options?: RandomizeOptions): void {
  // Default to all selected if no options provided
  const opts: RandomizeOptions = options || {
    tokens: {
      colors: true,
      sizes: true,
      opacities: true,
      fontSizes: true,
      fontWeights: true,
      letterSpacing: true,
      lineHeights: true,
      fontFamilies: true,
    },
    theme: {
      palettes: true,
      dimensions: true,
      layers: true,
    },
    uikit: {
      components: true,
    },
  }
  if (process.env.NODE_ENV !== 'development') {
    console.warn('randomizeAllVariables can only be called in development mode')
    return
  }
  
  const store = getVarsStore()
  const state = store.getState()
  
  // Get initial state
  const initialTokens = JSON.parse(JSON.stringify(state.tokens)) as JsonLike
  const initialTheme = JSON.parse(JSON.stringify(state.theme)) as JsonLike
  const initialUiKit = JSON.parse(JSON.stringify(state.uikit)) as JsonLike
  
  // Find all modifiable values
  const shouldRandomizeTokens = Object.values(opts.tokens).some(v => v === true)
  const shouldRandomizeTheme = Object.values(opts.theme).some(v => v === true)
  const shouldRandomizeUIKit = Object.values(opts.uikit).some(v => v === true)
  
  const tokenValuePaths = shouldRandomizeTokens ? findAllValuePaths(initialTokens) : []
  const themeValuePaths = shouldRandomizeTheme ? findAllValuePaths(initialTheme) : []
  const uikitValuePaths = shouldRandomizeUIKit ? findAllValuePaths(initialUiKit) : []
  
  console.log(`[Dev] Randomizing ${tokenValuePaths.length} token values, ${themeValuePaths.length} theme values, ${uikitValuePaths.length} uikit values`)
  
  // Modify tokens - handle dimension objects and regular values separately
  const modifiedTokens = JSON.parse(JSON.stringify(initialTokens)) as JsonLike
  
  // First, handle dimension objects by modifying the JSON directly
  if (shouldRandomizeTokens) {
    tokenValuePaths.forEach(({ path, value, isDimension }, index) => {
      if (!isDimension) return
      
      // Skip if it's a token reference
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return
      }
      
      // Handle dimension objects (font sizes, sizes) - modify nested value directly
      // Path is like: ['tokens', 'font', 'sizes', '2xs', '$value', 'value']
      const tokenPath = path.slice(1) // Skip 'tokens' prefix
      
      // Check if this category should be randomized
      const category = tokenPath[0]
      const isFontSize = category === 'font' && tokenPath[1] === 'sizes'
      const isSize = category === 'size' || category === 'sizes'
      const shouldRandomize = 
        (isSize && opts.tokens.sizes) ||
        (isFontSize && opts.tokens.fontSizes)
      
      if (!shouldRandomize) {
        return
      }
      
      // Check if this is the 6x size token - cap it at 100
      const is6xSize = isSize && tokenPath.length >= 2 && tokenPath[1] === '6x'
      const newValue = generateRandomValue(value, index, { isSize: true, maxSize: is6xSize ? 100 : undefined })
      modifyValueAtPath(modifiedTokens, path, newValue)
    })
    
    // Update tokens with modified dimension values if any were modified
    if (opts.tokens.sizes || opts.tokens.fontSizes) {
      store.setTokens(modifiedTokens)
    }
    
    // Then handle regular token values using updateToken (which handles CSS vars)
    tokenValuePaths.forEach(({ path, value, isDimension }, index) => {
    if (isDimension) return // Skip dimension objects, already handled
    
    // Skip if it's a token reference
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      return
    }
    // Skip if it's not a direct $value
    if (value && typeof value === 'object' && !Array.isArray(value) && !('$value' in value)) {
      return
    }
    
      // Build token name from path
      const tokenPath = path.slice(1) // Skip 'tokens' prefix
      // Filter out '$value' from the path
      const filteredPath = tokenPath.filter(p => p !== '$value')
      if (filteredPath.length >= 2) {
        const category = filteredPath[0]
        
        // Check if this category should be randomized
        const shouldRandomize = 
          (category === 'colors' || category === 'color') && opts.tokens.colors ||
          (category === 'size' || category === 'sizes') && opts.tokens.sizes ||
          (category === 'opacity' || category === 'opacities') && opts.tokens.opacities ||
          (category === 'font' && filteredPath[1] === 'sizes') && opts.tokens.fontSizes ||
          (category === 'font' && filteredPath[1] === 'weights') && opts.tokens.fontWeights ||
          (category === 'font' && filteredPath[1] === 'letter-spacings') && opts.tokens.letterSpacing ||
          (category === 'font' && filteredPath[1] === 'line-heights') && opts.tokens.lineHeights ||
          (category === 'font' && filteredPath[1] === 'typefaces') && opts.tokens.fontFamilies
        
        if (!shouldRandomize) {
          return
        }
        
        // Build token name - use singular 'opacity' for updateToken compatibility
        const tokenNameParts = [...filteredPath]
        if (tokenNameParts[0] === 'opacities') {
          tokenNameParts[0] = 'opacity' // Convert plural to singular for updateToken
        }
        const tokenName = tokenNameParts.join('/')
        
        const isColor = category === 'colors' || category === 'color'
        const isSize = category === 'size' || category === 'sizes'
        const isOpacity = category === 'opacity' || category === 'opacities'
        const isLetterSpacing = category === 'font' && filteredPath[1] === 'letter-spacings'
        const isFontFamily = category === 'font' && filteredPath[1] === 'typefaces' && Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
        
        const newValue = generateRandomValue(value, index, { isColor, isSize, isOpacity, isLetterSpacing, isFontFamily })
        try {
          store.updateToken(tokenName, newValue)
        } catch (e) {
          // Skip tokens that can't be updated
        }
      }
    })
  }
  
  // Modify theme/brand - directly modify JSON structure
  const modifiedTheme = JSON.parse(JSON.stringify(initialTheme)) as JsonLike
  if (shouldRandomizeTheme) {
    themeValuePaths.forEach(({ path, value, isDimension }, index) => {
    // Skip token references
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      return
    }
    // Skip typography $value objects
    if (value && typeof value === 'object' && '$type' in value && value.$type === 'typography') {
      return
    }
    // Skip if parent has $type typography
    const parent = path.length > 0 ? getValueAtPath(modifiedTheme, path.slice(0, -1)) : null
    if (parent && typeof parent === 'object' && '$type' in parent && parent.$type === 'typography') {
      return
    }
    
      // Skip dimension objects in layer properties (border-thickness, etc.) - these should be token references
      // Check if path ends with ['$value', 'value'] which indicates we're inside a dimension object
      const pathStr = path.join('.')
      const isLayerProperty = /layer.*\.properties/.test(pathStr) || (pathStr.includes('layer-') && pathStr.includes('properties'))
      const isInsideDimensionValue = path.length >= 2 && path[path.length - 2] === '$value' && path[path.length - 1] === 'value'
      if (isLayerProperty && (isDimension || isInsideDimensionValue)) {
        return
      }
      
      // Check if this category should be randomized
      const shouldRandomize = 
        (pathStr.includes('palettes') || pathStr.includes('color')) && opts.theme.palettes ||
        (pathStr.includes('dimensions') || pathStr.includes('size')) && opts.theme.dimensions ||
        (pathStr.includes('layer') && !pathStr.includes('layer-0')) && opts.theme.layers
      
      if (!shouldRandomize) {
        return
      }
      
      const isColor = pathStr.includes('palettes') || pathStr.includes('color')
      const isSize = pathStr.includes('dimensions') || pathStr.includes('size')
      const isFontFamily = (pathStr.includes('typefaces') || pathStr.includes('font-family')) && Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
      
      const newValue = generateRandomValue(value, index, { isColor, isSize, isFontFamily })
      modifyValueAtPath(modifiedTheme, path, newValue)
    })
    
    // Update store with modified theme
    store.setTheme(modifiedTheme)
  }
  
  // Modify UIKit - directly modify JSON structure
  const modifiedUiKit = JSON.parse(JSON.stringify(initialUiKit)) as JsonLike
  if (shouldRandomizeUIKit && opts.uikit.components) {
    uikitValuePaths.forEach(({ path, value }, index) => {
    // Skip token/brand references
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      return
    }
    // Skip typography $value objects
    if (value && typeof value === 'object' && '$type' in value && value.$type === 'typography') {
      return
    }
    // Skip if parent has $type typography
    const parent = path.length > 0 ? getValueAtPath(modifiedUiKit, path.slice(0, -1)) : null
    if (parent && typeof parent === 'object' && '$type' in parent && parent.$type === 'typography') {
      return
    }
    
    const pathStr = path.join('.')
    const isColor = pathStr.includes('color') || pathStr.includes('background')
    const isSize = pathStr.includes('size') || pathStr.includes('height') || pathStr.includes('width') || pathStr.includes('padding')
    const isFontFamily = (pathStr.includes('typefaces') || pathStr.includes('font-family')) && Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
    
      const newValue = generateRandomValue(value, index, { isColor, isSize, isFontFamily })
      modifyValueAtPath(modifiedUiKit, path, newValue)
    })
    
    // Update store with modified uikit
    store.setUiKit(modifiedUiKit)
  }
  
  // Trigger recomputation to update CSS variables
  // This will rebuild typography variables and dispatch cssVarsUpdated event
  store.recomputeAndApplyAll()
  
  // Ensure type samples update by dispatching an additional event after a short delay
  // This handles cases where typography CSS variables reference token variables
  // and need time to propagate through the CSS cascade
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [] } // Empty array means all CSS vars may have changed
    }))
  }, 150)
  
  console.log('[Dev] Variables randomized successfully')
}
