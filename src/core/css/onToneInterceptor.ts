/**
 * On-Tone Interceptor
 *
 * Detects when a toolbar change sets a component color property to a
 * `{brand.palettes.*.tone}` ref AND the same layer-N group contains sibling
 * properties that currently point to the matching `{brand.palettes.*.on-tone}`
 * of the OLD value (i.e. they were originally paired with the background).
 *
 * Flow:
 * 1. `updateCssVar()` reads the old DTCG ref at the path BEFORE calling
 *    `updateUIKitValue`, then passes it to `checkForOnToneConflict()`.
 * 2. This module resolves the old tone's base, scans siblings in the same
 *    layer-N group for matching `.on-tone` values.
 * 3. If related siblings are found the user preference is checked:
 *    - 'ask'           → dispatch `onToneConflict` CustomEvent
 *    - 'always-update' → silently apply on-tone updates
 *    - 'never-update'  → silently do nothing
 * 4. The modal (OnToneModal) calls `resolveOnToneConflict()`.
 */

import { cssVarToRef } from './cssVarBuilder'
import { getVarsStore } from '../store/varsStore'
import { cssVarToUIKitPath } from './updateUIKitValue'
import { updateCssVar } from './updateCssVar'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnToneSibling {
  /** Property key within the layer-N group, e.g. 'text', 'icon-color' */
  propertyKey: string
  /** Current DTCG ref, e.g. '{brand.palettes.core-colors.interactive.on-tone}' */
  currentRef: string
  /** The proposed new on-tone ref, e.g. '{brand.palettes.neutral.500.color.on-tone}' */
  newOnToneRef: string
  /** The corresponding CSS var for this sibling */
  cssVarName: string
}

export interface OnToneConflict {
  /** The changed CSS var, e.g. background */
  changedCssVarName: string
  /** Human-readable component + property, e.g. "Button / Background" */
  changedLabel: string
  /** Raw property key, e.g. 'background', 'text-hover' */
  changedPropKey: string
  /** The new tone ref, e.g. '{brand.palettes.neutral.500.color.tone}' */
  newToneRef: string
  /** The derived new on-tone ref, e.g. '{brand.palettes.neutral.500.color.on-tone}' */
  newOnToneRef: string
  /** Siblings that will be updated */
  siblings: OnToneSibling[]
}

export type OnTonePreference = 'ask' | 'always-update' | 'never-update'

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFERENCE_KEY = 'recursica_on_tone_preference'
const DEBOUNCE_MS = 150

// ─── Internal state ───────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingConflict: OnToneConflict | null = null

// ─── Preference helpers ───────────────────────────────────────────────────────

export function getOnTonePreference(): OnTonePreference {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEY)
    if (stored === 'always-update' || stored === 'never-update') return stored
  } catch { /* noop */ }
  return 'ask'
}

export function setOnTonePreference(pref: OnTonePreference): void {
  try {
    if (pref === 'ask') {
      localStorage.removeItem(PREFERENCE_KEY)
    } else {
      localStorage.setItem(PREFERENCE_KEY, pref)
    }
  } catch { /* noop */ }
}

export function clearOnTonePreference(): void {
  try { localStorage.removeItem(PREFERENCE_KEY) } catch { /* noop */ }
}

// ─── Ref helpers ──────────────────────────────────────────────────────────────

/**
 * Derive the base key shared by a `.tone` / `.on-tone` pair.
 * Returns the base path (without the final `.tone` or `.on-tone` suffix), or null.
 *
 * @example toneBase('{brand.palettes.core-colors.interactive.tone}')
 *   → 'brand.palettes.core-colors.interactive'
 * @example toneBase('{brand.palettes.neutral.500.color.tone}')
 *   → 'brand.palettes.neutral.500.color'
 */
function toneBase(ref: string): string | null {
  if (!ref.startsWith('{') || !ref.endsWith('}')) return null
  const inner = ref.slice(1, -1)
  if (inner.endsWith('.tone')) return inner.slice(0, -'.tone'.length)
  if (inner.endsWith('.on-tone')) return inner.slice(0, -'.on-tone'.length)
  return null
}

/**
 * Given a `.tone` ref, produce the corresponding `.on-tone` ref.
 * Returns null if the input is not a `.tone` ref.
 */
