/**
 * UIKit CSS Variable Resolver
 * 
 * Generates CSS variables from UIKit.json structure.
 * Handles token references and applies them to the document root.
 */

import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'
import { readCssVar } from '../css/readCssVar'

/**
 * Converts a UIKit.json path to a CSS variable name
 * 
 * @example
 * toCssVarName('components.button.color.layer-0.background-solid')
 * => '--recursica-ui-kit-components-button-color-layer-0-background-solid'
 * 
 * @example
 * toCssVarName('global.icon.style')
 * => '--recursica-ui-kit-global-icon-style'
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
 * - {ui-kit.0.global.form.indicator.color.required-asterisk}
 */
function resolveTokenRef(
  value: any,
  tokenIndex: ReturnType<typeof buildTokenIndex>,
  theme: JsonLike,
  uikit: JsonLike,
  depth = 0,
  vars?: Record<string, string> // Optional vars map to check if UIKit self-references exist
): string | null {
  if (depth > 10) return null
  
  if (typeof value !== 'string') return null
  
  const trimmed = value.trim()
  
  // Check if it's a brace reference
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null
  }
  
  const inner = trimmed.slice(1, -1).trim()
  
  // Handle theme references: {theme.light.*} or {theme.dark.*}
  if (/^theme\.(light|dark)\./i.test(inner)) {
    const parts = inner.split('.').filter(Boolean)
    if (parts.length < 2) return null
    
    const mode = parts[1].toLowerCase() // 'light' or 'dark'
    const path = parts.slice(2).join('.')
    
    // Directly map path patterns to CSS variable references
    // Don't resolve actual values - we want CSS var references
    
    // Layer references: layer.layer-0.property.surface
    const layerMatch = /^layer\.layer-(\d+)\.property\.(.+)$/i.exec(path)
    if (layerMatch) {
      const layerNum = layerMatch[1]
      const prop = layerMatch[2].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-layer-layer-${layerNum}-property-${prop})`
    }
    
    // Layer element references: layer.layer-0.element.text.color
    // Note: Actual CSS var pattern is: --recursica-brand-light-layer-layer-0-property-element-text-*
    // The "property" part is included in the actual variable name
    const layerElementMatch = /^layer\.layer-(\d+)\.element\.(.+)$/i.exec(path)
    if (layerElementMatch) {
      const layerNum = layerElementMatch[1]
      const elementPath = layerElementMatch[2].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-layer-layer-${layerNum}-property-element-${elementPath})`
    }
    
    // Palette references: palette.neutral.900.tone
    const paletteMatch = /^palette\.([a-z0-9-]+)\.(\d+|default|primary)\.(tone|on-tone)$/i.exec(path)
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const cssLevel = level === 'default' ? 'primary' : level
      return `var(--recursica-brand-${mode}-palettes-${paletteKey}-${cssLevel}-${type})`
    }
    
    // Palette alert/warning/success: palette.alert
    const paletteCoreMatch = /^palette\.(alert|warning|success)$/i.exec(path)
    if (paletteCoreMatch) {
      const [, coreColor] = paletteCoreMatch
      return `var(--recursica-brand-${mode}-palettes-core-${coreColor})`
    }
    
    // Dimension references: dimension.gutter.horizontal
    const dimensionMatch = /^dimension\.(.+)$/i.exec(path)
    if (dimensionMatch) {
      const dimPath = dimensionMatch[1].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-dimension-${dimPath})`
    }
    
    // State references: state.disabled
    const stateMatch = /^state\.(.+)$/i.exec(path)
    if (stateMatch) {
      const statePath = stateMatch[1].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-state-${statePath})`
    }
    
    // Token references: tokens.color.gray.500
    const tokenMatch = /^tokens\.(.+)$/i.exec(path)
    if (tokenMatch) {
      const tokenPath = tokenMatch[1].replace(/\./g, '-')
      return `var(--recursica-tokens-${tokenPath})`
    }
    
    // If no pattern matched, return null to fall through
    return null
  }
  
  // Handle UIKit self-references: {ui-kit.0.global.form.*} or {ui-kit.0.form.*}
  if (/^ui-kit\.\d+\./i.test(inner)) {
    const parts = inner.split('.').filter(Boolean)
    if (parts.length < 3) return null
    
    // Skip "ui-kit" and mode number (0 or 3), use the rest of the path
    // {ui-kit.0.global.form.indicator.color.required-asterisk} 
    // → parts: ['ui-kit', '0', 'global', 'form', ...]
    // → uikitPath: 'global.form.indicator.color.required-asterisk'
    // But in UIKit.json, "form" is a sibling of "global", not under it
    // So we need to handle: if path starts with "global.form", remove "global"
    let uikitPath = parts.slice(2).join('.')
    
    // Fix: If path is "global.form.*", it should actually be "form.*"
    // because "form" is a sibling of "global" in the structure
    if (uikitPath.startsWith('global.form.')) {
      uikitPath = uikitPath.replace(/^global\./, '')
    }
    
    // Generate CSS var name without adding "ui-kit" prefix (toCssVarName already adds it)
    const uikitVar = toCssVarName(uikitPath)
    const referencedVarName = `--recursica-ui-kit-${uikitPath.split('.').map(p => p.replace(/\s+/g, '-').toLowerCase()).filter(p => p !== 'ui-kit').join('-')}`
    
    // If vars map is provided, check if the referenced variable exists
    // If it doesn't exist yet, we'll resolve it in the second pass
    if (vars && !vars.hasOwnProperty(referencedVarName)) {
      // Variable doesn't exist yet - return null to defer resolution
      // The second pass will handle this
      return null
    }
    
    return `var(${uikitVar})`
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
  uikit: JsonLike
): void {
  if (obj == null || typeof obj !== 'object') return
  
  // Skip metadata properties
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      traverseUIKit(item, [...prefix, String(index)], vars, tokenIndex, theme, uikit)
    })
    return
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip metadata keys
    if (key.startsWith('$')) return
    
    const currentPath = [...prefix, key]
    
    // If this is a value object with $type and $value
    if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
      const val = (value as any).$value
      const type = (value as any).$type
      
      // Try to resolve token references
      // Pass vars map so UIKit self-references can check if the referenced var exists
      const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars)
      
      const cssVarName = toCssVarName(currentPath.join('.'))
      
      if (resolved) {
        vars[cssVarName] = resolved
      } else if (val != null) {
        // Check if val is a brace reference that couldn't be resolved yet
        // (e.g., UIKit self-reference that doesn't exist yet)
        if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
          // Preserve the brace reference for second pass resolution
          vars[cssVarName] = val.trim()
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
    } else {
      // Continue traversing
      traverseUIKit(value, currentPath, vars, tokenIndex, theme, uikit)
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
  uikit: JsonLike
): Record<string, string> {
  const vars: Record<string, string> = {}
  const tokenIndex = buildTokenIndex(tokens)
  
  const uikitRoot: any = uikit
  
  // Handle two possible structures:
  // 1. { "0": { "global": {...}, "button": {...} }, "3": {...} } - mode-based
  // 2. { "ui-kit": { "global": {...} }, "components": { "button": {...} } } - flat structure
  
  // First pass: Generate all variables (with placeholders for UIKit self-references)
  if (uikitRoot?.['0']) {
    // Structure 1: Mode-based (0 = light, 3 = dark)
    // Process mode "0" (light mode) as the default
    const lightMode = uikitRoot['0']
    traverseUIKit(lightMode, [], vars, tokenIndex, theme, uikit)
  } else if (uikitRoot?.['ui-kit'] || uikitRoot?.['components']) {
    // Structure 2: Flat structure with "ui-kit" and "components" at top level
    // Process "ui-kit" section (skip the "ui-kit" key in path)
    if (uikitRoot['ui-kit']) {
      traverseUIKit(uikitRoot['ui-kit'], [], vars, tokenIndex, theme, uikit)
    }
    // Process "components" section
    if (uikitRoot['components']) {
      traverseUIKit(uikitRoot['components'], ['components'], vars, tokenIndex, theme, uikit)
    }
  } else {
    // Fallback: treat entire object as UIKit structure
    traverseUIKit(uikitRoot, [], vars, tokenIndex, theme, uikit)
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
        // Check for unresolved UIKit references (still in brace format)
        if (value.includes('{ui-kit.')) {
          const resolved = resolveTokenRef(value, tokenIndex, theme, uikit, 0, vars)
          if (resolved) {
            vars[key] = resolved
            changed = true
          }
        }
        
        // Check for var() references to UIKit vars that might not exist
        const varMatches = value.match(/var\s*\(\s*(--recursica-ui-kit-[^)]+)\s*\)/g)
        if (varMatches) {
          for (const varMatch of varMatches) {
            const varNameMatch = varMatch.match(/var\s*\(\s*(--recursica-ui-kit-[^)]+)\s*\)/)
            if (varNameMatch) {
              const referencedVarName = varNameMatch[1]
              // If the referenced variable doesn't exist in vars, it's broken
              // But we can't fix it here - it means the variable wasn't generated
              // This will be caught by the audit
            }
          }
        }
      }
    }
  }
  
  return vars
}

