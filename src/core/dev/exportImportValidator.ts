/**
 * Export/Import Round-Trip Validator (dev only)
 *
 * Orchestrates the full validation flow:
 *   1. Capture export snapshot (including CSS)
 *   2. Reset forge to baseline
 *   3. Capture clean baseline (including CSS)
 *   4. Import the export
 *   5. Re-export to capture what actually loaded (including CSS)
 *   6. Schema-validate export and import snapshots
 *   7. Deep 3-way diff (Original vs Export vs Import)
 *   8. Store result in localStorage
 */

import { getVarsStore } from '../store/varsStore'
import { exportTokensJson, exportBrandJson, exportUIKitJson } from '../export/jsonExport'
import { importJsonFiles } from '../import/jsonImport'
import { validateTokensJson, validateBrandJson, validateUIKitJson, validateReferences } from '../utils/validateJsonSchemas'
import type { JsonLike } from '../resolvers/tokens'

const LOCAL_STORAGE_KEY = '__recursica_roundtrip__'

export interface DiffEntry {
  path: string
  file: 'tokens' | 'brand' | 'uikit' | 'css'
  originalValue: unknown
  exportValue: unknown
  importValue: unknown
}

export interface SchemaError {
  file: 'tokens' | 'brand' | 'uikit' | 'references'
  phase: 'export' | 'import'
  message: string
}

export interface RoundTripResult {
  originalSnapshot: { tokens: object; brand: object; uikit: object; css: object }
  exportSnapshot: { tokens: object; brand: object; uikit: object; css: object }
  importSnapshot: { tokens: object; brand: object; uikit: object; css: object }
  schemaErrors: SchemaError[]
  diffs: DiffEntry[]
  mismatches: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Recursively walk an object collecting all leaf paths and values. */
function collectLeaves(
  obj: unknown,
  prefix: string,
  out: Map<string, unknown>
): void {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out.set(prefix, obj)
    return
  }
  const record = obj as Record<string, unknown>
  for (const key of Object.keys(record)) {
    collectLeaves(record[key], prefix ? `${prefix}.${key}` : key, out)
  }
}

/** Safely captures all --recursica_ custom properties applied to the root element. */
function captureCssVars(): Record<string, string> {
  const cssVars: Record<string, string> = {}
  if (typeof document === 'undefined') return cssVars
  const style = document.documentElement.style
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (prop.startsWith('--recursica_')) {
      cssVars[prop] = style.getPropertyValue(prop).trim()
    }
  }
  return cssVars
}

// ─── Schema validation runner (non-throwing) ────────────────────────────────

function safeValidate(
  file: 'tokens' | 'brand' | 'uikit',
  phase: 'export' | 'import',
  data: object,
  errors: SchemaError[]
): void {
  try {
    if (file === 'tokens') validateTokensJson(data as JsonLike)
    else if (file === 'brand') validateBrandJson(data as JsonLike)
    else validateUIKitJson(data as JsonLike)
  } catch (e) {
    errors.push({ file, phase, message: e instanceof Error ? e.message : String(e) })
  }
}

function safeValidateReferences(
  phase: 'export' | 'import',
  brand: object,
  tokens: object,
  uikit: object,
  errors: SchemaError[]
): void {
  try {
    validateReferences(brand as JsonLike, tokens as JsonLike, uikit as JsonLike)
  } catch (e) {
    errors.push({ file: 'references', phase, message: e instanceof Error ? e.message : String(e) })
  }
}

// ─── Diff engine ────────────────────────────────────────────────────────────

/**
 * Perform a 3-way deep diff across the Original, Export, and Import snapshots.
 * Returns an entry for any path where not all three values are perfectly equal.
 */
