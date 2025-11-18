/**
 * JSON Export Utility
 * 
 * Converts current CSS variables back to JSON structure matching
 * the original tokens.json, brand.json, and uikit.json files.
 */

import { readCssVar } from '../css/readCssVar'
import { resolveCssVarToHex } from '../compliance/layerColorStepping'
import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'
import uikitJson from '../../vars/UIKit.json'

/**
 * Gets all CSS variables from the DOM
 */
function getAllCssVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  const root = document.documentElement
  const computed = getComputedStyle(root)
  
  // Read from inline styles
  for (let i = 0; i < root.style.length; i++) {
    const prop = root.style[i]
    if (prop && prop.startsWith('--recursica-')) {
      const value = root.style.getPropertyValue(prop).trim()
      if (value) vars[prop] = value
    }
  }
  
  // Also check computed styles for any we might have missed
  const allComputed = Array.from(document.styleSheets)
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules)
      } catch {
        return []
      }
    })
    .filter(rule => rule instanceof CSSStyleRule)
    .flatMap(rule => {
      const styleRule = rule as CSSStyleRule
      return Array.from(styleRule.style)
        .filter(prop => prop.startsWith('--recursica-'))
        .map(prop => ({
          name: prop,
          value: computed.getPropertyValue(prop).trim()
        }))
    })
  
  allComputed.forEach(({ name, value }) => {
    if (value && !vars[name]) {
      vars[name] = value
    }
  })
  
  return vars
}

/**
 * Converts a CSS variable reference to a token reference string
 */
function cssVarToTokenRef(cssVar: string): string | null {
  const varMatch = cssVar.match(/var\s*\(\s*(--recursica-tokens-([^)]+))\s*\)/)
  if (!varMatch) return null
  
  const path = varMatch[2]
  // Convert --recursica-tokens-color-gray-500 to tokens.color.gray.500
  const parts = path.split('-')
  
  if (parts[0] === 'tokens') {
    parts.shift() // Remove 'tokens'
  }
  
  // Handle color tokens: color-gray-500 -> color.gray.500
  if (parts[0] === 'color' && parts.length >= 3) {
    const family = parts[1]
    const level = parts.slice(2).join('-') // Handle levels like '0-5x'
    return `{tokens.color.${family}.${level}}`
  }
  
  // Handle size tokens: size-default -> size.default
  if (parts[0] === 'size' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.size.${name}}`
  }
  
  // Handle opacity tokens: opacity-solid -> opacity.solid
  if (parts[0] === 'opacity' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.opacity.${name}}`
  }
  
  // Handle font tokens: font-size-md -> font.size.md
  if (parts[0] === 'font' && parts.length >= 3) {
    const category = parts[1]
    const key = parts.slice(2).join('-')
    return `{tokens.font.${category}.${key}}`
  }
  
  return null
}

/**
 * Converts a CSS variable reference to a brand reference string
 */
