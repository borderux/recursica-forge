/**
 * Global Reference Interceptor
 *
 * Centralized module that detects when a toolbar change targets a UIKit
 * component property whose JSON `$value` is a `{ui-kit.globals.*}` reference.
 *
 * Flow:
 * 1. `updateCssVar()` calls `checkForGlobalRef()` after applying a UIKit
 *    component CSS var change.
 * 2. The interceptor looks up the **pristine** UIKit JSON to check whether
 *    the original `$value` at that path is a `{ui-kit.globals.*}` reference.
 * 3. If a global ref exists:
 *    a. The visual preview is already applied (CSS var was set by updateCssVar).
 *    b. A 500 ms debounce timer starts (reset on each call).
 *    c. After the timer fires, a `globalRefConflict` CustomEvent is dispatched
 *       so the React modal provider can render the decision modal.
 *    d. If the user's stored preference is `always-override` or `always-global`,
 *       the decision is applied silently without a modal.
 * 4. If no global ref, the function returns silently.
 */

import { getVarsStore } from '../store/varsStore'
import { updateUIKitValue } from './updateUIKitValue'
import { clearDeltaEntry, trackChange } from '../store/cssDelta'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlobalRefConflict {
  /** CSS var that was changed, e.g. `--recursica_ui-kit_components_text-field_...` */
  cssVarName: string
  /** Human-readable component name, e.g. "Text Field" */
  componentName: string
  /** The dotted JSON path to the global ref, e.g. `ui-kit.globals.form.field.colors.background` */
  globalRefPath: string
  /** Human-readable label, e.g. "Form Field / Background" */
  globalRefLabel: string
  /** The CSS var name of the global itself */
  globalCssVarName: string
  /** The new value the user selected */
  newValue: string
  /** The previous CSS var value before the user edited (the `var()` reference to the global) */
  previousValue: string
  /** The original DTCG reference string, e.g. `{ui-kit.globals.form.field.colors.background}` */
  originalDtcgRef: string
}

export type GlobalRefPreference = 'ask' | 'always-override' | 'always-global'

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFERENCE_KEY = 'rf:global-ref-preference'
const DEBOUNCE_MS = 500

// ─── Internal state ───────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingConflict: GlobalRefConflict | null = null

/**
 * Flag to suppress interception during `applyGlobalUpdate`.
 * When the interceptor reverts the component CSS var to its `var()` reference
 * via updateCssVar → updateUIKitValue, that re-enters updateCssVar, which
 * would call checkForGlobalRef again. This flag breaks the cycle.
 */
let suppressInterception = false

// ─── Preference helpers ───────────────────────────────────────────────────────

export function getGlobalRefPreference(): GlobalRefPreference {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEY)
    if (stored === 'always-override' || stored === 'always-global') return stored
  } catch { /* noop */ }
  return 'ask'
}

export function setGlobalRefPreference(pref: GlobalRefPreference): void {
  try {
    if (pref === 'ask') {
      localStorage.removeItem(PREFERENCE_KEY)
    } else {
      localStorage.setItem(PREFERENCE_KEY, pref)
    }
  } catch { /* noop */ }
}

export function clearGlobalRefPreference(): void {
  try { localStorage.removeItem(PREFERENCE_KEY) } catch { /* noop */ }
}

// ─── Path parsing (reuses the greedy–match logic from updateUIKitValue) ──────

/**
 * Converts a UIKit CSS variable name to a JSON path array using the
 * same greedy-match algorithm as `updateUIKitValue.ts`.
 */
function cssVarToUIKitPath(cssVar: string, rootObj: any): string[] | null {
  const match = cssVar.match(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?(.+)$/)
  if (!match) return null

  const pathString = match[1]
  const parts = pathString.split('_')
  const path: string[] = ['ui-kit']
  let current = rootObj?.['ui-kit'] || rootObj
  let i = 0

  while (i < parts.length) {
    if (!current || typeof current !== 'object') {
      path.push(parts.slice(i).join('_'))
      break
    }

    let matched = false
    for (let j = parts.length; j > i; j--) {
      const candidateKey = parts.slice(i, j).join('-')
      if (candidateKey in current) {
        path.push(candidateKey)
        current = current[candidateKey]
        i = j
        matched = true
        break
      }
    }

    if (!matched) {
      path.push(parts[i])
      current = current[parts[i]]
      i++
    }
  }

  return path
}

