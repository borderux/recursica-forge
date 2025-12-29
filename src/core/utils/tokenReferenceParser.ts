/**
 * Centralized Token Reference Parser
 * 
 * Handles parsing of token references from Brand.json and UIKit.json
 * Supports multiple formats:
 * - {tokens.color.family.level}
 * - {brand.palettes...} (theme-agnostic, uses current mode from context)
 * - {brand.layers...} (theme-agnostic, uses current mode from context)
 * - {ui-kit...}
 * 
 * All brand references are theme-agnostic and use the current mode from context.
 * Theme should never be specified in the reference itself.
 * 
 * This utility centralizes all token reference parsing logic to ensure
 * consistency and make structural changes easier to manage.
 */

import type { JsonLike } from '../resolvers/tokens'
import type { TokenIndex } from '../resolvers/tokens'

export type ParsedTokenReference = {
  type: 'token' | 'brand' | 'ui-kit' | 'unknown'
  path: string[]
  mode?: 'light' | 'dark'
  resolvedPath?: string // Normalized path after processing
}

export type TokenReferenceContext = {
  currentMode?: 'light' | 'dark'
  tokenIndex?: TokenIndex
  theme?: JsonLike
  uikit?: JsonLike
}

/**
 * Extracts the inner content from a brace reference
 * Handles $value wrappers and normalizes whitespace
 */
export function extractBraceContent(value: any): string | null {
  if (value == null) return null
  
  // Handle $value wrapper
  if (typeof value === 'object' && '$value' in value) {
    value = value.$value
  }
  
  if (typeof value !== 'string') return null
  
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null
  }
  
  let inner = trimmed.slice(1, -1).trim()
  
  // Normalize spaces to dots and clean up the reference
  // Handle cases like "{brand themes light palettes neutral.100. color tone}" 
  // → "{brand.themes.light.palettes.neutral.100.color.tone}"
  // Also handle spaces around dots: "{ui-kit .0 . global}" → "{ui-kit.0.global}"
  inner = inner
    .replace(/\s*\.\s*/g, '.')  // Remove spaces around dots first
    .replace(/\s+/g, '.')        // Replace remaining spaces with dots
    .replace(/\.+/g, '.')         // Collapse multiple dots to single dot
    .replace(/^\.|\.$/g, '')      // Remove leading/trailing dots
  
  return inner || null
}

/**
 * Parses a token reference into its components
 */
export function parseTokenReference(
  value: any,
  context?: TokenReferenceContext
): ParsedTokenReference | null {
  const inner = extractBraceContent(value)
  if (!inner) return null
  
  const currentMode = context?.currentMode || 'light'
  
  // Token references: {tokens.color.family.level} or {token.color.family.level}
  if (/^(tokens?|token)\./i.test(inner)) {
    const path = inner.replace(/^(tokens?|token)\./i, '').split('.').filter(Boolean)
    return {
      type: 'token',
      path,
      resolvedPath: path.join('/')
    }
  }
  
  // UIKit references: {ui-kit.*} or {ui-kit.*}
  if (/^ui-kit\./i.test(inner)) {
    const path = inner.replace(/^ui-kit\./i, '').split('.').filter(Boolean)
    return {
      type: 'ui-kit',
      path,
      resolvedPath: inner
    }
  }
  
  // Brand references
  if (/^brand\./i.test(inner) || /^theme\./i.test(inner)) {
    // Normalize "theme" to "brand"
    let normalized = inner.replace(/^theme\./i, 'brand.')
    
    // Remove any theme specification from the reference
    // Strip out: brand.themes.light.*, brand.themes.dark.*, brand.light.*, brand.dark.*
    // All references should be theme-agnostic and use current mode from context
    normalized = normalized
      .replace(/^brand\.themes\.(?:light|dark)\./i, 'brand.')
      .replace(/^brand\.(?:light|dark)\./i, 'brand.')
    
    const parts = normalized.split('.').filter(Boolean)
    
    // Extract path parts (skip "brand" prefix)
    const pathParts = parts.length > 0 && parts[0].toLowerCase() === 'brand' 
      ? parts.slice(1)
      : parts
    
    // Build resolved path with current mode for internal use
    const resolvedPath = pathParts.length > 0 
      ? `brand.themes.${currentMode}.${pathParts.join('.')}`
      : `brand.themes.${currentMode}`
    
    return {
      type: 'brand',
      path: pathParts,
      mode: currentMode,
      resolvedPath
    }
  }
  
  return {
    type: 'unknown',
    path: inner.split('.').filter(Boolean),
    resolvedPath: inner
  }
}

