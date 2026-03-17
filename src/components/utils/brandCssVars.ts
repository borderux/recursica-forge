/**
 * Utilities for generating Brand CSS variable names
 * 
 * These utilities centralize the construction of brand-level CSS variables
 * (typography, state, elevation) to ensure consistency across components.
 */

import { readCssVar } from '../../core/css/readCssVar'
import { brandTypography, genericState, elevation as elevationVar } from '../../core/css/cssVarBuilder'

/**
 * Generates CSS variable name for brand typography properties
 * 
 * @example
 * getBrandTypographyCssVar('caption', 'font-size')
 * => '--recursica_brand_typography_caption-font-size'
 * 
 * @example
 * getBrandTypographyCssVar('button', 'font-weight')
 * => '--recursica_brand_typography_button_font-weight'
 */
export function getBrandTypographyCssVar(
  style: string,
  property: string
): string {
  const normalizedStyle = style.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  const normalizedProperty = property.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  return brandTypography(normalizedStyle, normalizedProperty)
}

/**
 * Generates CSS variable name for brand state properties.
 * Returns the **generic** (scoped) name — the CSS cascade resolves the theme.
 * 
 * @example
 * getBrandStateCssVar('light', 'disabled')
 * => '--recursica_brand_states_disabled'
 */
export function getBrandStateCssVar(
  _mode: 'light' | 'dark',
  state: string
): string {
  const normalizedState = state.replace(/\./g, '-').replace(/\s+/g, '-').toLowerCase()
  return genericState(normalizedState)
}

/**
 * Generates box-shadow CSS value from elevation level.
 * Uses theme-scoped var names.
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
  // Use the elevation builder for correct underscore-delimited format
  const boxShadow = `var(${elevationVar(mode, elevationLevel, 'x-axis')}) var(${elevationVar(mode, elevationLevel, 'y-axis')}) var(${elevationVar(mode, elevationLevel, 'blur')}) var(${elevationVar(mode, elevationLevel, 'spread')}) var(${elevationVar(mode, elevationLevel, 'shadow-color')})`

  return boxShadow
}

/**
 * Parses elevation value from recursica_ui-kit.json or prop value
 * 
 * Handles both direct elevation values (e.g., "elevation-1") and
 * brand references (e.g., "{brand.themes.light.elevations.elevation-4}")
 * 
 * @param elevationValue - Elevation value from recursica_ui-kit.json or prop
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

/**
 * Extracts mode information from elevation token reference or CSS variable name
 * 
 * @param elevationValue - Elevation value that may contain a token reference
 * @param cssVarName - Optional CSS variable name (e.g., "--recursica_ui-kit_themes_dark_components_toast_properties_elevation_layer-1")
 * @returns Mode ('light' | 'dark') if found in token reference or CSS variable name, undefined otherwise
 */
export function extractElevationMode(elevationValue: string | undefined, cssVarName?: string): 'light' | 'dark' | undefined {
  if (!elevationValue && !cssVarName) {
    return undefined
  }

  // First, try to extract mode from token reference in elevation value
  if (elevationValue) {
    const modeMatch = elevationValue.match(/themes\.(light|dark)\.elevations/)
    if (modeMatch) {
      return modeMatch[1] as 'light' | 'dark'
    }
  }

  // If not found in value, try to extract mode from CSS variable name
  // CSS var names like: --recursica_ui-kit_themes_dark_components_toast_properties_elevation_layer-1
  if (cssVarName) {
    const varModeMatch = cssVarName.match(/themes_(light|dark)_components/)
    if (varModeMatch) {
      return varModeMatch[1] as 'light' | 'dark'
    }
  }

  return undefined
}

/**
 * Gets elevation box-shadow for a given layer.
 * Uses theme-scoped var names via `getElevationBoxShadow`.
 */
export function getLayerElevationBoxShadow(
  mode: 'light' | 'dark',
  layer: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
): string | undefined {
  // First, try reading the layer's elevation sub-properties directly
  const layerNum = layer.replace('layer-', '')
  const layerElevBase = `--recursica_brand_layer_${layerNum}_properties_elevation`
  const layerYAxis = readCssVar(`${layerElevBase}_y-axis`)

  if (layerYAxis) {
    return `var(${layerElevBase}_x-axis) var(${layerElevBase}_y-axis) var(${layerElevBase}_blur) var(${layerElevBase}_spread) var(${layerElevBase}_shadow-color)`
  }

  // Try reading the raw elevation value
  const elevationValue = readCssVar(`${layerElevBase}`)
  if (elevationValue) {
    const elevation = parseElevationValue(elevationValue.trim())
    if (elevation) {
      return getElevationBoxShadow(mode, elevation)
    }
  }

  // Last resort: use known layer → elevation mapping
  const layerElevationMap: Record<string, string> = {
    'layer-0': 'elevation-0',
    'layer-1': 'elevation-0',
    'layer-2': 'elevation-2',
    'layer-3': 'elevation-4',
  }

  const elevation = layerElevationMap[layer]
  return getElevationBoxShadow(mode, elevation)
}

