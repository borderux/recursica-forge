/**
 * UIKit CSS Variable Resolver
 * 
 * Generates CSS variables from UIKit.json structure.
 * Handles token references and applies them to the document root.
 */

import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'
import { resolveTokenReferenceToCssVar, extractBraceContent, parseTokenReference, type TokenReferenceContext } from '../utils/tokenReferenceParser'

/**
 * Converts a UIKit.json path to a CSS variable name
 * 
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid')
 * => '--recursica-ui-kit-components-button-color-layer-0-background-solid'
 * 
 * @example
 * toCssVarName('globals.icon.style')
 * => '--recursica-ui-kit-globals-icon-style'
 */
function toCssVarName(path: string): string {
  const parts = path
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .split('.')
    .filter(Boolean) // Remove empty parts
    .map(part => part.replace(/\s+/g, '-').toLowerCase())
  
  // Remove "ui-kit" from parts if it appears (to avoid double prefix)
  const filteredParts = parts.filter(part => part !== 'ui-kit')
  
  return `--recursica-ui-kit-${filteredParts.join('-')}`
}

/**
 * Resolves a token reference to a CSS variable reference
 * 
 * Handles references like:
 * - {theme.light.layer.layer-0.property.surface}
 * - {theme.light.palette.neutral.900.tone}
 * - {theme.light.dimension.border-radius.default}
 * - {ui-kit.0.globals.form.indicators.colors.required-asterisk}
 */
function resolveTokenRef(
  value: any,
  _tokenIndex: ReturnType<typeof buildTokenIndex>,
  _theme: JsonLike,
  _uikit: JsonLike,
  depth = 0,
  vars?: Record<string, string>, // Optional vars map to check if UIKit self-references exist
  mode: 'light' | 'dark' = 'light' // Current theme mode for resolving brand references
): string | null {
  if (depth > 10) return null
  
  // Use centralized token reference parser
  const context: TokenReferenceContext = {
    currentMode: mode,
    tokenIndex: _tokenIndex,
    theme: _theme,
    uikit: _uikit
  }
  
  const cssVar = resolveTokenReferenceToCssVar(value, context)
  if (cssVar) {
    // For UIKit self-references, check if the variable exists in vars map
    // If it doesn't exist yet, return null to defer resolution
    if (vars && cssVar.startsWith('var(--recursica-ui-kit-')) {
      const varName = cssVar.replace(/^var\(|\)$/g, '')
      if (!vars.hasOwnProperty(varName)) {
        // Variable doesn't exist yet - return null to defer resolution
        // The second pass will handle this
        return null
      }
    }
    return cssVar
  }
  
  return null
}

/**
 * Traverses UIKit.json and generates CSS variables
 */
