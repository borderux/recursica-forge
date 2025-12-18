/**
 * UIKit CSS Variable Resolver
 * 
 * Generates CSS variables from UIKit.json structure.
 * Handles token references and applies them to the document root.
 */

import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'

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
  _tokenIndex: ReturnType<typeof buildTokenIndex>,
  _theme: JsonLike,
  _uikit: JsonLike,
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
  
  let inner = trimmed.slice(1, -1).trim()
  
  // Normalize spaces to dots and clean up the reference
  // Handle cases like "{brand themes light palettes neutral.100. color tone}" 
  // → "{brand.themes.light.palettes.neutral.100.color.tone}"
  // Also handle spaces around dots: "{ui-kit .0 . global}" → "{ui-kit.0.global}"
  // First, remove spaces around dots, then replace remaining spaces with dots
  inner = inner
    .replace(/\s*\.\s*/g, '.')  // Remove spaces around dots first
    .replace(/\s+/g, '.')        // Replace remaining spaces with dots
    .replace(/\.+/g, '.')         // Collapse multiple dots to single dot
    .replace(/^\.|\.$/g, '')      // Remove leading/trailing dots
  
  // Handle brand-level references: {brand.dimensions.*} (no mode needed)
  if (/^brand\.dimensions?\./i.test(inner)) {
    const parts = inner.split('.').filter(Boolean)
    if (parts.length >= 2 && parts[1].toLowerCase() === 'dimensions') {
      const dimPath = parts.slice(2).join('-')
      return `var(--recursica-brand-dimensions-${dimPath})`
    }
  }
  
  // Handle brand-level typography references: {brand.typography.button.font-size} (no mode needed)
  // Note: Typography style references like {brand.typography.caption} should NOT be resolved here
  // because they don't have a single CSS variable - they have multiple properties (font-size, font-weight, etc.)
  // Components use typographyUtils to extract the style name and get individual property CSS variables
  // Only resolve if it's a specific property like {brand.typography.caption.font-size}
  if (/^brand\.typography\./i.test(inner)) {
    const parts = inner.split('.').filter(Boolean)
    if (parts.length >= 2 && parts[1].toLowerCase() === 'typography') {
      // Check if this is a specific property (e.g., caption.font-size) or just a style name (e.g., caption)
      if (parts.length > 3) {
        // This is a specific property like {brand.typography.caption.font-size}
        // parts: ['brand', 'typography', 'caption', 'font-size']
        // We want: --recursica-brand-typography-caption-font-size
        const typoPath = parts.slice(2).join('-') // Skip 'brand' and 'typography'
        return `var(--recursica-brand-typography-${typoPath})`
      }
      // Otherwise, it's just a style name like {brand.typography.caption}
      // Don't resolve it - return null so it's preserved as-is
      return null
    }
  }
  
  // Handle brand/theme references: {brand.themes.light.*} or {brand.light.*} or {theme.light.*} or {brand.dark.*} or {theme.dark.*}
  // Support both old format (brand.light.*) and new format (brand.themes.light.*) for backwards compatibility
  // Also support "theme" prefix for backwards compatibility
  const brandThemeMatch = /^(brand|theme)\.(themes\.)?(light|dark)\./i.exec(inner)
  if (brandThemeMatch) {
    const parts = inner.split('.').filter(Boolean)
    let mode: string
    let path: string
    
    // Handle new format: brand.themes.light.*
    if (parts.length >= 3 && parts[1].toLowerCase() === 'themes') {
      mode = parts[2].toLowerCase() // 'light' or 'dark'
      path = parts.slice(3).join('.') // Skip "brand", "themes", and mode
    } else {
      // Handle old format: brand.light.* or theme.light.*
      mode = parts[1].toLowerCase() // 'light' or 'dark'
      path = parts.slice(2).join('.') // Skip "brand"/"theme" and mode
    }
    
    // Directly map path patterns to CSS variable references
    // Don't resolve actual values - we want CSS var references
    
    // Layer references: layers.layer-0.property.surface or layers.0.property.surface (note: "layers" is now plural)
    // Handle both formats: layer-0 and numeric 0
    const layerMatch = /^layers?\.(?:layer-)?(\d+)\.property\.(.+)$/i.exec(path)
    if (layerMatch) {
      const layerNum = layerMatch[1]
      const prop = layerMatch[2].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-layer-layer-${layerNum}-property-${prop})`
    }
    
    // Layer element references: layers.layer-0.element.text.color or layers.0.element.text.color (note: "layers" is now plural)
    // Note: Actual CSS var pattern is: --recursica-brand-light-layer-layer-0-property-element-text-*
    // The "property" part is included in the actual variable name
    // Handle both formats: layer-0 and numeric 0
    const layerElementMatch = /^layers?\.(?:layer-)?(\d+)\.element\.(.+)$/i.exec(path)
    if (layerElementMatch) {
      const layerNum = layerElementMatch[1]
      let elementPath = layerElementMatch[2].replace(/\./g, '-')
      
      // Special handling: element.interactive should map to element.interactive-color
      // (the layers resolver generates --recursica-brand-light-layer-layer-0-property-element-interactive-color)
      if (elementPath === 'interactive') {
        elementPath = 'interactive-color'
      }
      // Handle element.interactive.default.on-tone -> element-interactive-default-on-tone
      // Handle element.interactive.hover.on-tone -> element-interactive-hover-on-tone
      // These are already handled by the replace(/\./g, '-') above, so no special case needed
      
      return `var(--recursica-brand-${mode}-layer-layer-${layerNum}-property-element-${elementPath})`
    }
    
    // Layer-alternative property references: layers.layer-alternative.primary-color.property.surface
    // Pattern: --recursica-brand-light-layer-layer-alternative-primary-color-property-surface
    const layerAltPropertyMatch = /^layers?\.layer-alternative\.([a-z0-9-]+)\.property\.(.+)$/i.exec(path)
    if (layerAltPropertyMatch) {
      const altKey = layerAltPropertyMatch[1]
      const prop = layerAltPropertyMatch[2].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property-${prop})`
    }
    
    // Layer-alternative element references: layers.layer-alternative.primary-color.element.text.color
    // Pattern: --recursica-brand-light-layer-layer-alternative-primary-color-property-element-text-color
    const layerAltElementMatch = /^layers?\.layer-alternative\.([a-z0-9-]+)\.element\.(.+)$/i.exec(path)
    if (layerAltElementMatch) {
      const altKey = layerAltElementMatch[1]
      let elementPath = layerAltElementMatch[2].replace(/\./g, '-')
      
      // Special handling: element.interactive should map to element.interactive-color
      if (elementPath === 'interactive') {
        elementPath = 'interactive-color'
      }
      
      return `var(--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property-element-${elementPath})`
    }
    
    // Palette core-colors references with state: palettes.core-colors.interactive.default.tone
    // Handle: palettes.core-colors.{color}.{state}.{tone|on-tone}
    // Note: For core-colors, "default" stays as "default" (not mapped to "primary" like regular palettes)
    const paletteCoreColorsStateMatch = /^palettes?\.core-colors?\.([a-z0-9-]+)\.([a-z0-9-]+)\.(tone|on-tone)$/i.exec(path)
    if (paletteCoreColorsStateMatch) {
      const [, coreColor, state, type] = paletteCoreColorsStateMatch
      // Keep state as-is for core-colors (default stays default, hover stays hover)
      return `var(--recursica-brand-${mode}-palettes-core-${coreColor}-${state}-${type})`
    }
    
    // Palette core-colors references: palettes.core-colors.alert (check this AFTER state pattern)
    const paletteCoreColorsMatch = /^palettes?\.core-colors?\.(alert|warning|success|interactive|black|white)$/i.exec(path)
    if (paletteCoreColorsMatch) {
      const [, coreColor] = paletteCoreColorsMatch
      return `var(--recursica-brand-${mode}-palettes-core-${coreColor})`
    }
    
    // Palette references with full path: palettes.neutral.100.color.tone, palettes.neutral.default.color.tone, etc.
    // Also handle: palettes.palette-1.default.color.tone
    // This pattern handles the full path structure with .color.tone or .color.on-tone
    const paletteFlexMatch = /^palettes?\.([a-z0-9-]+)\.([a-z0-9-]+)\.color\.(tone|on-tone)$/i.exec(path)
    if (paletteFlexMatch) {
      const [, paletteKey, level, type] = paletteFlexMatch
      const cssLevel = level === 'default' ? 'primary' : level
      return `var(--recursica-brand-${mode}-palettes-${paletteKey}-${cssLevel}-${type})`
    }
    
    // Palette references: palette.neutral.900.tone (legacy format without .color.)
    const paletteMatch = /^palettes?\.([a-z0-9-]+)\.(\d+|default|primary)\.(tone|on-tone)$/i.exec(path)
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const cssLevel = level === 'default' ? 'primary' : level
      return `var(--recursica-brand-${mode}-palettes-${paletteKey}-${cssLevel}-${type})`
    }
    
    // Palette references without tone/on-tone: palettes.neutral.default or palettes.palette-1.default
    // These should map to the primary tone (default -> primary)
    const paletteDefaultMatch = /^palettes?\.([a-z0-9-]+)\.(default|primary)$/i.exec(path)
    if (paletteDefaultMatch) {
      const [, paletteKey] = paletteDefaultMatch
      // Default to 'tone' when not specified
      return `var(--recursica-brand-${mode}-palettes-${paletteKey}-primary-tone)`
    }
    
    // Palette core colors: palettes.core.white or palettes.core.black
    // These map to palettes.core-colors.white/black
    const paletteCoreMatch = /^palettes?\.core\.(white|black)$/i.exec(path)
    if (paletteCoreMatch) {
      const [, color] = paletteCoreMatch
      return `var(--recursica-brand-${mode}-palettes-core-${color})`
    }
    
    // Palette alert/warning/success: palette.alert (legacy format)
    const paletteCoreLegacyMatch = /^palettes?\.(alert|warning|success)$/i.exec(path)
    if (paletteCoreLegacyMatch) {
      const [, coreColor] = paletteCoreLegacyMatch
      return `var(--recursica-brand-${mode}-palettes-core-${coreColor})`
    }
    
    // Palette black/white shortcuts: palette.black or palette.white
    // These are shortcuts for palette.core-colors.black/white
    const paletteBWMatch = /^palettes?\.(black|white)$/i.exec(path)
    if (paletteBWMatch) {
      const [, color] = paletteBWMatch
      return `var(--recursica-brand-${mode}-palettes-core-${color})`
    }
    
    // Dimension references: dimensions.gutter.horizontal (now at brand level, no mode)
    const dimensionMatch = /^dimensions?\.(.+)$/i.exec(path)
    if (dimensionMatch) {
      const dimPath = dimensionMatch[1].replace(/\./g, '-')
      return `var(--recursica-brand-dimensions-${dimPath})`
    }
    
    // Elevations references: elevations.elevation-0 or elevations.elevation-1
    // Pattern: --recursica-brand-light-elevations-elevation-0
    const elevationMatch = /^elevations?\.(elevation-\d+)$/i.exec(path)
    if (elevationMatch) {
      const elevationKey = elevationMatch[1]
      return `var(--recursica-brand-${mode}-elevations-${elevationKey})`
    }
    
    // State references: state.disabled
    const stateMatch = /^state\.(.+)$/i.exec(path)
    if (stateMatch) {
      const statePath = stateMatch[1].replace(/\./g, '-')
      return `var(--recursica-brand-${mode}-state-${statePath})`
    }
    
    // Text-emphasis references: text-emphasis.low or text-emphasis.high
    const textEmphasisMatch = /^text-emphasis\.(low|high)$/i.exec(path)
    if (textEmphasisMatch) {
      const [, emphasis] = textEmphasisMatch
      return `var(--recursica-brand-${mode}-text-emphasis-${emphasis})`
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
  // Also handle variations with spaces: {ui-kit.0 global form indicator color required-asterisk}
  // Also handle missing dots: {ui-kit0 global form...} → {ui-kit.0.global.form...}
  // Also handle spaces around dots: {ui-kit .0 . global . form ...} → {ui-kit.0.global.form...}
  // Note: inner has already been normalized (spaces → dots) at the top of the function
  // But we need to handle cases where spaces were around dots, creating patterns like "ui-kit.0.global"
  if (/^ui-kit/i.test(inner)) {
    // inner is already normalized, but we may need to fix "ui-kit0" → "ui-kit.0"
    // and ensure proper dot separation
    let normalized = inner
      .replace(/^ui-kit(\d+)/i, 'ui-kit.$1') // Fix "ui-kit0" → "ui-kit.0"
      .replace(/\.+/g, '.')  // Collapse multiple dots
      .replace(/^\.|\.$/g, '') // Remove leading/trailing dots
    
    // Check if it matches the UIKit pattern after normalization
    if (!/^ui-kit\.\d+\./i.test(normalized)) {
      return null
    }
    
    const parts = normalized.split('.').filter(Boolean)
    if (parts.length < 3) return null
    
    // Skip "ui-kit" and mode number (0 or 3), use the rest of the path
    // {ui-kit.0.global.form.indicator.color.required-asterisk} 
    // → parts: ['ui-kit', '0', 'global', 'form', 'indicator', 'color', 'required-asterisk']
    // → uikitPath: 'global.form.indicator.color.required-asterisk'
    // In UIKit.json structure: ui-kit.global.form.indicator.color.required-asterisk
    // So we keep the full path including "global"
    const uikitPath = parts.slice(2).join('.')
    
    // Generate CSS var name - toCssVarName will handle the path correctly
    const uikitVar = toCssVarName(uikitPath)
    
    // If vars map is provided, check if the referenced variable exists
    // If it doesn't exist yet, we'll resolve it in the second pass
    if (vars && !vars.hasOwnProperty(uikitVar)) {
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
      
      const cssVarName = toCssVarName(currentPath.join('.'))
      
      // Handle typography type: {brand.typography.caption}
      // Typography styles don't have a single CSS variable - they have multiple properties
      // (font-size, font-weight, etc.). We should NOT create a CSS variable that references
      // the typography style name directly. Instead, components should use the typography
      // utility functions to get the individual property CSS variables.
      if (type === 'typography' && typeof val === 'string') {
        // Don't create a CSS variable for typography type - it's handled differently
        // Components use typographyUtils to extract the style name and get individual properties
        // Just preserve the raw value for components to read
        vars[cssVarName] = val.trim()
        return
      }
      
      // Handle dimension type: { value: number | string, unit: string }
      if (type === 'dimension' && val && typeof val === 'object' && 'value' in val && 'unit' in val) {
        const dimValue = val.value
        const unit = val.unit || 'px'
        
        // Try to resolve token references in the value
        const resolved = resolveTokenRef(dimValue, tokenIndex, theme, uikit, 0, vars)
        
        if (resolved) {
          // If resolved to a CSS var, use it directly (it should already have units)
          vars[cssVarName] = resolved
        } else if (dimValue != null) {
          // Check if dimValue is a brace reference that couldn't be resolved yet
          if (typeof dimValue === 'string' && dimValue.trim().startsWith('{') && dimValue.trim().endsWith('}')) {
            // Preserve the brace reference for second pass resolution
            vars[cssVarName] = dimValue.trim()
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
        // e.g., {brand.themes.light.elevations.elevation-0} -> elevation-0
        const trimmed = val.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const inner = trimmed.slice(1, -1).trim()
          // Normalize spaces to dots
          const normalized = inner
            .replace(/\s*\.\s*/g, '.')
            .replace(/\s+/g, '.')
            .replace(/\.+/g, '.')
            .replace(/^\.|\.$/g, '')
          
          // Extract elevation name from pattern: brand.themes.light.elevations.elevation-0
          const elevationMatch = /elevations?\.(elevation-\d+)$/i.exec(normalized)
          if (elevationMatch) {
            vars[cssVarName] = elevationMatch[1] // Just the elevation name like "elevation-0"
          } else {
            // Try to resolve as a regular token reference
            const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars)
            if (resolved) {
              vars[cssVarName] = resolved
            } else {
              vars[cssVarName] = val.trim()
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
        const resolved = resolveTokenRef(val, tokenIndex, theme, uikit, 0, vars)
        
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
  // 2. { "ui-kit": { "global": {...}, "components": {...} } } - flat structure with components inside ui-kit
  
  // First pass: Generate all variables (with placeholders for UIKit self-references)
  if (uikitRoot?.['0']) {
    // Structure 1: Mode-based (0 = light, 3 = dark)
    // Process mode "0" (light mode) as the default
    const lightMode = uikitRoot['0']
    traverseUIKit(lightMode, [], vars, tokenIndex, theme, uikit)
  } else if (uikitRoot?.['ui-kit']) {
    // Structure 2: Flat structure with "ui-kit" containing both "global" and "components"
    // Process "ui-kit" section (skip the "ui-kit" key in path)
    // This will traverse both "global" and "components" as siblings
    traverseUIKit(uikitRoot['ui-kit'], [], vars, tokenIndex, theme, uikit)
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
        // Check for unresolved references (still in brace format)
        // This includes UIKit self-references and brand/theme references that weren't resolved
        const trimmed = value.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const resolved = resolveTokenRef(value, tokenIndex, theme, uikit, 0, vars)
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

