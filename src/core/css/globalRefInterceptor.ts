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

import React from 'react'
import { Tooltip } from '../../components/adapters/Tooltip'
import { Button } from '../../components/adapters/Button'
import { getVarsStore } from '../store/varsStore'
import { updateUIKitValue } from './updateUIKitValue'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'

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
  /** Whether the property has been detached and overridden */
  isDetached?: boolean
}

export type GlobalRefPreference = 'ask' | 'always-override' | 'always-global'

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFERENCE_KEY = 'recursica_global_ref_preference'
const DEBOUNCE_MS = 150

// ─── Internal state ───────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingConflict: GlobalRefConflict | null = null
let modalCallback: any = null

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
  immediate = false,
): void {
  if (suppressInterception) return

  const store = getVarsStore()

  // If the property is already detached (overridden), do not trigger a new conflict modal.
  const currentUikit = store.getState()?.uikit
  if (currentUikit) {
    const status = getPropertyGlobalRefStatus(cssVarName, currentUikit)
    if (status.isDetached) return
  }

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

  // Preference is 'ask' — fire immediately or debounce depending on context
  pendingConflict = conflict

  if (immediate) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    window.dispatchEvent(
      new CustomEvent('globalRefConflict', { detail: conflict })
    )
    pendingConflict = null
    return
  }

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

let activeConflict: GlobalRefConflict | null = null

export function initGlobalRefInterceptor(
  showModal: (conflict: GlobalRefConflict, onResolve: (decision: 'override' | 'global' | 'cancel') => void) => void
) {
  modalCallback = showModal

  if (typeof window === 'undefined') return

  window.addEventListener('globalRefConflict', (e: Event) => {
    const detail = (e as CustomEvent<GlobalRefConflict>).detail
    
    // IMPORTANT: Always set the active conflict so the modal can resolve it later!
    activeConflict = detail

    if (detail.isDetached) {
      // It's already detached, so clicking the icon means we want to reattach.
      // Show the modal in a state where it asks to reattach
      if (modalCallback) {
        modalCallback(detail, resolveGlobalRefConflict)
      }
      return
    }

    if (modalCallback) {
      modalCallback(detail, resolveGlobalRefConflict)
    }
  })
}

/**
 * Called by the modal (or silently by the preference system) to finalize
 * the user's decision.
 */
export function resolveGlobalRefConflict(
  decision: 'override' | 'update-global' | 'cancel',
  conflict: GlobalRefConflict,
  rememberChoice: boolean,
): void {
  if (decision !== 'cancel' && rememberChoice) {
    setGlobalRefPreference(
      decision === 'override' ? 'always-override' : 'always-global'
    )
  }

  if (decision === 'update-global') {
    applyGlobalUpdate(conflict)
  } else if (decision === 'cancel') {
    // Revert the component change without updating the global var
    suppressInterception = true
    try {
      const root = document.documentElement
      
      // Determine themed and non-themed variable names to clean up DOM overrides
      const baseVar = conflict.cssVarName.replace(/^--recursica_ui-kit_(?:themes_(?:light|dark)_)?/, '')
      const nonThemedVar = `--recursica_ui-kit_${baseVar}`
      const lightVar = `--recursica_ui-kit_themes_light_${baseVar}`
      const darkVar = `--recursica_ui-kit_themes_dark_${baseVar}`
      
      root.style.removeProperty(nonThemedVar)
      root.style.removeProperty(lightVar)
      root.style.removeProperty(darkVar)

      updateUIKitValue(conflict.cssVarName, conflict.originalDtcgRef)
      
      // Update UI state so toolbars and form inputs reset back to the reverted value
      const store = getVarsStore()
      store.recomputeAndApplyAll()
      
      // Force toolbars (e.g. PixelValueSliderInline) to re-sync their internal
      // state with the newly reverted DOM value since UIKit vars are filtered 
      // out of the generic cssVarsUpdated event stream.
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsReset'))
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [conflict.cssVarName] }
        }))
      })
    } finally {
      suppressInterception = false
    }
  } else if (decision === 'override') {
    // If opened via the globe icon, the preview isn't applied yet, so we must explicitly apply the override.
    let overrideValue = conflict.newValue;
    
    // If no new value was provided (e.g. detached via globe icon), resolve the underlying global value
    if (!overrideValue && conflict.originalDtcgRef) {
      const path = conflict.originalDtcgRef.slice(1, -1).split('.');
      const store = getVarsStore();
      const uikit = store.getPristineUikit();
      let node: any = uikit;
      for (const p of path) {
         if (node) node = node[p];
      }
      if (node && node.$value !== undefined) {
         overrideValue = typeof node.$value === 'object' && node.$value.value !== undefined ? node.$value.value : node.$value;
      }
    }

    if (overrideValue) {
      suppressInterception = true
      try {
        const root = document.documentElement
        if (typeof overrideValue === 'string' && !overrideValue.startsWith('{')) {
          root.style.setProperty(conflict.cssVarName, overrideValue)
        }
        updateUIKitValue(conflict.cssVarName, overrideValue)
        
        const store = getVarsStore()
        store.recomputeAndApplyAll()
        
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('cssVarsReset'))
        })
      } finally {
        suppressInterception = false
      }
    }
  }
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

    // Restore the original DTCG reference in the UIKit JSON store.
    updateUIKitValue(conflict.cssVarName, conflict.originalDtcgRef)

    // 2. Update the global CSS var with the new value.
    root.style.setProperty(conflict.globalCssVarName, conflict.newValue)

    // Sync the global's value to the UIKit JSON store.
    updateUIKitValue(conflict.globalCssVarName, conflict.newValue)
  } finally {
    suppressInterception = false
  }
}

