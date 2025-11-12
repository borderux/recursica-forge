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
  
  // If it's a raw value (px, number, etc), this is also an error for brand vars
  throw new Error(`Brand CSS variable ${cssVarName} must reference a token (var(--recursica-tokens-...)), got: ${value}`)
}

/**
 * Validates a CSS variable value based on its type
 */
export function validateCssVarValue(cssVarName: string, value: string): { valid: boolean; error?: string } {
  if (isBrandVar(cssVarName)) {
    const trimmed = value.trim()
    if (!trimmed.startsWith('var(')) {
      return {
        valid: false,
        error: `Brand CSS variable ${cssVarName} must use a token reference (var(--recursica-tokens-...)), got: ${value}`
      }
    }
  }
  return { valid: true }
}

