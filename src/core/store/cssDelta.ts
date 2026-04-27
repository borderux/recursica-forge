/**
 * CSS Variable Delta Serialization
 *
 * Tracks which CSS variables have been modified from their initial (JSON-derived)
 * values and persists only the delta to localStorage.  On page load, the init
 * pipeline applies JSON defaults first, then overlays the persisted delta.
 *
 * Each JSON namespace has its own isolated localStorage key so that the stores
 * remain small and independently clearable on import of a single file.
 *
 * ── Storage format ──
 * Key:   `rf:delta:brand`   → { [cssVarName]: value }  (--recursica_brand_*)
 * Key:   `rf:delta:tokens`  → { [cssVarName]: value }  (--recursica_tokens_*)
 * Key:   `rf:delta:uikit`   → { [cssVarName]: value }  (--recursica_ui-kit_*)
 *
 * Only CSS vars that differ from the JSON-derived defaults are stored.
 */

import { DELETED_SCALES_KEY } from './varsStore'

// ─── Storage keys ───

const STORAGE_KEYS = {
  brand:  'rf:delta:brand',
  tokens: 'rf:delta:tokens',
  uikit:  'rf:delta:uikit',
} as const

type Namespace = keyof typeof STORAGE_KEYS

const SAVE_DEBOUNCE_MS = 500

// ─── In-memory state ───

/** The set of CSS vars generated from JSON at init (the "defaults"). */
let defaults: Record<string, string> = {}

/** Per-namespace deltas — only vars that differ from defaults. */
const deltas: Record<Namespace, Record<string, string>> = {
  brand:  {},
  tokens: {},
  uikit:  {},
}

/** Per-namespace debounce timers. */
const saveTimers: Record<Namespace, ReturnType<typeof setTimeout> | null> = {
  brand:  null,
  tokens: null,
  uikit:  null,
}

/** Whether the delta system has been initialised. */
let initialised = false

// ─── Namespace routing ───

/**
 * Resolve which namespace a CSS var belongs to.
 * Returns null for vars that should never be tracked.
 */
function namespaceOf(cssVarName: string): Namespace | null {
  if (cssVarName.startsWith('--recursica_brand_'))   return 'brand'
  if (cssVarName.startsWith('--recursica_tokens_'))  return 'tokens'
  if (cssVarName.startsWith('--recursica_ui-kit_'))  return 'uikit'
  return null
}

// ─── Public API ───

/**
 * Snapshot the initial CSS vars as the "defaults" baseline.
 * Called once after bootstrap applies JSON-derived CSS vars and before
 * restoring any persisted delta.
 */
export function snapshotDefaults(varMap: Record<string, string>): void {
  defaults = { ...varMap }
  initialised = true
}

/**
 * Update the baseline defaults for a specific CSS-var prefix.
 * Call this after a JSON import+recompute so that the new JSON-derived values
 * become the new comparison baseline for that namespace.
 */
export function updateDefaultsForPrefix(prefix: string, varMap: Record<string, string>): void {
  for (const [key, value] of Object.entries(varMap)) {
    if (key.startsWith(prefix)) defaults[key] = value
  }
}

/**
 * Restore the persisted delta from localStorage and apply it to the DOM.
 * Called once during bootstrap, AFTER snapshotDefaults.
 *
 * @returns The number of vars restored, or 0 if nothing was stored.
 */
