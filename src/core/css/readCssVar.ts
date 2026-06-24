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
 * @param cssVarName - The CSS variable name (e.g., '--recursica_brand_light_palettes_core_black')
 * @param fallback - Optional fallback value if variable is not found
 * @returns The CSS variable value, or fallback if not found
 */
export function readCssVar(cssVarName: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback

  try {
    // Check inline style first (what we set via updateCssVar)
    const inlineValue = document.documentElement.style.getPropertyValue(cssVarName)
    if (inlineValue !== '') return inlineValue.trim()

    // Fall back to computed style
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName)
    if (computedValue !== '') return computedValue.trim()
    return fallback
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
  if (typeof document === 'undefined') return fallback

  try {
    // Check inline style first
    const inlineValue = document.documentElement.style.getPropertyValue(cssVarName)
    if (inlineValue !== '') {
      const num = parseFloat(inlineValue.trim())
      if (Number.isFinite(num)) return num
      // Inline value might be a var() reference — fall through to computed
    }

    // Computed style fully resolves var() chains to final values
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName)
    if (computedValue !== '') {
      const num = parseFloat(computedValue.trim())
      if (Number.isFinite(num)) return num
    }

    return fallback
  } catch {
    return fallback
  }
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
  const varMatch = value.match(/var\s*\(\s*(--[^)]+?)\s*\)/)
  if (varMatch) {
    const innerVarName = varMatch[1].trim()
    return readCssVarResolved(innerVarName, maxDepth - 1, fallback)
  }

  return value
}

/**
 * Reads the RAW, uncomputed CSS variable value (e.g. "var(--other-var)")
 * 
 * This looks up the exact string assigned to the variable without resolving it.
 * Useful when you need to parse the structure of a reference before the browser computes it.
 * 
 * @param cssVarName - The CSS variable name
 * @param fallback - Optional fallback value
 * @returns The raw, uncomputed value, or fallback if not found
 */
export function readRawCssVar(cssVarName: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback

  try {
    // Check inline style first
    const inlineValue = document.documentElement.style.getPropertyValue(cssVarName)
    if (inlineValue !== '') return inlineValue.trim()

    // Search through all style tags (this gets the uncomputed value like "var(...)")
    // Start from the end to get the most recently applied styles
    const styleElements = Array.from(document.querySelectorAll('style')).reverse()
    
    for (const style of styleElements) {
      if (!style.textContent) continue
      
      // Simple regex to find the variable assignment
      // Matches: --var-name: some-value; or --var-name: var(--other-var) /* comment */;
      const regex = new RegExp(`${cssVarName}\\s*:\\s*([^;}]+)`, 'g')
      let match
      let lastMatch
      
      // Get the last occurrence in this style tag (CSS cascade within file)
      while ((match = regex.exec(style.textContent)) !== null) {
        lastMatch = match[1]
      }
      
      if (lastMatch) {
        // Remove trailing comments or whitespace
        return lastMatch.replace(/\/\*[\s\S]*?\*\//g, '').trim()
      }
    }

    return fallback
  } catch {
    return fallback
  }
}
