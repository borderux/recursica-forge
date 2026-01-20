/**
 * CSS Variable Type Validation and Enforcement
 * 
 * Ensures that brand CSS variables always reference tokens, never hardcoded values.
 */

/**
 * Validates that a CSS variable name matches expected patterns
 */
export function isTokenVar(name: string): boolean {
  return name.startsWith('--recursica-tokens-') || name.startsWith('--tokens-')
}

export function isBrandVar(name: string): boolean {
  return name.startsWith('--recursica-brand-') || name.startsWith('--brand-')
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
  
  // If it's a raw value (px, number, etc), this is also an error for brand vars
  throw new Error(`Brand CSS variable ${cssVarName} must reference a token (var(--recursica-tokens-...)), got: ${value}`)
}

/**
 * Validates a CSS variable value based on its type
 */
export function validateCssVarValue(cssVarName: string, value: string): { valid: boolean; error?: string } {
  if (isBrandVar(cssVarName)) {
    const trimmed = value.trim()
    // Allow var() references (direct token references)
    if (trimmed.startsWith('var(')) {
      return { valid: true }
    }
    // Allow color-mix() and other CSS functions that contain token references
    // Check if the value contains var(--recursica-tokens-...) anywhere in it
    if (trimmed.includes('var(--recursica-tokens-') || trimmed.includes('var(--tokens-')) {
      return { valid: true }
    }
    // Special case: border-thickness can use direct pixel values (0-20px)
    // This allows users to set border thickness directly without requiring tokens
    if (cssVarName.includes('border-thickness')) {
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
      error: `Brand CSS variable ${cssVarName} must use a token reference (var(--recursica-tokens-...)), got: ${value}`
    }
  }
  return { valid: true }
}

