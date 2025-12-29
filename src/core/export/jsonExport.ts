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
import { getVarsStore } from '../store/varsStore'

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
        return `{brand.themes.${mode}.layers.${layerId}.properties.${propPath}}`
      }
      
      if (parts[0] === 'property' && parts[1] === 'element') {
        parts.shift() // Remove 'property'
        parts.shift() // Remove 'element'
        const elementPath = parts.join('.')
        return `{brand.themes.${mode}.layers.${layerId}.elements.${elementPath}}`
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
 * Exports tokens.json from current CSS variables ONLY
 * Only includes tokens that exist in the store AND have corresponding CSS variables
 */
export function exportTokensJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const store = getVarsStore()
  const storeState = store.getState()
  const storeTokens = (storeState.tokens as any)?.tokens || {}
  
  const result: any = {
    tokens: {
      color: {},
      size: {},
      opacity: {},
      font: {}
    }
  }
  
  // Process token CSS variables - only include what exists in store AND CSS vars
  Object.entries(vars).forEach(([cssVar, cssValue]) => {
    if (!cssVar.startsWith('--recursica-tokens-')) return
    
    const path = cssVar.replace('--recursica-tokens-', '').split('-')
    
    // Handle color tokens: color-gray-500
    if (path[0] === 'color' && path.length >= 3) {
      const family = path[1]
      const level = path.slice(2).join('-')
      
      // Only export if this color family and level exists in the store
      if (storeTokens.color?.[family]?.[level]) {
        if (!result.tokens.color[family]) {
          result.tokens.color[family] = {}
        }
        
        const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.color[family][level] = {
            $type: 'color',
            $value: jsonValue
          }
        }
      }
    }
    
    // Handle size tokens: size-default
    if (path[0] === 'size' && path.length >= 2) {
      const name = path.slice(1).join('-')
      
      // Only export if this size token exists in the store
      if (storeTokens.size?.[name]) {
        const jsonValue = cssValueToJsonValue(cssValue, 'dimension', tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.size[name] = {
            $type: 'dimension',
            $value: jsonValue
          }
        }
      }
    }
    
    // Handle opacity tokens: opacity-solid
    if (path[0] === 'opacity' && path.length >= 2) {
      const name = path.slice(1).join('-')
      
      // Only export if this opacity token exists in the store
      if (storeTokens.opacity?.[name]) {
        const jsonValue = cssValueToJsonValue(cssValue, 'number', tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.opacity[name] = {
            $type: 'number',
            $value: jsonValue
          }
        }
      }
    }
    
    // Handle font tokens: font-size-md, font-weight-bold, etc.
    if (path[0] === 'font' && path.length >= 3) {
      const category = path[1]
      const key = path.slice(2).join('-')
      
      // Only export if this font token exists in the store
      if (storeTokens.font?.[category]?.[key]) {
        if (!result.tokens.font[category]) {
          result.tokens.font[category] = {}
        }
        
        const type = category === 'size' ? 'dimension' : 'number'
        const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
        if (jsonValue !== undefined) {
          result.tokens.font[category][key] = {
            $type: type,
            $value: jsonValue
          }
        }
      }
    }
  })
  
  // Remove empty sections
  if (Object.keys(result.tokens.color).length === 0) delete result.tokens.color
  if (Object.keys(result.tokens.size).length === 0) delete result.tokens.size
  if (Object.keys(result.tokens.opacity).length === 0) delete result.tokens.opacity
  if (Object.keys(result.tokens.font).length === 0) delete result.tokens.font
  
  return result
}

/**
 * Exports brand.json from current CSS variables ONLY
 * Only includes brand data that has corresponding CSS variables
 */
