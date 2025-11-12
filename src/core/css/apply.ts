import { applyCssVars as applyDirect } from '../../modules/theme/varsUtil'
import { isBrandVar, validateCssVarValue } from './varTypes'
import { findTokenByHex, tokenToCssVar } from './tokenRefs'

export type CssVarMap = Record<string, string>

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

export function applyCssVars(vars: CssVarMap, tokens?: any) {
  // Validate all brand vars use token references
  const fixedVars: CssVarMap = { ...vars }
  let hasWarnings = false
  
  for (const [key, value] of Object.entries(vars)) {
    if (isBrandVar(key)) {
      const validation = validateCssVarValue(key, value)
      if (!validation.valid) {
        // Try to fix it
        const fixed = tryFixBrandVarValue(key, value, tokens)
        if (fixed) {
          fixedVars[key] = fixed
          console.warn(`Fixed brand CSS variable ${key}: ${value} -> ${fixed}`)
          hasWarnings = true
        } else {
          console.error(validation.error)
          // Don't throw - log error but continue with original value
          // This allows the app to continue functioning while highlighting the issue
          hasWarnings = true
        }
      }
    }
  }
  
  if (hasWarnings) {
    console.warn('Some brand CSS variables were set to non-reference values. They should always reference tokens.')
  }
  
  applyDirect(fixedVars)
}

export function clearAllCssVars() {
  const root = document.documentElement
  const style = root.style
  const varsToRemove: string[] = []
  
  // Collect all --recursica-* CSS custom properties from inline styles
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (prop && prop.startsWith('--recursica-')) {
      varsToRemove.push(prop)
    }
  }
  
  // Remove them
  varsToRemove.forEach(prop => root.style.removeProperty(prop))
}

export function applyCssVarsDelta(prev: CssVarMap | null, next: CssVarMap): { applied: number } {
  const root = document.documentElement
  let applied = 0
  const prevMap = prev || {}
  const toPrefixed = (name: string): string => {
    if (!name || !name.startsWith('--')) return name
    // If it already has --recursica- prefix, return as-is
    if (name.startsWith('--recursica-')) return name
    return `--recursica-${name.slice(2)}`
  }
  // Apply changed or added vars
  for (const [key, value] of Object.entries(next)) {
    const pref = toPrefixed(key)
    // Write ONLY the prefixed variable
    root.style.setProperty(pref, value)
    // Ensure the old/unprefixed variable is removed
    if (pref !== key) root.style.removeProperty(key)
    applied += 1
  }
  // Remove any old variables (both prefixed and unprefixed) that were previously applied but are no longer present
  const nextKeys = new Set(Object.keys(next))
  for (const key of Object.keys(prevMap)) {
    if (!key.startsWith('--')) continue
    const pref = toPrefixed(key)
    // Remove unprefixed legacy var if it exists
    if (pref !== key) {
      root.style.removeProperty(key)
    }
    // Remove prefixed var if it's no longer in next map
    if (!nextKeys.has(key)) {
      root.style.removeProperty(pref)
    }
  }
  return { applied }
}


