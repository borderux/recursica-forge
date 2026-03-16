/**
 * CSS Variable Type Validation and Enforcement
 * 
 * Ensures that brand CSS variables always reference tokens, never hardcoded values.
 */

import { TOKEN_PREFIX } from './cssVarBuilder'

/**
 * Validates that a CSS variable name matches expected patterns
 */
export function isTokenVar(name: string): boolean {
  return name.startsWith(TOKEN_PREFIX) || name.startsWith('--tokens-')
}

export function isBrandVar(name: string): boolean {
  return name.startsWith('--recursica_brand_') || name.startsWith('--brand-')
}

/**
 * Ensures brand CSS variables always use token references, never hardcoded values.
 * Throws an error if a hardcoded value is detected.
 */
export function enforceBrandVarValue(cssVarName: string, value: string): string {
  if (!isBrandVar(cssVarName)) return value

  const trimmed = value.trim()

  // If already a var() reference, return as-is
  if (trimmed.startsWith('var(')) return value

  // If it's a hex/RGB value, this is an error
  if (/^#?[0-9a-f]{6}$/i.test(trimmed) || trimmed.startsWith('rgb') || trimmed.startsWith('rgba')) {
    throw new Error(`Brand CSS variable ${cssVarName} cannot be set to hardcoded color value: ${value}. Must reference a token.`)
  }

  // Special case: font-family can use direct font values with fallbacks
  if (cssVarName.includes('font-family')) {
    // Allow font-family values that look like valid CSS font-family declarations
    if (/^["']?[^"']+["']?\s*,\s*[^,]+/.test(trimmed) || /^["']?[^"']+["']?$/.test(trimmed)) {
      return value
    }
  }

  // Special case: elevation size properties (blur, spread, x-axis, y-axis) can use direct pixel values
  // This allows mode-specific elevation values without token conflicts
  if (cssVarName.includes('elevation') &&
    (cssVarName.includes('_blur') || cssVarName.includes('_spread') ||
      cssVarName.includes('_x-axis') || cssVarName.includes('_y-axis'))) {
    // Allow pixel values like "0px", "4px", "-2px", etc. (including negative values)
    if (/^-?\d+px$/.test(trimmed)) {
      return value
    }
  }

  // If it's a raw value (px, number, etc), this is also an error for brand vars
  throw new Error(`Brand CSS variable ${cssVarName} must reference a token (var(--recursica_tokens_...)), got: ${value}`)
}

/**
 * Validates a CSS variable value based on its type
 */
export function validateCssVarValue(cssVarName: string, value: string): { valid: boolean; error?: string } {
  if (isBrandVar(cssVarName)) {
    const trimmed = value.trim()
    // Allow var() references (token references OR other brand variable references)
    // Brand variables can reference tokens, palettes, other layers properties, etc.
    if (trimmed.startsWith('var(')) {
      return { valid: true }
    }
    // Allow color-mix() and other CSS functions that contain token references
    // Check if the value contains var(--recursica_tokens_...) anywhere in it
    if (trimmed.includes('var(--recursica_tokens_') || trimmed.includes('var(--tokens-')) {
      return { valid: true }
    }
    // Special case: elevation can use token reference strings (e.g., {brand.themes.light.elevations.elevation-0})
    // or direct elevation names (e.g., elevation-0, elevation-1)
    // This allows elevation properties to reference elevation definitions
    if (cssVarName.includes('elevation')) {
      // Allow token reference strings
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return { valid: true }
      }
      // Allow direct elevation names (e.g., "elevation-0", "elevation-1")
      if (/^elevation-\d+$/.test(trimmed)) {
        return { valid: true }
      }
      // Special case: elevation size properties (blur, spread, x-axis, y-axis) can use direct pixel values
      // This allows mode-specific elevation values without token conflicts
      // Tokens are shared between modes, so we bypass them for mode-specific elevation properties
      if (cssVarName.includes('_blur') || cssVarName.includes('_spread') ||
        cssVarName.includes('_x-axis') || cssVarName.includes('_y-axis')) {
        // Allow pixel values like "0px", "4px", "-2px", etc. (including negative values)
        if (/^-?\d+px$/.test(trimmed)) {
          return { valid: true }
        }
      }
    }
    // Special case: border-size can use direct pixel values (0-20px)
    // This allows users to set border thickness directly without requiring tokens
    if (cssVarName.includes('border-size')) {
      // Allow pixel values like "0px", "2px", "20px", etc.
      if (/^\d+px$/.test(trimmed)) {
        return { valid: true }
      }
    }
    // Special case: font-family can use direct font values
    // This allows font-family to contain the actual font name (e.g., "Lexend" or Lexend)
    if (cssVarName.includes('font-family')) {
      // Allow font-family values that look like valid CSS font-family declarations
      // Matches patterns like: "Font Name", fallback or FontName, fallback, etc.
      if (/^["']?[^"']+["']?\s*,\s*[^,]+/.test(trimmed) || /^["']?[^"']+["']?$/.test(trimmed)) {
        return { valid: true }
      }
    }
    // Reject hardcoded values
    return {
      valid: false,
      error: `Brand CSS variable ${cssVarName} must use a token reference (var(--recursica_tokens_...)), got: ${value}`
    }
  }
  return { valid: true }
}