/**
 * Resolves a token reference to a CSS variable name
 * This is the main function that should be used throughout the codebase
 */
export function resolveTokenReferenceToCssVar(
  value: any,
  context: TokenReferenceContext
): string | null {
  const parsed = parseTokenReference(value, context)
  if (!parsed) return null
  
  const mode = parsed.mode || context.currentMode || 'light'
  
  // Token references → CSS token variables
  if (parsed.type === 'token') {
    const path = parsed.resolvedPath || parsed.path.join('/')
    return `var(--recursica-tokens-${path.replace(/\//g, '-')})`
  }
  
  // UIKit references → CSS UIKit variables
  if (parsed.type === 'ui-kit') {
    // Handle UIKit self-references: {ui-kit.0.global.form.*} or {ui-kit.0.form.*}
    // Normalize "ui-kit0" → "ui-kit.0" and ensure proper dot separation
    let normalized = parsed.resolvedPath || parsed.path.join('.')
    normalized = normalized
      .replace(/^ui-kit(\d+)/i, 'ui-kit.$1') // Fix "ui-kit0" → "ui-kit.0"
      .replace(/\.+/g, '.')  // Collapse multiple dots
      .replace(/^\.|\.$/g, '') // Remove leading/trailing dots
    
    const parts = normalized.split('.').filter(Boolean)
    if (parts.length < 3) return null
    
    // Skip "ui-kit" and mode number (0 or 3), use the rest of the path
    // {ui-kit.0.global.form.indicator.color.required-asterisk} 
    // → parts: ['ui-kit', '0', 'global', 'form', 'indicator', 'color', 'required-asterisk']
    // → uikitPath: 'global.form.indicator.color.required-asterisk'
    const uikitPath = parts.slice(2).join('.')
    
    // Generate CSS var name by joining with hyphens
    const pathParts = uikitPath.split('.').filter(Boolean)
    const cssVarName = `--recursica-ui-kit-${pathParts.join('-')}`
    
    return `var(${cssVarName})`
  }
  
  // Brand references → CSS brand variables
  if (parsed.type === 'brand') {
    const pathParts = parsed.path
    
    // Brand-level references (no mode): {brand.dimensions.*}, {brand.typography.*}
    if (pathParts.length > 0) {
      const firstPart = pathParts[0].toLowerCase()
      
      if (firstPart === 'dimensions' || firstPart === 'dimension') {
        const dimPath = pathParts.slice(1).join('-')
        return `var(--recursica-brand-dimensions-${dimPath})`
      }
      
      if (firstPart === 'typography') {
        const typoPath = pathParts.slice(1).join('-')
        return `var(--recursica-brand-typography-${typoPath})`
      }
    }
    
    // Layer references: layers.layer-0.property.surface or layers.0.property.surface
    const layerMatch = /^layers?\.(?:layer-)?(\d+)\.property\.(.+)$/i.exec(pathParts.join('.'))
    if (layerMatch) {
      const layerNum = layerMatch[1]
      const prop = layerMatch[2].replace(/\./g, '-')
      return `var(--recursica-brand-themes-${mode}-layer-layer-${layerNum}-property-${prop})`
    }
    
    // Layer element references: layers.layer-0.elements.text.color
    const layerElementMatch = /^layers?\.(?:layer-)?(\d+)\.elements?\.(.+)$/i.exec(pathParts.join('.'))
    if (layerElementMatch) {
      const layerNum = layerElementMatch[1]
      let elementPath = layerElementMatch[2].replace(/\./g, '-')
      
      // Special handling: element.interactive → element-interactive-color
      if (elementPath === 'interactive') {
        elementPath = 'interactive-color'
      }
      
      return `var(--recursica-brand-themes-${mode}-layer-layer-${layerNum}-property-element-${elementPath})`
    }
    
    // Palette core-colors references with state: palettes.core-colors.interactive.default.tone
    const paletteCoreColorsStateMatch = /^palettes?\.core-colors?\.([a-z0-9-]+)\.([a-z0-9-]+)\.(tone|on-tone)$/i.exec(pathParts.join('.'))
    if (paletteCoreColorsStateMatch) {
      const [, coreColor, state, type] = paletteCoreColorsStateMatch
      return `var(--recursica-brand-themes-${mode}-palettes-core-${coreColor}-${state}-${type})`
    }
    
    // Palette core-colors references: palettes.core-colors.alert
    const paletteCoreColorsMatch = /^palettes?\.core-colors?\.(alert|warning|success|interactive|black|white)$/i.exec(pathParts.join('.'))
    if (paletteCoreColorsMatch) {
      const [, coreColor] = paletteCoreColorsMatch
      return `var(--recursica-brand-themes-${mode}-palettes-core-${coreColor})`
    }
    
    // Palette references with full path: palettes.neutral.100.color.tone or palettes.neutral.default.color.tone
    const paletteFlexMatch = /^palettes?\.([a-z0-9-]+)\.([a-z0-9-]+)\.color\.(tone|on-tone)$/i.exec(pathParts.join('.'))
    if (paletteFlexMatch) {
      const [, paletteKey, level, type] = paletteFlexMatch
      const cssLevel = level === 'default' ? 'primary' : level
      return `var(--recursica-brand-themes-${mode}-palettes-${paletteKey}-${cssLevel}-${type})`
    }
    
    // Palette references: palettes.neutral.100.tone (legacy format without .color.)
    const paletteMatch = /^palettes?\.([a-z0-9-]+)\.(\d+|default|primary)\.(tone|on-tone)$/i.exec(pathParts.join('.'))
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const cssLevel = level === 'default' ? 'primary' : level
      return `var(--recursica-brand-themes-${mode}-palettes-${paletteKey}-${cssLevel}-${type})`
    }
    
    // Palette default/primary references: palettes.neutral.default or palettes.neutral.primary
    const paletteDefaultMatch = /^palettes?\.([a-z0-9-]+)\.(default|primary)$/i.exec(pathParts.join('.'))
    if (paletteDefaultMatch) {
      const [, paletteKey] = paletteDefaultMatch
      return `var(--recursica-brand-themes-${mode}-palettes-${paletteKey}-primary-tone)`
    }
    
    // Palette alert/warning/success: palettes.alert (legacy format)
    const paletteCoreMatch = /^palettes?\.(alert|warning|success)$/i.exec(pathParts.join('.'))
    if (paletteCoreMatch) {
      const [, coreColor] = paletteCoreMatch
      return `var(--recursica-brand-themes-${mode}-palettes-core-${coreColor})`
    }
    
    // Palette black/white shortcuts: palettes.black or palettes.white
    const paletteBWMatch = /^palettes?\.(black|white)$/i.exec(pathParts.join('.'))
    if (paletteBWMatch) {
      const [, color] = paletteBWMatch
      return `var(--recursica-brand-themes-${mode}-palettes-core-${color})`
    }
    
    // Elevation references: elevations.elevation-0 or elevations.elevation-1
    const elevationKeyMatch = /^elevations?\.(elevation-\d+)$/i.exec(pathParts.join('.'))
    if (elevationKeyMatch) {
      const [, elevationKey] = elevationKeyMatch
      return `var(--recursica-brand-themes-${mode}-elevations-${elevationKey})`
    }
    
    // Elevation references: elevations.elevation-0.x-axis
    const elevationMatch = /^elevations?\.elevation-(\d+)\.(.+)$/i.exec(pathParts.join('.'))
    if (elevationMatch) {
      const [, elevationNum, prop] = elevationMatch
      return `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationNum}-${prop.replace(/\./g, '-')})`
    }
    
    // State references: state.disabled
    const stateMatch = /^state\.(.+)$/i.exec(pathParts.join('.'))
    if (stateMatch) {
      const statePath = stateMatch[1].replace(/\./g, '-')
      return `var(--recursica-brand-themes-${mode}-state-${statePath})`
    }
    
    // Text-emphasis references: text-emphasis.low or text-emphasis.high
    const textEmphasisMatch = /^text-emphasis\.(low|high)$/i.exec(pathParts.join('.'))
    if (textEmphasisMatch) {
      const [, emphasis] = textEmphasisMatch
      return `var(--recursica-brand-themes-${mode}-text-emphasis-${emphasis})`
    }
  }
  
  return null
}

