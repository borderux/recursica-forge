/**
 * Utilities for generating Brand CSS variable names
 * 
 * These utilities centralize the construction of brand-level CSS variables
 * (typography, state, elevation) to ensure consistency across components.
 */

/**
 * Generates CSS variable name for brand typography properties
 * 
 * @example
 * getBrandTypographyCssVar('caption', 'font-size')
 * => '--recursica-brand-typography-caption-font-size'
 * 
 * @example
 * getBrandTypographyCssVar('button', 'font-weight')
 * => '--recursica-brand-typography-button-font-weight'
 */
export function getBrandTypographyCssVar(
  style: string,
  property: string
): string {
  const normalizedStyle = style.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  return `--recursica-brand-typography-${normalizedStyle}-${normalizedProperty}`
}

/**
 * Generates CSS variable name for brand state properties
 * 
 * @example
 * getBrandStateCssVar('light', 'disabled')
 * => '--recursica-brand-themes-light-state-disabled'
 * 
 * @example
 * getBrandStateCssVar('dark', 'hover')
 * => '--recursica-brand-themes-dark-state-hover'
 */
export function getBrandStateCssVar(
  mode: 'light' | 'dark',
  state: string
): string {
  const normalizedState = state.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  return `--recursica-brand-themes-${mode}-state-${normalizedState}`
}

/**
 * Generates box-shadow CSS value from elevation level
 * 
 * @example
 * getElevationBoxShadow('light', 'elevation-1')
 * => 'var(--recursica-brand-themes-light-elevations-elevation-1-x-axis, 0px) var(--recursica-brand-themes-light-elevations-elevation-1-y-axis, 0px) ...'
 * 
 * @param mode - Theme mode ('light' or 'dark')
 * @param elevation - Elevation level (e.g., 'elevation-1', 'elevation-2')
 * @returns Box-shadow CSS value or undefined if elevation is invalid or elevation-0
 */
export function getElevationBoxShadow(
  mode: 'light' | 'dark',
  elevation: string | undefined
): string | undefined {
  if (!elevation || elevation === 'elevation-0') {
    return undefined
  }
  
  const elevationMatch = elevation.match(/elevation-(\d+)/)
  if (!elevationMatch) {
    return undefined
  }
  
  const elevationLevel = elevationMatch[1]
  return `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
}

/**
 * Parses elevation value from UIKit.json or prop value
 * 
 * Handles both direct elevation values (e.g., "elevation-1") and
 * brand references (e.g., "{brand.themes.light.elevations.elevation-4}")
 * 
 * @param elevationValue - Elevation value from UIKit.json or prop
 * @returns Parsed elevation level (e.g., "elevation-1") or undefined
 */
export function parseElevationValue(elevationValue: string | undefined): string | undefined {
  if (!elevationValue) {
    return undefined
  }
  
  // Check if it's a brand reference
  const match = elevationValue.match(/elevations?\.(elevation-\d+)/)
  if (match) {
    return match[1]
  }
  
  // Check if it's already a direct elevation value
  if (/^elevation-\d+$/.test(elevationValue)) {
    return elevationValue
  }
  
  return undefined
}