export function exportBrandJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const result: any = {
    brand: {
      themes: {
        light: { palettes: {}, layers: {} },
        dark: { palettes: {}, layers: {} }
      }
    }
  }
  
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
        
        // Build structure from CSS vars only
        if (!result.brand.themes[mode].palettes[paletteKey]) {
          result.brand.themes[mode].palettes[paletteKey] = {}
        }
        if (!result.brand.themes[mode].palettes[paletteKey][level]) {
          result.brand.themes[mode].palettes[paletteKey][level] = {}
        }
        
        if (type === 'tone' || type === 'on-tone') {
          if (!result.brand.themes[mode].palettes[paletteKey][level].color) {
            result.brand.themes[mode].palettes[paletteKey][level].color = {}
          }
          const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
          if (jsonValue !== undefined) {
            result.brand.themes[mode].palettes[paletteKey][level].color[type] = { 
              $type: 'color', 
              $value: jsonValue 
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
        
        // Build structure from CSS vars only
        if (!result.brand.themes[mode].layers[layerId]) {
          result.brand.themes[mode].layers[layerId] = { properties: {}, elements: {} }
        }
        if (!result.brand.themes[mode].layers[layerId].properties) {
          result.brand.themes[mode].layers[layerId].properties = {}
        }
        if (!result.brand.themes[mode].layers[layerId].elements) {
          result.brand.themes[mode].layers[layerId].elements = {}
        }
        
        if (path[0] === 'property') {
          path.shift() // Remove 'property'
          const propName = path.join('-')
          
          const propType = propName.includes('color') ? 'color' : 
                          propName.includes('radius') || propName.includes('padding') || propName.includes('thickness') ? 'number' :
                          propName === 'elevation' ? 'elevation' : 'color'
          
          const jsonValue = cssValueToJsonValue(cssValue, propType, tokenIndex)
          if (jsonValue !== undefined) {
            result.brand.themes[mode].layers[layerId].properties[propName] = { 
              $type: propType, 
              $value: jsonValue 
            }
          }
        } else if (path[0] === 'element') {
          path.shift() // Remove 'element'
          const elementPath = path.join('-')
          
          // Handle nested element paths like text-color, interactive-tone
          const parts = elementPath.split('-')
          if (parts.length >= 2) {
            const elementType = parts[0] // text, interactive
            const elementProp = parts.slice(1).join('-') // color, tone, etc.
            
            if (!result.brand.themes[mode].layers[layerId].elements[elementType]) {
              result.brand.themes[mode].layers[layerId].elements[elementType] = {}
            }
            
            const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
            if (jsonValue !== undefined) {
              result.brand.themes[mode].layers[layerId].elements[elementType][elementProp] = { 
                $type: 'color', 
                $value: jsonValue 
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
 * Exports uikit.json from current CSS variables ONLY
 * Only includes UIKit data that has corresponding CSS variables
 */
export function exportUIKitJson(): object {
  const vars = getAllCssVars()
  const tokenIndex = buildTokenIndex(tokensJson as JsonLike)
  const result: any = {
    'ui-kit': {
      globals: {},
      components: {}
    }
  }
  
  // Process UIKit CSS variables
  Object.entries(vars).forEach(([cssVar, cssValue]) => {
    if (!cssVar.startsWith('--recursica-ui-kit-')) return
    
    const path = cssVar.replace('--recursica-ui-kit-', '').split('-')
    
    // Handle global paths: globals-icon-style
    if (path[0] === 'globals' && path.length >= 2) {
      path.shift() // Remove 'globals'
      const globalPath = path.join('.')
      
      // Build structure from CSS vars only
      const parts = globalPath.split('.')
      let current = result['ui-kit'].globals
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }
      
      const lastPart = parts[parts.length - 1]
      const type = cssValue.includes('var') ? 'string' : 
                  /^\d+px$/.test(cssValue) ? 'dimension' : 'string'
      const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
      if (jsonValue !== undefined) {
        current[lastPart] = {
          $type: type,
          $value: jsonValue
        }
      }
    }
    
    // Handle component paths: components-button-color-layer-0-background-solid
    if (path[0] === 'components' && path.length >= 4) {
      path.shift() // Remove 'components'
      const componentName = path[0]
      path.shift() // Remove component name
      
      let category = path[0] // colors, size
      path.shift() // Remove category
      
      // Map CSS variable category to JSON structure
      // CSS vars use "size" but JSON uses "sizes"
      // CSS vars use "colors" but JSON uses "variants" (colors are inside variants)
      const jsonCategory = category === 'size' ? 'sizes' : category === 'colors' ? 'variants' : category
      
      const componentPath = path.join('.')
      
      // Build structure from CSS vars only
      if (!result['ui-kit'].components[componentName]) {
        result['ui-kit'].components[componentName] = {}
      }
      if (!result['ui-kit'].components[componentName][jsonCategory]) {
        result['ui-kit'].components[componentName][jsonCategory] = {}
      }
      
      const parts = componentPath.split('.')
      let current = result['ui-kit'].components[componentName][jsonCategory]
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }
      
      const lastPart = parts[parts.length - 1]
      const type = category === 'colors' ? 'color' : 'dimension'
      const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
      if (jsonValue !== undefined) {
        current[lastPart] = {
          $type: type,
          $value: jsonValue
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
 * Downloads selected JSON files
 */
export function downloadJsonFiles(files: { tokens?: boolean; brand?: boolean; uikit?: boolean } = { tokens: true, brand: true, uikit: true }): void {
  let delay = 0
  
  if (files.tokens) {
    const tokens = exportTokensJson()
    downloadJsonFile(tokens, 'tokens.json')
    delay += 100
  }
  
  if (files.brand) {
    const brand = exportBrandJson()
    setTimeout(() => downloadJsonFile(brand, 'brand.json'), delay)
    delay += 100
  }
  
  if (files.uikit) {
    const uikit = exportUIKitJson()
    setTimeout(() => downloadJsonFile(uikit, 'uikit.json'), delay)
  }
}