function traverseUIKit(
  obj: any,
  prefix: string[],
  vars: Record<string, string>,
  tokenIndex: ReturnType<typeof buildTokenIndex>,
  theme: JsonLike,
  uikit: JsonLike,
  mode: 'light' | 'dark' = 'light'
): void {
  if (obj == null || typeof obj !== 'object') return
  
  // Skip metadata properties
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      traverseUIKit(item, [...prefix, String(index)], vars, tokenIndex, theme, uikit, mode)
    })
    return
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip metadata keys
    if (key.startsWith('$')) return
    
    // Map JSON "sizes" to CSS variable "size" for backward compatibility
    const cssVarKey = key === 'sizes' ? 'size' : key
    const currentPath = [...prefix, cssVarKey]
    
    // If this is a value object with $type and $value
    if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
      const val = (value as any).$value
      const type = (value as any).$type
      
      const cssVarName = toCssVarName(currentPath.join('.'))
      
      // Handle typography type: {brand.typography.caption}
      // Typography styles don't have a single CSS variable - they have multiple properties
      // (font-size, font-weight, etc.). We should NOT create a CSS variable that references
      // the typography style name directly. Instead, components should use the typography
      // utility functions to get the individual property CSS variables.
      if (type === 'typography' && typeof val === 'string') {
        // Create a CSS variable with the raw token reference as a valid CSS string value
        // Components use typographyUtils to extract the style name and get individual properties
        // The token reference like {brand.typography.caption} is a valid CSS value (string literal)
        // Store it as-is so components can read and parse it
        // Note: CSS variables can contain any string value, including braces
        vars[cssVarName] = val.trim()
        return
      }
      
      // Handle dimension type: { value: number | string, unit: string }
      if (type === 'dimension' && val && typeof val === 'object' && 'value' in val && 'unit' in val) {
        const dimValue = val.value
        const unit = val.unit || 'px'
        
        // Try to resolve token references in the value
        const resolved = resolveTokenRef(dimValue, tokenIndex, theme, uikit, 0, vars, mode)
        
        if (resolved) {
          // If resolved to a CSS var, use it directly (it should already have units)
          vars[cssVarName] = resolved
        } else if (dimValue != null) {
          // Check if dimValue is a brace reference that couldn't be resolved yet
          const braceContent = extractBraceContent(dimValue)
          if (braceContent !== null) {
            // Preserve the brace reference for second pass resolution
            vars[cssVarName] = typeof dimValue === 'string' ? dimValue.trim() : `{${braceContent}}`
          } else {
            // Use the value with the unit
            if (typeof dimValue === 'number') {
              vars[cssVarName] = `${dimValue}${unit}`
            } else if (typeof dimValue === 'string') {
              const trimmed = dimValue.trim()
              // Check if string already has a unit
              if (/^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|deg|rad|grad|ms|s|Hz|kHz|dpi|dpcm|dppx)$/i.test(trimmed)) {
                vars[cssVarName] = trimmed
              } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
                vars[cssVarName] = `${trimmed}${unit}`
              } else {
                vars[cssVarName] = trimmed
              }
            } else {
              vars[cssVarName] = String(dimValue)
            }
          }
        }
      } else if (type === 'elevation' && typeof val === 'string') {
        // Handle elevation type: extract elevation name from reference
        // e.g., {brand.elevations.elevation-0} -> elevation-0
        const trimmed = val.trim()
        const braceContent = extractBraceContent(trimmed)
        if (braceContent !== null) {
          // Parse the token reference to extract elevation name
          const context: TokenReferenceContext = {
            currentMode: mode,
            tokenIndex,
            theme,
            uikit
          }
          const parsed = parseTokenReference(trimmed, context)
          
          if (parsed && parsed.type === 'brand') {
            // Extract elevation name from path: palettes.elevations.elevation-0 or elevations.elevation-0
            const pathStr = parsed.path.join('.')
            const elevationMatch = /elevations?\.(elevation-\d+)$/i.exec(pathStr)
            if (elevationMatch) {
              vars[cssVarName] = elevationMatch[1] // Just the elevation name like "elevation-0"
            } else {
              // Try to resolve as a regular token reference
              const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars, mode)
              if (resolved) {
                vars[cssVarName] = resolved
              } else {
                vars[cssVarName] = trimmed
              }
            }
          } else {
            // Try to resolve as a regular token reference
            const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars, mode)
            if (resolved) {
              vars[cssVarName] = resolved
            } else {
              vars[cssVarName] = trimmed
            }
          }
        } else {
          // Not a brace reference, use as-is
          vars[cssVarName] = trimmed
        }
      } else {
        // Handle other types (number, string, color, etc.)
        
        // For color type, null values should be interpreted as transparent
        // This explicitly sets the color to transparent to override any default library component colors
        if (type === 'color' && (val === null || val === undefined)) {
          vars[cssVarName] = 'transparent'
          return
        }
        
        // Try to resolve token references
        // Pass vars map so UIKit self-references can check if the referenced var exists
        const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars, mode)
        
        if (resolved) {
          vars[cssVarName] = resolved
        } else if (val != null) {
          // Check if val is a brace reference that couldn't be resolved yet
          // (e.g., UIKit self-reference that doesn't exist yet)
          const braceContent = extractBraceContent(val)
          if (braceContent !== null) {
            // Preserve the brace reference for second pass resolution
            vars[cssVarName] = typeof val === 'string' ? val.trim() : `{${braceContent}}`
          } else {
            // Use raw value if it's not a reference
            // For numbers, add px if no unit (unless it's already a string with unit)
            if (type === 'number') {
              if (typeof val === 'number') {
                vars[cssVarName] = `${val}px`
              } else if (typeof val === 'string') {
                // Check if string already has a unit
                const trimmed = val.trim()
                if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
                  vars[cssVarName] = `${trimmed}px`
                } else {
                  vars[cssVarName] = trimmed
                }
              } else {
                vars[cssVarName] = String(val)
              }
            } else if (type === 'string') {
              vars[cssVarName] = String(val)
            } else {
              vars[cssVarName] = String(val)
            }
          }
        }
      }
    } else {
      // Continue traversing
      traverseUIKit(value, currentPath, vars, tokenIndex, theme, uikit, mode)
    }
  })
}

