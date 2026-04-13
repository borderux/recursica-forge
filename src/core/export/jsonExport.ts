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
import { TOKEN_PREFIX, unwrapVar, BRAND_PREFIX } from '../css/cssVarBuilder'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'
import { getVarsStore } from '../store/varsStore'
import { validateTokensJson, validateBrandJson, validateUIKitJson } from '../utils/validateJsonSchemas'
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
} from './EXPORT_FILENAMES'
import { recursicaJsonTransform as recursicaJsonTransformSpecific } from './recursicaJsonTransformSpecific'
import { recursicaJsonTransform as recursicaJsonTransformScoped } from './recursicaJsonTransformScoped'
import JSZip from 'jszip'

/**
 * Gets all CSS variables from the DOM
 */
function getAllCssVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  const root = document.documentElement

  // Read all CSS variables using readCssVar for consistency
  // This ensures we read from inline styles first (where updateCssVar sets values),
  // then fall back to computed styles
  // Collect all potential variable names from inline styles and computed styles
  const allVarNames = new Set<string>()

  // Get from inline styles
  for (let i = 0; i < root.style.length; i++) {
    const prop = root.style[i]
    if (prop && prop.startsWith('--recursica_')) {
      allVarNames.add(prop)
    }
  }

  // Also check computed styles for any we might have missed
  const computed = getComputedStyle(root)
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
        .filter(prop => prop.startsWith('--recursica_'))
        .map(prop => prop)
    })

  allComputed.forEach(name => allVarNames.add(name))

  // Read each variable using readCssVar (checks inline first, then computed)
  allVarNames.forEach(varName => {
    const value = readCssVar(varName)
    if (value) {
      vars[varName] = value
    }
  })

  return vars
}

/**
 * Converts a CSS variable reference to a token reference string.
 * With underscore-delimited names, splitting on '_' gives correct path segments directly.
 */
function cssVarToTokenRef(cssVar: string): string | null {
  const varName = unwrapVar(cssVar)
  if (!varName || !varName.startsWith(TOKEN_PREFIX)) return null

  // Remove prefix and split on '_' to get path segments (compound keys like 'scale-02' stay intact)
  const rest = varName.substring(TOKEN_PREFIX.length)
  const parts = rest.split('_')
  return `{tokens.${parts.join('.')}}`
}

/**
 * Converts a CSS variable reference to a brand reference string.
 * With underscore-delimited names, splitting on '_' gives correct path segments directly.
 */