function cssVarToBrandRef(cssVar: string): string | null {
  const varMatch = cssVar.match(/var\s*\(\s*(--recursica-brand-([^)]+))\s*\)/)
  if (!varMatch) return null
  
  const path = varMatch[2]
  const parts = path.split('-')
  
  if (parts[0] !== 'brand') {
    parts.unshift('brand')
  }
  
  // Handle brand paths: light-palettes-neutral-100-tone -> brand.themes.light.palettes.neutral.100.color.tone
  if (parts.length >= 2 && (parts[1] === 'light' || parts[1] === 'dark')) {
    const mode = parts[1]
    parts.shift() // Remove 'brand'
    parts.shift() // Remove mode
    
    // Reconstruct path
    let jsonPath = `brand.themes.${mode}`
    
    // Handle palettes
    if (parts[0] === 'palettes' && parts.length >= 4) {
      parts.shift() // Remove 'palettes'
      const paletteKey = parts[0]
      const level = parts[1]
      const type = parts.slice(2).join('-') // tone, on-tone, etc.
      
      if (type === 'tone' || type === 'on-tone') {
        return `{brand.themes.${mode}.palettes.${paletteKey}.${level}.color.${type}}`
      }
      
      return `{brand.themes.${mode}.palettes.${paletteKey}.${level}.${type}}`
    }
    
    // Handle layers
    if (parts[0] === 'layer' && parts.length >= 3) {
      parts.shift() // Remove 'layer'
      parts.shift() // Remove 'layer' (layer-layer-X)
      const layerId = parts[0]
      parts.shift() // Remove layer ID
      
      if (parts[0] === 'property') {
        parts.shift() // Remove 'property'
        const propPath = parts.join('.')
        return `{brand.themes.${mode}.layers.${layerId}.property.${propPath}}`
      }
      
      if (parts[0] === 'property' && parts[1] === 'element') {
        parts.shift() // Remove 'property'
        parts.shift() // Remove 'element'
        const elementPath = parts.join('.')
        return `{brand.themes.${mode}.layers.${layerId}.element.${elementPath}}`
      }
    }
    
    // Handle other brand paths
    return `{brand.themes.${mode}.${parts.join('.')}}`
  }
  
  // Handle brand-level paths (no mode): dimensions, typography, etc.
  if (parts[0] === 'brand' && parts.length >= 2) {
    parts.shift() // Remove 'brand'
    return `{brand.${parts.join('.')}}`
  }
  
  return null
}

/**
 * Converts a CSS value to JSON value format
 */
function cssValueToJsonValue(
  cssValue: string,
  type: string,
  tokenIndex: ReturnType<typeof buildTokenIndex>
): any {
  if (!cssValue) return undefined
  
  // Check if it's a token reference
  const tokenRef = cssVarToTokenRef(cssValue)
  if (tokenRef) return tokenRef
  
  // Check if it's a brand reference
  const brandRef = cssVarToBrandRef(cssValue)
  if (brandRef) return brandRef
  
  // Handle different types
  switch (type) {
    case 'color': {
      // Try to resolve to hex
      const hex = resolveCssVarToHex(cssValue, tokenIndex as any)
      if (hex) return hex
      // If it's already a hex, return it
      if (/^#?[0-9a-f]{6}$/i.test(cssValue.trim())) {
        const h = cssValue.trim().toLowerCase()
        return h.startsWith('#') ? h : `#${h}`
      }
      return cssValue
    }
    
    case 'dimension': {
      // Extract value and unit from CSS value like "16px"
      const match = cssValue.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/)
      if (match) {
        const value = parseFloat(match[1])
        const unit = match[2] || 'px'
        return { value, unit }
      }
      return cssValue
    }
    
    case 'number': {
      const num = parseFloat(cssValue)
      return Number.isFinite(num) ? num : cssValue
    }
    
    default:
      return cssValue
  }
}

/**
 * Sets a nested value in an object using a path string
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.')
  let current = obj
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!current[part]) {
      current[part] = {}
    }
    current = current[part]
  }
  
  current[parts[parts.length - 1]] = value
}

/**
 * Exports tokens.json from current CSS variables
 */
