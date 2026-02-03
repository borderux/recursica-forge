/**
 * Randomize Variables Utility
 * 
 * Development-only utility to randomly modify all user-modifiable variables
 * for thorough testing of exports and validation.
 */

import { getVarsStore } from '../store/varsStore'
import type { JsonLike } from '../resolvers/tokens'
import type { RandomizeOptions } from './RandomizeOptionsModal'
import uikitJson from '../../vars/UIKit.json'

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
function generateRandomValue(originalValue: any, index: number, context: {
  isColor?: boolean;
  isSize?: boolean;
  isOpacity?: boolean;
  isLetterSpacing?: boolean;
  isLineHeight?: boolean;
  isFontWeight?: boolean;
  isFontSize?: boolean;
  isElevation?: boolean;
  maxSize?: number;
  randomizeTokenRef?: boolean
} = {}): any {
  if (originalValue === null) {
    if (context.isColor) {
      const paletteNames = ['palette-1', 'palette-2', 'palette-3', 'neutral', 'core-colors']
      const levels = ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      const tones = ['tone', 'on-tone']

      const palette = paletteNames[Math.floor(Math.random() * paletteNames.length)]
      const tone = tones[Math.floor(Math.random() * tones.length)]

      if (palette === 'core-colors') {
        const coreColors = ['interactive', 'warning', 'success', 'alert']
        const coreColor = coreColors[Math.floor(Math.random() * coreColors.length)]
        if (coreColor === 'interactive') {
          return `{brand.palettes.core-colors.interactive.default.${tone}}`
        }
        return `{brand.palettes.core-colors.${coreColor}}`
      }

      const level = levels[Math.floor(Math.random() * levels.length)]
      return `{brand.palettes.${palette}.${level}.color.${tone}}`
    }
    return null
  }

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
      if (context.randomizeTokenRef) {
        // Extract the reference path
        const refContent = originalValue.slice(1, -1) // Remove { and }
        const parts = refContent.split('.')

        // 1. Color Randomization Logic
        if (context.isColor) {
          // If it's a tokens.colors reference (used by core colors), randomize to a different color token
          if (parts[0] === 'tokens' && parts[1] === 'colors') {
            const scales = ['scale-01', 'scale-02', 'scale-03', 'scale-04', 'scale-05', 'scale-06']
            const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]
            return `{tokens.colors.${randomScale}.${randomLevel}}`
          }

          // If it's a brand.palettes reference, randomize the palette and tone
          if (parts[0] === 'brand' && parts[1] === 'palettes') {
            const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
            const tones = ['tone', 'on-tone']
            const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
            const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]

            if (randomPalette === 'core-colors') {
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
              const randomLevel = levels[Math.floor(Math.random() * levels.length)]
              const randomTone = tones[Math.floor(Math.random() * tones.length)]
              return `{brand.palettes.neutral.${randomLevel}.color.${randomTone}}`
            } else {
              const randomLevel = levels[Math.floor(Math.random() * levels.length)]
              const randomTone = tones[Math.floor(Math.random() * tones.length)]
              return `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
            }
          }

          // Fallback: If it's any other brand or token reference but we know it should be a color
          if (parts[0] === 'brand' || parts[0] === 'tokens') {
            const paletteNames = ['palette-1', 'palette-2', 'palette-3', 'neutral', 'core-colors']
            const levels = ['100', '200', '300', '400', '500', '600', '700', '800', '900']
            const tones = ['tone', 'on-tone']

            const palette = paletteNames[Math.floor(Math.random() * paletteNames.length)]
            const tone = tones[Math.floor(Math.random() * tones.length)]

            if (palette === 'core-colors') {
              const coreColors = ['interactive', 'warning', 'success', 'alert']
              const coreColor = coreColors[Math.floor(Math.random() * coreColors.length)]
              if (coreColor === 'interactive') {
                return `{brand.palettes.core-colors.interactive.default.${tone}}`
              }
              return `{brand.palettes.core-colors.${coreColor}}`
            }

            const level = levels[Math.floor(Math.random() * levels.length)]
            return `{brand.palettes.${palette}.${level}.color.${tone}}`
          }
        }

        // 2. Dimension/Size Randomization Logic
        if (context.isSize) {
          // If it's a brand.dimensions reference, randomize within dimension scales
          if (parts[0] === 'brand' && parts[1] === 'dimensions') {
            const types = ['general', 'border-radii', 'icons']
            let dimType = types.includes(parts[2]) ? parts[2] : types[Math.floor(Math.random() * types.length)]

            if (originalValue.includes('border-radii')) dimType = 'border-radii'
            if (originalValue.includes('icons')) dimType = 'icons'
            if (originalValue.includes('gutters') || originalValue.includes('general')) dimType = 'general'

            if (dimType === 'border-radii') {
              const scales = ['none', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', 'pill', 'circle']
              const randomScale = scales[Math.floor(Math.random() * scales.length)]
              return `{brand.dimensions.border-radii.${randomScale}}`
            } else if (dimType === 'icons') {
              const scales = ['xs', 'sm', 'default', 'lg', 'xl']
              const randomScale = scales[Math.floor(Math.random() * scales.length)]
              return `{brand.dimensions.icons.${randomScale}}`
            } else {
              const scales = ['none', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', '3xl']
              const randomScale = scales[Math.floor(Math.random() * scales.length)]
              return `{brand.dimensions.general.${randomScale}}`
            }
          }
        }

        // 3. Elevation Randomization Logic
        if (context.isElevation || (parts[0] === 'brand' && parts[1] === 'elevations')) {
          const scales = ['elevation-0', 'elevation-1', 'elevation-2', 'elevation-3', 'elevation-4']
          const randomScale = scales[Math.floor(Math.random() * scales.length)]
          return `{brand.elevations.${randomScale}}`
        }

        // 4. Opacity Randomization Logic
        if (context.isOpacity || parts[0] === 'brand' && (parts[1] === 'text-emphasis' || parts[1] === 'states')) {
          if (parts[0] === 'tokens' && parts[1] === 'opacities') {
            const scales = ['invisible', 'mist', 'ghost', 'faint', 'veiled', 'smoky', 'solid']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{tokens.opacities.${randomScale}}`
          }
          if (parts[0] === 'brand' && parts[1] === 'text-emphasis') {
            const scales = ['low', 'medium', 'high']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{brand.text-emphasis.${randomScale}}`
          }
          if (parts[0] === 'brand' && parts[1] === 'states') {
            const scales = ['disabled']
            return `{brand.states.disabled}`
          }
        }

        // 5. Typography Token Randomization Logic
        if (context.isFontWeight || context.isFontSize || context.isLetterSpacing || context.isLineHeight || parts[0] === 'tokens' && parts[1] === 'font') {
          if (parts[2] === 'weights') {
            const scales = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{tokens.font.weights.${randomScale}}`
          }
          if (parts[2] === 'sizes') {
            const scales = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{tokens.font.sizes.${randomScale}}`
          }
          if (parts[2] === 'letter-spacings') {
            const scales = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{tokens.font.letter-spacings.${randomScale}}`
          }
          if (parts[2] === 'line-heights') {
            const scales = ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest']
            const randomScale = scales[Math.floor(Math.random() * scales.length)]
            return `{tokens.font.line-heights.${randomScale}}`
          }
        }
      }
      // Keep references as-is to maintain validity (if not randomizing)
      return originalValue
    }
    // For size strings like "16px", generate random size
    if (context.isSize && /^\d+(\.\d+)?px$/.test(originalValue)) {
      const num = Math.floor(Math.random() * (context.maxSize ?? 100)) + 8
      return `${num}px`
    }
    // For letter spacing strings like "0" or "0.5"
    if (context.isLetterSpacing && /^-?\d+(\.\d+)?$/.test(originalValue)) {
      return Math.round((Math.random() * 0.6 - 0.1) * 100) / 100
    }
    // For line heights
    if (context.isLineHeight && /^\d+(\.\d+)?$/.test(originalValue)) {
      return Math.round((Math.random() * 0.5 + 0.9) * 100) / 100
    }
    // For font weight strings
    if (context.isFontWeight && /^\d+$/.test(originalValue)) {
      const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
      return weights[Math.floor(Math.random() * weights.length)]
    }
    return originalValue
  }

  if (typeof originalValue === 'number') {
    // For opacity (0-1)
    if (context.isOpacity) {
      return Math.round(Math.random() * 100) / 100
    }
    // For letter spacing
    if (context.isLetterSpacing) {
      return Math.round((Math.random() * 0.6 - 0.1) * 100) / 100
    }
    // For line height
    if (context.isLineHeight) {
      return Math.round((Math.random() * 0.5 + 0.9) * 100) / 100
    }
    // For font weight
    if (context.isFontWeight) {
      const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
      return weights[Math.floor(Math.random() * weights.length)]
    }
    // For dimension values (font sizes, sizes) - positive numbers
    if (context.isSize || context.isFontSize) {
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
  const getAllComponentsTrue = () => {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}
    const result: Record<string, boolean> = {}
    Object.keys(components).forEach(key => {
      result[key] = true
    })
    return result
  }

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
      components: getAllComponentsTrue(),
    },
  }
  if (process.env.NODE_ENV !== 'development') {
    console.warn('randomizeAllVariables can only be called in development mode')
    return
  }

  const store = getVarsStore()
  // Get fresh state each time - ensure we're reading the latest values
  const state = store.getState()

  // Get initial state - deep clone to avoid mutating the original
  const initialTokens = JSON.parse(JSON.stringify(state.tokens)) as JsonLike
  const initialTheme = JSON.parse(JSON.stringify(state.theme)) as JsonLike
  const initialUiKit = JSON.parse(JSON.stringify(state.uikit)) as JsonLike

  // Find all modifiable values
  const shouldRandomizeTokens = Object.values(opts.tokens).some(v => v === true)
  const shouldRandomizeTheme = Object.values(opts.theme).some(v => v === true)
  const shouldRandomizeUIKit = Object.values(opts.uikit.components).some(v => v === true)

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

  // AA compliance is now trigger-based, no need to disable watchers

  // Modify theme/brand - directly modify JSON structure
  const modifiedTheme = JSON.parse(JSON.stringify(initialTheme)) as JsonLike
  if (shouldRandomizeTheme) {
    let corePropertyCount = 0

    themeValuePaths.forEach(({ path, value, isDimension }, index) => {
      const pathStr = path.join('.')

      // Skip typography $value objects themselves (the whole object), but allow properties inside them
      // Path structure: brand.themes.light.typography.h1.$value.fontFamily
      // We want to randomize fontFamily, fontSize, etc. but skip the $value object itself
      if (value && typeof value === 'object' && '$type' in value && value.$type === 'typography') {
        return
      }

      // Check if we're inside a typography $value object (path contains typography and $value)
      // If so, we want to randomize these properties
      // Path structure: brand.themes.light.typography.h1.$value.fontFamily
      const isInsideTypographyValue = pathStr.includes('typography') && pathStr.includes('$value')

      // Skip if parent has $type typography AND we're not inside the $value object
      if (!isInsideTypographyValue) {
        const parent = path.length > 0 ? getValueAtPath(modifiedTheme, path.slice(0, -1)) : null
        if (parent && typeof parent === 'object' && '$type' in parent && parent.$type === 'typography') {
          return
        }
      }

      // Skip dimension objects in layer properties EXCEPT border-thickness (which should be randomized)
      // But allow layer elements (text, interactive, etc.) to be randomized
      // Check if path ends with ['$value', 'value'] which indicates we're inside a dimension object
      const isLayerProperty = /layer.*\.properties/.test(pathStr) || (pathStr.includes('layer-') && pathStr.includes('properties'))
      const isLayerElement = pathStr.includes('layer') && pathStr.includes('elements')
      const isBorderThickness = pathStr.includes('border-thickness')
      const isInsideDimensionValue = path.length >= 2 && path[path.length - 2] === '$value' && path[path.length - 1] === 'value'
      // Only skip dimension objects in properties (except border-thickness), not in elements
      if (isLayerProperty && !isLayerElement && !isBorderThickness && (isDimension || isInsideDimensionValue)) {
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

      // Check if this is a high, low, disabled, or hover opacity that should be randomized with token references
      const isHighEmphasisOpacity = pathStr.includes('text-emphasis') && pathStr.includes('high')
      const isLowEmphasisOpacity = pathStr.includes('text-emphasis') && pathStr.includes('low')
      const isDisabledOpacity = pathStr.includes('states') && pathStr.includes('disabled')
      const isHoverOpacity = pathStr.includes('states') && pathStr.includes('hover')
      const isEmphasisOrDisabledOpacity = isHighEmphasisOpacity || isLowEmphasisOpacity || isDisabledOpacity || isHoverOpacity

      // Check if this is an overlay color or opacity that should be randomized
      // Path structure: brand.themes.light.states.overlay.color.$value or themes.light.states.overlay.color.$value
      // Or: brand.themes.light.states.overlay.opacity.$value or themes.light.states.overlay.opacity.$value
      // The path from findAllValuePaths doesn't include $value (it's the key), so the path ends with 'color' or 'opacity'
      const pathParts = pathStr.split('.')
      const hasStatesOverlay = pathStr.includes('states') && pathStr.includes('overlay')
      const lastPart = pathParts[pathParts.length - 1]
      // Check if path contains 'overlay.color' or 'overlay.opacity' - this is the most reliable check
      // Also check if the path ends with 'color' or 'opacity' and has 'overlay' before it
      const hasOverlayColor = pathStr.includes('overlay.color') || (hasStatesOverlay && lastPart === 'color')
      const hasOverlayOpacity = pathStr.includes('overlay.opacity') || (hasStatesOverlay && lastPart === 'opacity')
      const isOverlayColor = hasStatesOverlay && hasOverlayColor
      const isOverlayOpacity = hasStatesOverlay && hasOverlayOpacity
      const isOverlay = isOverlayColor || isOverlayOpacity

      // Type: typography section - use isInsideTypographyValue to ensure we're inside a $value object
      const isType = isInsideTypographyValue

      // Elevations: elevation definitions (check for "elevations" plural in path, or "elevation-" followed by number)
      // Exclude layer properties which have "properties.elevation" but not "elevations"
      const isElevation = pathStr.includes('elevations') || (pathStr.includes('elevation-') && !pathStr.includes('properties'))
      const isElevationColor = isElevation && pathStr.includes('color')

      // Layers: layer properties and elements (text, interactive, alert, warning, success colors)
      // Check this early so we can use it in the token reference check below
      const isLayer = pathStr.includes('layer') && (pathStr.includes('properties') || pathStr.includes('elements'))

      // Dimensions: size dimensions (check this early so we can use it in the token reference check below)
      const isDimensionCategory = pathStr.includes('dimensions') || (pathStr.includes('size') && !pathStr.includes('font'))

      // Skip token references UNLESS they are core properties, emphasis/disabled opacities, overlay values, typography, elevation colors, layer properties, or dimensions (which we want to randomize)
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // If it's NOT a core property, emphasis/disabled opacity, overlay value, typography property, elevation color, layer property, or dimension, or the relevant randomization is disabled, skip it
        if (!isCoreProperty && !isEmphasisOrDisabledOpacity && !isOverlay && !isType && !isElevationColor && !isLayer && !isDimensionCategory) {
          return
        }
        if (isLayer && !opts.theme.layers) {
          return // Only randomize layer properties when layers are enabled
        }
        if (isCoreProperty && !opts.theme.coreProperties) {
          return
        }
        if (isEmphasisOrDisabledOpacity && !opts.theme.coreProperties) {
          return // Only randomize emphasis/disabled opacities when core properties are enabled
        }
        if (isType && !opts.theme.type) {
          return
        }
        if (isElevationColor && !opts.theme.elevations) {
          return // Only randomize elevation colors when elevations are enabled
        }
        if (isDimensionCategory && !opts.theme.dimensions) {
          return // Only randomize dimensions when dimensions are enabled
        }
        // For core properties, emphasis/disabled opacities, overlay values, typography, elevation colors, layer properties, and dimensions, we'll randomize the token reference itself
        // Continue to randomization logic below - don't return here
      } else if (isCoreProperty && opts.theme.coreProperties && typeof value !== 'string') {
        // Core properties should be token references or color values
        // If it's not a string (not a token reference), it might be a color object - continue
      }
      // Palettes: color palettes (but exclude core-colors which are handled as core properties)
      // Note: Palette randomization is handled separately below, not in the forEach loop
      const isPalette = false // Disable individual palette value randomization - we handle it separately
      // Note: isElevation and isElevationColor are already defined above for the token reference check
      // isLayer is already defined above

      const shouldRandomize =
        isCoreProperty && opts.theme.coreProperties ||
        (isEmphasisOrDisabledOpacity && opts.theme.coreProperties) || // Only randomize emphasis/disabled opacities when core properties are enabled
        (isOverlay && opts.theme.coreProperties) || // Randomize overlay when core properties are enabled
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
      // Note: isElevation and isElevationColor are already defined above for the token reference check
      const isElevationSize = isElevation && (pathStr.includes('x') || pathStr.includes('y') || pathStr.includes('blur') || pathStr.includes('spread'))
      const isElevationOpacity = isElevation && pathStr.includes('opacity')

      // Layer-specific value type detection
      // Layer colors include: surface, border-color, and all element colors (text, interactive, alert, warning, success)
      const isLayerColor = isLayer && (
        pathStr.includes('surface') ||
        pathStr.includes('border-color') ||
        pathStr.includes('text-color') ||
        pathStr.includes('element-text-color') ||
        pathStr.includes('elements') // All element colors (text, interactive, alert, warning, success)
      )
      const isLayerSize = isLayer && (pathStr.includes('padding') || pathStr.includes('border-radius') || pathStr.includes('border-thickness'))


      // For high, low, disabled, and hover opacities, randomize by picking a random opacity token reference
      // For overlay opacity, also randomize with a random opacity token reference
      // For overlay color, randomize with a random palette reference
      let newValue: any
      if (isEmphasisOrDisabledOpacity && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Pick a random opacity token reference
        const opacityTokens = ['invisible', 'mist', 'ghost', 'faint', 'veiled', 'smoky', 'solid']
        const currentToken = value.match(/\{tokens\.opacity\.([a-z0-9-]+)\}/)?.[1]
        const availableTokens = currentToken ? opacityTokens.filter(t => t !== currentToken) : opacityTokens
        const randomOpacityToken = availableTokens.length > 0
          ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
          : opacityTokens[Math.floor(Math.random() * opacityTokens.length)]
        newValue = `{tokens.opacity.${randomOpacityToken}}`
      } else if (isOverlayOpacity && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Pick a random opacity token reference for overlay opacity
        // Ensure we pick a different value than the current one
        const opacityTokens = ['invisible', 'mist', 'ghost', 'faint', 'veiled', 'smoky', 'solid']
        const currentToken = value.match(/\{tokens\.opacity\.([a-z0-9-]+)\}/)?.[1]
        const availableTokens = currentToken ? opacityTokens.filter(t => t !== currentToken) : opacityTokens
        const randomOpacityToken = availableTokens.length > 0
          ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
          : opacityTokens[Math.floor(Math.random() * opacityTokens.length)]
        newValue = `{tokens.opacity.${randomOpacityToken}}`
      } else if (isOverlayColor && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Pick a random palette reference for overlay color
        // Determine the current mode from the path
        const modeMatch = pathStr.match(/\.(light|dark)\./)
        const currentMode = modeMatch ? modeMatch[1] : 'light'

        const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
        const tones = ['tone', 'on-tone']
        const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

        // Randomly select a palette
        const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]

        // Build a random reference - overlay colors can use either brand.palettes or brand.themes.{mode}.palettes format
        // Use the shorter brand.palettes format for consistency
        if (randomPalette === 'core-colors') {
          // Core colors have specific structure
          // For overlay colors, non-interactive core colors need .tone suffix to match CSS variable format
          const coreColors = ['interactive', 'warning', 'success', 'alert', 'black', 'white']
          const randomCoreColor = coreColors[Math.floor(Math.random() * coreColors.length)]
          if (randomCoreColor === 'interactive') {
            const variants = ['default', 'hover']
            const randomVariant = variants[Math.floor(Math.random() * variants.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            newValue = `{brand.palettes.core-colors.interactive.${randomVariant}.${randomTone}}`
          } else {
            // For non-interactive core colors, use .tone suffix to match CSS variable format
            // This resolves to: var(--recursica-brand-themes-${mode}-palettes-core-${coreColor}-tone)
            newValue = `{brand.palettes.core-colors.${randomCoreColor}.tone}`
          }
        } else if (randomPalette === 'neutral') {
          // Neutral has level.color.tone structure
          const randomLevel = levels[Math.floor(Math.random() * levels.length)]
          const randomTone = tones[Math.floor(Math.random() * tones.length)]
          newValue = `{brand.palettes.neutral.${randomLevel}.color.${randomTone}}`
        } else {
          // Other palettes have level.color.tone structure
          const randomLevel = levels[Math.floor(Math.random() * levels.length)]
          const randomTone = tones[Math.floor(Math.random() * tones.length)]
          newValue = `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
        }
      } else if (isType && opts.theme.type && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Randomize typography properties by picking random token references
        if (pathStr.includes('fontFamily')) {
          // Pick a random typeface token reference
          const typefaces = ['primary', 'secondary', 'tertiary']
          const randomTypeface = typefaces[Math.floor(Math.random() * typefaces.length)]
          newValue = `{tokens.font.typefaces.${randomTypeface}}`
        } else if (pathStr.includes('fontSize')) {
          // Pick a random font size token reference
          const fontSizes = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
          const randomSize = fontSizes[Math.floor(Math.random() * fontSizes.length)]
          newValue = `{tokens.font.sizes.${randomSize}}`
        } else if (pathStr.includes('fontWeight')) {
          // Pick a random font weight token reference
          const fontWeights = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
          const randomWeight = fontWeights[Math.floor(Math.random() * fontWeights.length)]
          newValue = `{tokens.font.weights.${randomWeight}}`
        } else if (pathStr.includes('letterSpacing')) {
          // Pick a random letter spacing token reference
          const letterSpacings = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest']
          const currentToken = value.match(/\{tokens\.font\.letter-spacings\.([a-z0-9-]+)\}/)?.[1]
          const availableTokens = currentToken ? letterSpacings.filter(t => t !== currentToken) : letterSpacings
          const randomSpacing = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : letterSpacings[Math.floor(Math.random() * letterSpacings.length)]
          newValue = `{tokens.font.letter-spacings.${randomSpacing}}`
        } else if (pathStr.includes('lineHeight')) {
          // Pick a random line height token reference
          const lineHeights = ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest']
          const currentToken = value.match(/\{tokens\.font\.line-heights\.([a-z0-9-]+)\}/)?.[1]
          const availableTokens = currentToken ? lineHeights.filter(t => t !== currentToken) : lineHeights
          const randomLineHeight = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : lineHeights[Math.floor(Math.random() * lineHeights.length)]
          newValue = `{tokens.font.line-heights.${randomLineHeight}}`
        } else if (pathStr.includes('textCase')) {
          // Pick a random text case token reference
          const textCases = ['original', 'uppercase', 'titlecase']
          const currentToken = value.match(/\{tokens\.font\.cases\.([a-z0-9-]+)\}/)?.[1]
          const availableTokens = currentToken ? textCases.filter(t => t !== currentToken) : textCases
          const randomCase = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : textCases[Math.floor(Math.random() * textCases.length)]
          newValue = `{tokens.font.cases.${randomCase}}`
        } else if (pathStr.includes('textDecoration')) {
          // Pick a random text decoration token reference
          const textDecorations = ['none', 'underline', 'strikethrough']
          const currentToken = value.match(/\{tokens\.font\.decorations\.([a-z0-9-]+)\}/)?.[1]
          const availableTokens = currentToken ? textDecorations.filter(t => t !== currentToken) : textDecorations
          const randomDecoration = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : textDecorations[Math.floor(Math.random() * textDecorations.length)]
          newValue = `{tokens.font.decorations.${randomDecoration}}`
        } else {
          // For other typography properties, keep as-is
          newValue = value
        }
      } else if (isElevation && opts.theme.elevations) {
        // Special handling for elevation properties with specific ranges
        // Check if this is the color property (token reference)
        if (isElevationColor && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          // Randomize shadow color by picking a random palette reference
          const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
          const tones = ['tone', 'on-tone']
          const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

          // Randomly select a palette
          const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]

          // Build a random reference
          if (randomPalette === 'core-colors') {
            const coreColors = ['interactive', 'warning', 'success', 'alert', 'black', 'white']
            const randomCoreColor = coreColors[Math.floor(Math.random() * coreColors.length)]
            if (randomCoreColor === 'interactive') {
              const variants = ['default', 'hover']
              const randomVariant = variants[Math.floor(Math.random() * variants.length)]
              const randomTone = tones[Math.floor(Math.random() * tones.length)]
              newValue = `{brand.palettes.core-colors.interactive.${randomVariant}.${randomTone}}`
            } else {
              newValue = `{brand.palettes.core-colors.${randomCoreColor}}`
            }
          } else if (randomPalette === 'neutral') {
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            newValue = `{brand.palettes.neutral.${randomLevel}.color.${randomTone}}`
          } else {
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            newValue = `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
          }
        } else if (isElevationOpacity) {
          // Elevation opacity: 0-100% (stored as percentage in dimension object)
          // The value is the number inside the dimension object (0-100)
          const randomOpacity = Math.floor(Math.random() * 101) // 0-100
          newValue = randomOpacity
        } else if (isElevationSize) {
          // Elevation size properties (blur, spread, x, y) - check which one
          if (pathStr.includes('blur')) {
            // Blur: 0-200px
            const randomBlur = Math.floor(Math.random() * 201) // 0-200
            newValue = randomBlur
          } else if (pathStr.includes('spread')) {
            // Spread: 0-200px
            const randomSpread = Math.floor(Math.random() * 201) // 0-200
            newValue = randomSpread
          } else if (pathStr.includes('.x.') || pathStr.endsWith('.x') || pathStr.includes('offsetX') || (path.length > 0 && path[path.length - 1] === 'x')) {
            // Offset X: -50 to 50px (check for .x. in path or x as last path segment)
            const randomOffsetX = Math.floor(Math.random() * 101) - 50 // -50 to 50
            newValue = randomOffsetX
          } else if (pathStr.includes('.y.') || pathStr.endsWith('.y') || pathStr.includes('offsetY') || (path.length > 0 && path[path.length - 1] === 'y')) {
            // Offset Y: -50 to 50px (check for .y. in path or y as last path segment)
            const randomOffsetY = Math.floor(Math.random() * 101) - 50 // -50 to 50
            newValue = randomOffsetY
          } else {
            // Fallback for other elevation size properties
            newValue = generateRandomValue(value, index, { isSize: true })
          }
        } else {
          // Fallback for other elevation properties
          newValue = generateRandomValue(value, index, {
            isColor: isColor || isElevationColor,
            isSize: isSize || isElevationSize,
            isOpacity: isElevationOpacity,
            randomizeTokenRef: isCoreProperty && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
          })
        }
      } else if (isDimensionCategory && opts.theme.dimensions && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Randomize dimension token references
        // Dimensions can reference either {tokens.size.XXX} or {tokens.font.sizes.XXX}
        const sizeTokenMatch = value.match(/\{tokens\.size\.([a-z0-9-]+)\}/)
        const fontSizeTokenMatch = value.match(/\{tokens\.font\.sizes\.([a-z0-9-]+)\}/)

        if (sizeTokenMatch) {
          // Regular size token reference
          const sizeTokens = ['none', '0-5x', '1x', '1-5x', '2x', '3x', '4x', '5x', '6x']
          const currentToken = sizeTokenMatch[1]
          const availableTokens = currentToken ? sizeTokens.filter(t => t !== currentToken) : sizeTokens
          const randomToken = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : sizeTokens[Math.floor(Math.random() * sizeTokens.length)]
          newValue = `{tokens.size.${randomToken}}`
        } else if (fontSizeTokenMatch) {
          // Font size token reference (for text-size dimensions)
          const fontSizes = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
          const currentToken = fontSizeTokenMatch[1]
          const availableTokens = currentToken ? fontSizes.filter(t => t !== currentToken) : fontSizes
          const randomToken = availableTokens.length > 0
            ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
            : fontSizes[Math.floor(Math.random() * fontSizes.length)]
          newValue = `{tokens.font.sizes.${randomToken}}`
        } else {
          // Unknown token reference format, keep as-is
          newValue = value
        }
      } else if (isLayer && opts.theme.layers) {
        // Layer-specific randomization
        if (isLayerColor && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          // Check if this is a layer element (text, interactive, etc.) that references core-colors
          const isLayerElement = pathStr.includes('elements')
          const isCoreColorRef = value.includes('core-colors') && (value.includes('warning') || value.includes('success') || value.includes('alert') || value.includes('interactive'))

          // For layer elements that reference core-colors (alert, warning, success, interactive),
          // randomize by picking a random core color or palette
          // Check if path contains alert, warning, success, or interactive
          const isAlertWarningSuccess = pathStr.includes('alert') || pathStr.includes('warning') || pathStr.includes('success')
          const isInteractive = pathStr.includes('interactive')

          if (isLayerElement && (isCoreColorRef || isAlertWarningSuccess || isInteractive)) {
            const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
            const tones = ['tone', 'on-tone']
            const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

            // Extract current value to avoid picking the same one
            let currentCoreColor: string | null = null
            let currentPalette: string | null = null
            if (value.includes('core-colors')) {
              const coreColorMatch = value.match(/core-colors\.([a-z]+)/)
              if (coreColorMatch) currentCoreColor = coreColorMatch[1]
            } else {
              const paletteMatch = value.match(/palettes\.(palette-\d+|neutral)/)
              if (paletteMatch) currentPalette = paletteMatch[1]
            }

            const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]

            if (randomPalette === 'core-colors') {
              const coreColors = ['interactive', 'warning', 'success', 'alert', 'black', 'white']
              const availableCoreColors = currentCoreColor ? coreColors.filter(c => c !== currentCoreColor) : coreColors
              const randomCoreColor = availableCoreColors.length > 0
                ? availableCoreColors[Math.floor(Math.random() * availableCoreColors.length)]
                : coreColors[Math.floor(Math.random() * coreColors.length)]
              newValue = `{brand.palettes.core-colors.${randomCoreColor}}`
            } else {
              newValue = `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
            }
          } else {
            // Regular layer color randomization
            const paletteNames = ['core-colors', 'neutral', 'palette-1', 'palette-2', 'palette-3']
            const tones = ['tone', 'on-tone']
            const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

            // Extract current value to avoid picking the same one
            let currentCoreColor: string | null = null
            let currentPalette: string | null = null
            if (value.includes('core-colors')) {
              const coreColorMatch = value.match(/core-colors\.([a-z]+)/)
              if (coreColorMatch) currentCoreColor = coreColorMatch[1]
            } else {
              const paletteMatch = value.match(/palettes\.(palette-\d+|neutral)/)
              if (paletteMatch) currentPalette = paletteMatch[1]
            }

            const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)]
            const randomTone = tones[Math.floor(Math.random() * tones.length)]
            const randomLevel = levels[Math.floor(Math.random() * levels.length)]

            if (randomPalette === 'core-colors') {
              const coreColors = ['interactive', 'warning', 'success', 'alert', 'black', 'white']
              const availableCoreColors = currentCoreColor ? coreColors.filter(c => c !== currentCoreColor) : coreColors
              const randomCoreColor = availableCoreColors.length > 0
                ? availableCoreColors[Math.floor(Math.random() * availableCoreColors.length)]
                : coreColors[Math.floor(Math.random() * coreColors.length)]
              newValue = `{brand.palettes.core-colors.${randomCoreColor}}`
            } else {
              newValue = `{brand.palettes.${randomPalette}.${randomLevel}.color.${randomTone}}`
            }
          }
        } else if (isLayerSize) {
          // Layer size properties (padding, border-radius, border-thickness)
          // Check if this is a token reference (dimension token) that should be randomized
          if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
            // Randomize the token reference by picking a random size token
            const sizeTokenMatch = value.match(/\{tokens\.size\.([a-z0-9-]+)\}/)
            if (sizeTokenMatch) {
              const sizeTokens = ['none', '0-5x', '1x', '1-5x', '2x', '3x', '4x', '5x', '6x']
              const currentToken = sizeTokenMatch[1]
              const availableTokens = currentToken ? sizeTokens.filter(t => t !== currentToken) : sizeTokens
              const randomToken = availableTokens.length > 0
                ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
                : sizeTokens[Math.floor(Math.random() * sizeTokens.length)]
              newValue = `{tokens.size.${randomToken}}`
            } else {
              // Unknown token reference format, keep as-is
              newValue = value
            }
          } else if (typeof value === 'object' && value !== null && 'value' in value && 'unit' in value) {
            // Dimension object (border-thickness) - randomize the value
            const randomValue = Math.floor(Math.random() * 201) // 0-200px
            newValue = { value: randomValue, unit: value.unit }
          } else {
            // Direct numeric value
            newValue = generateRandomValue(value, index, { isSize: true, maxSize: 200 })
          }
        } else {
          // Fallback for other layer properties
          newValue = generateRandomValue(value, index, {
            isColor: isLayerColor,
            isSize: isLayerSize,
            randomizeTokenRef: isLayerColor && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
          })
        }
      } else {
        newValue = generateRandomValue(value, index, {
          isColor: isColor || isElevationColor,
          isSize: isSize || isElevationSize,
          isOpacity: isElevationOpacity,
          randomizeTokenRef: isCoreProperty && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
        })
      }
      if (isCoreProperty && opts.theme.coreProperties) {
        corePropertyCount++
      }


      modifyValueAtPath(modifiedTheme, path, newValue)
    })

    // Handle typography properties separately since they're not $value properties
    // Typography structure: brand.typography.h1.$value.fontFamily (typography is at brand level, not inside themes)
    // findAllValuePaths won't find fontFamily, fontSize, etc. because they're regular properties, not $value
    if (opts.theme.type) {
      const root: any = modifiedTheme.brand || modifiedTheme

      if (root.typography) {
        for (const [styleName, styleObj] of Object.entries(root.typography)) {
          if (!styleObj || typeof styleObj !== 'object' || !('$value' in styleObj)) continue

          const $value = styleObj.$value as Record<string, any>
          if (!$value || typeof $value !== 'object') continue

          // Randomize fontFamily
          if (typeof $value.fontFamily === 'string' && $value.fontFamily.startsWith('{') && $value.fontFamily.endsWith('}')) {
            const typefaces = ['primary', 'secondary', 'tertiary']
            const randomTypeface = typefaces[Math.floor(Math.random() * typefaces.length)]
            $value.fontFamily = `{tokens.font.typefaces.${randomTypeface}}`
          }

          // Randomize fontSize
          if (typeof $value.fontSize === 'string' && $value.fontSize.startsWith('{') && $value.fontSize.endsWith('}')) {
            const fontSizes = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
            const randomSize = fontSizes[Math.floor(Math.random() * fontSizes.length)]
            $value.fontSize = `{tokens.font.sizes.${randomSize}}`
          }

          // Randomize fontWeight
          if (typeof $value.fontWeight === 'string' && $value.fontWeight.startsWith('{') && $value.fontWeight.endsWith('}')) {
            const fontWeights = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
            const randomWeight = fontWeights[Math.floor(Math.random() * fontWeights.length)]
            $value.fontWeight = `{tokens.font.weights.${randomWeight}}`
          }

          // Randomize letterSpacing
          if (typeof $value.letterSpacing === 'string' && $value.letterSpacing.startsWith('{') && $value.letterSpacing.endsWith('}')) {
            const letterSpacings = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest']
            const currentToken = $value.letterSpacing.match(/\{tokens\.font\.letter-spacings\.([a-z0-9-]+)\}/)?.[1]
            const availableTokens = currentToken ? letterSpacings.filter(t => t !== currentToken) : letterSpacings
            const randomSpacing = availableTokens.length > 0
              ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
              : letterSpacings[Math.floor(Math.random() * letterSpacings.length)]
            $value.letterSpacing = `{tokens.font.letter-spacings.${randomSpacing}}`
          }

          // Randomize lineHeight
          if (typeof $value.lineHeight === 'string' && $value.lineHeight.startsWith('{') && $value.lineHeight.endsWith('}')) {
            const lineHeights = ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest']
            const currentToken = $value.lineHeight.match(/\{tokens\.font\.line-heights\.([a-z0-9-]+)\}/)?.[1]
            const availableTokens = currentToken ? lineHeights.filter(t => t !== currentToken) : lineHeights
            const randomLineHeight = availableTokens.length > 0
              ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
              : lineHeights[Math.floor(Math.random() * lineHeights.length)]
            $value.lineHeight = `{tokens.font.line-heights.${randomLineHeight}}`
          }

          // Randomize textCase
          if (typeof $value.textCase === 'string' && $value.textCase.startsWith('{') && $value.textCase.endsWith('}')) {
            const textCases = ['original', 'uppercase', 'titlecase']
            const currentToken = $value.textCase.match(/\{tokens\.font\.cases\.([a-z0-9-]+)\}/)?.[1]
            const availableTokens = currentToken ? textCases.filter(t => t !== currentToken) : textCases
            const randomCase = availableTokens.length > 0
              ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
              : textCases[Math.floor(Math.random() * textCases.length)]
            $value.textCase = `{tokens.font.cases.${randomCase}}`
          }

          // Randomize textDecoration
          if (typeof $value.textDecoration === 'string' && $value.textDecoration.startsWith('{') && $value.textDecoration.endsWith('}')) {
            const textDecorations = ['none', 'underline', 'strikethrough']
            const currentToken = $value.textDecoration.match(/\{tokens\.font\.decorations\.([a-z0-9-]+)\}/)?.[1]
            const availableTokens = currentToken ? textDecorations.filter(t => t !== currentToken) : textDecorations
            const randomDecoration = availableTokens.length > 0
              ? availableTokens[Math.floor(Math.random() * availableTokens.length)]
              : textDecorations[Math.floor(Math.random() * textDecorations.length)]
            $value.textDecoration = `{tokens.font.decorations.${randomDecoration}}`
          }
        }
      }
    }

    // Handle palette randomization separately
    // This assigns unique color scales to each palette, adds new palettes if scales are available,
    // deletes palettes if all scales are used, and randomly sets the default level for each palette
    if (opts.theme.palettes) {
      const root: any = modifiedTheme.brand || modifiedTheme
      const themes = root.themes || root

      // Get available color scales from tokens - use current state tokens, not initial
      const currentState = store.getState()
      const tokensRoot: any = currentState.tokens.tokens || currentState.tokens
      const colorsRoot = tokensRoot.colors || {}
      const availableScales = Object.keys(colorsRoot).filter(k => k.startsWith('scale-')).sort()

      // Process both light and dark modes
      for (const mode of ['light', 'dark']) {
        const theme = themes[mode]
        if (!theme || !theme.palettes) continue

        const palettes = theme.palettes
        const paletteKeys = Object.keys(palettes).filter(k => k !== 'core-colors')

        // Shuffle available scales and assign unique scales to each palette
        // Use a proper shuffle algorithm to ensure different results each time
        const shuffledScales = [...availableScales]
        for (let i = shuffledScales.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledScales[i], shuffledScales[j]] = [shuffledScales[j], shuffledScales[i]]
        }
        const scaleAssignments = new Map<string, string>()

        // Assign unique scales to existing palettes
        for (let i = 0; i < paletteKeys.length && i < shuffledScales.length; i++) {
          scaleAssignments.set(paletteKeys[i], shuffledScales[i])
        }

        // Update each palette to use its assigned scale
        const levels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000']
        const defaultLevels = ['100', '200', '300', '400', '500', '600', '700', '800']

        for (const paletteKey of paletteKeys) {
          const palette = palettes[paletteKey]
          if (!palette || typeof palette !== 'object') continue

          const assignedScale = scaleAssignments.get(paletteKey)
          if (!assignedScale) continue

          // Pick a random level from the scale to use for all on-tone values
          const onToneLevels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000']
          const randomOnToneLevel = onToneLevels[Math.floor(Math.random() * onToneLevels.length)]
          const onToneToken = `{tokens.colors.${assignedScale}.${randomOnToneLevel}}`

          // Update all levels to use the new scale
          for (const levelKey of levels) {
            if (!palette[levelKey]) continue
            const level = palette[levelKey]
            if (level && typeof level === 'object' && level.color) {
              if (level.color.tone) {
                level.color.tone.$value = `{tokens.colors.${assignedScale}.${levelKey}}`
              }
              // Set all on-tone values to the same random token from the assigned scale
              if (level.color['on-tone']) {
                level.color['on-tone'].$value = onToneToken
              }
            }
          }

          // Randomly choose a default level (primary level)
          const randomDefaultLevel = defaultLevels[Math.floor(Math.random() * defaultLevels.length)]

          // Ensure default structure exists
          if (!palette.default) {
            palette.default = {
              $type: 'color',
              $value: `{brand.palettes.${paletteKey}.${randomDefaultLevel}}`
            }
          } else {
            palette.default.$value = `{brand.palettes.${paletteKey}.${randomDefaultLevel}}`
          }

          // Also set the primary level in localStorage (mode-specific)
          // This is what the UI uses to determine which level is the "primary" for the palette
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(`palette-primary-level:${paletteKey}:${mode}`, JSON.stringify(randomDefaultLevel))
            }
          } catch (err) {
            // Ignore localStorage errors
          }

          // Dispatch event to notify PaletteGrid components to re-read primary level from localStorage
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
                detail: { paletteKey, mode, level: randomDefaultLevel }
              }))
            }
          } catch (err) {
            // Ignore event dispatch errors
          }
        }

        // Add or delete palettes based on scale count
        // If palettes < scales: add a palette using an unused scale
        // If palettes == scales: delete a palette
        if (paletteKeys.length < availableScales.length) {
          // Find an unused scale (not in scaleAssignments)
          const usedScales = new Set(scaleAssignments.values())
          const unusedScales = availableScales.filter(scale => !usedScales.has(scale))

          if (unusedScales.length > 0) {
            const newPaletteScale = unusedScales[0]
            const existingPaletteNumbers = paletteKeys
              .filter(k => k.startsWith('palette-'))
              .map(k => parseInt(k.replace('palette-', '')))
              .filter(n => !isNaN(n))
            const nextPaletteNumber = existingPaletteNumbers.length > 0
              ? Math.max(...existingPaletteNumbers) + 1
              : 1
            const newPaletteKey = `palette-${nextPaletteNumber}`

            // Pick a random level from the scale to use for all on-tone values
            const onToneLevels = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000']
            const randomOnToneLevel = onToneLevels[Math.floor(Math.random() * onToneLevels.length)]
            const onToneToken = `{tokens.colors.${newPaletteScale}.${randomOnToneLevel}}`

            // Create new palette structure
            const newPalette: any = {}
            for (const levelKey of levels) {
              newPalette[levelKey] = {
                color: {
                  $type: 'color',
                  tone: {
                    $value: `{tokens.colors.${newPaletteScale}.${levelKey}}`
                  },
                  'on-tone': {
                    $value: onToneToken
                  }
                }
              }
            }

            // Set random default level (primary level)
            const randomDefaultLevel = defaultLevels[Math.floor(Math.random() * defaultLevels.length)]
            newPalette.default = {
              $type: 'color',
              $value: `{brand.palettes.${newPaletteKey}.${randomDefaultLevel}}`
            }

            // Also set the primary level in localStorage (mode-specific)
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(`palette-primary-level:${newPaletteKey}:${mode}`, JSON.stringify(randomDefaultLevel))
              }
            } catch (err) {
              // Ignore localStorage errors
            }

            // Dispatch event to notify PaletteGrid components to re-read primary level from localStorage
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
                  detail: { paletteKey: newPaletteKey, mode, level: randomDefaultLevel }
                }))
              }
            } catch (err) {
              // Ignore event dispatch errors
            }

            palettes[newPaletteKey] = newPalette

            // Also add to palettesState.dynamic so the UI displays it
            // Only do this once per palette (e.g., in light mode)
            if (mode === 'light') {
              const currentPalettesState = store.getState().palettes
              const existingPaletteKeys = new Set(currentPalettesState.dynamic.map(p => p.key))
              if (!existingPaletteKeys.has(newPaletteKey)) {
                const newPaletteEntry = {
                  key: newPaletteKey,
                  title: `Palette ${nextPaletteNumber}`,
                  defaultLevel: parseInt(randomDefaultLevel),
                  initialFamily: newPaletteScale
                }
                const updatedDynamic = [...currentPalettesState.dynamic, newPaletteEntry]
                store.setPalettes({ ...currentPalettesState, dynamic: updatedDynamic })
              }
            }
          }
        } else if (paletteKeys.length === availableScales.length) {
          // Delete a palette if palettes == scales (delete the last palette-* one, but keep neutral)
          const paletteToDelete = paletteKeys
            .filter(k => k.startsWith('palette-'))
            .sort()
            .pop()
          if (paletteToDelete) {
            delete palettes[paletteToDelete]

            // Also remove from palettesState.dynamic so the UI updates
            // Only do this once (e.g., in light mode)
            if (mode === 'light') {
              const currentPalettesState = store.getState().palettes
              const updatedDynamic = currentPalettesState.dynamic.filter(p => p.key !== paletteToDelete)
              store.setPalettes({ ...currentPalettesState, dynamic: updatedDynamic })

              // Dispatch event for AA compliance watcher
              try {
                window.dispatchEvent(new CustomEvent('paletteDeleted', { detail: { key: paletteToDelete } }))
              } catch { }
            }
          }
        }

        // Dispatch a general event after all palettes are randomized for the current mode
        // This ensures all PaletteGrid components re-read their primary levels
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
              detail: { allPalettes: true, mode }
            }))
          }
        } catch (err) {
          // Ignore event dispatch errors
        }
      }
    }

    // If elevations were randomized, build elevation state from modifiedTheme BEFORE setTheme
    // This ensures elevation state is ready when setTheme triggers recomputeAndApplyAll()
    let newElevationState: any = null
    if (opts.theme.elevations) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          // Clear elevation state from localStorage - it will be rebuilt from the randomized theme
          const STORAGE_KEYS = {
            elevation: 'recursica-elevation-state'
          }
          localStorage.removeItem(STORAGE_KEYS.elevation)
          localStorage.removeItem('elevation-color-tokens')
          localStorage.removeItem('elevation-alpha-tokens')
          localStorage.removeItem('elevation-palette-selections')
          localStorage.removeItem('elevation-directions')

          // Access the private initElevationState method to rebuild elevation state from modifiedTheme
          const storeAny = store as any
          if (storeAny?.initElevationState && typeof storeAny.initElevationState === 'function') {
            const currentState = store.getState()
            // Build elevation state from modifiedTheme directly (before it's set in store)
            // Pass true as third parameter to force rebuilding from theme, ignoring localStorage
            const updatedElevation = storeAny.initElevationState(modifiedTheme, currentState.tokens, true)

            // CRITICAL: Update the token values that CSS variables reference
            // The elevation controls have the correct values, but the tokens themselves need to be updated
            for (let i = 0; i <= 4; i++) {
              const k = `elevation-${i}`
              const ctrl = updatedElevation.controls[k]
              if (ctrl) {
                const blurTokenName = updatedElevation.blurTokens[k] || `size/elevation-${i}-blur`
                const spreadTokenName = updatedElevation.spreadTokens[k] || `size/elevation-${i}-spread`
                const offsetXTokenName = updatedElevation.offsetXTokens[k] || `size/elevation-${i}-offset-x`
                const offsetYTokenName = updatedElevation.offsetYTokens[k] || `size/elevation-${i}-offset-y`

                // Update token values to match the randomized elevation controls
                try {
                  store.updateToken(blurTokenName, ctrl.blur)
                  store.updateToken(spreadTokenName, ctrl.spread)
                  store.updateToken(offsetXTokenName, ctrl.offsetX)
                  store.updateToken(offsetYTokenName, ctrl.offsetY)
                } catch (e) {
                  // Failed to update tokens, continue with other elevations
                }
              }
            }

            // Ensure we create a completely new elevation state object so React detects the change
            // Deep clone to ensure all nested objects are new references
            newElevationState = JSON.parse(JSON.stringify(updatedElevation))
          }
        }
      } catch (err) {
        // Error building elevation state, continue without elevation state update
      }
    }

    // Update store with modified theme AND elevation state together
    // This ensures both are set before recomputeAndApplyAll() runs

    if (newElevationState) {
      // Set both theme and elevation state together using writeState directly
      const storeAny = store as any
      if (storeAny.writeState) {
        storeAny.writeState({ theme: modifiedTheme, elevation: newElevationState }, false)
      } else {
        // Fallback: set theme first, then elevation
        store.setTheme(modifiedTheme)
        store.setElevation(newElevationState)
      }
    } else {
      store.setTheme(modifiedTheme)
    }
  }

  // Modify UIKit - directly modify JSON structure
  const modifiedUiKit = JSON.parse(JSON.stringify(initialUiKit)) as JsonLike
  if (shouldRandomizeUIKit) {
    uikitValuePaths.forEach(({ path, value }, index) => {
      // Determine component name from path
      let componentName = ''
      const componentsIndex = path.indexOf('components')
      if (componentsIndex !== -1 && componentsIndex + 1 < path.length) {
        componentName = path[componentsIndex + 1]
      }

      // Check granular selection using path matching (most specific to least specific)
      // Path keys in opts.uikit.components are dot-separated relative to 'components'
      // e.g., 'button.variants.styles.default'
      const pathAfterComponents = path.slice(componentsIndex + 1)
      let isSelected = false
      const segments = [...pathAfterComponents]

      // Look for the most specific matching key in the options
      while (segments.length > 0) {
        const key = segments.join('.')
        if (key in opts.uikit.components) {
          isSelected = opts.uikit.components[key]
          break
        }
        segments.pop()
      }

      // If explicitly unselected or strictly not selected (and no parent selected), skip
      // Note: RandomizeOptionsModal ensures parents usually control children, but partial selection
      // results in 'false' parents with 'true' children. Longest match handles this correctly.
      if (!isSelected) {
        return
      }

      // Skip token/brand references IF explicitly requested (but for components we usually want to randomize them)
      // We will allow randomization of token references for component properties
      /* 
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return
      }
      */
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
      const isColor = pathStr.includes('color') || pathStr.includes('background') || pathStr.includes('fill') || pathStr.includes('surface') || pathStr.includes('stroke') || pathStr.includes('shadow') || pathStr.includes('tint')

      const isBorder = pathStr.includes('border-size') || pathStr.includes('border-width') || pathStr.includes('divider-size') || pathStr.includes('thickness')
      const isRadius = pathStr.includes('radius')
      const isGap = pathStr.includes('gap') || pathStr.includes('gutter')
      const isIconSize = pathStr.includes('icon-size') || pathStr.includes('icon.size')
      const isPadding = pathStr.includes('padding')
      const isElevation = pathStr.includes('elevation')
      const isOpacity = pathStr.includes('opacity') || pathStr.includes('disabled') || pathStr.includes('emphasis')
      const isLetterSpacing = pathStr.includes('letter-spacing')
      const isLineHeight = pathStr.includes('line-height')
      const isFontWeight = pathStr.includes('font-weight')
      const isFontSize = pathStr.includes('font-size') || (pathStr.includes('font') && pathStr.includes('size'))

      const isSize = isBorder || isRadius || isGap || isIconSize || isPadding || pathStr.includes('size') || pathStr.includes('height') || pathStr.includes('width')

      let maxSize = 100
      if (isBorder) maxSize = 8
      else if (isRadius) maxSize = 32
      else if (isIconSize) maxSize = 48
      else if (isGap || isPadding) maxSize = 64
      else if (isFontSize) maxSize = 48
      else if (pathStr.includes('width') || pathStr.includes('height')) maxSize = 400

      const newValue = generateRandomValue(value, index, {
        isColor,
        isSize,
        isElevation,
        isOpacity,
        isLetterSpacing,
        isLineHeight,
        isFontWeight,
        isFontSize,
        maxSize,
        randomizeTokenRef: true
      })
      modifyValueAtPath(modifiedUiKit, path, newValue)
    })

    // Update store with modified uikit
    // setUiKit will trigger recomputeAndApplyAll() internally
    store.setUiKit(modifiedUiKit)
  }

  // Now trigger recomputation once after all updates are complete
  // This ensures we're reading from the fully updated state
  // Use a longer delay to ensure setTheme's and setElevation's automatic recomputations complete first
  // If elevations were randomized, use a slightly longer delay to ensure elevation state update completes
  const recomputeDelay = opts.theme.elevations ? 150 : 100
  setTimeout(() => {
    // Force a recomputation to ensure all CSS variables are up to date
    // This will use the updated elevation state with randomized values
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

      // Dispatch cssVarsUpdated event - include overlay CSS variables if core properties were randomized
      // Also include elevation CSS variables if elevations were randomized
      const cssVarsToNotify: string[] = []

      if (opts.theme.coreProperties) {
        cssVarsToNotify.push(
          '--recursica-brand-themes-light-state-overlay-color',
          '--recursica-brand-themes-light-state-overlay-opacity',
          '--recursica-brand-themes-dark-state-overlay-color',
          '--recursica-brand-themes-dark-state-overlay-opacity'
        )
      }

      if (opts.theme.elevations) {
        // Include all elevation CSS variables for both light and dark modes
        for (const themeMode of ['light', 'dark'] as const) {
          for (let i = 0; i <= 4; i++) {
            cssVarsToNotify.push(
              `--recursica-brand-themes-${themeMode}-elevations-elevation-${i}-x-axis`,
              `--recursica-brand-themes-${themeMode}-elevations-elevation-${i}-y-axis`,
              `--recursica-brand-themes-${themeMode}-elevations-elevation-${i}-blur`,
              `--recursica-brand-themes-${themeMode}-elevations-elevation-${i}-spread`,
              `--recursica-brand-themes-${themeMode}-elevations-elevation-${i}-shadow-color`
            )
          }
        }
      }

      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: cssVarsToNotify }
      }))

      // AA compliance is now trigger-based, no need to re-enable watchers
    }, 300)
  }, 100)
}