// ─── Global ref detection ─────────────────────────────────────────────────────

/**
 * Look up the node in `recursica_ui-kit.json` at `jsonPath` and check whether
 * its `$value` is a `{ui-kit.globals.*}` reference string.
 *
 * Returns the reference string (e.g. `{ui-kit.globals.form.field.colors.background}`)
 * or `null`.
 */
function findGlobalRef(uikit: any, jsonPath: string[]): string | null {
  let node: any = uikit
  for (const seg of jsonPath) {
    if (!node || typeof node !== 'object') return null
    node = node[seg]
  }

  if (!node || typeof node !== 'object') return null
  const val = node.$value

  // Direct string reference (color, typography, etc.)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('{ui-kit.globals.') && trimmed.endsWith('}')) {
      return trimmed
    }
  }

  // Dimension tokens store the reference inside $value.value
  // e.g. { value: "{ui-kit.globals.form.field.size.border-radius}", unit: "px" }
  if (val && typeof val === 'object' && 'value' in val) {
    const inner = val.value
    if (typeof inner === 'string') {
      const trimmed = inner.trim()
      if (trimmed.startsWith('{ui-kit.globals.') && trimmed.endsWith('}')) {
        return trimmed
      }
    }
  }

  return null
}

/**
 * Convert a DTCG reference like `{ui-kit.globals.form.field.colors.background}`
 * to the actual themed CSS variable name, e.g.
 * `--recursica_ui-kit_themes_light_globals_form_field_colors_background`.
 *
 * The UIKit resolver always emits themed globals (with `themes_{mode}_` prefix),
 * so we must include the mode to match the live CSS var.
 */
function globalRefToCssVar(ref: string, mode: 'light' | 'dark'): string {
  const inner = ref.slice(1, -1) // strip { }
  const segments = inner.split('.')
  // segments[0] = 'ui-kit', rest = 'globals', 'form', 'field', …
  // Result: --recursica_ui-kit_themes_{mode}_globals_form_field_…
  const tail = segments.slice(1).join('_') // skip 'ui-kit'
  return `--recursica_ui-kit_themes_${mode}_${tail}`
}

/**
 * Format a global ref path into a human-readable label.
 * `{ui-kit.globals.form.field.colors.background}` → "Form Field / Colors / Background"
 */
function formatGlobalRefLabel(ref: string): string {
  const inner = ref.slice(1, -1)
  const segments = inner.split('.')
  // Skip "ui-kit" and "globals"
  const meaningful = segments.slice(2)
  return meaningful
    .map(seg =>
      seg
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    )
    .join(' / ')
}

/**
 * Extract the component name from a UIKit component CSS var.
 * `--recursica_ui-kit_components_text-field_...` → "text-field"
 */
function extractComponentName(cssVar: string): string {
  const match = cssVar.match(/--recursica_ui-kit_(?:themes_(?:light|dark)_)?components_([^_]+)/)
  if (match) return match[1]

  // Greedy match: walk the UIKit JSON to find the component key
  const store = getVarsStore()
  const uikit = store.getPristineUikit()
  const components = (uikit as any)?.['ui-kit']?.components || {}
  const pathString = cssVar.replace(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?components_/, '')
  const parts = pathString.split('_')

  // Try greedy match against component keys
  for (let j = parts.length; j > 0; j--) {
    const candidate = parts.slice(0, j).join('-')
    if (candidate in components) return candidate
  }

  return parts[0] || 'unknown'
}

/**
 * Format a component name for display.
 * "text-field" → "Text Field"
 */
