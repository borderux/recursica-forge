/**
 * Export/Import Round-Trip Validator — Diff Engine
 *
 * Provides:
 *  - captureCssVars()   — snapshot of current DOM CSS custom properties
 *  - computeDiff()      — 3-way diff between original, export and import snapshots
 *
 * The orchestration (download → reset → import → open tab) lives in MantineShell.
 * This module is pure diff logic with no side-effects on the store or DOM.
 */

import { exportTokensJson, exportBrandJson, exportUIKitJson } from '../export/jsonExport'

export interface DiffEntry {
  path: string
  file: 'tokens' | 'brand' | 'uikit' | 'css'
  originalValue: unknown
  exportValue: unknown
  importValue: unknown
}

export interface RoundTripResult {
  originalSnapshot: { tokens: object; brand: object; uikit: object; css: object }
  exportSnapshot:   { tokens: object; brand: object; uikit: object; css: object }
  importSnapshot:   { tokens: object; brand: object; uikit: object; css: object }
  diffs: DiffEntry[]
  mismatches: number
}

// ─── CSS snapshot ────────────────────────────────────────────────────────────

/**
 * CSS variable prefixes that are excluded from the round-trip CSS diff.
 *
 * `--recursica_ui-kit_themes_` vars are derived/cached and updated only by a full
 * recomputeAndApplyAll(). After toolbar changes, setUiKitSilent() skips the recompute
 * so they are stale in the EXPORT snapshot but fresh in IMPORT. Excluding them keeps
 * the diff focused on the non-themed vars that actually drive rendering.
 */
const EXCLUDED_CSS_PREFIXES = [
  '--recursica_ui-kit_themes_light_',
  '--recursica_ui-kit_themes_dark_',
]

/** Snapshot all --recursica_ custom properties currently on the root element. */
export function captureCssVars(): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof document === 'undefined') return out
  const style = document.documentElement.style
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (
      prop.startsWith('--recursica_') &&
      !EXCLUDED_CSS_PREFIXES.some(p => prop.startsWith(p))
    ) {
      out[prop] = style.getPropertyValue(prop).trim()
    }
  }
  return out
}



/** Capture the current store state as a JSON + CSS snapshot. */
export function captureCurrentSnapshot() {
  return {
    tokens: exportTokensJson() as object,
    brand:  exportBrandJson()  as object,
    uikit:  exportUIKitJson()  as object,
    css:    captureCssVars(),
  }
}

// ─── Diff engine ─────────────────────────────────────────────────────────────

function collectLeaves(obj: unknown, prefix: string, out: Map<string, unknown>): void {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out.set(prefix, obj)
    return
  }
  const record = obj as Record<string, unknown>
  for (const key of Object.keys(record)) {
    collectLeaves(record[key], prefix ? `${prefix}.${key}` : key, out)
  }
}

function diffSnapshotTriple(
  file: 'tokens' | 'brand' | 'uikit' | 'css',
  origObj: object,
  exportObj: object,
  importObj: object,
): DiffEntry[] {
  const origLeaves   = new Map<string, unknown>()
  const exportLeaves = new Map<string, unknown>()
  const importLeaves = new Map<string, unknown>()

  collectLeaves(origObj,   '', origLeaves)
  collectLeaves(exportObj, '', exportLeaves)
  collectLeaves(importObj, '', importLeaves)

  const allPaths = new Set([...origLeaves.keys(), ...exportLeaves.keys(), ...importLeaves.keys()])
  const entries: DiffEntry[] = []

  for (const path of allPaths) {
    if (path.startsWith('$metadata.')) continue

    const origVal   = origLeaves.get(path)
    const exportVal = exportLeaves.get(path)
    const importVal = importLeaves.get(path)

    const oStr = origVal   === undefined ? undefined : JSON.stringify(origVal)
    const eStr = exportVal === undefined ? undefined : JSON.stringify(exportVal)
    const iStr = importVal === undefined ? undefined : JSON.stringify(importVal)

    if (oStr !== eStr || eStr !== iStr) {
      entries.push({ path, file, originalValue: origVal, exportValue: exportVal, importValue: importVal })
    }
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Compute a 3-way diff given three snapshots.
 *
 * @param original  State captured before reset (ground truth)
 * @param exported  State captured after randomisation / just before reset (what was exported)
 * @param imported  State captured after import (what the importer produced)
 */
export function computeDiff(
  original: { tokens: object; brand: object; uikit: object; css: object },
  exported: { tokens: object; brand: object; uikit: object; css: object },
  imported: { tokens: object; brand: object; uikit: object; css: object },
): RoundTripResult {
  const diffs: DiffEntry[] = [
    ...diffSnapshotTriple('tokens', original.tokens, exported.tokens, imported.tokens),
    ...diffSnapshotTriple('brand',  original.brand,  exported.brand,  imported.brand),
    ...diffSnapshotTriple('uikit',  original.uikit,  exported.uikit,  imported.uikit),
    ...diffSnapshotTriple('css',    original.css,    exported.css,    imported.css),
  ]

  const mismatches = diffs.filter((d) => {
    const eStr = d.exportValue === undefined ? undefined : JSON.stringify(d.exportValue)
    const iStr = d.importValue === undefined ? undefined : JSON.stringify(d.importValue)
    return eStr !== iStr
  }).length

  return {
    originalSnapshot: original,
    exportSnapshot:   exported,
    importSnapshot:   imported,
    diffs,
    mismatches,
  }
}

export { LOCAL_STORAGE_KEY }
const LOCAL_STORAGE_KEY = '__recursica_roundtrip__'
