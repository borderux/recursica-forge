/**
 * Dimension CSS Variable Resolver
 * 
 * Generates CSS variables from Brand.json dimension section.
 */

import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'

/**
 * Recursively traverses dimension object and generates CSS variables
 */
function traverseDimensions(
  obj: any,
  prefix: string[],
  vars: Record<string, string>,
  tokenIndex: ReturnType<typeof buildTokenIndex>,
  theme: JsonLike,
  mode: 'light' | 'dark'
): void {
  if (obj == null || typeof obj !== 'object') return

  Object.entries(obj).forEach(([key, value]) => {
    // Skip metadata keys
    if (key.startsWith('$')) return

    const currentPath = [...prefix, key]

    // If this is a value object with $type and $value
    if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
      const val = (value as any).$value
      const type = (value as any).$type
      const cssVarName = `--recursica-brand-${mode}-dimension-${currentPath.join('-')}`

      // Check if value is a token reference (e.g., {tokens.size.2x})
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        const inner = val.trim().slice(1, -1).trim()
        
        // Handle token references: {tokens.size.2x} → var(--recursica-tokens-size-2x)
        if (/^tokens\./i.test(inner)) {
          const tokenPath = inner.replace(/^tokens\./i, '').replace(/\./g, '-')
          vars[cssVarName] = `var(--recursica-tokens-${tokenPath})`
          return // Skip to next iteration
        }
        
        // Handle theme references: {theme.light.dimension.*} → var(--recursica-brand-light-dimension-*)
        if (/^theme\.(light|dark)\./i.test(inner)) {
          const parts = inner.split('.').filter(Boolean)
          if (parts.length >= 2) {
            const themeMode = parts[1].toLowerCase()
            const themePath = parts.slice(2).join('-')
            vars[cssVarName] = `var(--recursica-brand-${themeMode}-dimension-${themePath})`
            return // Skip to next iteration
          }
        }
      }

      // If not a reference, resolve it (but this shouldn't happen for brand vars)
      // This is a fallback for raw values
      if (type === 'number') {
        if (typeof val === 'number') {
          vars[cssVarName] = `${val}px`
        } else if (typeof val === 'string') {
          const trimmed = val.trim()
          if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            vars[cssVarName] = `${trimmed}px`
          } else {
            vars[cssVarName] = trimmed
          }
        } else {
          vars[cssVarName] = String(val)
        }
      } else {
        vars[cssVarName] = String(val)
      }
    } else {
      // Continue traversing
      traverseDimensions(value, currentPath, vars, tokenIndex, theme, mode)
    }
  })
}

/**
 * Builds CSS variables from Brand.json dimension section
 * 
 * @param tokens - Tokens JSON for resolving token references
 * @param theme - Brand JSON containing dimension definitions
 * @param mode - 'light' or 'dark'
 * @returns Map of CSS variable names to values
 */
export function buildDimensionVars(
  tokens: JsonLike,
  theme: JsonLike,
  mode: 'light' | 'dark'
): Record<string, string> {
  const vars: Record<string, string> = {}
  const tokenIndex = buildTokenIndex(tokens)
  
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const modeRoot = troot?.[mode]
  const dimensions = modeRoot?.dimension

  if (dimensions) {
    traverseDimensions(dimensions, [], vars, tokenIndex, theme, mode)
  }

  return vars
}