function formatComponentName(name: string): string {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Called by `updateCssVar()` after a UIKit component CSS var is written.
 *
 * Checks the **pristine** UIKit JSON to determine if the original `$value`
 * at the corresponding path is a `{ui-kit.globals.*}` reference. If so,
 * debounces a conflict-resolution flow (modal or silent preference).
 */
export function checkForGlobalRef(
  cssVarName: string,
  newValue: string,
): void {
  if (suppressInterception) return

  const store = getVarsStore()

  // Use the pristine (unmodified) UIKit JSON for detection.
  // The in-memory UIKit may have already been mutated by updateUIKitValue
  // with the new value, which would overwrite the original reference.
  const pristineUikit = store.getPristineUikit()
  if (!pristineUikit) return

  const jsonPath = cssVarToUIKitPath(cssVarName, pristineUikit)
  if (!jsonPath) return

  const globalRef = findGlobalRef(pristineUikit, jsonPath)
  if (!globalRef) return

  // We have a global ref. Build the conflict descriptor.
  // Extract the current theme mode from the component CSS var
  // (e.g. `--recursica_ui-kit_themes_light_components_…`).
  const modeMatch = cssVarName.match(/themes_(light|dark)/)
  const mode: 'light' | 'dark' = (modeMatch?.[1] as 'light' | 'dark') || 'light'

  const globalCssVarName = globalRefToCssVar(globalRef, mode)
  const previousValue = `var(${globalCssVarName})`
  const rawComponentName = extractComponentName(cssVarName)

  const conflict: GlobalRefConflict = {
    cssVarName,
    componentName: formatComponentName(rawComponentName),
    globalRefPath: globalRef.slice(1, -1),
    globalRefLabel: formatGlobalRefLabel(globalRef),
    globalCssVarName,
    newValue,
    previousValue,
    originalDtcgRef: globalRef,
  }

  // Check user preference
  const pref = getGlobalRefPreference()
  if (pref === 'always-override') {
    // Silently keep the component-level override (already applied)
    return
  }
  if (pref === 'always-global') {
    // Silently update the global instead
    applyGlobalUpdate(conflict)
    return
  }

  // Preference is 'ask' — debounce and then fire the modal event
  pendingConflict = conflict

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    if (pendingConflict) {
      window.dispatchEvent(
        new CustomEvent('globalRefConflict', { detail: pendingConflict })
      )
      pendingConflict = null
    }
    debounceTimer = null
  }, DEBOUNCE_MS)
}

/**
 * Called by the modal (or silently by the preference system) to finalize
 * the user's decision.
 */
export function resolveGlobalRefConflict(
  decision: 'override' | 'update-global',
  conflict: GlobalRefConflict,
  rememberChoice: boolean,
): void {
  if (rememberChoice) {
    setGlobalRefPreference(
      decision === 'override' ? 'always-override' : 'always-global'
    )
  }

  if (decision === 'update-global') {
    applyGlobalUpdate(conflict)
  }
  // 'override' — the preview is already applied; nothing to revert.
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Revert the component CSS var to its previous `var()` reference (so it
 * continues following the global) and update the global's value instead.
 *
 * We inline the essential steps of `updateCssVar` here to avoid a circular
 * import (`updateCssVar` → `globalRefInterceptor` → `updateCssVar`).
 * For UIKit vars, `updateCssVar` does three things:
 *   1. `root.style.setProperty`
 *   2. `trackChange` (delta persistence)
 *   3. `updateUIKitValue` (JSON sync)
 * We replicate those directly.
 */
function applyGlobalUpdate(conflict: GlobalRefConflict): void {
  // Suppress interception to prevent re-entry when we update the global var
  suppressInterception = true

  try {
    const root = document.documentElement

    // 1. Revert the component CSS var back to its var() reference
    //    so it continues following the global.
    root.style.setProperty(conflict.cssVarName, conflict.previousValue)

    // Remove the stale component-level override from the delta system.
    clearDeltaEntry(conflict.cssVarName)

    // Restore the original DTCG reference in the UIKit JSON store.
    updateUIKitValue(conflict.cssVarName, conflict.originalDtcgRef)

    // 2. Update the global CSS var with the new value.
    root.style.setProperty(conflict.globalCssVarName, conflict.newValue)

    // Track the global change in the delta system for persistence.
    trackChange(conflict.globalCssVarName, conflict.newValue)

    // Sync the global's value to the UIKit JSON store.
    updateUIKitValue(conflict.globalCssVarName, conflict.newValue)
  } finally {
    suppressInterception = false
  }
}