export function exportTokensJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const result = JSON.parse(JSON.stringify(tokensJson)) as any
  
  // Process token CSS variables
  Object.entries(vars).forEach(([cssVar, cssValue]) => {
    if (!cssVar.startsWith('--recursica-tokens-')) return
    
    const path = cssVar.replace('--recursica-tokens-', '').split('-')
    
    // Handle color tokens: color-gray-500
    if (path[0] === 'color' && path.length >= 3) {
      const family = path[1]
      const level = path.slice(2).join('-')
      
      if (result.tokens?.color?.[family]?.[level]) {
        const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.color[family][level].$value = jsonValue
        }
      }
    }
    
    // Handle size tokens: size-default
    if (path[0] === 'size' && path.length >= 2) {
      const name = path.slice(1).join('-')
      
      if (result.tokens?.size?.[name]) {
        const jsonValue = cssValueToJsonValue(cssValue, 'dimension', tokenIndex)
        if (jsonValue !== undefined) {
          if (typeof result.tokens.size[name] === 'object' && '$value' in result.tokens.size[name]) {
            result.tokens.size[name].$value = jsonValue
          } else {
            result.tokens.size[name] = jsonValue
          }
        }
      }
    }
    
    // Handle opacity tokens: opacity-solid
    if (path[0] === 'opacity' && path.length >= 2) {
      const name = path.slice(1).join('-')
      
      if (result.tokens?.opacity?.[name]) {
        const jsonValue = cssValueToJsonValue(cssValue, 'number', tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.opacity[name].$value = jsonValue
        }
      }
    }
    
    // Handle font tokens: font-size-md, font-weight-bold, etc.
    if (path[0] === 'font' && path.length >= 3) {
      const category = path[1]
      const key = path.slice(2).join('-')
      
      if (result.tokens?.font?.[category]?.[key]) {
        const type = category === 'size' ? 'dimension' : 'number'
        const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
        if (jsonValue !== undefined) {
          if (typeof result.tokens.font[category][key] === 'object' && '$value' in result.tokens.font[category][key]) {
            result.tokens.font[category][key].$value = jsonValue
          } else {
            result.tokens.font[category][key] = jsonValue
          }
        }
      }
    }
  })
  
  return result
}

/**
 * Exports brand.json from current CSS variables
 */
export function exportBrandJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const result = JSON.parse(JSON.stringify(brandJson)) as any
  
  // Process brand CSS variables
  Object.entries(vars).forEach(([cssVar, cssValue]) => {
    if (!cssVar.startsWith('--recursica-brand-')) return
    
    const path = cssVar.replace('--recursica-brand-', '').split('-')
    
    // Handle mode-specific paths: light-palettes-neutral-100-tone
    if (path.length >= 2 && (path[0] === 'light' || path[0] === 'dark')) {
      const mode = path[0]
      path.shift() // Remove mode
      
      // Handle palettes: palettes-neutral-100-tone
      if (path[0] === 'palettes' && path.length >= 4) {
        path.shift() // Remove 'palettes'
        const paletteKey = path[0]
        const level = path[1]
        const type = path.slice(2).join('-') // tone, on-tone, etc.
        
        if (result.brand?.themes?.[mode]?.palettes?.[paletteKey]?.[level]) {
          if (type === 'tone' || type === 'on-tone') {
            if (!result.brand.themes[mode].palettes[paletteKey][level].color) {
              result.brand.themes[mode].palettes[paletteKey][level].color = {}
            }
            const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
            if (jsonValue !== undefined) {
              if (!result.brand.themes[mode].palettes[paletteKey][level].color[type]) {
                result.brand.themes[mode].palettes[paletteKey][level].color[type] = { $type: 'color', $value: jsonValue }
              } else {
                result.brand.themes[mode].palettes[paletteKey][level].color[type].$value = jsonValue
              }
            }
          }
        }
      }
      
      // Handle layers: layer-layer-0-property-surface
      if (path[0] === 'layer' && path[1] === 'layer' && path.length >= 4) {
        path.shift() // Remove 'layer'
        path.shift() // Remove 'layer'
        const layerId = path[0]
        path.shift() // Remove layer ID
        
        if (path[0] === 'property') {
          path.shift() // Remove 'property'
          const propName = path.join('-')
          
          if (result.brand?.themes?.[mode]?.layers?.[layerId]?.property) {
            const propType = propName.includes('color') ? 'color' : 
                            propName.includes('radius') || propName.includes('padding') || propName.includes('thickness') ? 'number' :
                            propName === 'elevation' ? 'elevation' : 'color'
            
            const jsonValue = cssValueToJsonValue(cssValue, propType, tokenIndex)
            if (jsonValue !== undefined) {
              if (!result.brand.themes[mode].layers[layerId].property[propName]) {
                result.brand.themes[mode].layers[layerId].property[propName] = { $type: propType, $value: jsonValue }
              } else {
                result.brand.themes[mode].layers[layerId].property[propName].$value = jsonValue
              }
            }
          }
        }
        
        if (path[0] === 'property' && path[1] === 'element') {
          path.shift() // Remove 'property'
          path.shift() // Remove 'element'
          const elementPath = path.join('-')
          
          // Handle nested element paths like text-color, interactive-tone
          const parts = elementPath.split('-')
          if (parts.length >= 2) {
            const elementType = parts[0] // text, interactive
            const elementProp = parts.slice(1).join('-') // color, tone, etc.
            
            if (result.brand?.themes?.[mode]?.layers?.[layerId]?.element?.[elementType]) {
              const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
              if (jsonValue !== undefined) {
                if (!result.brand.themes[mode].layers[layerId].element[elementType][elementProp]) {
                  result.brand.themes[mode].layers[layerId].element[elementType][elementProp] = { $type: 'color', $value: jsonValue }
                } else {
                  result.brand.themes[mode].layers[layerId].element[elementType][elementProp].$value = jsonValue
                }
              }
            }
          }
        }
      }
    }
    
    // Handle brand-level paths (no mode): dimensions, typography, etc.
    if (path[0] === 'dimensions' || path[0] === 'typography' || path[0] === 'layout-grid') {
      // These are handled separately or may not have CSS vars
    }
  })
  
  return result
}