function toOnToneRef(toneRef: string): string | null {
  if (!toneRef.startsWith('{') || !toneRef.endsWith('}')) return null
  const inner = toneRef.slice(1, -1)
  if (!inner.endsWith('.tone') || inner.endsWith('.on-tone')) return null
  return `{${inner.slice(0, -'.tone'.length)}.on-tone}`
}

// ─── Property label formatting ────────────────────────────────────────────────

/** 'icon-color' → 'Icon Color', 'text-hover' → 'Text Hover' */
export function formatPropLabel(key: string): string {
  return key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Format a list of property labels as natural-language English.
 * ['text', 'text hover', 'icon color'] → 'text, text hover, and icon color'
 */
export function formatSiblingList(siblings: OnToneSibling[]): string {
  const labels = siblings.map(s => formatPropLabel(s.propertyKey).toLowerCase())
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

// ─── CSS var ↔ layer-N sibling resolution ────────────────────────────────────

/**
 * From a UIKit CSS var for a `_properties_colors_layer-N_propKey` path,
 * return the parent CSS var prefix for the layer-N group (so we can build
 * sibling CSS var names by appending the sibling key).
 *
 * e.g. '--recursica_ui-kit_themes_light_components_button_variants_styles_solid_properties_colors_layer-0_background'
 *   → { prefix: '--recursica_ui-kit_themes_light_components_button_variants_styles_solid_properties_colors_layer-0_',
 *       layerKey: 'layer-0',
 *       propKey: 'background' }
 */
function parseLayerColorVar(cssVar: string): { prefix: string; layerKey: string; propKey: string } | null {
  // Match the layer-N_propKey suffix
  const m = cssVar.match(/^(.*_properties_colors_(layer-\d+)_)(.+)$/)
  if (!m) return null
  return { prefix: m[1], layerKey: m[2], propKey: m[3] }
}

/**
 * Read the current DTCG `$value` at the given JSON path from the live UIKit store.
 * Returns null if not found or not a string ref.
 */
export function readCurrentDtcgRef(cssVar: string): string | null {
  const store = getVarsStore()
  const uikit = store.getState().uikit
  if (!uikit) return null

  const path = cssVarToUIKitPath(cssVar, uikit)
  if (!path) return null

  let node: any = uikit
  for (const seg of path) {
    if (!node || typeof node !== 'object') return null
    node = node[seg]
  }
  if (!node || typeof node !== 'object') return null
  const val = node.$value
  if (typeof val !== 'string') return null
  return val
}

// ─── Main check ───────────────────────────────────────────────────────────────

/**
 * Called by `updateCssVar()` AFTER `updateUIKitValue()` has written the new value.
 *
 * @param cssVarName  - The CSS var that was changed
 * @param newCssValue - The raw CSS value written (e.g. `var(--recursica_brand_...)`)
 * @param oldDtcgRef  - The DTCG `$value` that was at this path BEFORE the update
 * @param immediate   - If true, skip debounce
 */
export function checkForOnToneConflict(
  cssVarName: string,
  newCssValue: string,
  oldDtcgRef: string | null,
  immediate: boolean,
): void {
  // Only interested in component color layer properties
  if (!cssVarName.includes('_properties_colors_')) return

  // The new value must be a brand palette .tone ref (not .on-tone)
  const newDtcgRef = cssVarToRef(newCssValue)
  if (!newDtcgRef) return

  const newOnToneRef = toOnToneRef(newDtcgRef)
  if (!newOnToneRef) return // not a .tone ref — nothing to do

  // The old value must have been a .tone ref too (otherwise it wasn't a paired color)
  if (!oldDtcgRef || !oldDtcgRef.startsWith('{brand.')) return
  const oldBase = toneBase(oldDtcgRef)
  if (!oldBase) return // old value wasn't a tone ref

  // Find the layer-N group in the CSS var path
  const parsed = parseLayerColorVar(cssVarName)
  if (!parsed) return

  // Scan sibling properties in the same layer-N group
  const store = getVarsStore()
  const uikit = store.getState().uikit
  if (!uikit) return

  // Build a representative sibling CSS var to get to the layer-N JSON node
  // Use the changed CSS var path and swap the propKey for any sibling key
  const layerPath = cssVarToUIKitPath(`${parsed.prefix}${parsed.propKey}`, uikit)
  if (!layerPath) return

  // The layer-N node is the parent of the propKey — go up one level
  const layerNodePath = layerPath.slice(0, -1)
  let layerNode: any = uikit
  for (const seg of layerNodePath) {
    if (!layerNode || typeof layerNode !== 'object') { layerNode = null; break }
    layerNode = layerNode[seg]
  }
  if (!layerNode || typeof layerNode !== 'object') return

  // Collect siblings that have the matching .on-tone value (old base)
  const siblings: OnToneSibling[] = []
  for (const [key, entry] of Object.entries(layerNode)) {
    if (key === parsed.propKey) continue // skip the property being changed
    if (key.startsWith('$')) continue

    const entryVal = (entry as any)?.$value
    if (typeof entryVal !== 'string') continue

    const entryBase = toneBase(entryVal)
    if (!entryBase) continue

    // The sibling must be an .on-tone AND its base must match the OLD tone's base
    if (!entryVal.endsWith('.on-tone}')) continue
    if (entryBase !== oldBase) continue

    // Build the CSS var name for this sibling
    const siblingCssVar = `${parsed.prefix}${key}`

    siblings.push({
      propertyKey: key,
      currentRef: entryVal,
      newOnToneRef,
      cssVarName: siblingCssVar,
    })
  }

  if (siblings.length === 0) return

  // Build a human-readable label for the changed property
  const compMatch = cssVarName.match(/components_([^_]+)/)
  const compName = compMatch
    ? compMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Component'
  const propLabel = formatPropLabel(parsed.propKey)

  const conflict: OnToneConflict = {
    changedCssVarName: cssVarName,
    changedLabel: `${compName} / ${propLabel}`,
    changedPropKey: parsed.propKey,
    newToneRef: newDtcgRef,
    newOnToneRef,
    siblings,
  }

  const pref = getOnTonePreference()

  if (pref === 'always-update') {
    applyOnToneUpdates(conflict)
    return
  }
  if (pref === 'never-update') {
    return
  }

  // 'ask' — fire event
  pendingConflict = conflict

  if (immediate) {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
    window.dispatchEvent(new CustomEvent('onToneConflict', { detail: conflict }))
    pendingConflict = null
    return
  }

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (pendingConflict) {
      window.dispatchEvent(new CustomEvent('onToneConflict', { detail: pendingConflict }))
      pendingConflict = null
    }
    debounceTimer = null
  }, DEBOUNCE_MS)
}

