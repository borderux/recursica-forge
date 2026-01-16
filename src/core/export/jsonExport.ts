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
import { validateTokensJson, validateBrandJson } from '../utils/validateJsonSchemas'
import JSZip from 'jszip'

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
  
  // Handle color tokens: colors-scale-01-100 -> colors.scale-01.100
  // Also support old format: color-gray-500 -> color.gray.500
  if (parts[0] === 'colors' && parts.length >= 3) {
    const scale = parts[1]
    const level = parts.slice(2).join('-') // Handle levels like '0-5x'
    return `{tokens.colors.${scale}.${level}}`
  }
  if (parts[0] === 'color' && parts.length >= 3) {
    const family = parts[1]
    const level = parts.slice(2).join('-') // Handle levels like '0-5x'
    return `{tokens.color.${family}.${level}}`
  }
  
  // Handle size tokens: sizes-default -> sizes.default
  // Also support old format: size-default -> size.default
  if (parts[0] === 'sizes' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.sizes.${name}}`
  }
  if (parts[0] === 'size' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.size.${name}}`
  }
  
  // Handle opacity tokens: opacities-solid -> opacities.solid
  // Also support old format: opacity-solid -> opacity.solid
  if (parts[0] === 'opacities' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.opacities.${name}}`
  }
  if (parts[0] === 'opacity' && parts.length >= 2) {
    const name = parts.slice(1).join('-')
    return `{tokens.opacity.${name}}`
  }
  
  // Handle font tokens: font-sizes-md -> font.sizes.md
  // Also support old format: font-size-md -> font.size.md
  if (parts[0] === 'font' && parts.length >= 3) {
    const category = parts[1]
    const key = parts.slice(2).join('-')
    // Map plural to singular for backwards compatibility in references
    const singularMap: Record<string, string> = {
      'sizes': 'sizes',
      'weights': 'weights',
      'letter-spacings': 'letter-spacings',
      'line-heights': 'line-heights',
      'typefaces': 'typefaces',
      'cases': 'cases',
      'decorations': 'decorations'
    }
    // Keep plural form in reference
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
      // Handle opacity values that might be normalized (0-1) or percentage (0-100)
      const num = parseFloat(cssValue)
      if (Number.isFinite(num)) {
        // If it's a normalized opacity value (0-1), keep it as-is for tokens
        // But for brand.json exports, we might need percentage format
        return num
      }
      return cssValue
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
  
  // Match reference structure: sizes (plural), opacities (plural), font with plural categories
  const result: any = {
    tokens: {
      sizes: {},
      opacities: {},
      font: {
        typefaces: {},
        sizes: {},
        weights: {},
        cases: {},
        decorations: {},
        'letter-spacings': {},
        'line-heights': {}
      }
    }
  }
  
  // Export all tokens from store state (more reliable than CSS vars)
  // This ensures we get all tokens including dynamically created ones
  
  // Export size tokens (export as plural "sizes")
  // Store uses 'sizes' (plural) consistently
  const sizeTokens = storeTokens.sizes || {}
  
  Object.keys(sizeTokens).forEach((key) => {
    const token = sizeTokens[key]
    if (!token || typeof token !== 'object') return
    
    const tokenValue = token.$value
    if (tokenValue != null) {
      let jsonValue: any
      if (typeof tokenValue === 'number') {
        jsonValue = { value: tokenValue, unit: 'px' }
      } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
        jsonValue = tokenValue
      } else if (typeof tokenValue === 'string') {
        // Try to parse string like "10px"
        const match = tokenValue.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/)
        if (match) {
          jsonValue = { value: parseFloat(match[1]), unit: match[2] || 'px' }
        } else {
          jsonValue = { value: Number(tokenValue) || 0, unit: 'px' }
        }
      } else {
        jsonValue = { value: Number(tokenValue) || 0, unit: 'px' }
      }
      
      result.tokens.sizes[key] = {
        $type: 'dimension',
        $value: jsonValue
      }
    }
  })
  
  // Also export colors if they exist (reference doesn't show colors, but they should be exported)
  // Key ordering will be handled by schema-based sorting during validation
  if (storeTokens.colors) {
    result.tokens.colors = {}
    Object.keys(storeTokens.colors).forEach((scaleKey) => {
      const scale = storeTokens.colors[scaleKey]
      if (!scale || typeof scale !== 'object') return
      
      result.tokens.colors[scaleKey] = {}
      
      // Export alias if it exists
      if (scale.alias) {
        result.tokens.colors[scaleKey].alias = scale.alias
      }
      
      // Export color levels (will be sorted by schema)
      Object.keys(scale).forEach((level) => {
        if (level === 'alias') return
        const colorToken = scale[level]
        if (colorToken && typeof colorToken === 'object' && colorToken.$value != null) {
          result.tokens.colors[scaleKey][level] = {
            $type: 'color',
            $value: colorToken.$value
          }
        }
      })
    })
  }
  
  // Export opacity tokens (export as plural "opacities")
  // Opacity values should be 0-1 (normalized), not percentage
  // Store uses 'opacities' (plural) consistently
  const opacityTokens = storeTokens.opacities || {}
  
  Object.keys(opacityTokens).forEach((key) => {
    const token = opacityTokens[key]
    if (!token || typeof token !== 'object') return
    
    const tokenValue = token.$value
    if (tokenValue != null) {
      let jsonValue: number
      if (typeof tokenValue === 'number') {
        // Ensure it's normalized 0-1
        jsonValue = tokenValue <= 1 ? tokenValue : tokenValue / 100
      } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
        const num = Number(tokenValue.value)
        jsonValue = num <= 1 ? num : num / 100
      } else {
        const num = Number(tokenValue)
        jsonValue = num <= 1 ? num : num / 100
      }
      
      result.tokens.opacities[key] = {
        $type: 'number',
        $value: jsonValue
      }
    }
  })
  
  // Export font tokens from store
  if (storeTokens.font) {
    // Font sizes: should be $type: "dimension" with value object containing value and unit
    const fontSizes = storeTokens.font.sizes || storeTokens.font.size || {}
    Object.keys(fontSizes).forEach((key) => {
      const token = fontSizes[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: any
        if (typeof tokenValue === 'number') {
          jsonValue = { value: tokenValue, unit: 'px' }
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = { value: Number(tokenValue.value), unit: tokenValue.unit || 'px' }
        } else if (typeof tokenValue === 'string') {
          // Try to parse string like "10px"
          const match = tokenValue.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/)
          if (match) {
            jsonValue = { value: parseFloat(match[1]), unit: match[2] || 'px' }
          } else {
            const num = Number(tokenValue)
            jsonValue = { value: Number.isFinite(num) ? num : 0, unit: 'px' }
          }
        } else {
          const num = Number(tokenValue)
          jsonValue = { value: Number.isFinite(num) ? num : 0, unit: 'px' }
        }
        
        if (jsonValue.value != null && Number.isFinite(jsonValue.value)) {
          result.tokens.font.sizes[key] = {
            $type: 'dimension',
            $value: jsonValue
          }
        }
      }
    })
    
    // Font weights: $type: "number" with number value
    const fontWeights = storeTokens.font.weights || storeTokens.font.weight || {}
    Object.keys(fontWeights).forEach((key) => {
      const token = fontWeights[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: number
        if (typeof tokenValue === 'number') {
          jsonValue = tokenValue
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = Number(tokenValue.value)
        } else {
          jsonValue = Number(tokenValue)
        }
        
        if (Number.isFinite(jsonValue)) {
          result.tokens.font.weights[key] = {
            $type: 'number',
            $value: jsonValue
          }
        }
      }
    })
    
    // Font typefaces: extract only the font name (not the CSS font-family value)
    // Structure should match source: typefaces has $type at parent, each typeface has just $value
    const fontTypefaces = storeTokens.font.typefaces || storeTokens.font.typeface || {}
    const typefaceEntries: Array<[string, string]> = []
    Object.keys(fontTypefaces).forEach((key) => {
      const token = fontTypefaces[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let fontName: string
        if (typeof tokenValue === 'string') {
          // Extract font name from CSS font-family value like "Lexend", sans-serif or "Lexend"
          // Remove quotes and extract the first part before comma
          const cleaned = tokenValue.replace(/^["']|["']$/g, '').trim()
          const parts = cleaned.split(',')
          fontName = parts[0].trim().replace(/^["']|["']$/g, '')
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          const str = String(tokenValue.value)
          const cleaned = str.replace(/^["']|["']$/g, '').trim()
          const parts = cleaned.split(',')
          fontName = parts[0].trim().replace(/^["']|["']$/g, '')
        } else {
          const str = String(tokenValue)
          const cleaned = str.replace(/^["']|["']$/g, '').trim()
          const parts = cleaned.split(',')
          fontName = parts[0].trim().replace(/^["']|["']$/g, '')
        }
        
        if (fontName) {
          typefaceEntries.push([key, fontName])
        }
      }
    })
    
    // Set $type at parent level if we have typefaces
    if (typefaceEntries.length > 0) {
      result.tokens.font.typefaces = {
        $type: 'fontFamily'
      }
      typefaceEntries.forEach(([key, fontName]) => {
        result.tokens.font.typefaces[key] = {
          $value: fontName
        }
      })
    }
    
    // Font cases: $type: "string" with string value
    // Must always include "original" with null value
    const fontCases = storeTokens.font.cases || {}
    const caseEntries: Array<[string, string | null]> = []
    
    // Always include "original" with null
    caseEntries.push(['original', null])
    
    Object.keys(fontCases).forEach((key) => {
      if (key === 'original') return // Already added
      
      const token = fontCases[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: string
        if (typeof tokenValue === 'string') {
          jsonValue = tokenValue
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = String(tokenValue.value)
        } else {
          jsonValue = String(tokenValue)
        }
        
        caseEntries.push([key, jsonValue])
      }
    })
    
    caseEntries.forEach(([key, value]) => {
      result.tokens.font.cases[key] = {
        $type: 'string',
        $value: value
      }
    })
    
    // Font decorations: $type: "string" with string value
    // Must always include "none" with null value
    const fontDecorations = storeTokens.font.decorations || {}
    const decorationEntries: Array<[string, string | null]> = []
    
    // Always include "none" with null
    decorationEntries.push(['none', null])
    
    Object.keys(fontDecorations).forEach((key) => {
      if (key === 'none') return // Already added
      
      const token = fontDecorations[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: string
        if (typeof tokenValue === 'string') {
          jsonValue = tokenValue
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = String(tokenValue.value)
        } else {
          jsonValue = String(tokenValue)
        }
        
        decorationEntries.push([key, jsonValue])
      }
    })
    
    decorationEntries.forEach(([key, value]) => {
      result.tokens.font.decorations[key] = {
        $type: 'string',
        $value: value
      }
    })
    
    // Font letter-spacings: $type: "number" with number value
    const fontLetterSpacings = storeTokens.font['letter-spacings'] || storeTokens.font['letter-spacing'] || {}
    Object.keys(fontLetterSpacings).forEach((key) => {
      const token = fontLetterSpacings[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: number
        if (typeof tokenValue === 'number') {
          jsonValue = tokenValue
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = Number(tokenValue.value)
        } else {
          jsonValue = Number(tokenValue)
        }
        
        if (Number.isFinite(jsonValue)) {
          result.tokens.font['letter-spacings'][key] = {
            $type: 'number',
            $value: jsonValue
          }
        }
      }
    })
    
    // Font line-heights: $type: "number" with number value
    const fontLineHeights = storeTokens.font['line-heights'] || storeTokens.font['line-height'] || {}
    Object.keys(fontLineHeights).forEach((key) => {
      const token = fontLineHeights[key]
      if (!token || typeof token !== 'object') return
      
      const tokenValue = token.$value
      if (tokenValue != null) {
        let jsonValue: number
        if (typeof tokenValue === 'number') {
          jsonValue = tokenValue
        } else if (typeof tokenValue === 'object' && tokenValue.value != null) {
          jsonValue = Number(tokenValue.value)
        } else {
          jsonValue = Number(tokenValue)
        }
        
        if (Number.isFinite(jsonValue)) {
          result.tokens.font['line-heights'][key] = {
            $type: 'number',
            $value: jsonValue
          }
        }
      }
    })
  }
  
  // Remove empty sections
  if (result.tokens.colors && Object.keys(result.tokens.colors).length === 0) delete result.tokens.colors
  if (Object.keys(result.tokens.sizes).length === 0) delete result.tokens.sizes
  if (Object.keys(result.tokens.opacities).length === 0) delete result.tokens.opacities
  // Don't delete typefaces if it has $type (it's a special structure)
  if (result.tokens.font.typefaces && !result.tokens.font.typefaces.$type && Object.keys(result.tokens.font.typefaces).length === 0) delete result.tokens.font.typefaces
  if (Object.keys(result.tokens.font.sizes).length === 0) delete result.tokens.font.sizes
  if (Object.keys(result.tokens.font.weights).length === 0) delete result.tokens.font.weights
  if (Object.keys(result.tokens.font.cases).length === 0) delete result.tokens.font.cases
  if (Object.keys(result.tokens.font.decorations).length === 0) delete result.tokens.font.decorations
  if (Object.keys(result.tokens.font['letter-spacings']).length === 0) delete result.tokens.font['letter-spacings']
  if (Object.keys(result.tokens.font['line-heights']).length === 0) delete result.tokens.font['line-heights']
  if (Object.keys(result.tokens.font).length === 0) delete result.tokens.font
  
  return result
}

/**
 * Normalizes brand references to use short alias format (no theme paths)
 * Converts {brand.themes.light.palettes.core-colors.black} -> {brand.palettes.black}
 */
function normalizeBrandReferences(obj: any): any {
  if (typeof obj === 'string') {
    // Normalize reference strings - convert theme paths to short aliases
    // {brand.themes.light.palettes.core-colors.black} -> {brand.palettes.core-colors.black}
    // {brand.themes.dark.palettes.core-colors.white} -> {brand.palettes.core-colors.white}
    // Also handle old format {brand.light.palettes.core-colors.X} -> {brand.palettes.core-colors.X}
    // Note: We preserve {brand.palettes.core-colors.X} format as that's what the source uses
    return obj
      .replace(/{brand\.themes\.(light|dark)\.palettes\.core-colors\.(black|white|alert|warning|success)}/g, '{brand.palettes.core-colors.$2}')
      .replace(/{brand\.(light|dark)\.palettes\.core-colors\.(black|white|alert|warning|success)}/g, '{brand.palettes.core-colors.$2}')
  }
  
  if (Array.isArray(obj)) {
    return obj.map(normalizeBrandReferences)
  }
  
  if (obj && typeof obj === 'object') {
    const normalized: any = {}
    for (const key in obj) {
      normalized[key] = normalizeBrandReferences(obj[key])
    }
    return normalized
  }
  
  return obj
}

/**
 * Exports brand.json from store state
 * Reads from the VarsStore to ensure all data is exported correctly
 * Similar to tokens export - reads directly from store state
 */
export function exportBrandJson(): object {
  const store = getVarsStore()
  const storeState = store.getState()
  const theme = storeState.theme as any
  
  // Read directly from theme.brand, just like tokens export reads from storeState.tokens
  if (!theme?.brand) {
    return { brand: {} }
  }
  
  // Deep clone the brand structure from store
  const result = JSON.parse(JSON.stringify(theme.brand))
  
  // Normalize all references to use short alias format (no theme paths)
  const normalized = normalizeBrandReferences(result)
  
  return { brand: normalized }
}

/**
 * Extracts numeric value from CSS value, handling var() references and calc()
 */
function extractNumericValue(cssValue: string, tokenIndex: any): number | null {
  // If it's a direct pixel value like "10px", extract the number
  const pxMatch = cssValue.match(/(\d+(?:\.\d+)?)\s*px/)
  if (pxMatch) {
    return Number(pxMatch[1])
  }
  
  // If it's a calc() with var(), try to resolve the var
  const calcVarMatch = cssValue.match(/calc\s*\(\s*(-?\d+)\s*\*\s*var\(([^)]+)\)\s*\)/)
  if (calcVarMatch) {
    const multiplier = Number(calcVarMatch[1])
    const varName = calcVarMatch[2]
    // Try to read the CSS variable value
    const varValue = readCssVar(varName)
    if (varValue) {
      const pxMatch2 = varValue.match(/(\d+(?:\.\d+)?)\s*px/)
      if (pxMatch2) {
        return Number(pxMatch2[1]) * multiplier
      }
    }
  }
  
  // If it's a var() reference, try to resolve it
  const varMatch = cssValue.match(/var\(([^)]+)\)/)
  if (varMatch) {
    const varName = varMatch[1]
    const varValue = readCssVar(varName)
    if (varValue) {
      const pxMatch2 = varValue.match(/(\d+(?:\.\d+)?)\s*px/)
      if (pxMatch2) {
        return Number(pxMatch2[1])
      }
    }
  }
  
  return null
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
    
    // Handle component paths with new structure:
    // - components-switch-properties-colors-layer-0-thumb-selected
    // - components-button-variants-styles-solid-properties-colors-layer-0-background
    // - components-button-variants-sizes-default-properties-height
    // - components-button-properties-border-radius
    if (path[0] === 'components' && path.length >= 4) {
      path.shift() // Remove 'components'
      const componentName = path[0]
      path.shift() // Remove component name
      
      // Initialize component if needed
      if (!result['ui-kit'].components[componentName]) {
        result['ui-kit'].components[componentName] = {}
      }
      
      // Check the structure based on the path
      // NEW STRUCTURE patterns:
      // 1. properties.colors (Switch): components-switch-properties-colors-layer-0-thumb-selected
      // 2. variants.styles.{variant}.properties.colors: components-button-variants-styles-solid-properties-colors-layer-0-background
      // 3. variants.sizes.{variant}.properties.{property}: components-button-variants-sizes-default-properties-height
      // 4. properties.{property}: components-button-properties-border-radius
      
      if (path[0] === 'properties') {
        // Pattern 1 or 4: properties.colors or properties.{property}
        path.shift() // Remove 'properties'
        
        if (path[0] === 'colors') {
          // Pattern 1: properties.colors (Switch)
          path.shift() // Remove 'colors'
          const componentPath = path.join('.')
          
          if (!result['ui-kit'].components[componentName]['properties']) {
            result['ui-kit'].components[componentName]['properties'] = {}
          }
          if (!result['ui-kit'].components[componentName]['properties']['colors']) {
            result['ui-kit'].components[componentName]['properties']['colors'] = {}
          }
          
          const parts = componentPath.split('.')
          let current = result['ui-kit'].components[componentName]['properties']['colors']
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {}
            }
            current = current[parts[i]]
          }
          
          const lastPart = parts[parts.length - 1]
          const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
          if (jsonValue !== undefined) {
            current[lastPart] = {
              $type: 'color',
              $value: jsonValue
            }
          }
        } else {
          // Pattern 4: properties.{property} (component-level properties)
          const componentPath = path.join('.')
          
          if (!result['ui-kit'].components[componentName]['properties']) {
            result['ui-kit'].components[componentName]['properties'] = {}
          }
          
          const parts = componentPath.split('.')
          let current = result['ui-kit'].components[componentName]['properties']
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {}
            }
            current = current[parts[i]]
          }
          
          const lastPart = parts[parts.length - 1]
          // Determine type based on property name or default to dimension
          const type = lastPart.includes('elevation') ? 'elevation' :
                      lastPart.includes('size') && !lastPart.includes('text') ? 'dimension' :
                      lastPart.includes('typography') || lastPart.includes('font') ? 'typography' :
                      'dimension'
          const jsonValue = cssValueToJsonValue(cssValue, type, tokenIndex)
          if (jsonValue !== undefined) {
            current[lastPart] = {
              $type: type,
              $value: jsonValue
            }
          }
        }
      } else if (path[0] === 'variants') {
        // Pattern 2 or 3: variants.styles or variants.sizes
        path.shift() // Remove 'variants'
        
        if (!result['ui-kit'].components[componentName]['variants']) {
          result['ui-kit'].components[componentName]['variants'] = {}
        }
        
        if (path[0] === 'styles' || path[0] === 'sizes') {
          const category = path[0] // 'styles' or 'sizes'
          path.shift() // Remove category
          
          if (!result['ui-kit'].components[componentName]['variants'][category]) {
            result['ui-kit'].components[componentName]['variants'][category] = {}
          }
          
          // Next should be variant name (e.g., 'solid', 'default')
          if (path.length > 0) {
            const variantName = path[0]
            path.shift() // Remove variant name
            
            if (!result['ui-kit'].components[componentName]['variants'][category][variantName]) {
              result['ui-kit'].components[componentName]['variants'][category][variantName] = {}
            }
            
            // Check if next is 'properties'
            if (path[0] === 'properties') {
              path.shift() // Remove 'properties'
              
              if (!result['ui-kit'].components[componentName]['variants'][category][variantName]['properties']) {
                result['ui-kit'].components[componentName]['variants'][category][variantName]['properties'] = {}
              }
              
              if (path[0] === 'colors') {
                // Pattern 2: variants.styles.{variant}.properties.colors
                path.shift() // Remove 'colors'
                const componentPath = path.join('.')
                
                if (!result['ui-kit'].components[componentName]['variants'][category][variantName]['properties']['colors']) {
                  result['ui-kit'].components[componentName]['variants'][category][variantName]['properties']['colors'] = {}
                }
                
                const parts = componentPath.split('.')
                let current = result['ui-kit'].components[componentName]['variants'][category][variantName]['properties']['colors']
                
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]]) {
                    current[parts[i]] = {}
                  }
                  current = current[parts[i]]
                }
                
                const lastPart = parts[parts.length - 1]
                const jsonValue = cssValueToJsonValue(cssValue, 'color', tokenIndex)
                if (jsonValue !== undefined) {
                  current[lastPart] = {
                    $type: 'color',
                    $value: jsonValue
                  }
                }
              } else {
                // Pattern 3: variants.sizes.{variant}.properties.{property}
                const componentPath = path.join('.')
                
                const parts = componentPath.split('.')
                let current = result['ui-kit'].components[componentName]['variants'][category][variantName]['properties']
                
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]]) {
                    current[parts[i]] = {}
                  }
                  current = current[parts[i]]
                }
                
                const lastPart = parts[parts.length - 1]
                const jsonValue = cssValueToJsonValue(cssValue, 'dimension', tokenIndex)
                if (jsonValue !== undefined) {
                  current[lastPart] = {
                    $type: 'dimension',
                    $value: jsonValue
                  }
                }
              }
            }
          }
        }
      } else {
        // Legacy structure: direct category (colors, size)
      let category = path[0] // colors, size
      path.shift() // Remove category
      
      // Map CSS variable category to JSON structure
      const jsonCategory = category === 'size' ? 'sizes' : category === 'colors' ? 'variants' : category
      
      const componentPath = path.join('.')
      
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
 * Downloads a CSS file
 */
function downloadCssFile(css: string, filename: string): void {
  const blob = new Blob([css], { type: 'text/css' })
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
 * Extract numeric level from color token variable name
 * Returns the level as a number for sorting (000 -> 0, 050 -> 50, 100 -> 100, etc.)
 */
function extractColorLevel(varName: string): number {
  // Pattern: --recursica-tokens-color-{family}-{level}
  const match = varName.match(/--recursica-tokens-color-[^-]+-(\d+)$/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return -1
}

/**
 * Extract sort key for brand variables to group light/dark together
 * Returns a key that groups by path structure, then sorts by level, then light before dark
 */
function getBrandSortKey(varName: string): string {
  // Pattern: --recursica-brand-themes-{mode}-{rest}
  const match = varName.match(/--recursica-brand-themes-(light|dark)-(.*)$/)
  if (match) {
    const mode = match[1]
    const rest = match[2]
    
    // Extract numeric level if present (for palettes with levels like 000, 050, 100, etc.)
    const levelMatch = rest.match(/(\d{3,4})(?:-|$)/)
    let level = '0000' // Default to 0000 for non-numeric paths
    if (levelMatch) {
      level = levelMatch[1].padStart(4, '0') // Pad to 4 digits for proper sorting
    }
    
    // Remove the level from the path to group by structure
    const pathWithoutLevel = rest.replace(/\d{3,4}/, '')
    
    // Create sort key: path + level + mode (0 for light, 1 for dark)
    // This groups same paths together, sorts by level, then puts light before dark
    return `${pathWithoutLevel}-${level}-${mode === 'light' ? '0' : '1'}`
  }
  return varName
}

export function exportCssStylesheet(): string {
  const vars = getAllCssVars()
  
  // Filter to only --recursica- variables
  const allRecursicaVars = Object.entries(vars)
    .filter(([name]) => name.startsWith('--recursica-'))
  
  // Group by category: tokens, brand, ui-kit
  const tokensVars: Array<[string, string]> = []
  const brandVars: Array<[string, string]> = []
  const uikitVars: Array<[string, string]> = []
  
  allRecursicaVars.forEach(([name, value]) => {
    if (name.startsWith('--recursica-tokens-')) {
      tokensVars.push([name, value])
    } else if (name.startsWith('--recursica-brand-')) {
      brandVars.push([name, value])
    } else if (name.startsWith('--recursica-ui-kit-')) {
      uikitVars.push([name, value])
    }
  })
  
  // Sort tokens: group by type (color, size, opacity, font), then by family, then by level (000-1000)
  tokensVars.sort(([a], [b]) => {
    // Extract prefix (color, size, opacity, font)
    const aPrefix = a.match(/--recursica-tokens-([^-]+)/)?.[1] || ''
    const bPrefix = b.match(/--recursica-tokens-([^-]+)/)?.[1] || ''
    
    // First sort by prefix
    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix)
    }
    
    // For color tokens, sort by family first, then by numeric level (000-1000)
    if (aPrefix === 'color') {
      // Extract family name
      const aFamilyMatch = a.match(/--recursica-tokens-color-([^-]+)-/)
      const bFamilyMatch = b.match(/--recursica-tokens-color-([^-]+)-/)
      const aFamily = aFamilyMatch ? aFamilyMatch[1] : ''
      const bFamily = bFamilyMatch ? bFamilyMatch[1] : ''
      
      // Sort by family first
      if (aFamily !== bFamily) {
        return aFamily.localeCompare(bFamily)
      }
      
      // Then sort by numeric level (000 -> 0, 050 -> 50, 100 -> 100, ... 1000 -> 1000)
      const aLevel = extractColorLevel(a)
      const bLevel = extractColorLevel(b)
      if (aLevel !== -1 && bLevel !== -1) {
        return aLevel - bLevel
      }
      // If level extraction fails, fall back to alphabetical
      return a.localeCompare(b)
    }
    
    // For other token types, sort alphabetically
    return a.localeCompare(b)
  })
  
  // Sort brand: group by path structure, then light before dark, then by level
  brandVars.sort(([a], [b]) => {
    const aKey = getBrandSortKey(a)
    const bKey = getBrandSortKey(b)
    return aKey.localeCompare(bKey)
  })
  
  // Sort UIKit alphabetically
  uikitVars.sort(([a], [b]) => a.localeCompare(b))
  
  // Combine in order: tokens, brand, ui-kit
  const recursicaVars = [...tokensVars, ...brandVars, ...uikitVars]
  
  // Extract metadata from CSS variable names
  const components = new Set<string>()
  const colorFamilies = new Set<string>()
  
  recursicaVars.forEach(([name]) => {
    // Extract component names from UIKit variables
    // Pattern: --recursica-ui-kit-components-{component}-...
    // Only capture the component name (first part after components-)
    const uikitMatch = name.match(/--recursica-ui-kit-components-([a-z]+(?:-[a-z]+)*?)(?:-|$)/)
    if (uikitMatch) {
      const componentName = uikitMatch[1]
      // Convert kebab-case to Title Case for display
      const displayName = componentName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      components.add(displayName)
    }
    
    // Extract color families from token variables
    // Pattern: --recursica-tokens-color-{family}-{level}
    const tokenColorMatch = name.match(/--recursica-tokens-color-([a-z]+(?:-[a-z]+)*)-/)
    if (tokenColorMatch) {
      const family = tokenColorMatch[1]
      // Convert kebab-case to Title Case
      const displayFamily = family
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      colorFamilies.add(displayFamily)
    }
  })
  
  // Get UTC date/time
  const buildDate = new Date().toUTCString()
  
  // Build header comment
  const totalVars = recursicaVars.length
  const componentsList = Array.from(components).sort().join(', ') || 'None'
  const colorsList = Array.from(colorFamilies).sort().join(', ') || 'None'
  
  let css = `/*\n`
  css += ` * Recursica CSS Variables Export\n`
  css += ` * Generated: ${buildDate}\n`
  css += ` *\n`
  css += ` * Total CSS Variables: ${totalVars}\n`
  css += ` *\n`
  css += ` * Components Included: ${componentsList}\n`
  css += ` *\n`
  css += ` * Color Families Included: ${colorsList}\n`
  css += ` */\n\n`
  
  // Build CSS content
  css += ':root {\n'
  
  recursicaVars.forEach(([name, value]) => {
    // Escape any special characters in the value if needed
    // Keep var() references as-is
    css += `  ${name}: ${value};\n`
  })
  
  css += '}\n'
  
  return css
}

/**
 * Downloads selected JSON files and optionally CSS file
 * If multiple files are selected, they are zipped together
 * Validates JSON files before export and throws error if validation fails
 */
export async function downloadJsonFiles(files: { tokens?: boolean; brand?: boolean; uikit?: boolean; css?: boolean } = { tokens: true, brand: true, uikit: true }): Promise<void> {
  // Count how many files are selected
  const selectedFiles: Array<{ content: string | object; filename: string; isJson: boolean }> = []
  
  if (files.tokens) {
    const tokens = exportTokensJson()
    // Validate tokens before adding to export
    try {
      validateTokensJson(tokens as JsonLike)
    } catch (error) {
      console.error('[Export] Tokens.json validation failed:', error)
      throw new Error(`Cannot export tokens.json: ${error instanceof Error ? error.message : String(error)}`)
    }
    selectedFiles.push({ content: tokens, filename: 'tokens.json', isJson: true })
  }
  
  if (files.brand) {
    const brand = exportBrandJson()
    // Validate brand before adding to export
    try {
      validateBrandJson(brand as JsonLike)
    } catch (error) {
      console.error('[Export] Brand.json validation failed:', error)
      throw new Error(`Cannot export brand.json: ${error instanceof Error ? error.message : String(error)}`)
    }
    selectedFiles.push({ content: brand, filename: 'brand.json', isJson: true })
  }
  
  if (files.uikit) {
    const uikit = exportUIKitJson()
    selectedFiles.push({ content: uikit, filename: 'uikit.json', isJson: true })
  }
  
  if (files.css) {
    const css = exportCssStylesheet()
    selectedFiles.push({ content: css, filename: 'recursica-variables.css', isJson: false })
  }
  
  // If only one file, download it directly
  if (selectedFiles.length === 1) {
    const file = selectedFiles[0]
    if (file.isJson) {
      downloadJsonFile(file.content as object, file.filename)
    } else {
      downloadCssFile(file.content as string, file.filename)
    }
    return
  }
  
  // If multiple files, create a zip
  if (selectedFiles.length > 1) {
    const zip = new JSZip()
    
    for (const file of selectedFiles) {
      if (file.isJson) {
        zip.file(file.filename, JSON.stringify(file.content, null, 2))
      } else {
        zip.file(file.filename, file.content as string)
      }
    }
    
    // Generate zip file and download
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recursica-export.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