/**
 * Exports uikit.json from current CSS variables
 */
export function exportUIKitJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const result = JSON.parse(JSON.stringify(uikitJson)) as any
  
  // Process UIKit CSS variables
  Object.entries(vars).forEach(([cssVar, cssValue]) => {
    if (!cssVar.startsWith('--recursica-ui-kit-')) return
    
    const path = cssVar.replace('--recursica-ui-kit-', '').split('-')
    
    // Handle global paths: global-icon-style
    if (path[0] === 'global' && path.length >= 2) {
      path.shift() // Remove 'global'
      const globalPath = path.join('.')
      
      // Navigate to the path in result.ui-kit.global
      const parts = globalPath.split('.')
      let current = result['ui-kit']?.global
      
      if (current) {
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {}
          }
          current = current[parts[i]]
        }
        
        const lastPart = parts[parts.length - 1]
        if (current[lastPart]) {
          const type = cssValue.includes('var') ? 'string' : 
                      /^\d+px$/.test(cssValue) ? 'dimension' : 'string'
          const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
          if (jsonValue !== undefined && typeof current[lastPart] === 'object' && '$value' in current[lastPart]) {
            current[lastPart].$value = jsonValue
          }
        }
      }
    }
    
    // Handle component paths: components-button-color-layer-0-background-solid
    if (path[0] === 'components' && path.length >= 4) {
      path.shift() // Remove 'components'
      const componentName = path[0]
      path.shift() // Remove component name
      
      const category = path[0] // color, size
      path.shift() // Remove category
      
      const componentPath = path.join('.')
      
      // Navigate to the path in result.ui-kit.components[componentName][category]
      const parts = componentPath.split('.')
      let current = result['ui-kit']?.components?.[componentName]?.[category]
      
      if (current) {
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {}
          }
          current = current[parts[i]]
        }
        
        const lastPart = parts[parts.length - 1]
        if (current[lastPart]) {
          const type = category === 'color' ? 'color' : 'dimension'
          const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
          if (jsonValue !== undefined && typeof current[lastPart] === 'object' && '$value' in current[lastPart]) {
            current[lastPart].$value = jsonValue
          }
        }
      }
    }
  })
  
  return result
}

/**
 * Downloads a JSON file
 */
function downloadJsonFile(json: object, filename: string): void {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Downloads all three JSON files (tokens, brand, uikit)
 */
export function downloadJsonFiles(): void {
  const tokens = exportTokensJson()
  const brand = exportBrandJson()
  const uikit = exportUIKitJson()
  
  downloadJsonFile(tokens, 'tokens.json')
  setTimeout(() => downloadJsonFile(brand, 'brand.json'), 100)
  setTimeout(() => downloadJsonFile(uikit, 'uikit.json'), 200)
}

