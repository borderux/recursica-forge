/**
 * Centralized CSS Variable Reading Utility
 * 
 * All CSS variable reading should go through this utility to ensure:
 * - Consistency (checks both inline and computed styles)
 * - Fallback handling
 * - Type safety
 */

/**
 * Reads a CSS variable value from the document root
 * 
 * Checks inline styles first (what we set), then falls back to computed styles.
 * 
 * @param cssVarName - The CSS variable name (e.g., '--recursica-brand-light-palettes-core-black')
 * @param fallback - Optional fallback value if variable is not found
 * @returns The CSS variable value, or fallback if not found
 */
export function readCssVar(cssVarName: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback
  
  try {
    // Check inline style first (what we set via updateCssVar)
    const inlineValue = document.documentElement.style.getPropertyValue(cssVarName).trim()
    if (inlineValue) return inlineValue
    
    // Fall back to computed style
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim()
    return computedValue || fallback
  } catch {
    return fallback
  }
}

/**
 * Reads a CSS variable value as a number
 * 
 * @param cssVarName - The CSS variable name
 * @param fallback - Optional fallback number if variable is not found or invalid
 * @returns The numeric value, or fallback if not found/invalid
 */
export function readCssVarNumber(cssVarName: string, fallback: number = 0): number {
  const value = readCssVar(cssVarName)
  if (!value) return fallback
  
  const num = parseFloat(value)
  return Number.isFinite(num) ? num : fallback
}

/**
 * Reads a CSS variable value and resolves it recursively
 * 
 * If the value is a var() reference, it will be resolved to its final value.
 * 
 * @param cssVarName - The CSS variable name
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @param fallback - Optional fallback value
 * @returns The resolved value, or fallback if not found
 */
export function readCssVarResolved(
  cssVarName: string,
  maxDepth: number = 10,
  fallback?: string
): string | undefined {
  if (maxDepth <= 0) return fallback
  
  const value = readCssVar(cssVarName)
  if (!value) return fallback
  
  // If it's a var() reference, resolve it
  const varMatch = value.match(/var\s*\(\s*(--[^)]+)\s*\)/)
  if (varMatch) {
    const innerVarName = varMatch[1]
    return readCssVarResolved(innerVarName, maxDepth - 1, fallback)
  }
  
  return value
}