export function restoreDelta(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0

  // ── One-time migration from the legacy single-key format ──────────────────
  // If rf:css-delta still exists, fan its entries into the three namespace
  // stores and delete the old key so this runs exactly once.
  try {
    const legacyRaw = localStorage.getItem('rf:css-delta')
    if (legacyRaw) {
      const legacy: Record<string, string> = JSON.parse(legacyRaw)
      if (legacy && typeof legacy === 'object') {
        const buckets: Record<Namespace, Record<string, string>> = { brand: {}, tokens: {}, uikit: {} }
        for (const [k, v] of Object.entries(legacy)) {
          const ns = namespaceOf(k)
          if (ns) buckets[ns][k] = v
        }
        for (const ns of ['brand', 'tokens', 'uikit'] as Namespace[]) {
          if (Object.keys(buckets[ns]).length > 0) {
            // Merge with any already-present new-format data (new format wins)
            const existing = readStoredDelta(ns)
            const merged = { ...buckets[ns], ...existing }
            localStorage.setItem(STORAGE_KEYS[ns], JSON.stringify(merged))
          }
        }
      }
      localStorage.removeItem('rf:css-delta')
    }
  } catch { }
  // ─────────────────────────────────────────────────────────────────────────

  const root = document.documentElement
  let totalCount = 0

  // Read deleted scale keys/aliases so we can skip their CSS vars
  const deletedScaleKeys = new Set<string>()
  try {
    const deletedRaw = localStorage.getItem(DELETED_SCALES_KEY)
    if (deletedRaw) {
      const deletedAliases = JSON.parse(deletedRaw) as string[]
      // Collect scale keys from the tokens delta family-name entries
      const tokensSaved = readStoredDelta('tokens')
      for (const [varName, value] of Object.entries(tokensSaved)) {
        const match = varName.match(/^--recursica_tokens_colors_(scale-\d+)_family-name$/)
        if (match) {
          const alias = value.toLowerCase().replace(/\s+/g, '-')
          if (deletedAliases.includes(alias)) {
            deletedScaleKeys.add(match[1])
          }
        }
      }
      deletedAliases.forEach(a => deletedScaleKeys.add(a))
    }
  } catch { }

  for (const ns of ['brand', 'tokens', 'uikit'] as Namespace[]) {
    try {
      const saved = readStoredDelta(ns)
      let count = 0

      for (const [varName, value] of Object.entries(saved)) {
        // Font typefaces/families are managed exclusively by rf:fonts — never restore from delta
        if (varName.startsWith('--recursica_tokens_font_typefaces_') || varName.startsWith('--recursica_tokens_font_families_')) continue
        // Brand font sequence vars (primary/secondary/tertiary) are re-derived from rf:fonts on every
        // recompute — restoring a stale import delta would overwrite the correct sequence.
        if (varName.startsWith('--recursica_brand_fonts_')) continue
        // Dimension brand vars always resolve to token var() references — never user-editable
        if (varName.startsWith('--recursica_brand_dimensions_')) continue
        // Elevation shadow-color vars are fully recomputed from paletteSelections — never restore
        if (varName.includes('_elevations_') && varName.endsWith('_shadow-color')) continue
        // Skip CSS vars belonging to deleted color scales
        if (deletedScaleKeys.size > 0) {
          const tokenColorMatch = varName.match(/^--recursica_tokens_colors?_([\w-]+)_/)
          if (tokenColorMatch) {
            const family = tokenColorMatch[1]
            if (deletedScaleKeys.has(family)) continue
          }
        }
        root.style.setProperty(varName, value)
        deltas[ns][varName] = value
        count++
      }

      totalCount += count
    } catch { }
  }

  return totalCount
}

/**
 * Record a CSS var change.
 * If the new value equals the default, the var is removed from the delta.
 * Otherwise it is added/updated.  A debounced save is scheduled.
 */
export function trackChange(cssVarName: string, value: string): void {
  if (!initialised) return
  if (!cssVarName.startsWith('--recursica_')) return
  // Dimension brand vars are always token var() references — never track in delta
  if (cssVarName.startsWith('--recursica_brand_dimensions_')) return
  // Elevation shadow-color vars are fully recomputed from paletteSelections state.
  if (cssVarName.includes('_elevations_') && cssVarName.endsWith('_shadow-color')) return

  const ns = namespaceOf(cssVarName)
  if (!ns) return

  const defaultValue = defaults[cssVarName]
  if (value === defaultValue) {
    delete deltas[ns][cssVarName]
  } else {
    deltas[ns][cssVarName] = value
  }

  scheduleSave(ns)
}

/**
 * Record multiple CSS var changes at once (batch-friendly).
 */
export function trackChanges(changes: Record<string, string>): void {
  if (!initialised) return

  const dirtied = new Set<Namespace>()

  for (const [varName, value] of Object.entries(changes)) {
    if (!varName.startsWith('--recursica_')) continue
    // Dimension brand vars are always token var() references — never track in delta
    if (varName.startsWith('--recursica_brand_dimensions_')) continue
    // Elevation shadow-color vars are fully recomputed from paletteSelections state — never track
    if (varName.includes('_elevations_') && varName.endsWith('_shadow-color')) continue

    const ns = namespaceOf(varName)
    if (!ns) continue

    const defaultValue = defaults[varName]
    if (value === defaultValue) {
      delete deltas[ns][varName]
    } else {
      deltas[ns][varName] = value
    }
    dirtied.add(ns)
  }

  for (const ns of dirtied) scheduleSave(ns)
}

/**
 * Clear the entire delta (e.g. on "Reset All").
 * Also removes all localStorage entries.
 */
export function clearDelta(): void {
  deltas.brand  = {}
  deltas.tokens = {}
  deltas.uikit  = {}
  try {
    localStorage.removeItem(STORAGE_KEYS.brand)
    localStorage.removeItem(STORAGE_KEYS.tokens)
    localStorage.removeItem(STORAGE_KEYS.uikit)
  } catch { /* ignore */ }
}

/**
 * Remove a single CSS var from the delta, reverting it to its default.
 * The removal is persisted via a debounced save.
 */
