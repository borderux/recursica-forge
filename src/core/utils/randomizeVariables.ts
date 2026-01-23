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
          // Add this $value path
          paths.push({ path: prefix, value, parent: obj, key })
          // If $value is an object, continue recursing into it to find nested $value properties
          // This is needed for structures like core-colors.$value.interactive.default.tone.$value
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            findAllValuePaths(value, [...prefix, '$value'], paths)
          }
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
      // If the current key points to an object with $value, update $value
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
 * Generates a random valid value based on the original value type and context
 */
function generateRandomValue(originalValue: any, index: number, context: { isColor?: boolean; isSize?: boolean; isOpacity?: boolean; isLetterSpacing?: boolean; maxSize?: number; randomizeTokenRef?: boolean } = {}): any {
  if (typeof originalValue === 'string') {
    // For color hex values
    if (/^#[0-9a-fA-F]{6}$/.test(originalValue)) {
      // Generate random valid hex color
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
    }
    // For token references - randomize if requested (for core properties)
    if (originalValue.startsWith('{') && originalValue.endsWith('}')) {
      if (context.randomizeTokenRef && context.isColor) {
        // Randomize token reference for core properties
        // Extract the reference path
        const refContent = originalValue.slice(1, -1) // Remove { and }
        const parts = refContent.split('.')
        
        // If it's a tokens.colors reference (used by core colors), randomize to a different color token
        if (parts[0] === 'tokens' && parts[1] === 'colors') {
          // Randomize to a different scale and level
          const scales = ['scale-01', 'scale-02', 'scale-03', 'scale-04', 'scale-05']
          const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
          const randomScale = scales[Math.floor(Math.random() * scales.length)]
          const randomLevel = levels[Math.floor(Math.random() * levels.length)]
          return `{tokens.colors.${randomScale}.${randomLevel}}`
        }
        
        // If it's a brand.palettes reference, randomize the palette and tone
        if (parts[0] === 'brand' && parts[1] === 'palettes') {
          // Common palette names and tones to randomize between
          const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
          const tones = ['tone', 'on-tone']
          const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
          
          // Randomly select a palette
          const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]
          
          // Build a random reference
          if (randomPalette === 'core-colors') {
            // Core colors have specific structure
            const coreColors = ['interactive', 'warning', 'success', 'alert', 'black', 'white']
            const randomCoreColor = coreColors[Math.floor(Math.random() * coreColors.length)]
            if (randomCoreColor === 'interactive') {
              const variants = ['default', 'hover']
              const randomVariant = variants[Math.floor(Math.random() * variants.length)]
              const randomTone = tones[Math.floor(Math.random() * tones.length)]
              return `{brand.palettes.core-colors.interactive.${randomVariant}.${randomTone}}`
            } else {
              return `{brand.palettes.core-colors.${randomCoreColor}}`
            }
          } else if (randomPalette === 'neutral') {
            // Neutral has level.color.tone structure
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            return `{brand.palettes.neutral.${randomLevel}.color.${randomTone}}`
          } else {
            // Other palettes have level.color.tone structure
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            return `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
          }
        }
      }
      // Keep references as-is to maintain validity (if not randomizing)
      return originalValue
    }
    // For size strings like "16px", generate random size
    if (context.isSize && /^\d+(\.\d+)?px$/.test(originalValue)) {
      const num = Math.floor(Math.random() * 100) + 8 // 8-108px
      return `${num}px`
    }
    // For letter spacing strings like "0" or "0.5", generate random letter spacing
    if (context.isLetterSpacing && /^-?\d+(\.\d+)?$/.test(originalValue)) {
      // Generate random letter spacing between -0.1 and 0.5
      return Math.round((Math.random() * 0.6 - 0.1) * 100) / 100
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
    },
    theme: {
      coreProperties: true,
      type: true,
      palettes: true,
      elevations: true,
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
          (category === 'font' && filteredPath[1] === 'line-heights') && opts.tokens.lineHeights
        
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
        
        const newValue = generateRandomValue(value, index, { isColor, isSize, isOpacity, isLetterSpacing })
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
    let corePropertyCount = 0
    
    themeValuePaths.forEach(({ path, value, isDimension }, index) => {
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
      // Core properties: palette core colors (interactive, alert, warning, success, black, white)
      // Path structure: brand.themes.light.palettes.core-colors.$value.interactive.default.tone.$value
      // OR: themes.light.palettes.core-colors.$value.interactive.default.tone.$value
      // We want to randomize individual color properties, not the parent core-colors.$value object
      const hasCoreColors = pathStr.includes('palettes') && pathStr.includes('core-colors')
      
      // Skip the parent core-colors.$value object (it's the entire object containing all colors)
      // Check if path ends with just core-colors (the parent object)
      if (hasCoreColors && opts.theme.coreProperties) {
        const afterCoreColors = pathStr.split('core-colors')[1] || ''
        // Remove $value from consideration
        const meaningfulParts = afterCoreColors.split('.').filter(p => p && p !== '$value')
        
        // If there are no meaningful parts after core-colors, this is the parent object - skip it
        if (meaningfulParts.length === 0) {
          return
        }
      }
      
      const isCoreProperty = hasCoreColors
      
      // Skip token references UNLESS they are core properties (which we want to randomize)
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // If it's NOT a core property, or coreProperties randomization is disabled, skip it
        if (!isCoreProperty || !opts.theme.coreProperties) {
          return
        }
        // For core properties, we'll randomize the token reference itself
        // Continue to randomization logic below - don't return here
      } else if (isCoreProperty && opts.theme.coreProperties && typeof value !== 'string') {
        // Core properties should be token references or color values
        // If it's not a string (not a token reference), it might be a color object - continue
      }
      // Type: typography section
      const isType = pathStr.includes('typography')
      // Palettes: color palettes (but exclude core-colors which are handled as core properties)
      const isPalette = (pathStr.includes('palettes') || pathStr.includes('color')) && !pathStr.includes('core-colors') && !pathStr.includes('elements')
      // Elevations: elevation definitions
      const isElevation = pathStr.includes('elevations') || (pathStr.includes('elevation') && !pathStr.includes('property'))
      // Dimensions: size dimensions (rename to avoid conflict with parameter)
      const isDimensionCategory = pathStr.includes('dimensions') || (pathStr.includes('size') && !pathStr.includes('font'))
      // Layers: layer properties (but not elements, which are core properties)
      const isLayer = pathStr.includes('layer') && pathStr.includes('properties') && !pathStr.includes('layer-0')
      
      const shouldRandomize = 
        isCoreProperty && opts.theme.coreProperties ||
        isType && opts.theme.type ||
        isPalette && opts.theme.palettes ||
        isElevation && opts.theme.elevations ||
        isDimensionCategory && opts.theme.dimensions ||
        isLayer && opts.theme.layers
      
      if (!shouldRandomize) {
        return
      }
      
      // Determine value type for proper randomization
      const isColor = pathStr.includes('palettes') || pathStr.includes('color') || isCoreProperty
      const isSize = isDimensionCategory || (pathStr.includes('size') && !pathStr.includes('font'))
      // Elevations contain shadow properties (x, y, blur, spread) which are sizes, and color/opacity
      const isElevationSize = isElevation && (pathStr.includes('x') || pathStr.includes('y') || pathStr.includes('blur') || pathStr.includes('spread'))
      const isElevationColor = isElevation && pathStr.includes('color')
      const isElevationOpacity = isElevation && pathStr.includes('opacity')
      
      const newValue = generateRandomValue(value, index, { 
        isColor: isColor || isElevationColor, 
        isSize: isSize || isElevationSize, 
        isOpacity: isElevationOpacity,
        randomizeTokenRef: isCoreProperty && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
      })
      if (isCoreProperty && opts.theme.coreProperties) {
        corePropertyCount++
      }
      modifyValueAtPath(modifiedTheme, path, newValue)
    })
    
    // Update store with modified theme
    // setTheme will trigger recomputeAndApplyAll() internally
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
    
      const newValue = generateRandomValue(value, index, { isColor, isSize })
      modifyValueAtPath(modifiedUiKit, path, newValue)
    })
    
    // Update store with modified uikit
    // setUiKit will trigger recomputeAndApplyAll() internally
    store.setUiKit(modifiedUiKit)
  }
  
  // Disable AA compliance watcher during randomization to prevent it from overwriting randomized values
  const storeAny = store as any
  const aaWatcher = storeAny.aaWatcher
  if (aaWatcher && typeof aaWatcher.disable === 'function') {
    aaWatcher.disable()
  }
  
  // Now trigger recomputation once after all updates are complete
  // This ensures we're reading from the fully updated state
  setTimeout(() => {
    // Force a recomputation to ensure all CSS variables are up to date
    store.recomputeAndApplyAll()
    
    // Dispatch events after recomputation completes
    setTimeout(() => {
      // Dispatch palette vars changed event for core properties and palette changes
      if (opts.theme.coreProperties || opts.theme.palettes) {
        window.dispatchEvent(new CustomEvent('paletteVarsChanged', {}))
        // Also dispatch recheckCoreColorInteractiveOnTones for interactive colors
        if (opts.theme.coreProperties) {
          window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones', {}))
          window.dispatchEvent(new CustomEvent('recheckAllPaletteOnTones', {}))
        }
      }
      
      // Dispatch cssVarsUpdated event
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [] } // Empty array means all CSS vars may have changed
      }))
      
      // Re-enable AA compliance watcher after a delay to ensure CSS variables are fully applied
      setTimeout(() => {
        if (aaWatcher && typeof aaWatcher.enable === 'function') {
          aaWatcher.enable()
        }
      }, 100)
    }, 300)
  }, 100)
}
