/**
 * Dimension CSS Variable Resolver
 * 
 * Generates CSS variables from Brand.json dimension section.
 */

import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'
import { resolveTokenReferenceToCssVar, type TokenReferenceContext } from '../utils/tokenReferenceParser'

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
      // Dimensions are now at brand level, so CSS vars don't include mode
      const cssVarName = `--recursica-brand-dimensions-${currentPath.join('-')}`

      // Check if value is a token reference (e.g., {tokens.size.2x})
      if (typeof val === 'string') {
        const context: TokenReferenceContext = {
          tokenIndex
        }
        const cssVar = resolveTokenReferenceToCssVar(val, context)
        if (cssVar) {
          vars[cssVarName] = cssVar
          return // Skip to next iteration
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
  // Dimensions are now at brand level, not mode level
  const dimensions = troot?.dimensions

  if (dimensions) {
    // Dimensions are mode-agnostic, but we still need mode for CSS var naming
    // Generate CSS vars without mode prefix since dimensions are shared
    traverseDimensions(dimensions, [], vars, tokenIndex, theme, mode)
    
    // Add backwards compatibility aliases for spacer dimensions
    // Old format: --recursica-brand-dimensions-spacer-sm
    // New format: --recursica-brand-dimensions-spacers-sm
    // Generate aliases so old references still work
    if (dimensions.spacers && typeof dimensions.spacers === 'object') {
      const spacerKeys = Object.keys(dimensions.spacers).filter(k => !k.startsWith('$'))
      spacerKeys.forEach(spacerKey => {
        const newVarName = `--recursica-brand-dimensions-spacers-${spacerKey}`
        const oldVarName = `--recursica-brand-dimensions-spacer-${spacerKey}`
        if (vars[newVarName] && !vars[oldVarName]) {
          vars[oldVarName] = vars[newVarName]
        }
      })
    }
    // Also add backwards compatibility for icon dimensions
    // Old format: --recursica-brand-dimensions-icon-default
    // New format: --recursica-brand-dimensions-icons-default
    if (dimensions.icons && typeof dimensions.icons === 'object') {
      const iconKeys = Object.keys(dimensions.icons).filter(k => !k.startsWith('$'))
      iconKeys.forEach(iconKey => {
        const newVarName = `--recursica-brand-dimensions-icons-${iconKey}`
        const oldVarName = `--recursica-brand-dimensions-icon-${iconKey}`
        if (vars[newVarName] && !vars[oldVarName]) {
          vars[oldVarName] = vars[newVarName]
        }
      })
    }
    // Add backwards compatibility aliases for general dimensions (if they exist)
    // Old format: --recursica-brand-dimensions-sm
    // New format: --recursica-brand-dimensions-general-sm
    // Generate aliases so old references still work
    if (dimensions.general && typeof dimensions.general === 'object') {
      const generalDims = ['default', 'sm', 'md', 'lg', 'xl']
      generalDims.forEach(dim => {
        const newVarName = `--recursica-brand-dimensions-general-${dim}`
        const oldVarName = `--recursica-brand-dimensions-${dim}`
        if (vars[newVarName] && !vars[oldVarName]) {
          vars[oldVarName] = vars[newVarName]
        }
      })
    }
  }

  return vars
}