function cssVarToBrandRef(cssVar: string): string | null {
  const varName = unwrapVar(cssVar)
  if (!varName || !varName.startsWith(BRAND_PREFIX)) return null

  // Remove prefix and split on '_' to get path segments (compound keys like 'palette-1', 'on-tone' stay intact)
  const rest = varName.substring(BRAND_PREFIX.length)
  const parts = rest.split('_')
  return `{brand.${parts.join('.')}}`
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
  const originalTokens = tokensJson as JsonLike

  // Match reference structure: colors, font, sizes, opacities (matching original order)
  const result: any = {
    tokens: {
      colors: {},
      font: {
        sizes: {},
        typefaces: {},
        weights: {},
        cases: {},
        decorations: {},
        'letter-spacings': {},
        'line-heights': {},
        styles: {}
      },
      sizes: {},
      opacities: {}
    }
  }

  // Export all tokens from store state (more reliable than CSS vars)
  // This ensures we get all tokens including dynamically created ones

  // Export size tokens (export as plural "sizes")
  // Store uses 'sizes' (plural) consistently
  // Filter out elevation tokens (they shouldn't be in sizes)
  const sizeTokens = storeTokens.sizes || {}

  Object.keys(sizeTokens).forEach((key) => {
    // Skip elevation tokens - they're not part of the original sizes
    if (key.startsWith('elevation-')) return

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

  // Export colors if they exist
  // Maintain proper ordering: alias first, then 000, 050, 100-1000
  if (storeTokens.colors) {
    result.tokens.colors = {}
    Object.keys(storeTokens.colors).forEach((scaleKey) => {
      const scale = storeTokens.colors[scaleKey]
      if (!scale || typeof scale !== 'object') return

      result.tokens.colors[scaleKey] = {}

      // Export alias: prefer live CSS var (user may have renamed), fall back to in-memory JSON
      const familyNameCssVar = `--recursica_tokens_colors_${scaleKey}_family-name`
      const liveFamilyName = vars[familyNameCssVar]
      if (liveFamilyName) {
        // Use the CSS var value (lowercase for alias field, as it's a machine-readable identifier)
        result.tokens.colors[scaleKey].alias = liveFamilyName.toLowerCase().replace(/\s+/g, '-')
      } else if (scale.alias) {
        result.tokens.colors[scaleKey].alias = scale.alias
      }

      // Export color levels in proper order: 000, 050, then 100-1000
      const levelKeys = Object.keys(scale).filter(key => key !== 'alias')
      const sortedLevels = levelKeys.sort((a, b) => {
        // Sort: 000, 050, then numeric order (100, 200, ... 1000)
        if (a === '000') return -1
        if (b === '000') return 1
        if (a === '050') return -1
        if (b === '050') return 1
        const numA = parseInt(a, 10)
        const numB = parseInt(b, 10)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.localeCompare(b)
      })

      sortedLevels.forEach((level) => {
        const colorToken = scale[level]
        if (colorToken && typeof colorToken === 'object' && colorToken.$value != null) {
          // Prefer live CSS var value (source of truth) over in-memory JSON
          const cssVarName = `--recursica_tokens_colors_${scaleKey}_${level}`
          const liveValue = vars[cssVarName]
          result.tokens.colors[scaleKey][level] = {
            $type: 'color',
            $value: liveValue || colorToken.$value
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
      // Prefer live CSS var value (source of truth) over in-memory JSON
      const cssVarName = `--recursica_tokens_opacities_${key}`
      const liveValue = vars[cssVarName]

      let jsonValue: number
      if (liveValue != null) {
        const num = parseFloat(liveValue)
        jsonValue = Number.isFinite(num) ? (num <= 1 ? num : num / 100) : (typeof tokenValue === 'number' ? tokenValue : Number(tokenValue))
      } else if (typeof tokenValue === 'number') {
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

    // Font typefaces: preserve original structure with extensions from original tokens.json
    // Read from original tokens.json to preserve $extensions (Google Fonts URLs, variants)
    const originalFont = (originalTokens as any)?.tokens?.font || {}
    const originalTypefaces = originalFont.typefaces || {}

    if (Object.keys(originalTypefaces).length > 0) {
      result.tokens.font.typefaces = {
        $type: 'fontFamily'
      }

      // Copy typefaces from original to preserve extensions, but update $value from store if changed
      Object.keys(originalTypefaces).forEach((key) => {
        if (key === '$type') return

        const originalTypeface = originalTypefaces[key]
        const storeTypeface = storeTokens.font.typefaces?.[key] || storeTokens.font.typeface?.[key]

        // Start with original structure (preserves extensions)
        const exportedTypeface: any = JSON.parse(JSON.stringify(originalTypeface))

        // Update $value from store if it exists and differs
        if (storeTypeface?.$value != null) {
          const storeValue = storeTypeface.$value
          // If store has a string value, extract font name
          if (typeof storeValue === 'string') {
            const cleaned = storeValue.replace(/^["']|["']$/g, '').trim()
            const parts = cleaned.split(',')
            const fontName = parts[0].trim().replace(/^["']|["']$/g, '')
            // If original was an array, keep array format; otherwise use string
            if (Array.isArray(originalTypeface.$value)) {
              exportedTypeface.$value = [fontName, originalTypeface.$value[1] || 'sans-serif']
            } else {
              exportedTypeface.$value = fontName
            }
          } else if (Array.isArray(storeValue)) {
            exportedTypeface.$value = storeValue
          } else {
            exportedTypeface.$value = storeValue
          }
        }

        result.tokens.font.typefaces[key] = exportedTypeface
      })
    }

    // Font styles: preserve from original tokens.json (not stored in store)
    const originalStyles = originalFont.styles || {}
    if (Object.keys(originalStyles).length > 0) {
      Object.keys(originalStyles).forEach((key) => {
        result.tokens.font.styles[key] = JSON.parse(JSON.stringify(originalStyles[key]))
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

  // Remove empty sections (but preserve order)
  if (result.tokens.colors && Object.keys(result.tokens.colors).length === 0) delete result.tokens.colors
  // Don't delete typefaces if it has $type (it's a special structure)
  if (result.tokens.font.typefaces && !result.tokens.font.typefaces.$type && Object.keys(result.tokens.font.typefaces).length === 0) delete result.tokens.font.typefaces
  if (Object.keys(result.tokens.font.sizes).length === 0) delete result.tokens.font.sizes
  if (Object.keys(result.tokens.font.weights).length === 0) delete result.tokens.font.weights
  if (Object.keys(result.tokens.font.cases).length === 0) delete result.tokens.font.cases
  if (Object.keys(result.tokens.font.decorations).length === 0) delete result.tokens.font.decorations
  if (Object.keys(result.tokens.font['letter-spacings']).length === 0) delete result.tokens.font['letter-spacings']
  if (Object.keys(result.tokens.font['line-heights']).length === 0) delete result.tokens.font['line-heights']
  if (Object.keys(result.tokens.font.styles).length === 0) delete result.tokens.font.styles
  if (Object.keys(result.tokens.font).length === 0) delete result.tokens.font
  if (Object.keys(result.tokens.sizes).length === 0) delete result.tokens.sizes
  if (Object.keys(result.tokens.opacities).length === 0) delete result.tokens.opacities

  // Add metadata with export timestamp
  result.$metadata = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }

  return result
}

/**
 * Normalizes brand references to use short alias format (no theme paths)
 * Converts {brand.themes.light.palettes.core-colors.black} -> {brand.palettes.black}
 */
function normalizeBrandReferences(obj: any): any {
  if (typeof obj === 'string') {
    // Normalize reference strings - convert theme paths to short aliases
    // Also fix malformed references that may have been created incorrectly

    let normalized = obj
      // Core-colors: normalize to theme-agnostic token paths (.tone)
      .replace(/{brand\.themes\.(light|dark)\.palettes\.core-colors\.(black|white|alert|warning|success)(\.tone|\.on-tone)?}/g, (_, _mode, leaf, suffix) => `{brand.palettes.core-colors.${leaf}${suffix || '.tone'}}`)
      .replace(/{brand\.(light|dark)\.palettes\.core-colors\.(black|white|alert|warning|success)(\.tone|\.on-tone)?}/g, (_, _mode, leaf, suffix) => `{brand.palettes.core-colors.${leaf}${suffix || '.tone'}}`)
      // Core-black/core-white: normalize to token path (core-colors.black.tone / core-colors.white.tone)
      .replace(/{brand\.themes\.(light|dark)\.palettes\.(core-white|core-black)}/g, (_, _mode, which) => (which === 'core-black' ? '{brand.palettes.core-colors.black.tone}' : '{brand.palettes.core-colors.white.tone}'))
      .replace(/{brand\.(light|dark)\.palettes\.(core-white|core-black)}/g, (_, _mode, which) => (which === 'core-black' ? '{brand.palettes.core-colors.black.tone}' : '{brand.palettes.core-colors.white.tone}'))
      // Already short form: {brand.palettes.core-black} / core-white -> token path
      .replace(/\{brand\.palettes\.core-black\}/g, '{brand.palettes.core-colors.black.tone}')
      .replace(/\{brand\.palettes\.core-white\}/g, '{brand.palettes.core-colors.white.tone}')
      // Fix malformed: {brand.palettes.core.white} / core.black -> token path (not core-white/core-black)
      .replace(/\{brand\.palettes\.core\.white\}/g, '{brand.palettes.core-colors.white.tone}')
      .replace(/\{brand\.palettes\.core\.black\}/g, '{brand.palettes.core-colors.black.tone}')
      // Fix malformed references: {brand.palettes.palette.2.000.on.tone} -> {brand.palettes.palette-2.000.color.on-tone}
      .replace(/{brand\.palettes\.palette\.(\d+)\.(\d{3,4})\.on\.tone}/g, '{brand.palettes.palette-$1.$2.color.on-tone}')
      .replace(/{brand\.palettes\.palette\.(\d+)\.(\d{3,4})\.tone}/g, '{brand.palettes.palette-$1.$2.color.tone}')
      // Fix refs missing .color: {brand.palettes.X.600.tone} -> {brand.palettes.X.600.color.tone}
      .replace(/\{brand\.palettes\.(neutral|palette-1|palette-2)\.(default|\d{3,4})\.tone\}/g, '{brand.palettes.$1.$2.color.tone}')
      .replace(/\{brand\.palettes\.(neutral|palette-1|palette-2)\.(default|\d{3,4})\.on-tone\}/g, '{brand.palettes.$1.$2.color.on-tone}')
      // Fix malformed token references: {tokens.colors.scale.01-100} -> {tokens.colors.scale-01.100}
      .replace(/{tokens\.colors\.scale\.(\d+)-(\d{3,4})}/g, '{tokens.colors.scale-$1.$2}')
      // Remove theme from all other palette references
      .replace(/{brand\.themes\.(light|dark)\.palettes\./g, '{brand.palettes.')
      .replace(/{brand\.(light|dark)\.palettes\./g, '{brand.palettes.')
      // Remove theme from other brand references
      .replace(/{brand\.themes\.(light|dark)\./g, '{brand.')
      .replace(/{brand\.(light|dark)\./g, '{brand.')

    return normalized
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
 * Normalizes brand references in UIKit exports to remove theme information
 * Converts theme-specific references to theme-agnostic ones
 * Examples:
 * - {brand.themes.light.layer.layer.0.property.surface} -> {brand.layer.layer.0.property.surface}
 * - {brand.themes.light.palettes.neutral.100.tone} -> {brand.palettes.neutral.100.tone}
 * - {brand.themes.light.text.emphasis.low} -> {brand.text.emphasis.low}
 */
function normalizeUIKitBrandReferences(obj: any): any {
  if (typeof obj === 'string') {
    let normalized = obj
      // ── Layer element text path: cssVarToRef flattens `text.color` into `text-color` ──
      // Fix: {brand.layers.layer-N.elements.text-color} → {brand.layers.layer-N.elements.text.color}
      // Also handles theme-qualified variants that haven't been stripped yet
      .replace(/{brand(?:\.themes\.(?:light|dark))?\.layers\.(layer-\d+)\.elements\.text-(color|warning|success|alert)}/g,
        '{brand.layers.$1.elements.text.$2}')
      // ── Core palette path: cssVarToRef flattens `core-colors` into `core` ──
      // Fix: {brand.palettes.core.black.tone} → {brand.palettes.core-colors.black.tone}
      // Also handles theme-qualified variants
      .replace(/{brand(?:\.themes\.(?:light|dark))?\.palettes\.core\.(black|white|alert|warning|success)(?:\.(tone|on-tone))?}/g,
        (_, leaf, suffix) => `{brand.palettes.core-colors.${leaf}${suffix ? '.' + suffix : '.tone'}}`)
      // ── Core-colors toneless: ensure `.tone` suffix ──
      .replace(/{brand(?:\.themes\.(?:light|dark))?\.palettes\.core-colors\.(black|white|alert|warning|success)}/g,
        '{brand.palettes.core-colors.$1.tone}')
      // ── Palette refs missing .color. segment ──
      .replace(/\{brand(?:\.themes\.(?:light|dark))?\.palettes\.(neutral|palette-1|palette-2)\.(default|\d{3,4})\.tone\}/g,
        '{brand.palettes.$1.$2.color.tone}')
      .replace(/\{brand(?:\.themes\.(?:light|dark))?\.palettes\.(neutral|palette-1|palette-2)\.(default|\d{3,4})\.on-tone\}/g,
        '{brand.palettes.$1.$2.color.on-tone}')
      // ── Remove theme prefix from all brand references ──
      .replace(/{brand\.themes\.(light|dark)\./g, '{brand.')

    return normalized
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeUIKitBrandReferences)
  }

  if (obj && typeof obj === 'object') {
    const normalized: any = {}
    for (const key in obj) {
      normalized[key] = normalizeUIKitBrandReferences(obj[key])
    }
    return normalized
  }

  return obj
}

/** Default palette step per theme when emitting default (light: 200/400/400, dark: 800/600/600). */
const DEFAULT_PALETTE_STEP: Record<string, Record<string, string>> = {
  light: { neutral: '200', 'palette-1': '400', 'palette-2': '400' },
  dark: { neutral: '800', 'palette-1': '600', 'palette-2': '600' },
}

/**
 * Ensures each theme's neutral, palette-1, palette-2 has a default key with color.tone and color.on-tone
 * so theme-agnostic refs like {brand.palettes.palette-1.default.color.on-tone} resolve in export.
 */
function ensurePaletteDefaults(result: any): void {
  const themes = result?.themes
  if (!themes) return

  for (const mode of ['light', 'dark'] as const) {
    const palettes = themes[mode]?.palettes
    if (!palettes) continue

    const steps = DEFAULT_PALETTE_STEP[mode]
    if (!steps) continue

    for (const paletteKey of ['neutral', 'palette-1', 'palette-2'] as const) {
      const palette = palettes[paletteKey]
      if (!palette || typeof palette !== 'object') continue

      const step = steps[paletteKey]
      const toneRef = `{brand.themes.${mode}.palettes.${paletteKey}.${step}.color.tone}`
      const onToneRef = `{brand.themes.${mode}.palettes.${paletteKey}.${step}.color.on-tone}`

      if (!palette.default) {
        palette.default = {
          color: {
            tone: { $type: 'color', $value: toneRef },
            'on-tone': { $type: 'color', $value: onToneRef },
          },
        }
        continue
      }

      const color = palette.default?.color
      if (!color || typeof color !== 'object') {
        palette.default = { color: { tone: { $type: 'color', $value: toneRef }, 'on-tone': { $type: 'color', $value: onToneRef } } }
        continue
      }

      if (!color.tone || typeof color.tone !== 'object') {
        color.tone = { $type: 'color', $value: toneRef }
      }
      const toneValue = color.tone.$value
      const stepMatch = typeof toneValue === 'string' ? toneValue.match(/\.(?:neutral|palette-\d+)\.(\d{3,4})\.color\.tone/) : null
      const resolvedStep = stepMatch ? stepMatch[1] : step

      if (!color['on-tone'] || typeof color['on-tone'] !== 'object') {
        const baseRef = typeof toneValue === 'string' && toneValue.startsWith('{')
          ? toneValue.replace(/\.color\.tone\s*\}$/, '.color.on-tone}')
          : `{brand.themes.${mode}.palettes.${paletteKey}.${resolvedStep}.color.on-tone}`
        color['on-tone'] = { $type: 'color', $value: baseRef }
      }
    }
  }
}

/**
 * Ensures all palette tone/on-tone tokens have the required DTCG $type: "color" property.
 * The store may not always include $type on palette tokens (especially dynamically created palettes).
 */
function ensurePaletteTypes(result: any): void {
  const themes = result?.themes
  if (!themes) return

  for (const mode of ['light', 'dark'] as const) {
    const palettes = themes[mode]?.palettes
    if (!palettes) continue

    for (const paletteKey of Object.keys(palettes)) {
      if (paletteKey === 'core-colors') continue // core-colors has a different structure
      const palette = palettes[paletteKey]
      if (!palette || typeof palette !== 'object') continue

      for (const stepKey of Object.keys(palette)) {
        if (stepKey.startsWith('$')) continue // skip $type, $description, etc.
        const step = palette[stepKey]
        if (!step || typeof step !== 'object') continue

        const color = step.color
        if (!color || typeof color !== 'object') continue

        // Ensure color group $type
        if (!color.$type) {
          color.$type = 'color'
        }

        // Ensure tone has $type
        if (color.tone && typeof color.tone === 'object' && !color.tone.$type) {
          color.tone.$type = 'color'
        }

        // Ensure on-tone has $type
        if (color['on-tone'] && typeof color['on-tone'] === 'object' && !color['on-tone'].$type) {
          color['on-tone'].$type = 'color'
        }
      }
    }
  }
}

/**
 * Ensures state and text-emphasis token references use the correct format.
 * The randomizer writes `{tokens.opacity.*}` (singular) but the schema
 * and source JSON use `{tokens.opacities.*}` (plural). This normalizes
 * those references and ensures `$type` is present.
 */
function ensureStateTokenRefs(result: any): void {
  const themes = result?.themes
  if (!themes) return

  for (const mode of ['light', 'dark'] as const) {
    const modeData = themes[mode]
    if (!modeData) continue

    // Fix states: disabled, hover, overlay.opacity
    const states = modeData.states
    if (states && typeof states === 'object') {
      for (const stateKey of ['disabled', 'hover'] as const) {
        const state = states[stateKey]
        if (state && typeof state === 'object') {
          if (!state.$type) state.$type = 'number'
          if (typeof state.$value === 'string') {
            state.$value = state.$value.replace('{tokens.opacity.', '{tokens.opacities.')
          }
        }
      }
      // Fix overlay.opacity
      const overlay = states.overlay
      if (overlay && typeof overlay === 'object') {
        if (overlay.opacity && typeof overlay.opacity === 'object') {
          if (!overlay.opacity.$type) overlay.opacity.$type = 'number'
          if (typeof overlay.opacity.$value === 'string') {
            overlay.opacity.$value = overlay.opacity.$value.replace('{tokens.opacity.', '{tokens.opacities.')
          }
        }
        if (overlay.color && typeof overlay.color === 'object') {
          if (!overlay.color.$type) overlay.color.$type = 'color'
        }
      }
    }

    // Fix text-emphasis: low, high
    const textEmphasis = modeData['text-emphasis']
    if (textEmphasis && typeof textEmphasis === 'object') {
      for (const emphasisKey of ['low', 'high'] as const) {
        const emphasis = textEmphasis[emphasisKey]
        if (emphasis && typeof emphasis === 'object') {
          if (!emphasis.$type) emphasis.$type = 'number'
          if (typeof emphasis.$value === 'string') {
            emphasis.$value = emphasis.$value.replace('{tokens.opacity.', '{tokens.opacities.')
          }
        }
      }
    }
  }
}

/**
 * Exports brand.json from the store.
 * Now a direct store dump — brand CSS var changes are synced to the store
 * in real-time via updateBrandValue, so the store is always up-to-date.
 */
export function exportBrandJson(): object {
  const store = getVarsStore()
  const storeState = store.getState()
  const theme = storeState.theme as any

  if (!theme?.brand) {
    return {
      brand: {},
      $metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  // Deep clone the brand structure from store
  const result = JSON.parse(JSON.stringify(theme.brand))

  // Ensure each palette has default entries with both tone and on-tone
  ensurePaletteDefaults(result)

  // Ensure all palette tone/on-tone entries have $type: "color" (DTCG compliance)
  ensurePaletteTypes(result)

  // Ensure state and text-emphasis values use correct token reference format
  ensureStateTokenRefs(result)

  // Normalize all references to use short alias format (no theme paths)
  const normalized = normalizeBrandReferences(result)

  const exportObject = {
    brand: normalized,
    $metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  // Validate the exported JSON before returning
  try {
    validateBrandJson(exportObject as JsonLike)
  } catch (error) {
    // validation failed — error will be re-thrown by handleExport in exportWithCompliance
  }

  return exportObject
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
 * Exports uikit.json from store state
 * Reads from the VarsStore to ensure all data is exported correctly
 * Similar to tokens and brand export - reads directly from store state
 */
export function exportUIKitJson(): object {
  const store = getVarsStore()
  const storeState = store.getState()
  const uikit = storeState.uikit as any

  // Read directly from uikit, just like tokens export reads from storeState.tokens
  // UIKit in store may have 'ui-kit' wrapper or be the raw structure
  if (!uikit) {
    return {
      'ui-kit': {},
      $metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  // Deep clone the UIKit structure from store
  // Ensure it has the 'ui-kit' wrapper if it doesn't already
  const uikitWithWrapper = (uikit as any)?.['ui-kit'] ? uikit : { 'ui-kit': uikit }
  const result = JSON.parse(JSON.stringify(uikitWithWrapper))

  // Normalize brand references to remove theme information (UIKit should be theme-agnostic)
  const normalized = normalizeUIKitBrandReferences(result)

  // Add metadata with export timestamp
  normalized.$metadata = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }

  // Validate the exported JSON before returning
  try {
    validateUIKitJson(normalized as JsonLike)
  } catch (error) {
    // validation failed — error will be re-thrown by handleExport in exportWithCompliance
  }

  return normalized
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
  // Pattern: --recursica_tokens_color_{family}-{level}
  const match = varName.match(/--recursica_tokens_color_[^-]+-(\d+)$/)
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
  // Pattern: --recursica_brand_themes_{mode}-{rest}
  const match = varName.match(/--recursica_brand_themes_(light|dark)-(.*)$/)
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

/**
 * Parses a CSS variable name to extract theme and layer information
 * Returns an object with theme, layer, and base name (without theme/layer)
 */
function parseCssVarName(varName: string): {
  theme: 'light' | 'dark' | null
  layer: string | null
  baseName: string
  hasTheme: boolean
  hasLayer: boolean
} {
  // Brand vars: --recursica_brand_themes_{light|dark}-...
  const brandThemeMatch = varName.match(/^--recursica_brand_themes_(light|dark)-(.*)$/)
  if (brandThemeMatch) {
    const theme = brandThemeMatch[1] as 'light' | 'dark'
    const rest = brandThemeMatch[2]

    // Check for layer in brand vars: ...-layer-layer-{N}-...
    // Pattern: --recursica_brand_themes_{theme}-layer-layer-{N}-...
    const layerMatch = rest.match(/^layer-layer-(\d+)-(.*)$/)
    if (layerMatch) {
      const layer = layerMatch[1]
      const afterLayer = layerMatch[2]
      // Base name: --recursica_brand_layer_{rest}
      const baseName = `--recursica_brand_layer_${afterLayer}`
      return {
        theme,
        layer,
        baseName,
        hasTheme: true,
        hasLayer: true
      }
    }

    // No layer, just theme
    // Base name: remove themes-{mode}- prefix
    const baseName = varName.replace(/^--recursica_brand_themes_(light|dark)-/, '--recursica_brand_')
    return {
      theme,
      layer: null,
      baseName,
      hasTheme: true,
      hasLayer: false
    }
  }

  // UIKit vars: --recursica_ui-kit_components_{component}-...-layer-{N}-...
  // Need to find the layer-{N} pattern and remove it
  const uikitMatch = varName.match(/^(--recursica_ui-kit_components_.*?)-layer-(\d+)(.*)$/)
  if (uikitMatch) {
    const beforeLayer = uikitMatch[1]
    const layer = uikitMatch[2]
    const afterLayer = uikitMatch[3]
    // Base name: remove -layer-{N} part
    const baseName = `${beforeLayer}${afterLayer}`
    return {
      theme: null,
      layer,
      baseName,
      hasTheme: false,
      hasLayer: true
    }
  }

  // No theme or layer
  return {
    theme: null,
    layer: null,
    baseName: varName,
    hasTheme: false,
    hasLayer: false
  }
}

/**
 * Converts hyphens to underscores in key segments of CSS variable names
 * Only converts hyphens in the actual key names, not in path segments (which were originally dots)
 *
 * @example
 * convertKeyHyphensToUnderscores('--recursica_ui-kit_globals_form_properties_label_field_gap_horizontal')
 * => '--recursica_ui-kit_globals_form_properties_label_field_gap_horizontal'
 *
 * @example
 * convertKeyHyphensToUnderscores('--recursica_tokens_color_gray_500')
 * => '--recursica_tokens_color_gray_500'
 */
function convertKeyHyphensToUnderscores(varName: string): string {
  // Pattern: --recursica_{category}-{path-segments}-{key-name}
  // We need to identify where the path ends and the key begins

  // For tokens: --recursica_tokens_{type}-{family}-{level}
  // The last segment (level) is the key
  const tokensMatch = varName.match(/^(--recursica_tokens_[^-]+-[^-]+)-(.+)$/)
  if (tokensMatch) {
    const prefix = tokensMatch[1]
    const key = tokensMatch[2]
    return `${prefix}-${key.replace(/-/g, '_')}`
  }

  // For brand: --recursica_brand_{path}-{key}
  // The structure is complex, but typically the last segment(s) are the key
  // Common patterns:
  // - --recursica_brand_dimensions_{path}-{key}
  // - --recursica_brand_palettes_{palette}-{level}-{property}
  // - --recursica_brand_layer_layer_{N}-{path}-{key}
  // For now, convert hyphens to underscores in the last segment
  const brandMatch = varName.match(/^(--recursica_brand_[^-]+(?:-[^-]+)*)-(.+)$/)
  if (brandMatch) {
    const prefix = brandMatch[1]
    const key = brandMatch[2]
    // Check if key contains known path separators (like "layer-0" or numeric patterns)
    // If it's just a simple key name, convert hyphens to underscores
    // Otherwise, be more conservative
    if (!key.match(/^(layer-\d+|properties|elements|colors|sizes|palettes)/)) {
      return `${prefix}-${key.replace(/-/g, '_')}`
    }
    // For complex paths, convert only the final segment
    const parts = key.split('-')
    if (parts.length > 1) {
      const lastPart = parts.pop()!
      const path = parts.join('-')
      return `${prefix}-${path}-${lastPart.replace(/-/g, '_')}`
    }
  }

  // For UIKit: --recursica_ui-kit_{path}-{key}
  // The path structure is: globals|components-{component}-{category}-{path}-{key}
  // We need to identify the key part (everything after known path segments)
  // Common path patterns end with: properties-, colors-, size-, variants-styles-, variants-sizes-
  // Strategy: Find the last occurrence of known path keywords followed by hyphen, then convert the rest
  if (varName.startsWith('--recursica_ui-kit_')) {
    // Try to match known path patterns that end before the key
    // Pattern: --recursica_ui-kit_{path}-{key} where path ends with known keywords
    const knownPathEndings = [
      'properties-',
      'colors-',
      'size-',
      'variants-styles-',
      'variants-sizes-',
      'field-',
      'form-'
    ]

    for (const ending of knownPathEndings) {
      const pattern = new RegExp(`^(--recursica_ui-kit_.+?-${ending.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(.+)$`)
      const match = varName.match(pattern)
      if (match) {
        const prefix = match[1]
        const key = match[2]
        // Convert hyphens to underscores in the key part
        return `${prefix}${key.replace(/-/g, '_')}`
      }
    }

    // Fallback: if no known path pattern matches, find the last hyphen-separated segment
    // and convert hyphens to underscores in it
    // This handles cases like: --recursica_ui-kit_globals_icon_style
    const parts = varName.split('-')
    if (parts.length > 4) { // At least: --, recursica, ui, kit, ...
      // Keep prefix up to and including the second-to-last segment
      const prefixParts = parts.slice(0, -1)
      const lastPart = parts[parts.length - 1]
      // Convert hyphens to underscores in the last part
      return `${prefixParts.join('-')}-${lastPart.replace(/-/g, '_')}`
    }
  }

  // Fallback: if no pattern matches, convert all hyphens after the prefix
  const prefixMatch = varName.match(/^(--recursica_[^-]+-[^-]+)-(.+)$/)
  if (prefixMatch) {
    const prefix = prefixMatch[1]
    const rest = prefixMatch[2]
    // Convert hyphens to underscores in the rest
    return `${prefix}-${rest.replace(/-/g, '_')}`
  }

  // If no pattern matches, return as-is
  return varName
}

/**
 * Groups CSS variables by theme and layer for scoped export
 */
function groupVarsByThemeAndLayer(
  vars: Array<[string, string]>
): {
  byTheme: Map<'light' | 'dark', Array<[string, string]>> // [baseName, value] - only vars with theme but no layer
  byLayer: Map<string, Array<[string, string]>> // [baseName, value] - only vars with layer but no theme
  byThemeAndLayer: Map<string, Map<string, Array<[string, string]>>> // [theme][layer] -> [baseName, value] - vars with both
  unscoped: Array<[string, string]> // vars without theme/layer
} {
  const byTheme = new Map<'light' | 'dark', Array<[string, string]>>()
  const byLayer = new Map<string, Array<[string, string]>>()
  const byThemeAndLayer = new Map<string, Map<string, Array<[string, string]>>>()
  const unscoped: Array<[string, string]> = []

  vars.forEach(([name, value]) => {
    const parsed = parseCssVarName(name)

    if (parsed.hasTheme && parsed.hasLayer) {
      // Var has both theme and layer - goes into combined scoping
      const themeKey = parsed.theme!
      const layerKey = parsed.layer!
      if (!byThemeAndLayer.has(themeKey)) {
        byThemeAndLayer.set(themeKey, new Map())
      }
      if (!byThemeAndLayer.get(themeKey)!.has(layerKey)) {
        byThemeAndLayer.get(themeKey)!.set(layerKey, [])
      }
      byThemeAndLayer.get(themeKey)!.get(layerKey)!.push([parsed.baseName, value])
    } else if (parsed.hasTheme && !parsed.hasLayer) {
      // Var has theme but no layer - goes into theme scoping only
      if (!byTheme.has(parsed.theme!)) {
        byTheme.set(parsed.theme!, [])
      }
      byTheme.get(parsed.theme!)!.push([parsed.baseName, value])
    } else if (!parsed.hasTheme && parsed.hasLayer) {
      // Var has layer but no theme - goes into layer scoping only
      if (!byLayer.has(parsed.layer!)) {
        byLayer.set(parsed.layer!, [])
      }
      byLayer.get(parsed.layer!)!.push([parsed.baseName, value])
    } else {
      // No theme or layer
      unscoped.push([name, value])
    }
  })

  return { byTheme, byLayer, byThemeAndLayer, unscoped }
}

/**
 * Exports CSS stylesheet - can export specific, scoped, or both
 * Returns an object with 'specific' and/or 'scoped' CSS strings
 */
export function exportCssStylesheet(options: { specific?: boolean; scoped?: boolean } = { specific: true, scoped: true }): { specific?: string; scoped?: string } {
  const vars = getAllCssVars()

  // Filter to only --recursica_ variables
  const allRecursicaVars = Object.entries(vars)
    .filter(([name]) => name.startsWith('--recursica_'))

  // Group by category: tokens, brand, ui-kit
  const tokensVars: Array<[string, string]> = []
  const brandVars: Array<[string, string]> = []
  const uikitVars: Array<[string, string]> = []

  allRecursicaVars.forEach(([name, value]) => {
    if (name.startsWith(TOKEN_PREFIX)) {
      tokensVars.push([name, value])
    } else if (name.startsWith('--recursica_brand_')) {
      brandVars.push([name, value])
    } else if (name.startsWith('--recursica_ui-kit_')) {
      uikitVars.push([name, value])
    }
  })

  // Sort tokens: group by type (color, size, opacity, font), then by family, then by level (000-1000)
  tokensVars.sort(([a], [b]) => {
    // Extract prefix (color, size, opacity, font)
    const aPrefix = a.match(/--recursica_tokens_([^-]+)/)?.[1] || ''
    const bPrefix = b.match(/--recursica_tokens_([^-]+)/)?.[1] || ''

    // First sort by prefix
    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix)
    }

    // For color tokens, sort by family first, then by numeric level (000-1000)
    if (aPrefix === 'color') {
      // Extract family name
      const aFamilyMatch = a.match(/--recursica_tokens_color_([^-]+)-/)
      const bFamilyMatch = b.match(/--recursica_tokens_color_([^-]+)-/)
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
    // Pattern: --recursica_ui-kit_components_{component}-...
    // Only capture the component name (first part after components-)
    const uikitMatch = name.match(/--recursica_ui-kit_components_([a-z]+(?:-[a-z]+)*?)(?:-|$)/)
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
    // Pattern: --recursica_tokens_color_{family}-{level}
    const tokenColorMatch = name.match(/--recursica_tokens_color_([a-z]+(?:-[a-z]+)*)-/)
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

  // Group vars by theme and layer for scoped export
  const brandGrouped = groupVarsByThemeAndLayer(brandVars)
  const uikitGrouped = groupVarsByThemeAndLayer(uikitVars)
  const tokensGrouped = groupVarsByThemeAndLayer(tokensVars)

  // Collect all scoped variable names to avoid duplicating them in :root
  const scopedVarNames = new Set<string>()
  brandGrouped.byTheme.forEach((vars) => {
    vars.forEach(([baseName]) => scopedVarNames.add(baseName))
  })
  brandGrouped.byThemeAndLayer.forEach((layers) => {
    layers.forEach((vars) => {
      vars.forEach(([baseName]) => scopedVarNames.add(baseName))
    })
  })
  uikitGrouped.byLayer.forEach((vars) => {
    vars.forEach(([baseName]) => scopedVarNames.add(baseName))
  })
  uikitGrouped.byThemeAndLayer.forEach((themes) => {
    themes.forEach((layers) => {
      layers.forEach((vars) => {
        vars.forEach(([baseName]) => scopedVarNames.add(baseName))
      })
    })
  })

  const result: { specific?: string; scoped?: string } = {}

  // Build specific CSS (all variables with their full names, including theme/layer)
  if (options.specific) {
    let specificCss = `/*\n`
    specificCss += ` * Recursica CSS Variables - Specific (Backward Compatibility)\n`
    specificCss += ` * Generated: ${buildDate}\n`
    specificCss += ` *\n`
    specificCss += ` * Total CSS Variables: ${totalVars}\n`
    specificCss += ` *\n`
    specificCss += ` * Components Included: ${componentsList}\n`
    specificCss += ` *\n`
    specificCss += ` * Color Families Included: ${colorsList}\n`
    specificCss += ` *\n`
    specificCss += ` * This file contains all CSS variables with their full names,\n`
    specificCss += ` * including theme and layer information in the variable names.\n`
    specificCss += ` * Use this for backward compatibility with existing code.\n`
    specificCss += ` */\n\n`
    specificCss += `:root {\n`

    recursicaVars.forEach(([name, value]) => {
      const exportedName = convertKeyHyphensToUnderscores(name)
      specificCss += `  ${exportedName}: ${value};\n`
    })

    specificCss += `}\n`
    result.specific = specificCss
  }

  // Build scoped CSS (variables without theme/layer in names, using data attributes)
  if (options.scoped) {
    // Filter :root vars to exclude those that will be in scoped blocks
    const rootVars = recursicaVars.filter(([name]) => {
      const parsed = parseCssVarName(name)
      // Include in :root if it has no theme/layer (unscoped)
      return !parsed.hasTheme && !parsed.hasLayer
    })

    let scopedCss = `/*\n`
    scopedCss += ` * Recursica CSS Variables - Scoped\n`
    scopedCss += ` * Generated: ${buildDate}\n`
    scopedCss += ` *\n`
    scopedCss += ` * Total CSS Variables: ${totalVars}\n`
    scopedCss += ` *\n`
    scopedCss += ` * Components Included: ${componentsList}\n`
    scopedCss += ` *\n`
    scopedCss += ` * Color Families Included: ${colorsList}\n`
    scopedCss += ` *\n`
    scopedCss += ` * This file contains CSS variables using data-recursica-theme\n`
    scopedCss += ` * and data-recursica-layer attributes for scoping.\n`
    scopedCss += ` * Variables do not include theme/layer in their names.\n`
    scopedCss += ` *\n`
    scopedCss += ` * Usage:\n`
    scopedCss += ` * - Set data-recursica-theme="light" or "dark" on root <html> element\n`
    scopedCss += ` * - Set data-recursica-layer="N" on any element to override layer for that element and descendants\n`
    scopedCss += ` * - CSS cascading ensures variables flow through all nested elements\n`
    scopedCss += ` * - Elements between root and layer declaration inherit from their nearest ancestor\n`
    scopedCss += ` * - Combined theme+layer selectors override individual theme or layer selectors\n`
    scopedCss += ` */\n\n`

    // Section 1: Unscoped CSS variables in :root (no theme/layer)
    if (rootVars.length > 0) {
      scopedCss += `/*\n`
      scopedCss += ` * Unscoped CSS Variables (:root)\n`
      scopedCss += ` * These variables have no theme/layer and are available globally\n`
      scopedCss += ` */\n`
      scopedCss += `:root {\n`

      rootVars.forEach(([name, value]) => {
        const exportedName = convertKeyHyphensToUnderscores(name)
        scopedCss += `  ${exportedName}: ${value};\n`
      })

      scopedCss += `}\n\n`
    }

    // Section 2: Scoped CSS variables using data-recursica-theme
    // These selectors cascade through all descendant elements
    // Set data-recursica-theme on the root <html> element
    if (brandGrouped.byTheme.size > 0) {
      scopedCss += `/*\n`
      scopedCss += ` * Scoped CSS Variables - Theme (data-recursica-theme)\n`
      scopedCss += ` * These variables cascade through all descendant elements\n`
      scopedCss += ` * Set data-recursica-theme="light" or "dark" on the root <html> element\n`
      scopedCss += ` */\n`

      // Export light theme
      if (brandGrouped.byTheme.has('light')) {
        scopedCss += `[data-recursica-theme="light"] {\n`
        brandGrouped.byTheme.get('light')!.forEach(([baseName, value]) => {
          const exportedName = convertKeyHyphensToUnderscores(baseName)
          scopedCss += `  ${exportedName}: ${value};\n`
        })
        scopedCss += `}\n\n`
      }

      // Export dark theme
      if (brandGrouped.byTheme.has('dark')) {
        scopedCss += `[data-recursica-theme="dark"] {\n`
        brandGrouped.byTheme.get('dark')!.forEach(([baseName, value]) => {
          const exportedName = convertKeyHyphensToUnderscores(baseName)
          scopedCss += `  ${exportedName}: ${value};\n`
        })
        scopedCss += `}\n\n`
      }
    }

    // Section 3: Scoped CSS variables using data-recursica-layer
    // These selectors cascade through all descendant elements
    // Can be set on any element in the DOM hierarchy to override layer for that element and its children
    if (uikitGrouped.byLayer.size > 0) {
      scopedCss += `/*\n`
      scopedCss += ` * Scoped CSS Variables - Layer (data-recursica-layer)\n`
      scopedCss += ` * These variables cascade through all descendant elements\n`
      scopedCss += ` * Set data-recursica-layer="N" on any element to apply layer N to that element and all descendants\n`
      scopedCss += ` * Root element should have data-recursica-layer="0" by default\n`
      scopedCss += ` * Elements between root and layer declaration will inherit from their nearest ancestor\n`
      scopedCss += ` */\n`

      // Sort layers numerically
      const sortedLayers = Array.from(uikitGrouped.byLayer.keys()).sort((a, b) => {
        const numA = parseInt(a, 10)
        const numB = parseInt(b, 10)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.localeCompare(b)
      })

      sortedLayers.forEach((layer) => {
        scopedCss += `[data-recursica-layer="${layer}"] {\n`
        uikitGrouped.byLayer.get(layer)!.forEach(([baseName, value]) => {
          const exportedName = convertKeyHyphensToUnderscores(baseName)
          scopedCss += `  ${exportedName}: ${value};\n`
        })
        scopedCss += `}\n\n`
      })
    }

    // Section 4: Combined theme + layer scoping for vars with both theme and layer
    // These selectors have higher specificity and override theme-only or layer-only selectors
    // They cascade through all descendant elements when both attributes are present on an element or ancestor
    if (brandGrouped.byThemeAndLayer.size > 0) {
      scopedCss += `/*\n`
      scopedCss += ` * Scoped CSS Variables - Theme + Layer (data-recursica-theme + data-recursica-layer)\n`
      scopedCss += ` * These variables combine both theme and layer scoping with higher specificity\n`
      scopedCss += ` * They cascade through all descendant elements when both attributes are present\n`
      scopedCss += ` * Example: <html data-recursica-theme="light"> with <div data-recursica-layer="1"> inside\n`
      scopedCss += ` *          Elements inside the div will use these combined theme+layer variables\n`
      scopedCss += ` */\n`

      const sortedThemes = Array.from(brandGrouped.byThemeAndLayer.keys()).sort()
      sortedThemes.forEach((theme) => {
        const layers = brandGrouped.byThemeAndLayer.get(theme)!
        const sortedLayers = Array.from(layers.keys()).sort((a, b) => {
          const numA = parseInt(a, 10)
          const numB = parseInt(b, 10)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.localeCompare(b)
        })

        sortedLayers.forEach((layer) => {
          scopedCss += `[data-recursica-theme="${theme}"][data-recursica-layer="${layer}"] {\n`
          layers.get(layer)!.forEach(([baseName, value]) => {
            const exportedName = convertKeyHyphensToUnderscores(baseName)
            scopedCss += `  ${exportedName}: ${value};\n`
          })
          scopedCss += `}\n\n`
        })
      })
    }

    // Also handle UIKit vars with both theme and layer (if any exist in future)
    if (uikitGrouped.byThemeAndLayer.size > 0) {
      const sortedThemes = Array.from(uikitGrouped.byThemeAndLayer.keys()).sort()
      sortedThemes.forEach((theme) => {
        const layers = uikitGrouped.byThemeAndLayer.get(theme)!
        const sortedLayers = Array.from(layers.keys()).sort((a, b) => {
          const numA = parseInt(a, 10)
          const numB = parseInt(b, 10)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.localeCompare(b)
        })

        sortedLayers.forEach((layer) => {
          scopedCss += `[data-recursica-theme="${theme}"][data-recursica-layer="${layer}"] {\n`
          layers.get(layer)!.forEach(([baseName, value]) => {
            const exportedName = convertKeyHyphensToUnderscores(baseName)
            scopedCss += `  ${exportedName}: ${value};\n`
          })
          scopedCss += `}\n\n`
        })
      })
    }

    result.scoped = scopedCss
  }

  return result
}

/**
 * Downloads selected JSON files and optionally CSS file
 * If multiple files are selected, they are zipped together
 * Validates JSON files before export and throws error if validation fails
 */
export async function downloadJsonFiles(files: { tokens?: boolean; brand?: boolean; uikit?: boolean; cssSpecific?: boolean; cssScoped?: boolean } = { tokens: true, brand: true, uikit: true }): Promise<void> {
  // Count how many files are selected
  const selectedFiles: Array<{ content: string | object; filename: string; isJson: boolean }> = []

  if (files.tokens) {
    const tokens = exportTokensJson()
    // Validate tokens before adding to export
    try {
      validateTokensJson(tokens as JsonLike)
    } catch (error) {

      throw new Error(`Cannot export tokens.json: ${error instanceof Error ? error.message : String(error)}`)
    }
    selectedFiles.push({ content: tokens, filename: EXPORT_FILENAME_TOKENS, isJson: true })
  }

  if (files.brand) {
    const brand = exportBrandJson()
    // Validate brand before adding to export
    try {
      validateBrandJson(brand as JsonLike)
    } catch (error) {

      throw new Error(`Cannot export brand.json: ${error instanceof Error ? error.message : String(error)}`)
    }
    selectedFiles.push({ content: brand, filename: EXPORT_FILENAME_BRAND, isJson: true })
  }

  if (files.uikit) {
    const uikit = exportUIKitJson()
    // Validate UIKit before adding to export
    try {
      validateUIKitJson(uikit as JsonLike)
    } catch (error) {

      throw new Error(`Cannot export uikit.json: ${error instanceof Error ? error.message : String(error)}`)
    }
    selectedFiles.push({ content: uikit, filename: EXPORT_FILENAME_UIKIT, isJson: true })
  }

  // Export CSS files (specific and/or scoped) via JSON transforms
  if (files.cssSpecific || files.cssScoped) {
    const json = {
      tokens: exportTokensJson(),
      brand: normalizeBrandReferences(exportBrandJson()),
      uikit: normalizeBrandReferences(exportUIKitJson())
    } as Parameters<typeof recursicaJsonTransformSpecific>[0]
    if (files.cssSpecific) {
      const [file] = recursicaJsonTransformSpecific(json)
      selectedFiles.push({ content: file.contents, filename: file.filename, isJson: false })
    }
    if (files.cssScoped) {
      const [file] = recursicaJsonTransformScoped(json)
      selectedFiles.push({ content: file.contents, filename: file.filename, isJson: false })
    }
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

