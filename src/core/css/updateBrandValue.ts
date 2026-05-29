/**
 * Utility to update Brand JSON in the store when CSS variables are changed.
 * Mirrors the updateUIKitValue pattern for brand variables.
 *
 * `cssVarToRef()` already contains battle-tested de-flattening rules that convert
 * CSS var flat segments back to nested JSON paths (e.g. `elements_text-alert` →
 * `elements.text.alert`). However, it also strips `themes.{mode}.` for component
 * theme-agnosticism. We use its output but restore the mode segment before
 * converting the ref to a navigation path array.
 */

import { getVarsStore } from '../store/varsStore'
import { cssVarToRef } from './cssVarBuilder'

/**
 * Extracts the mode (`light` or `dark`) directly from a brand CSS var name.
 * Returns null for brand vars that don't include a mode segment.
 */
function extractModeFromCssVar(cssVar: string): 'light' | 'dark' | null {
  const m = cssVar.match(/--recursica_brand_themes_(light|dark)_/)
  return m ? (m[1] as 'light' | 'dark') : null
}

/**
 * Converts a `--recursica_brand_*` CSS variable name to the JSON navigation path.
 *
 * Strategy:
 *   1. Let `cssVarToRef` handle all the complex de-flattening (elements.text.alert,
 *      core-colors nesting, etc.) — it already has every rule encoded.
 *   2. Extract the mode from the raw CSS var name (before cssVarToRef strips it).
 *   3. Reconstruct the full mode-aware path: `brand.themes.{mode}.<rest>`.
 */
function cssVarToJsonPath(cssVar: string): string[] | null {
  if (!cssVar.startsWith('--recursica_brand_')) return null

  const ref = cssVarToRef(cssVar)
  if (!ref || !ref.startsWith('{brand.') || !ref.endsWith('}')) return null

  // ref is already mode-stripped, e.g. "{brand.palettes.core-colors.alert.on-tone}"
  const inner = ref.slice(1, -1) // "brand.palettes.core-colors.alert.on-tone"
  const afterBrand = inner.slice('brand.'.length) // "palettes.core-colors.alert.on-tone"

  const mode = extractModeFromCssVar(cssVar)
  if (!mode) {
    // No mode in CSS var — navigate directly from brand root
    return inner.split('.')
  }

  // Reconstruct the full path with mode: brand.themes.{mode}.<rest>
  return `brand.themes.${mode}.${afterBrand}`.split('.')
}

export function updateBrandValue(cssVar: string, value: string): boolean {
  const store = getVarsStore()

  const path = cssVarToJsonPath(cssVar)
  if (!path) return false

  const themeCopy = store.getLatestThemeCopy()
  if (!themeCopy || typeof themeCopy !== 'object') return false

  // Resolve the incoming value to a DTCG JSON reference string.
  let jsonValue: any = value
  const resolvedRef = cssVarToRef(value)

  if (resolvedRef) {
    jsonValue = resolvedRef
    // cssVarToRef strips `themes.{mode}.` from brand refs. Re-inject it so the stored
    // $value correctly points to the mode-specific path in the JSON.
    const mode = extractModeFromCssVar(cssVar)
    if (
      mode &&
      typeof jsonValue === 'string' &&
      jsonValue.startsWith('{brand.') &&
      !jsonValue.startsWith('{brand.themes.')
    ) {
      jsonValue = jsonValue.replace('{brand.', `{brand.themes.${mode}.`)
    }
  } else if (value.includes('var(')) {
    // A var() reference that cssVarToRef couldn't convert — cannot persist safely.
    return false
  }

  // Navigate the theme JSON to the parent of the target key.
  let current: any = themeCopy
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    if (!current[segment] || typeof current[segment] !== 'object') {
      // Path segment missing: the JSON structure doesn't match what the CSS var implies.
      // Abort rather than auto-creating nodes in the wrong location.
      return false
    }
    current = current[segment]
  }

  const finalKey = path[path.length - 1]

  // If current is a composite token (e.g., typography or shadow), its sub-properties are stored inside its $value object.
  const isCompositeToken = current && typeof current === 'object' &&
                           (current.$type === 'typography' || current.$type === 'shadow') &&
                           current.$value && typeof current.$value === 'object'

  if (isCompositeToken) {
    const targetParent = current.$value
    
    if (targetParent[finalKey] && typeof targetParent[finalKey] === 'object' && '$value' in targetParent[finalKey]) {
      const hasUnitObject =
        targetParent[finalKey].$value &&
        typeof targetParent[finalKey].$value === 'object' &&
        'unit' in targetParent[finalKey].$value
      if (hasUnitObject && typeof jsonValue === 'string') {
        const match = jsonValue.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/)
        if (match) {
          targetParent[finalKey].$value = { value: parseFloat(match[1]), unit: match[2] || 'px' }
        } else {
          targetParent[finalKey].$value = jsonValue
        }
      } else {
        targetParent[finalKey].$value = jsonValue
      }
    } else {
      targetParent[finalKey] = jsonValue
    }
  } else if (current[finalKey] && typeof current[finalKey] === 'object' && '$value' in current[finalKey]) {
    const hasUnitObject =
      current[finalKey].$value &&
      typeof current[finalKey].$value === 'object' &&
      'unit' in current[finalKey].$value
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

  store.setThemeSilent(themeCopy)
  return true
}
