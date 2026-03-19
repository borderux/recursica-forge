/**
 * Family Name Helpers
 *
 * Read/write color family display names via CSS vars instead of localStorage.
 * The CSS var `--recursica_tokens_colors_{scaleKey}_family-name` holds the
 * user-facing display name (e.g., "Blue", "Brand Primary").
 *
 * These helpers replace all direct `localStorage.getItem('family-friendly-names')` usage.
 */

import { tokenColorFamilyName } from '../css/cssVarBuilder'
import { readCssVar } from '../css/readCssVar'
import { trackChange } from '../store/cssDelta'
import { getVarsStore } from '../store/varsStore'

/**
 * Get the display name for a color scale by scaleKey.
 * @param scaleKey — e.g., 'scale-05'
 * @returns The display name (e.g., "Blue") or undefined if not set
 */
export function getFamilyName(scaleKey: string): string | undefined {
  const cssVar = tokenColorFamilyName(scaleKey)
  const value = readCssVar(cssVar)
  return value || undefined
}

/**
 * Get a map of ALL family names { alias → displayName } by scanning CSS vars.
 * Reads from the store's in-memory tokens if no tokensJson is provided.
 */
export function getAllFamilyNames(tokensJson?: any): Record<string, string> {
  const names: Record<string, string> = {}
  let tokensRoot: any
  if (tokensJson) {
    tokensRoot = tokensJson?.tokens || tokensJson || {}
  } else {
    try {
      const store = getVarsStore()
      const state = store.getState()
      tokensRoot = (state.tokens as any)?.tokens || {}
    } catch {
      tokensRoot = {}
    }
  }
  const colorsRoot = tokensRoot?.colors || {}

  if (colorsRoot && typeof colorsRoot === 'object') {
    Object.keys(colorsRoot).forEach((scaleKey) => {
      if (!scaleKey.startsWith('scale-')) return
      const scale = colorsRoot[scaleKey]
      if (!scale || typeof scale !== 'object') return
      const alias = scale.alias
      if (typeof alias !== 'string' || !alias) return

      // Read display name from CSS var (source of truth)
      const cssVar = tokenColorFamilyName(scaleKey)
      const displayName = readCssVar(cssVar)
      if (displayName) {
        names[alias] = displayName
      } else {
        // Fallback: title-case the alias
        names[alias] = alias.charAt(0).toUpperCase() + alias.slice(1)
      }
    })
  }

  // Also check old color format
  const oldColors = tokensRoot?.color || {}
  Object.keys(oldColors).forEach((fam) => {
    if (fam === 'translucent') return
    if (!names[fam]) {
      names[fam] = fam.charAt(0).toUpperCase() + fam.slice(1)
    }
  })

  return names
}

/**
 * Find the scaleKey for a given alias (e.g., 'blue' → 'scale-05').
 */
export function findScaleKeyByAlias(alias: string, tokensJson?: any): string | undefined {
  let tokensRoot: any
  if (tokensJson) {
    tokensRoot = tokensJson?.tokens || tokensJson || {}
  } else {
    try {
      const store = getVarsStore()
      const state = store.getState()
      tokensRoot = (state.tokens as any)?.tokens || {}
    } catch {
      return undefined
    }
  }
  const colorsRoot = tokensRoot?.colors || {}
  return Object.keys(colorsRoot).find((key) => {
    const scale = colorsRoot[key]
    return scale && typeof scale === 'object' && scale.alias === alias
  })
}

/**
 * Set the display name for a color scale by scaleKey.
 * Writes to the CSS var and tracks the change in the delta.
 * @param scaleKey — e.g., 'scale-05'
 * @param displayName — e.g., "Brand Primary"
 */
export function setFamilyName(scaleKey: string, displayName: string): void {
  const cssVar = tokenColorFamilyName(scaleKey)
  document.documentElement.style.setProperty(cssVar, displayName)
  trackChange(cssVar, displayName)
}

/**
 * Set the display name for a color family by alias.
 * Looks up the scaleKey, writes the CSS var, and dispatches the event.
 * @param alias — e.g., 'blue'
 * @param displayName — e.g., "Sky Blue"
 * @param tokensJson — optional tokens JSON for lookup
 */
export function setFamilyNameByAlias(alias: string, displayName: string, tokensJson?: any): void {
  const scaleKey = findScaleKeyByAlias(alias, tokensJson)
  if (scaleKey) {
    setFamilyName(scaleKey, displayName)
  }
  // Always dispatch event so listeners update
  try {
    window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: getAllFamilyNames(tokensJson) }))
  } catch { }
}

/**
 * Delete the family name for a color scale.
 */
export function deleteFamilyName(scaleKey: string): void {
  const cssVar = tokenColorFamilyName(scaleKey)
  document.documentElement.style.removeProperty(cssVar)
  trackChange(cssVar, '')
}

/**
 * Update the family name for a color family: delete old, set new.
 * Used during renames where the alias changes.
 */
export function renameFamilyName(
  oldAlias: string,
  newAlias: string,
  displayName: string,
  tokensJson?: any
): void {
  // Remove old name if it was on a different scale
  const oldScaleKey = findScaleKeyByAlias(oldAlias, tokensJson)
  // Set new name
  const newScaleKey = findScaleKeyByAlias(newAlias, tokensJson)
  if (oldScaleKey && oldScaleKey !== newScaleKey) {
    deleteFamilyName(oldScaleKey)
  }
  if (newScaleKey) {
    setFamilyName(newScaleKey, displayName)
  }
  try {
    window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: getAllFamilyNames(tokensJson) }))
  } catch { }
}