export interface GlobalRefStatus {
  isAttached: boolean
  isDetached: boolean
  originalGlobalRef: string | null
  globalRefPath: string | null
  globalRefLabel: string | null
  globalCssVarName: string | null
}

export function getPropertyGlobalRefStatus(cssVarName: string, currentUikit: any): GlobalRefStatus {
  const store = getVarsStore()
  const pristineUikit = store.getPristineUikit()
  
  const jsonPath = cssVarToUIKitPath(cssVarName, pristineUikit)
  if (!jsonPath) {
    return { isAttached: false, isDetached: false, originalGlobalRef: null, globalRefPath: null, globalRefLabel: null, globalCssVarName: null }
  }
  
  const originalRef = findGlobalRef(pristineUikit, jsonPath)
  if (!originalRef) {
    return { isAttached: false, isDetached: false, originalGlobalRef: null, globalRefPath: null, globalRefLabel: null, globalCssVarName: null }
  }
  
  // We found a global ref in the pristine template. Now check current value in currentUikit
  const currentRef = findGlobalRef(currentUikit, jsonPath)
  
  // If the current value is still a global reference (or matches originalRef), it is attached.
  const isAttached = currentRef === originalRef
  
  // If it's not attached, but we had an original global ref, it is detached!
  const isDetached = !isAttached
  
  const modeMatch = cssVarName.match(/themes_(light|dark)/)
  const mode: 'light' | 'dark' = (modeMatch?.[1] as 'light' | 'dark') || 'light'
  const globalCssVarName = globalRefToCssVar(originalRef, mode)
  
  return {
    isAttached,
    isDetached,
    originalGlobalRef: originalRef,
    globalRefPath: originalRef.slice(1, -1),
    globalRefLabel: formatGlobalRefLabel(originalRef),
    globalCssVarName
  }
}

export function useGlobalRefControl(primaryVar: string, uikit: any) {
  const status = getPropertyGlobalRefStatus(primaryVar, uikit)
  const isAttached = status.isAttached
  const isDetached = status.isDetached
  
  const iconName = isAttached ? 'globe-simple' : isDetached ? 'arrow-clockwise' : null
  const GlobeIcon = iconName ? iconNameToReactComponent(iconName) : null
  const editIconTitle = isAttached ? "Edit global variable" : "Reattach to global variable"
  
  const handleGlobeClick = (e: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    const compName = status.globalRefLabel ? status.globalRefLabel.split('/')[0].trim() : 'Component'
    
    window.dispatchEvent(
      new CustomEvent('globalRefConflict', {
        detail: {
          cssVarName: primaryVar,
          componentName: compName,
          globalRefPath: status.globalRefPath,
          globalRefLabel: status.globalRefLabel,
          globalCssVarName: status.globalCssVarName,
          newValue: '',
          previousValue: status.globalCssVarName ? `var(${status.globalCssVarName})` : '',
          originalDtcgRef: status.originalGlobalRef,
          isDetached,
        }
      })
    )
  }

  const rawIcon = GlobeIcon ? (
    isDetached ? (
      React.createElement(Button, {
        variant: 'text',
        size: 'small',
        icon: React.createElement(GlobeIcon, { style: { width: '13px', height: '13px' } }),
        onClick: handleGlobeClick
      }, 'Reattach')
    ) : (
      React.createElement(GlobeIcon, {
        id: `globe-${primaryVar}`,
        style: { 
          width: '16px', 
          height: '16px', 
          color: 'var(--recursica_brand_themes_light_palettes_core-colors_primary_tone)'
        }
      })
    )
  ) : undefined

  const editIcon = rawIcon ? React.createElement(Tooltip, {
    label: editIconTitle,
    withinPortal: true,
    zIndex: 10000,
    position: 'top',
    alignment: 'middle'
  }, rawIcon) : undefined

  return {
    isAttached,
    isDetached,
    handleGlobeClick,
    editIcon,
    editIconTitle: undefined
  }
}

