/**
 * Export/Import Round-Trip Validator (dev only)
 *
 * Orchestrates the full validation flow:
 *   1. Export current state
 *   2. Reset forge to baseline
 *   3. Import the export
 *   4. Re-export to capture what actually loaded
 *   5. Schema-validate both snapshots
 *   6. Deep-diff export vs import snapshots
 *   7. Reset forge again (restore baseline)
 *   8. Store result in sessionStorage
 */

import { getVarsStore } from '../store/varsStore'
import { exportTokensJson, exportBrandJson, exportUIKitJson } from '../export/jsonExport'
import { importJsonFiles } from '../import/jsonImport'
import { validateTokensJson, validateBrandJson, validateUIKitJson, validateReferences } from '../utils/validateJsonSchemas'
import type { JsonLike } from '../resolvers/tokens'

const SESSION_STORAGE_KEY = '__recursica_roundtrip__'

export type DiffStatus = 'match' | 'mismatch' | 'missing' | 'extra'

export interface DiffEntry {
  path: string
  file: 'tokens' | 'brand' | 'uikit'
  exportValue: unknown
  importValue: unknown
  status: DiffStatus
}

export interface SchemaError {
  file: 'tokens' | 'brand' | 'uikit' | 'references'
  phase: 'export' | 'import'
  message: string
}

export interface RoundTripResult {
  originalSnapshot: { tokens: object; brand: object; uikit: object }
  exportSnapshot: { tokens: object; brand: object; uikit: object }
  importSnapshot: { tokens: object; brand: object; uikit: object }
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
 * Diffs two JSON snapshots of the same file, returning only non-matching entries.
 * Skips $metadata paths (timestamps differ by design).
 */
function diffSnapshot(
  file: 'tokens' | 'brand' | 'uikit',
  exportObj: object,
  importObj: object
): DiffEntry[] {
  const exportLeaves = new Map<string, unknown>()
  const importLeaves = new Map<string, unknown>()
  collectLeaves(exportObj, '', exportLeaves)
  collectLeaves(importObj, '', importLeaves)

  const allPaths = new Set([...exportLeaves.keys(), ...importLeaves.keys()])
  const entries: DiffEntry[] = []

  for (const path of allPaths) {
    // Skip metadata paths — timestamps always differ by design
    if (path.startsWith('$metadata.')) continue

    const inExport = exportLeaves.has(path)
    const inImport = importLeaves.has(path)

    let status: DiffStatus

    if (!inExport) {
      status = 'extra'
    } else if (!inImport) {
      status = 'missing'
    } else {
      const exportStr = JSON.stringify(exportLeaves.get(path))
      const importStr = JSON.stringify(importLeaves.get(path))
      status = exportStr === importStr ? 'match' : 'mismatch'
    }

    if (status !== 'match') {
      entries.push({
        path,
        file,
        exportValue: exportLeaves.get(path),
        importValue: importLeaves.get(path),
        status,
      })
    }
  }

  return entries
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export async function runRoundTripValidation(): Promise<RoundTripResult> {
  const store = getVarsStore()

  // 1. Capture export snapshot
  const exportTokens = exportTokensJson() as object
  const exportBrand = exportBrandJson() as object
  const exportUikit = exportUIKitJson() as object
  const exportSnapshot = { tokens: exportTokens, brand: exportBrand, uikit: exportUikit }

  // 2. Reset forge to baseline (clean slate)
  store.resetAll()

  // Allow one microtask tick for store listeners to settle
  await new Promise<void>((r) => setTimeout(r, 50))

  // 2b. Capture the clean baseline BEFORE importing (this is the "Original" panel)
  const originalTokens = exportTokensJson() as object
  const originalBrand = exportBrandJson() as object
  const originalUikit = exportUIKitJson() as object
  const originalSnapshot = { tokens: originalTokens, brand: originalBrand, uikit: originalUikit }

  // 3. Import the export (bypasses dirty-data modal — we control the data)
  importJsonFiles({ tokens: exportTokens, brand: exportBrand, uikit: exportUikit })

  // Allow resolvers to apply
  await new Promise<void>((r) => setTimeout(r, 100))

  // 4. Re-export to capture what actually loaded
  const importTokens = exportTokensJson() as object
  const importBrand = exportBrandJson() as object
  const importUikit = exportUIKitJson() as object
  const importSnapshot = { tokens: importTokens, brand: importBrand, uikit: importUikit }

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

  // 6. Deep-diff export vs import snapshots
  const diffs: DiffEntry[] = [
    ...diffSnapshot('tokens', exportTokens, importTokens),
    ...diffSnapshot('brand', exportBrand, importBrand),
    ...diffSnapshot('uikit', exportUikit, importUikit),
  ]

  // (No second reset — we navigate in-tab to /dev/diff so the imported state persists for the diff view)

  const mismatches = diffs.filter((d) => d.status === 'mismatch').length

  const result: RoundTripResult = {
    originalSnapshot,
    exportSnapshot,
    importSnapshot,
    schemaErrors,
    diffs,
    mismatches,
  }

  // 8. Store in sessionStorage — consumed and immediately removed by RoundTripPage
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result))

  return result
}

export { SESSION_STORAGE_KEY }