/**
 * Builds CSS variables from UIKit.json
 * 
 * @param tokens - Tokens JSON for resolving token references
 * @param theme - Theme/Brand JSON for resolving theme references
 * @param uikit - UIKit JSON to process
 * @returns Map of CSS variable names to values
 */
export function buildUIKitVars(
  tokens: JsonLike,
  theme: JsonLike,
  uikit: JsonLike,
  mode: 'light' | 'dark' = 'light'
): Record<string, string> {
  const vars: Record<string, string> = {}
  const tokenIndex = buildTokenIndex(tokens)
  
  const uikitRoot: any = uikit
  
  // Handle two possible structures:
  // 1. { "0": { "globals": {...}, "button": {...} }, "3": {...} } - mode-based
  // 2. { "ui-kit": { "globals": {...}, "components": {...} } } - flat structure with components inside ui-kit
  
  // First pass: Generate all variables (with placeholders for UIKit self-references)
  if (uikitRoot?.['0']) {
    // Structure 1: Mode-based (0 = light, 3 = dark)
    // Process mode "0" (light mode) as the default
    const lightMode = uikitRoot['0']
    traverseUIKit(lightMode, [], vars, tokenIndex, theme, uikit, mode)
  } else if (uikitRoot?.['ui-kit']) {
    // Structure 2: Flat structure with "ui-kit" containing both "globals" and "components"
    // Process "ui-kit" section (skip the "ui-kit" key in path)
    // This will traverse both "globals" and "components" as siblings
    traverseUIKit(uikitRoot['ui-kit'], [], vars, tokenIndex, theme, uikit, mode)
  } else {
    // Fallback: treat entire object as UIKit structure
    traverseUIKit(uikitRoot, [], vars, tokenIndex, theme, uikit, mode)
  }
  
  // Second pass: Resolve any UIKit self-references that weren't resolved in first pass
  // (This handles cases where a variable references another UIKit variable)
  // Keep iterating until no more changes (handles transitive references)
  let changed = true
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false
    iterations++
    
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'string') {
        // Check for unresolved references (still in brace format)
        // This includes UIKit self-references and brand/theme references that weren't resolved
        const trimmed = value.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const resolved = resolveTokenRef(value, tokenIndex, theme, uikit, 0, vars, mode)
          // Update if we got a resolution and it's different from the original
          // (resolved will be a CSS var reference like "var(--recursica-...)" or null)
          if (resolved && typeof resolved === 'string' && !resolved.startsWith('{')) {
            vars[key] = resolved
            changed = true
          } else if (!resolved) {
            // Unresolved references will be caught by the CSS var audit
            // Silently skip - these are expected for some references that may not be resolvable
          }
        }
        
        // Check for var() references to UIKit vars that might not exist
        // (This is just for validation - broken references will be caught by the audit)
        const varMatches = value.match(/var\s*\(\s*(--recursica-ui-kit-[^)]+)\s*\)/g)
        if (varMatches) {
          // If the referenced variable doesn't exist in vars, it's broken
          // But we can't fix it here - it means the variable wasn't generated
          // This will be caught by the audit
        }
      }
    }
  }
  
  return vars
}
