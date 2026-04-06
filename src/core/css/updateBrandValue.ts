/**
 * Utility to update Brand JSON in the store when CSS variables are changed.
 * Mirrors the updateUIKitValue pattern for brand variables.
 *
 * With unified underscore-delimited naming, the CSS var name directly maps
 * to the JSON path by splitting on '_'.
 */

import { getVarsStore } from '../store/varsStore'
import { exportedNameToPath } from '../export/exportedCssVarNames'
import { cssVarToRef } from './cssVarBuilder'

/**
 * Converts a brand CSS variable name to a JSON navigation path.
 * Uses exportedNameToPath which handles the underscore-delimited format.
 *
 * @example
 * '--recursica_brand_themes_light_palettes_neutral_500_color_tone'
 * → ['brand', 'themes', 'light', 'palettes', 'neutral', '500', 'color', 'tone']
 */
function cssVarToBrandPath(cssVar: string): string[] | null {
  const path = exportedNameToPath(cssVar)
  if (path.length === 0) return null
  // Path should start with 'brand'
  if (path[0] !== 'brand') return null
  return path
}

/**
 * Updates a value in the Brand JSON at the specified path.
 * Called from updateCssVar when a brand CSS variable is modified.
 *
 * @param cssVar - The CSS variable name (e.g., '--recursica_brand_themes_light_palettes_neutral_500_color_tone')
 * @param value - The new value (e.g., 'var(--recursica_tokens_colors_scale-02_500)' or '#ff0000')
 */
export function updateBrandValue(cssVar: string, value: string): boolean {
  const store = getVarsStore()

  const path = cssVarToBrandPath(cssVar)
  if (!path) return false

  // Use a deep copy to avoid mutating the store's theme reference in-place.
  // In-place mutation followed by setTheme is dangerous because concurrent
  // state updates (e.g. interactive color changes) could be lost if another
  // code path reads the mutated-but-not-yet-saved reference.
  const themeCopy = store.getLatestThemeCopy()
  if (!themeCopy || typeof themeCopy !== 'object') return false

  // Convert CSS var() references to JSON token references
  let jsonValue = value
  const resolvedRef = cssVarToRef(value)
  if (resolvedRef) {
    jsonValue = resolvedRef
  }

  // Navigate to the target location in the theme JSON
  // The path includes 'brand' as the first segment
  let current: any = themeCopy
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    if (!current[segment] || typeof current[segment] !== 'object') {
      return false
    }
    current = current[segment]
  }

  const finalKey = path[path.length - 1]

  // Update the value, preserving $type if it exists
  if (current[finalKey] && typeof current[finalKey] === 'object' && '$value' in current[finalKey]) {
    current[finalKey].$value = jsonValue
  } else {
    // If the key doesn't exist or isn't a token object, don't create it
    // Brand values should always be pre-existing in the schema
    return false
  }

  // Persist via setThemeSilent — JSON persistence only, no recomputeAndApplyAll.
  // The CSS var is already set by the caller (updateCssVar), so a full recompute
  // would overwrite other CSS vars that have been changed but not yet persisted to JSON
  // (this was the root cause of the interactive color reset bug).
  store.setThemeSilent(themeCopy)

  return true
}
