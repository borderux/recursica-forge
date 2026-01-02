/**
 * Centralized CSS Variable Update Function
 * 
 * All CSS variable updates should go through this function to ensure:
 * - Validation (brand vars must reference tokens)
 * - Consistency (all updates use same path)
 * - Traceability (can log/audit updates)
 * - Future: reactive updates (AA compliance, etc.)
 */

import { isBrandVar, validateCssVarValue } from './varTypes'
import { findTokenByHex, tokenToCssVar } from './tokenRefs'

/**
 * Updates a single CSS variable with validation
 * 
 * @param cssVarName - The CSS variable name (e.g., '--recursica-brand-light-palettes-core-black')
 * @param value - The value to set (must be a token reference for brand vars)
 * @param tokens - Optional tokens object for auto-fixing hex values
 * @returns true if update was successful, false if validation failed
 */
export function updateCssVar(
  cssVarName: string,
  value: string,
  tokens?: any
): boolean {
  const root = document.documentElement
  const trimmedValue = value.trim()
  
  // Validate brand vars must use token references
  if (isBrandVar(cssVarName)) {
    const validation = validateCssVarValue(cssVarName, trimmedValue)
    if (!validation.valid) {
      // Try to auto-fix if it's a hex color
      const fixed = tryFixBrandVarValue(cssVarName, trimmedValue, tokens)
      if (fixed) {
        console.warn(`Auto-fixed brand CSS variable ${cssVarName}: ${trimmedValue} -> ${fixed}`)
        root.style.setProperty(cssVarName, fixed)
        return true
      } else {
        console.error(`Cannot update brand CSS variable ${cssVarName}: ${validation.error}`)
        return false
      }
    }
  }
  
  // Apply the update
  root.style.setProperty(cssVarName, trimmedValue)
  
  // Dispatch event to notify components of CSS variable updates
  // This allows components to reactively update when CSS vars change
  try {
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [cssVarName] }
    }))
  } catch (e) {
    // Ignore errors if window is not available (SSR)
  }
  
  return true
}

/**
 * Updates multiple CSS variables at once
 * 
 * @param vars - Map of CSS variable names to values
 * @param tokens - Optional tokens object for auto-fixing
 * @returns Number of successfully updated variables
 */
export function updateCssVars(
  vars: Record<string, string>,
  tokens?: any
): number {
  let successCount = 0
  for (const [cssVar, value] of Object.entries(vars)) {
    if (updateCssVar(cssVar, value, tokens)) {
      successCount++
    }
  }
  return successCount
}

/**
 * Tries to fix a brand CSS variable value by finding a matching token
 */
function tryFixBrandVarValue(cssVarName: string, value: string, tokens?: any): string | null {
  const trimmed = value.trim()
  
  // If it's a hex color, try to find matching token
  if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
    if (tokens) {
      const tokenMatch = findTokenByHex(trimmed, tokens)
      if (tokenMatch) {
        return `var(--recursica-tokens-color-${tokenMatch.family}-${tokenMatch.level})`
      }
    }
  }
  
  // If it looks like a token name, try to convert it
  if (trimmed.includes('/')) {
    const tokenRef = tokenToCssVar(trimmed)
    if (tokenRef) return tokenRef
  }
  
  return null
}

/**
 * Removes a CSS variable
 * 
 * @param cssVarName - The CSS variable name to remove
 */
export function removeCssVar(cssVarName: string): void {
  const root = document.documentElement
  root.style.removeProperty(cssVarName)
  
  // Also remove unprefixed version if it exists
  if (cssVarName.startsWith('--recursica-')) {
    const unprefixed = cssVarName.replace('--recursica-', '--')
    root.style.removeProperty(unprefixed)
  }
  
  // Dispatch event to notify components of CSS variable removal
  try {
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [cssVarName] }
    }))
  } catch (e) {
    // Ignore errors if window is not available (SSR)
  }
}