export function clearDeltaEntry(cssVarName: string): void {
  const ns = namespaceOf(cssVarName)
  if (!ns) return
  delete deltas[ns][cssVarName]
  scheduleSave(ns)
}

/**
 * Remove all delta entries whose CSS var name starts with the given prefix.
 * Useful for resetting an entire namespace or category (e.g. all vars for a layer).
 *
 * When the prefix exactly matches a full namespace (e.g. '--recursica_brand_'),
 * the corresponding store is completely cleared for efficiency.
 */
export function clearDeltaByPrefix(prefix: string): void {
  // Fast path: full-namespace clear
  if (prefix === '--recursica_brand_')   { deltas.brand  = {}; scheduleSave('brand');  return }
  if (prefix === '--recursica_tokens_')  { deltas.tokens = {}; scheduleSave('tokens'); return }
  if (prefix === '--recursica_ui-kit_')  { deltas.uikit  = {}; scheduleSave('uikit');  return }

  // Partial prefix: iterate each affected namespace
  const dirtied = new Set<Namespace>()
  for (const ns of ['brand', 'tokens', 'uikit'] as Namespace[]) {
    for (const key of Object.keys(deltas[ns])) {
      if (key.startsWith(prefix)) {
        delete deltas[ns][key]
        dirtied.add(ns)
      }
    }
  }
  for (const ns of dirtied) scheduleSave(ns)
}

/**
 * Get the current delta as a single merged map (read-only snapshot).
 * Consumers that iterate over all changed vars (e.g. deltaToJson, detectDirtyData)
 * receive a unified view without needing to know about the namespace split.
 */
export function getDelta(): Readonly<Record<string, string>> {
  return { ...deltas.brand, ...deltas.tokens, ...deltas.uikit }
}

/**
 * Returns true if the CSS var has no entry in the snapshotDefaults baseline —
 * i.e. it was never generated from the static JSON and is therefore user-added.
 * Used to restrict trackChanges to only new palette CSS vars.
 */
export function isVarNew(cssVarName: string): boolean {
  return !(cssVarName in defaults)
}

/**
 * Get the delta for a specific namespace (read-only snapshot).
 */
export function getDeltaForNamespace(ns: Namespace): Readonly<Record<string, string>> {
  return { ...deltas[ns] }
}

/**
 * Re-apply the current in-memory delta to the DOM.
 *
 * Called after recomputeAndApplyAll() to restore user changes that were
 * overwritten when CSS vars were regenerated from JSON state.
 *
 * @returns The number of vars re-applied.
 */
export function reapplyDelta(): number {
  if (!initialised || typeof document === 'undefined') return 0

  const root = document.documentElement
  let count = 0

  for (const ns of ['brand', 'tokens', 'uikit'] as Namespace[]) {
    for (const [varName, value] of Object.entries(deltas[ns])) {
      // Font typefaces/families are managed exclusively by rf:fonts — never overwrite from delta
      if (varName.startsWith('--recursica_tokens_font_typefaces_') || varName.startsWith('--recursica_tokens_font_families_')) continue
      // Brand font sequence vars are re-derived on every recompute — never overwrite from delta
      if (varName.startsWith('--recursica_brand_fonts_')) continue
      root.style.setProperty(varName, value)
      count++
    }
  }

  return count
}

/**
 * Get the current defaults (read-only snapshot).
 */
export function getDefaults(): Readonly<Record<string, string>> {
  return { ...defaults }
}

/**
 * Force an immediate save of all namespace stores (called on beforeunload).
 */
export function flushDelta(): void {
  for (const ns of ['brand', 'tokens', 'uikit'] as Namespace[]) {
    const timer = saveTimers[ns]
    if (timer) {
      clearTimeout(timer)
      saveTimers[ns] = null
    }
    writeDelta(ns)
  }
}

/**
 * Install the beforeunload listener to save all deltas when the user
 * navigates away or closes the tab.
 */
export function installBeforeUnloadHandler(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeunload', flushDelta)
}

// ─── Internals ───

/** Read a raw stored delta from localStorage without affecting in-memory state. */
function readStoredDelta(ns: Namespace): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[ns])
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function scheduleSave(ns: Namespace): void {
  if (saveTimers[ns]) clearTimeout(saveTimers[ns]!)
  saveTimers[ns] = setTimeout(() => {
    writeDelta(ns)
    saveTimers[ns] = null
  }, SAVE_DEBOUNCE_MS)
}

function writeDelta(ns: Namespace): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const delta = deltas[ns]
    if (Object.keys(delta).length === 0) {
      localStorage.removeItem(STORAGE_KEYS[ns])
    } else {
      localStorage.setItem(STORAGE_KEYS[ns], JSON.stringify(delta))
    }
  } catch { /* ignore quota errors */ }
}
