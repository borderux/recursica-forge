/**
 * JSON Import Utility
 *
 * Imports recursica_tokens.json, recursica_brand.json, and recursica_ui-kit.json files and converts them
 * to CSS variables using the existing resolver functions.
 */

import { getVarsStore } from "../store/varsStore";
import tokensJson from "../../../recursica_tokens.json";
import brandJson from "../../../recursica_brand.json";
import uikitJson from "../../../recursica_ui-kit.json";
import type { JsonLike } from "../resolvers/tokens";
import { validateBrandJson, validateTokensJson, validateUIKitJson } from "../utils/validateJsonSchemas";
import { validateImportedReferences } from "./importHydration";
import { migrateImportedJson } from "./migrateImportedJson";

/**
 * Clears CSS variables based on what's being imported
 * - If recursica_tokens.json is imported, clears only --recursica_tokens_* vars
 * - If recursica_brand.json is imported, clears only --recursica_brand_* vars
 * - If recursica_ui-kit.json is imported, clears only --recursica_ui-kit_* vars
 */
function clearCssVarsForImport(files: {
  tokens?: object;
  brand?: object;
  uikit?: object;
}): void {
  const root = document.documentElement;
  const style = root.style;
  const varsToRemove: string[] = [];

  // Collect all --recursica_* CSS custom properties from inline styles
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    if (!prop || !prop.startsWith("--recursica_")) continue;

    // Determine which vars to remove based on what's being imported
    if (files.tokens && prop.startsWith("--recursica_tokens_")) {
      varsToRemove.push(prop);
    } else if (files.brand && prop.startsWith("--recursica_brand_")) {
      varsToRemove.push(prop);
    } else if (files.uikit && prop.startsWith("--recursica_ui-kit_")) {
      varsToRemove.push(prop);
    }
  }

  // Remove them
  varsToRemove.forEach((prop) => root.style.removeProperty(prop));
}

/**
 * Stable JSON stringify with sorted keys for order-independent comparison
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as object).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          stableStringify((value as Record<string, unknown>)[k]),
      )
      .join(",") +
    "}"
  );
}

/**
 * Detects if there are unexported changes (dirty data)
 * by checking the CSS delta and comparing current store state with original JSON files
 */
export function detectDirtyData(): boolean {
  try {
    // Compare in-memory state to the baseline (imported state if available, otherwise bundled JSON)
    const store = getVarsStore();
    const currentState = store.getState();

    let baselineTokens: JsonLike;
    let baselineBrand: JsonLike;
    let baselineUiKit: JsonLike;

    // Check if the user has imported files — if so, compare against the imported baseline
    const importedTokens = localStorage.getItem('recursica_tokens_imported');
    const importedBrand = localStorage.getItem('recursica_brand_imported');
    const importedUikit = localStorage.getItem('recursica_uikit_imported');

    if (importedTokens || importedBrand || importedUikit) {
      baselineTokens = importedTokens ? JSON.parse(importedTokens) : (tokensJson as JsonLike);
      baselineBrand = importedBrand ? JSON.parse(importedBrand) : ((brandJson as any)?.brand ? brandJson : { brand: brandJson }) as JsonLike;
      baselineUiKit = importedUikit ? JSON.parse(importedUikit) : ((uikitJson as any)?.["ui-kit"] ? uikitJson : { "ui-kit": uikitJson }) as JsonLike;
    } else {
      // No imported data — compare against bundled app JSON
      baselineTokens = tokensJson as JsonLike;
      baselineBrand = ((brandJson as any)?.brand ? brandJson : { brand: brandJson }) as JsonLike;
      baselineUiKit = ((uikitJson as any)?.["ui-kit"] ? uikitJson : { "ui-kit": uikitJson }) as JsonLike;
    }

    // Compare using stable stringify (key-order independent)
    const tokensEqual = stableStringify(currentState.tokens) === stableStringify(baselineTokens);
    const themeEqual = stableStringify(currentState.theme) === stableStringify(baselineBrand);
    const uikitEqual = stableStringify(currentState.uikit) === stableStringify(baselineUiKit);

    // If any differ, we have dirty data
    return !tokensEqual || !themeEqual || !uikitEqual;
  } catch {
    return false;
  }
}

/**
 * Detects which type of JSON file was uploaded
 */
export function detectJsonFileType(
  json: any,
): "tokens" | "brand" | "uikit" | null {
  if (json?.tokens) return "tokens";
  if (json?.brand || json?.themes) return "brand";
  if (json?.["ui-kit"] || json?.uiKit) return "uikit";
  return null;
}

/**
 * Main import function - imports any combination of JSON files.
 * Clears relevant CSS variables before importing to ensure clean state.
 * All imports flow through this single entry point → store.bulkImport().
 */
export function importJsonFiles(files: {
  tokens?: object;
  brand?: object;
  uikit?: object;
}): void {
  // Clear running CSS variables for the files being imported
  clearCssVarsForImport(files);

  const store = getVarsStore();
  const fileCount = (files.tokens ? 1 : 0) + (files.brand ? 1 : 0) + (files.uikit ? 1 : 0);

  const normalizedTokens = files.tokens
    ? ((files.tokens as any)?.tokens ? files.tokens : { tokens: files.tokens })
    : undefined;

  const normalizedBrand = files.brand
    ? ((files.brand as any)?.brand ? files.brand : { brand: files.brand })
    : undefined;

  const normalizedUikit = files.uikit
    ? ((files.uikit as any)?.['ui-kit'] ? files.uikit : { 'ui-kit': files.uikit })
    : undefined;

  // Run structural migrations on the imported files to future-proof against older structures
  const migratedTokens = normalizedTokens ? migrateImportedJson(normalizedTokens as JsonLike) : undefined;
  const migratedBrand = normalizedBrand ? migrateImportedJson(normalizedBrand as JsonLike) : undefined;
  const migratedUikit = normalizedUikit ? migrateImportedJson(normalizedUikit as JsonLike) : undefined;

  // Validate all files before importing
  if (migratedTokens) {
    validateTokensJson(migratedTokens);
  }
  if (migratedBrand) {
    validateBrandJson(migratedBrand);
  }
  if (migratedUikit) {
    validateUIKitJson(migratedUikit);
  }

  // Validate cross-references before importing
  const currentState = store.getState();
  const tempTokens = migratedTokens || currentState.tokens;
  const tempBrand = migratedBrand || currentState.theme;
  const tempUikit = migratedUikit || currentState.uikit;
  validateImportedReferences(tempTokens, tempBrand, tempUikit);

  store.bulkImport({
    tokens: migratedTokens,
    brand: migratedBrand,
    uikit: migratedUikit,
  });
}