// ─── Resolution ───────────────────────────────────────────────────────────────

/**
 * Called by the modal to apply the user's decision.
 */
export function resolveOnToneConflict(
  decision: 'update' | 'skip',
  conflict: OnToneConflict,
  rememberChoice: boolean,
): void {
  if (rememberChoice) {
    setOnTonePreference(decision === 'update' ? 'always-update' : 'never-update')
  }

  if (decision === 'update') {
    applyOnToneUpdates(conflict)
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Write the new on-tone ref to each sibling CSS var.
 * Reuses `updateCssVar` (with noGlobalRefCheck=true to avoid re-entry) so the
 * DOM, delta, and JSON store all stay in sync.
 */
function applyOnToneUpdates(conflict: OnToneConflict): void {
  // Build the CSS var value from the new on-tone DTCG ref by deriving its CSS var name.
  // The ref is already theme-agnostic; the CSS engine resolves the right var via cascade.
  // We write it as a {ref} string directly through updateUIKitValue by passing the
  // ref string as-is — but updateCssVar needs a var() CSS value. Build it from the ref.
  const onToneRef = conflict.newOnToneRef
  // Produce the raw CSS var name from the DTCG ref:
  // {brand.palettes.neutral.500.color.on-tone} → --recursica_brand_palettes_neutral_500_color_on-tone
  const refInner = onToneRef.slice(1, -1)
  const cssVarFromRef = '--recursica_' + refInner.replace(/\./g, '_')
  const cssVarValue = `var(${cssVarFromRef})`

  for (const sibling of conflict.siblings) {
    // Write to DOM and sync JSON — noGlobalRefCheck=true prevents the global ref
    // interceptor from also firing on these sibling writes.
    updateCssVar(sibling.cssVarName, cssVarValue, undefined, { noGlobalRefCheck: true, noOnToneCheck: true })
  }
}