function diffSnapshotTriple(
  file: 'tokens' | 'brand' | 'uikit' | 'css',
  origObj: object,
  exportObj: object,
  importObj: object
): DiffEntry[] {
  const origLeaves = new Map<string, unknown>()
  const exportLeaves = new Map<string, unknown>()
  const importLeaves = new Map<string, unknown>()

  collectLeaves(origObj, '', origLeaves)
  collectLeaves(exportObj, '', exportLeaves)
  collectLeaves(importObj, '', importLeaves)

  const allPaths = new Set([
    ...origLeaves.keys(),
    ...exportLeaves.keys(),
    ...importLeaves.keys()
  ])
  
  const entries: DiffEntry[] = []

  for (const path of allPaths) {
    // Skip metadata paths — timestamps always differ by design
    if (path.startsWith('$metadata.')) continue

    const origVal = origLeaves.get(path)
    const exportVal = exportLeaves.get(path)
    const importVal = importLeaves.get(path)

    const origStr = origVal === undefined ? undefined : JSON.stringify(origVal)
    const exportStr = exportVal === undefined ? undefined : JSON.stringify(exportVal)
    const importStr = importVal === undefined ? undefined : JSON.stringify(importVal)

    // Include if ANY of them are different
    if (origStr !== exportStr || exportStr !== importStr) {
      entries.push({
        path,
        file,
        originalValue: origVal,
        exportValue: exportVal,
        importValue: importVal,
      })
    }
  }

  // Sort paths alphabetically
  return entries.sort((a, b) => a.path.localeCompare(b.path))
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export async function runRoundTripValidation(): Promise<RoundTripResult> {
  const store = getVarsStore()

  // 1. Capture export snapshot (this is what the user thinks they exported)
  const exportTokens = exportTokensJson() as object
  const exportBrand = exportBrandJson() as object
  const exportUikit = exportUIKitJson() as object
  const exportCss = captureCssVars()
  const exportSnapshot = { tokens: exportTokens, brand: exportBrand, uikit: exportUikit, css: exportCss }

  // 2. Reset forge to baseline (clean slate)
  store.resetAll()

  // Allow one microtask tick for store listeners to settle
  await new Promise<void>((r) => setTimeout(r, 50))

  // 2b. Capture the clean baseline BEFORE importing
  const originalTokens = exportTokensJson() as object
  const originalBrand = exportBrandJson() as object
  const originalUikit = exportUIKitJson() as object
  const originalCss = captureCssVars()
  const originalSnapshot = { tokens: originalTokens, brand: originalBrand, uikit: originalUikit, css: originalCss }

  // 3. Import the export (bypasses dirty-data modal — we control the data)
  importJsonFiles({ tokens: exportTokens, brand: exportBrand, uikit: exportUikit })

  // Allow resolvers to apply and DOM to update
  await new Promise<void>((r) => setTimeout(r, 200))

  // 4. Re-export to capture what actually loaded
  const importTokens = exportTokensJson() as object
  const importBrand = exportBrandJson() as object
  const importUikit = exportUIKitJson() as object
  const importCss = captureCssVars()
  const importSnapshot = { tokens: importTokens, brand: importBrand, uikit: importUikit, css: importCss }

  // 5. Validate schemas on both snapshots
  const schemaErrors: SchemaError[] = []
  safeValidate('tokens', 'export', exportTokens, schemaErrors)
  safeValidate('brand', 'export', exportBrand, schemaErrors)
  safeValidate('uikit', 'export', exportUikit, schemaErrors)
  safeValidateReferences('export', exportBrand, exportTokens, exportUikit, schemaErrors)
  safeValidate('tokens', 'import', importTokens, schemaErrors)
  safeValidate('brand', 'import', importBrand, schemaErrors)
  safeValidate('uikit', 'import', importUikit, schemaErrors)
  safeValidateReferences('import', importBrand, importTokens, importUikit, schemaErrors)

  // 6. Deep 3-way diff
  const diffs: DiffEntry[] = [
    ...diffSnapshotTriple('tokens', originalTokens, exportTokens, importTokens),
    ...diffSnapshotTriple('brand', originalBrand, exportBrand, importBrand),
    ...diffSnapshotTriple('uikit', originalUikit, exportUikit, importUikit),
    ...diffSnapshotTriple('css', originalCss, exportCss, importCss),
  ]

  // Track mismatches specifically where Export does not match Import (data loss bugs)
  const mismatches = diffs.filter((d) => {
    const exportStr = d.exportValue === undefined ? undefined : JSON.stringify(d.exportValue)
    const importStr = d.importValue === undefined ? undefined : JSON.stringify(d.importValue)
    return exportStr !== importStr
  }).length

  const result: RoundTripResult = {
    originalSnapshot,
    exportSnapshot,
    importSnapshot,
    schemaErrors,
    diffs,
    mismatches,
  }

  // 8. Store in memory for the new tab to pick up (bypasses 5MB limit!)
  if (typeof window !== 'undefined') {
    ;(window as any).__RECURSICA_ROUNDTRIP_DATA__ = result
  }

  // Gracefully attempt localStorage fallback for pure persistence
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result))
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      console.warn('Diagnostic payload exceeded 5MB localStorage limit. Relying strictly on window.opener.')
    } else {
      console.error(e)
    }
  }

  return result
}

export { LOCAL_STORAGE_KEY }
