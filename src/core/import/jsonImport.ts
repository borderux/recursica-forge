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
import {
  validateBrandJson,
  validateTokensJson,
  validateUIKitJson,
} from "../utils/validateJsonSchemas";
import { getDelta } from "../store/cssDelta";

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
    // Fast path: check if the CSS delta has any entries
    const delta = getDelta();
    if (Object.keys(delta).length > 0) return true;

    // Fallback: compare in-memory JSON state to originals
    const store = getVarsStore();
    const currentState = store.getState();

    // Normalize original JSON files for comparison
    const originalTokens = tokensJson as JsonLike;
    const originalBrand = (brandJson as any)?.brand
      ? brandJson
      : ({ brand: brandJson } as JsonLike);
    const originalUiKit = (uikitJson as any)?.["ui-kit"]
      ? uikitJson
      : ({ "ui-kit": uikitJson } as JsonLike);

    // Compare using stable stringify (key-order independent)
    const tokensEqual =
      stableStringify(currentState.tokens) === stableStringify(originalTokens);
    const themeEqual =
      stableStringify(currentState.theme) === stableStringify(originalBrand);
    const uikitEqual =
      stableStringify(currentState.uikit) === stableStringify(originalUiKit);

    // If any differ, we have dirty data
    return !tokensEqual || !themeEqual || !uikitEqual;
  } catch (error) {
    console.error("Error detecting dirty data:", error);
    // If we can't detect, assume clean to allow import
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
 * Imports recursica_tokens.json and updates CSS variables
 */
export function importTokensJson(tokens: object): void {
  // Validate schema before importing
  const normalizedTokens = (tokens as any)?.tokens
    ? tokens
    : { tokens: tokens };
  try {
    validateTokensJson(normalizedTokens as JsonLike);
  } catch (error) {
    console.error("[Import] recursica_tokens.json validation failed:", error);
    throw new Error(
      `Failed to import recursica_tokens.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const store = getVarsStore();
  store.setTokens(normalizedTokens as JsonLike);
}

/**
 * Imports recursica_brand.json and updates CSS variables
 */
export function importBrandJson(brand: object): void {
  // Validate schema before importing
  const normalizedBrand = (brand as any)?.brand ? brand : { brand: brand };
  try {
    validateBrandJson(normalizedBrand as JsonLike);
  } catch (error) {
    console.error("[Import] recursica_brand.json validation failed:", error);
    throw new Error(
      `Failed to import recursica_brand.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const store = getVarsStore();
  store.setTheme(normalizedBrand as JsonLike);
}

/**
 * Imports recursica_ui-kit.json and updates CSS variables
 */
export function importUIKitJson(uikit: object): void {
  // Validate schema before importing
  const normalizedUiKit = (uikit as any)?.["ui-kit"]
    ? uikit
    : { "ui-kit": uikit };
  try {
    validateUIKitJson(normalizedUiKit as JsonLike);
  } catch (error) {
    console.error("[Import] recursica_ui-kit.json validation failed:", error);
    throw new Error(
      `Failed to import recursica_ui-kit.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const store = getVarsStore();
  store.setUiKit(normalizedUiKit as JsonLike);
}

/**
 * Main import function - imports any combination of JSON files
 * Clears relevant CSS variables before importing to ensure clean state
 */
export function importJsonFiles(files: {
  tokens?: object;
  brand?: object;
  uikit?: object;
}): void {
  // Clear CSS variables for the files being imported (start clean)
  clearCssVarsForImport(files);

  // Import files in order: tokens first, then brand, then uikit
  // This ensures dependencies are resolved correctly
  if (files.tokens) {
    importTokensJson(files.tokens);
  }

  if (files.brand) {
    importBrandJson(files.brand);
  }

  if (files.uikit) {
    importUIKitJson(files.uikit);
  }
}
