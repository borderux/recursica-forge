/**
 * CSS Variable Delta Serialization
 *
 * Tracks which CSS variables have been modified from their initial (JSON-derived)
 * values and persists only the delta to localStorage.  On page load, the init
 * pipeline applies JSON defaults first, then overlays the persisted delta.
 *
 * This replaces the old pattern of storing full JSON objects in localStorage.
 *
 * ── Storage format ──
 * Key:   `rf:css-delta`
 * Value: JSON object  { [cssVarName]: value }
 *
 * Only CSS vars that differ from the JSON-derived defaults are stored.
 */

const STORAGE_KEY = 'rf:css-delta'
const SAVE_DEBOUNCE_MS = 500

// ─── In-memory state ───

/** The set of CSS vars generated from JSON at init (the "defaults"). */
let defaults: Record<string, string> = {}

/** The current user-modified delta (vars that differ from defaults). */
let delta: Record<string, string> = {}

/** Debounce timer for saving to localStorage. */
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** Whether the delta system has been initialised. */
let initialised = false

// ─── Public API ───

/**
 * Snapshot the initial CSS vars as the "defaults" baseline.
 * Called once after bootstrap applies JSON-derived CSS vars and before
 * restoring any persisted delta.
 *
 * @param varMap  The full map of CSS vars generated from JSON.
 */
export function snapshotDefaults(varMap: Record<string, string>): void {
  defaults = { ...varMap }
  initialised = true
}

/**
 * Restore the persisted delta from localStorage and apply it to the DOM.
 * Called once during bootstrap, AFTER snapshotDefaults.
 *
 * @returns The number of vars restored, or 0 if nothing was stored.
 */
export function restoreDelta(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0

    const saved: Record<string, string> = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return 0

    const root = document.documentElement
    let count = 0

    // Read deleted scale keys/aliases so we can skip their CSS vars
    const deletedScaleKeys = new Set<string>()
    try {
      const deletedRaw = localStorage.getItem('rf:deleted-scales')
      if (deletedRaw) {
        const deletedAliases = JSON.parse(deletedRaw) as string[]
        // Collect scale keys from family-name entries in the saved delta
        for (const [varName, value] of Object.entries(saved)) {
          const match = varName.match(/^--recursica_tokens_colors_(scale-\d+)_family-name$/)
          if (match) {
            const alias = value.toLowerCase().replace(/\s+/g, '-')
            if (deletedAliases.includes(alias)) {
              deletedScaleKeys.add(match[1])
            }
          }
        }
        // Also add direct alias matches
        deletedAliases.forEach(a => deletedScaleKeys.add(a))
      }
    } catch { }

    for (const [varName, value] of Object.entries(saved)) {
      if (!varName.startsWith('--recursica_')) continue
      // Font typefaces/families are managed exclusively by rf:fonts — never restore from delta
      if (varName.startsWith('--recursica_tokens_font_typefaces_') || varName.startsWith('--recursica_tokens_font_families_')) continue
      // Skip CSS vars belonging to deleted color scales
      if (deletedScaleKeys.size > 0) {
        const tokenColorMatch = varName.match(/^--recursica_tokens_colors?_([\w-]+)_/)
        if (tokenColorMatch) {
          const family = tokenColorMatch[1]
          if (deletedScaleKeys.has(family)) continue
        }
      }
      root.style.setProperty(varName, value)
      delta[varName] = value
      count++
    }

    return count
  } catch {
    return 0
  }
}

/**
 * Record a CSS var change.
 * If the new value equals the default, the var is removed from the delta.
 * Otherwise it is added/updated.  A debounced save is scheduled.
 *
 * @param cssVarName  The CSS variable name (e.g. `--recursica_brand_...`)
 * @param value       The new value.
 */
export function trackChange(cssVarName: string, value: string): void {
  if (!initialised) return
  if (!cssVarName.startsWith('--recursica_')) return

  const defaultValue = defaults[cssVarName]

  if (value === defaultValue) {
    // Value reverted to default — remove from delta
    delete delta[cssVarName]
  } else {
    delta[cssVarName] = value
  }

  scheduleSave()
}

/**
 * Record multiple CSS var changes at once (batch-friendly).
 */
export function trackChanges(changes: Record<string, string>): void {
  if (!initialised) return

  for (const [varName, value] of Object.entries(changes)) {
    if (!varName.startsWith('--recursica_')) continue
    const defaultValue = defaults[varName]
    if (value === defaultValue) {
      delete delta[varName]
    } else {
      delta[varName] = value
    }
  }

  scheduleSave()
}

/**
 * Clear the entire delta (e.g. on "Reset All").
 * Also removes the localStorage entry.
 */
export function clearDelta(): void {
  delta = {}
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/**
 * Remove a single CSS var from the delta, reverting it to its default.
 * Called when a CSS var is intentionally removed (e.g. elevation reset).
 * Unlike trackChange with an empty value, this does NOT persist the removal —
 * the var simply falls back to whatever recomputeAndApplyAll generates.
 */
export function clearDeltaEntry(cssVarName: string): void {
  delete delta[cssVarName]
  scheduleSave()
}

/**
 * Remove all delta entries whose CSS var name starts with the given prefix.
 * Useful for resetting an entire category (e.g. all vars for a layer).
 */
export function clearDeltaByPrefix(prefix: string): void {
  for (const key of Object.keys(delta)) {
    if (key.startsWith(prefix)) {
      delete delta[key]
    }
  }
  scheduleSave()
}

/**
 * Get the current delta (read-only snapshot).
 */
export function getDelta(): Readonly<Record<string, string>> {
  return { ...delta }
}

/**
 * Re-apply the current in-memory delta to the DOM.
 *
 * Called after recomputeAndApplyAll() to restore user changes that were
 * overwritten when CSS vars were regenerated from JSON state.  This does NOT
 * read from localStorage — it uses the live in-memory delta that was built up
 * by trackChange/trackChanges during the session.
 *
 * @returns The number of vars re-applied.
 */
export function reapplyDelta(): number {
  if (!initialised || typeof document === 'undefined') return 0

  const root = document.documentElement
  let count = 0

  for (const [varName, value] of Object.entries(delta)) {
    // Font typefaces/families are managed exclusively by rf:fonts — never overwrite from delta
    if (varName.startsWith('--recursica_tokens_font_typefaces_') || varName.startsWith('--recursica_tokens_font_families_')) continue
    root.style.setProperty(varName, value)
    count++
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
 * Force an immediate save (called on beforeunload).
 */
export function flushDelta(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  writeDelta()
}

/**
 * Install the beforeunload listener to save the delta when the user
 * navigates away or closes the tab.
 */
export function installBeforeUnloadHandler(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeunload', flushDelta)
}

// ─── Internals ───

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    writeDelta()
    saveTimer = null
  }, SAVE_DEBOUNCE_MS)
}

function writeDelta(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    if (Object.keys(delta).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(delta))
    }
  } catch { /* ignore quota errors */ }
}
