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
  const errors: Array<{ var: string; value: string; error: string; context?: string }> = []
  const warnings: Array<{ var: string; value: string; fixed: string; context?: string }> = []
  
  for (const [key, value] of Object.entries(vars)) {
    if (!key || typeof key !== 'string') {
      errors.push({
        var: String(key),
        value: String(value),
        error: 'Invalid CSS variable name (must be a non-empty string)',
        context: 'applyCssVars received invalid variable name'
      })
      continue
    }
    
    if (value === undefined || value === null) {
      errors.push({
        var: key,
        value: String(value),
        error: 'CSS variable value cannot be undefined or null',
        context: `Variable ${key} has invalid value`
      })
      continue
    }
    
    const trimmedValue = String(value).trim()
    
    // Validate brand vars must use token references
    if (isBrandVar(key)) {
      const validation = validateCssVarValue(key, trimmedValue)
      if (!validation.valid) {
        // Try to fix it
        const fixed = tryFixBrandVarValue(key, trimmedValue, tokens)
        if (fixed) {
          fixedVars[key] = fixed
          warnings.push({
            var: key,
            value: trimmedValue,
            fixed: fixed,
            context: `Auto-fixed brand CSS variable: ${validation.error}`
          })
        } else {
          errors.push({
            var: key,
            value: trimmedValue,
            error: validation.error || 'Invalid value for brand CSS variable',
            context: `Brand CSS variable ${key} must reference a token (e.g., var(--recursica-tokens-...)) but got: ${trimmedValue}`
          })
          // Keep original value but mark as error
          fixedVars[key] = trimmedValue
        }
      } else {
        // Valid brand var - check if token reference exists
        const tokenMatch = trimmedValue.match(/var\(--recursica-tokens-([^)]+)\)/)
        if (tokenMatch && tokens) {
          const tokenPath = tokenMatch[1]
          // Basic check: ensure token path looks valid
          if (!tokenPath || tokenPath.length === 0) {
            warnings.push({
              var: key,
              value: trimmedValue,
              fixed: trimmedValue,
              context: `Empty token reference in ${key}`
            })
          }
        }
      }
    }
    
    // Validate token vars have valid format
    if (key.startsWith('--recursica-tokens-')) {
      // Token vars should be simple values (hex colors, numbers, etc.) or var() references
      if (trimmedValue.startsWith('var(') && !trimmedValue.match(/^var\(--recursica-/)) {
        warnings.push({
          var: key,
          value: trimmedValue,
          fixed: trimmedValue,
          context: `Token CSS variable ${key} references non-recursica variable: ${trimmedValue}`
        })
      }
    }
    
    // Validate value format
    if (trimmedValue.length === 0 && key.startsWith('--recursica-')) {
      warnings.push({
        var: key,
        value: trimmedValue,
        fixed: trimmedValue,
        context: `CSS variable ${key} has empty value`
      })
    }
  }
  
  // Log errors with context
  if (errors.length > 0) {
    console.error(`[CSS Var Validation] Found ${errors.length} validation error(s):`)
    errors.forEach(({ var: varName, value, error, context }) => {
      console.error(`  ❌ ${varName} = ${value}`)
      console.error(`     Error: ${error}`)
      if (context) {
        console.error(`     Context: ${context}`)
      }
    })
    
    // In development, log errors but don't throw to prevent infinite loops
    // Errors are already logged above, so we just continue
    // Throwing here was causing infinite recompute loops
  }
  
  // Log warnings with context
  if (warnings.length > 0) {
    console.warn(`[CSS Var Validation] Found ${warnings.length} validation warning(s):`)
    warnings.forEach(({ var: varName, value, fixed, context }) => {
      console.warn(`  ⚠️  ${varName} = ${value} → ${fixed}`)
      if (context) {
        console.warn(`     ${context}`)
      }
    })
  }
  
  // Apply validated vars
  applyDirect(fixedVars)
  
  // Return validation summary
  return {
    applied: Object.keys(fixedVars).length,
    errors: errors.length,
    warnings: warnings.length,
    details: { errors, warnings }
  }
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

export function applyCssVarsDelta(prev: CssVarMap | null, next: CssVarMap, tokens?: any): { applied: number; errors: number; warnings: number } {
  // Validate before applying delta
  const validation = applyCssVars(next, tokens)
  
  const root = document.documentElement
  let applied = 0
  const prevMap = prev || {}
  const toPrefixed = (name: string): string => {
    if (!name || !name.startsWith('--')) return name
    // If it already has --recursica- prefix, return as-is
    if (name.startsWith('--recursica-')) return name
    return `--recursica-${name.slice(2)}`
  }
  
  // Apply changed or added vars (already validated by applyCssVars)
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
  
  return { 
    applied, 
    errors: validation.errors, 
    warnings: validation.warnings 
  }
}


