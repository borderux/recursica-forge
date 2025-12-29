/**
 * Typography Utilities
 * 
 * Utilities for working with typography type styles from UIKit.json
 */

import { extractBraceContent, parseTokenReference } from '../../core/utils/tokenReferenceParser'

/**
 * Typography properties that should be applied from a typography style
 * 
 * Note: The typography resolver uses 'font-letter-spacing' (not 'letter-spacing')
 * and 'line-height' (not 'font-line-height')
 */
export const TYPOGRAPHY_PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'font-letter-spacing',
  'line-height',
] as const

export type TypographyProperty = typeof TYPOGRAPHY_PROPERTIES[number]

/**
 * Extracts the typography style name from a typography type property value
 * 
 * @example
 * extractTypographyStyleName('{brand.typography.caption}') => 'caption'
 * extractTypographyStyleName('{brand.typography.body}') => 'body'
 * extractTypographyStyleName('var(--recursica-brand-typography-caption-font-size)') => 'caption' (from CSS var)
 * 
 * @param value - The $value from a typography type property (e.g., '{brand.typography.caption}')
 *                or a CSS variable reference (e.g., 'var(--recursica-brand-typography-caption-font-size)')
 * @returns The typography style name (e.g., 'caption') or null if not a typography reference
 */
export function extractTypographyStyleName(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  
  const trimmed = value.trim()
  
  // Check if it's a brace reference: {brand.typography.caption}
  const braceContent = extractBraceContent(trimmed)
  if (braceContent !== null) {
    const parsed = parseTokenReference(trimmed, {})
    if (parsed && parsed.type === 'brand' && parsed.path.length === 2 && parsed.path[0] === 'typography') {
      return parsed.path[1].toLowerCase()
    }
  }
  
  // Check if it's a CSS variable reference: var(--recursica-brand-typography-caption-font-size)
  // Extract the style name from the CSS variable name (non-greedy match up to first hyphen after style name)
  const varMatch = trimmed.match(/var\s*\(\s*--recursica-brand-typography-([a-z0-9]+)-/)
  if (varMatch) {
    return varMatch[1].toLowerCase()
  }
  
  // Check if it's just a CSS variable name: --recursica-brand-typography-caption-font-size
  const cssVarMatch = trimmed.match(/^--recursica-brand-typography-([a-z0-9]+)-/)
  if (cssVarMatch) {
    return cssVarMatch[1].toLowerCase()
  }
  
  return null
}

/**
 * Gets the CSS variable name for a typography property
 * 
 * @example
 * getTypographyCssVar('caption', 'font-size') => '--recursica-brand-typography-caption-font-size'
 * getTypographyCssVar('body', 'font-weight') => '--recursica-brand-typography-body-font-weight'
 * 
 * @param styleName - The typography style name (e.g., 'caption', 'body')
 * @param property - The typography property (e.g., 'font-size', 'font-weight', 'line-height')
 * @returns The CSS variable name
 */
export function getTypographyCssVar(styleName: string, property: string): string {
  const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  return `--recursica-brand-typography-${styleName}-${normalizedProperty}`
}

/**
 * Gets all typography CSS variables for a typography style
 * 
 * @example
 * getTypographyCssVars('caption') => {
 *   'font-family': '--recursica-brand-typography-caption-font-family',
 *   'font-size': '--recursica-brand-typography-caption-font-size',
 *   'font-weight': '--recursica-brand-typography-caption-font-weight',
 *   'letter-spacing': '--recursica-brand-typography-caption-letter-spacing',
 *   'line-height': '--recursica-brand-typography-caption-line-height',
 * }
 * 
 * @param styleName - The typography style name (e.g., 'caption', 'body')
 * @returns A map of typography property names to CSS variable names
 */
export function getTypographyCssVars(styleName: string): Record<TypographyProperty, string> {
  const vars: Record<string, string> = {}
  for (const prop of TYPOGRAPHY_PROPERTIES) {
    vars[prop] = getTypographyCssVar(styleName, prop)
  }
  return vars as Record<TypographyProperty, string>
}

/**
 * Gets all typography CSS variables from a typography type property value
 * 
 * This extracts the typography style name and returns all CSS variables for that style.
 * 
 * @example
 * getTypographyCssVarsFromValue('{brand.typography.caption}') => {
 *   'font-family': '--recursica-brand-typography-caption-font-family',
 *   'font-size': '--recursica-brand-typography-caption-font-size',
 *   ...
 * }
 * 
 * @param value - The $value from a typography type property
 * @returns A map of typography property names to CSS variable names, or null if not a typography reference
 */
export function getTypographyCssVarsFromValue(value: string | null | undefined): Record<TypographyProperty, string> | null {
  const styleName = extractTypographyStyleName(value)
  if (!styleName) return null
  
  return getTypographyCssVars(styleName)
}