/**
 * Resolves a token reference to its actual value from the theme/tokens
 * This traverses the JSON structure to get the actual value
 */
export function resolveTokenReferenceToValue(
  value: any,
  context: TokenReferenceContext,
  depth = 0
): any {
  if (depth > 10) return undefined
  
  const parsed = parseTokenReference(value, context)
  if (!parsed) {
    // Not a brace reference, return as-is
    if (typeof value === 'object' && '$value' in value) {
      return resolveTokenReferenceToValue(value.$value, context, depth + 1)
    }
    return value
  }
  
  // Token references → get from token index
  if (parsed.type === 'token' && context.tokenIndex) {
    const path = parsed.resolvedPath || parsed.path.join('/')
    const tokenValue = context.tokenIndex.get(path)
    return resolveTokenReferenceToValue(tokenValue, context, depth + 1)
  }
  
  // Brand references → traverse theme JSON
  if (parsed.type === 'brand' && context.theme) {
    const root: any = (context.theme as any)?.brand ? (context.theme as any).brand : context.theme
    const themes = root?.themes || root
    
    let node: any = themes
    const pathParts = parsed.path
    
    // Always use the mode from parsed (which comes from context.currentMode)
    // parsed.mode is always set to currentMode from context
    const mode = parsed.mode || context.currentMode || 'light'
    node = node?.[mode]
    
    // Traverse the path
    for (const part of pathParts) {
      if (!node) break
      
      // Check direct property
      let next = node[part]
      
      // If not found, check inside $value wrapper
      if (next == null && node && typeof node === 'object' && '$value' in node) {
        next = node.$value?.[part]
      }
      
      node = next
    }
    
    return resolveTokenReferenceToValue(node, context, depth + 1)
  }
  
  // UIKit references → traverse UIKit JSON
  if (parsed.type === 'ui-kit' && context.uikit) {
    let node: any = context.uikit
    
    for (const part of parsed.path) {
      if (!node) break
      
      let next = node[part]
      
      // Check inside $value wrapper
      if (next == null && node && typeof node === 'object' && '$value' in node) {
        next = node.$value?.[part]
      }
      
      node = next
    }
    
    return resolveTokenReferenceToValue(node, context, depth + 1)
  }
  
  return undefined
}

/**
 * Checks if a value is a token reference (brace reference)
 */
export function isTokenReference(value: any): boolean {
  return extractBraceContent(value) !== null
}

/**
 * Checks if a token reference uses a specific token family/level
 * Useful for detecting when a core color token changes
 */
export function tokenReferenceUsesToken(
  value: any,
  family: string,
  level: string,
  context?: TokenReferenceContext
): boolean {
  const parsed = parseTokenReference(value, context)
  if (!parsed || parsed.type !== 'token') return false
  
  const path = parsed.path
  if (path.length < 3) return false
  
  // Check if path matches tokens.color.{family}.{level}
  if (path[0].toLowerCase() === 'color' && path[1] === family && path[2] === level) {
    return true
  }
  
  return false
}

