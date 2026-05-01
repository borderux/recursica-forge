/**
 * Utility to update Brand JSON in the store when CSS variables are changed.
 * Mirrors the updateUIKitValue pattern for brand variables.
 *
 * CSS var names use a FLATTENED underscore-delimited format where compound JSON paths
 * like `elements.text.warning` are collapsed into `elements_text-warning`. The
 * cssVarToRef function in cssVarBuilder.ts correctly handles these transformations,
 * so we derive the JSON navigation path from cssVarToRef output — NOT by naively
 * splitting on underscores (which produces wrong paths for compound segments).
 */

import { getVarsStore } from '../store/varsStore'
import { cssVarToRef } from './cssVarBuilder'

/**
 * Converts a brand CSS variable name to a DTCG-correct JSON navigation path.
 */
function cssVarToJsonPath(cssVar: string): string[] | null {
  const ref = cssVarToRef(cssVar)
  if (!ref || !ref.startsWith('{') || !ref.endsWith('}')) return null
  const inner = ref.slice(1, -1)
  const segments = inner.split('.')
  if (segments.length === 0 || segments[0] !== 'brand') return null
  return segments
}

export function updateBrandValue(cssVar: string, value: string): boolean {
  const store = getVarsStore()

  const path = cssVarToJsonPath(cssVar)
  if (!path) {
    // DIAGNOSTIC: Log when path resolution fails so we can see which vars are missed
    if (cssVar.includes('_brand_themes_')) {
      console.warn(`[updateBrandValue] NO PATH for: ${cssVar}`)
    }
    return false
  }

  const themeCopy = store.getLatestThemeCopy()
  if (!themeCopy || typeof themeCopy !== 'object') return false

  let jsonValue: any = value
  const resolvedRef = cssVarToRef(value)

  if (resolvedRef) {
    jsonValue = resolvedRef
    if (path.length > 2 && path[0] === 'brand' && path[1] === 'themes' && (path[2] === 'light' || path[2] === 'dark')) {
      const mode = path[2]
      if (typeof jsonValue === 'string' && jsonValue.startsWith('{brand.') && !jsonValue.startsWith('{brand.themes.')) {
        jsonValue = jsonValue.replace('{brand.', `{brand.themes.${mode}.`)
      }
    }
  } else if (value.includes('var(')) {
    // DIAGNOSTIC: Log when a var() can't be converted to a JSON ref
    console.warn(`[updateBrandValue] Cannot convert to JSON ref: cssVar=${cssVar} value=${value}`)
    return false
  }

  // Navigate to the target location in the theme JSON
  let current: any = themeCopy
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    if (!current[segment] || typeof current[segment] !== 'object') {
      // DIAGNOSTIC: Log when we auto-create a missing node
      console.warn(`[updateBrandValue] Auto-creating missing node at path[${i}]="${segment}" for cssVar=${cssVar}`)
      current[segment] = {}
    }
    current = current[segment]
  }

  const finalKey = path[path.length - 1]

  if (current[finalKey] && typeof current[finalKey] === 'object' && '$value' in current[finalKey]) {
    const hasUnitObject = current[finalKey].$value && typeof current[finalKey].$value === 'object' && 'unit' in current[finalKey].$value
    if (hasUnitObject && typeof jsonValue === 'string') {
      const match = jsonValue.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/)
      if (match) {
        current[finalKey].$value = { value: parseFloat(match[1]), unit: match[2] || 'px' }
      } else {
        current[finalKey].$value = jsonValue
      }
    } else {
      current[finalKey].$value = jsonValue
    }
  } else {
    current[finalKey] = { $type: 'color', $value: jsonValue }
  }

  // DIAGNOSTIC: Confirm what we wrote
  console.info(`[updateBrandValue] WROTE path=${path.join('.')} finalKey=${finalKey} jsonValue=${jsonValue}`)

  store.setThemeSilent(themeCopy)
  return true
}
