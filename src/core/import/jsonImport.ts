/**
 * JSON Import Utility
 * 
 * Imports tokens.json, brand.json, and uikit.json files and converts them
 * to CSS variables using the existing resolver functions.
 */

import { getVarsStore } from '../store/varsStore'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'
import uikitJson from '../../vars/UIKit.json'
import type { JsonLike } from '../resolvers/tokens'

/**
 * Clears CSS variables based on what's being imported
 * - If tokens.json is imported, clears only --recursica-tokens-* vars
 * - If brand.json is imported, clears only --recursica-brand-* vars
 * - If uikit.json is imported, clears only --recursica-ui-kit-* vars
 */
function clearCssVarsForImport(files: {
  tokens?: object
  brand?: object
  uikit?: object
}): void {
  const root = document.documentElement
  const style = root.style
  const varsToRemove: string[] = []
  
  // Collect all --recursica-* CSS custom properties from inline styles
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (!prop || !prop.startsWith('--recursica-')) continue
    
    // Determine which vars to remove based on what's being imported
    if (files.tokens && prop.startsWith('--recursica-tokens-')) {
      varsToRemove.push(prop)
    } else if (files.brand && prop.startsWith('--recursica-brand-')) {
      varsToRemove.push(prop)
    } else if (files.uikit && prop.startsWith('--recursica-ui-kit-')) {
      varsToRemove.push(prop)
    }
  }
  
  // Remove them
  varsToRemove.forEach(prop => root.style.removeProperty(prop))
}

/**
 * Detects if there are unexported changes (dirty data)
 * by comparing current store state with original JSON files
 */
export function detectDirtyData(): boolean {
  try {
    const store = getVarsStore()
    const currentState = store.getState()
    
    // Normalize original JSON files for comparison
    const originalTokens = tokensJson as JsonLike
    const originalBrand = (brandJson as any)?.brand ? brandJson : { brand: brandJson } as JsonLike
    const originalUiKit = (uikitJson as any)?.['ui-kit'] ? uikitJson : { 'ui-kit': uikitJson } as JsonLike
    
    // Compare tokens
    const tokensEqual = JSON.stringify(currentState.tokens) === JSON.stringify(originalTokens)
    
    // Compare theme/brand
    const themeEqual = JSON.stringify(currentState.theme) === JSON.stringify(originalBrand)
    
    // Compare uikit
    const uikitEqual = JSON.stringify(currentState.uikit) === JSON.stringify(originalUiKit)
    
    // If any differ, we have dirty data
    return !tokensEqual || !themeEqual || !uikitEqual
  } catch (error) {
    console.error('Error detecting dirty data:', error)
    // If we can't detect, assume clean to allow import
    return false
  }
}

/**
 * Detects which type of JSON file was uploaded
 */
export function detectJsonFileType(json: any): 'tokens' | 'brand' | 'uikit' | null {
  if (json?.tokens) return 'tokens'
  if (json?.brand || json?.themes) return 'brand'
  if (json?.['ui-kit'] || json?.uiKit) return 'uikit'
  return null
}

/**
 * Imports tokens.json and updates CSS variables
 */
export function importTokensJson(tokens: object): void {
  const store = getVarsStore()
  // Normalize tokens structure
  const normalizedTokens = (tokens as any)?.tokens ? tokens : { tokens: tokens }
  store.setTokens(normalizedTokens as JsonLike)
}

/**
 * Imports brand.json and updates CSS variables
 */
export function importBrandJson(brand: object): void {
  const store = getVarsStore()
  // Normalize brand structure
  const normalizedBrand = (brand as any)?.brand ? brand : { brand: brand }
  store.setTheme(normalizedBrand as JsonLike)
}

/**
 * Imports uikit.json and updates CSS variables
 */
export function importUIKitJson(uikit: object): void {
  const store = getVarsStore()
  // Normalize uikit structure
  const normalizedUiKit = (uikit as any)?.['ui-kit'] ? uikit : { 'ui-kit': uikit }
  store.setUiKit(normalizedUiKit as JsonLike)
}

/**
 * Main import function - imports any combination of JSON files
 * Clears relevant CSS variables before importing to ensure clean state
 */
export function importJsonFiles(files: {
  tokens?: object
  brand?: object
  uikit?: object
}): void {
  // Clear CSS variables for the files being imported (start clean)
  clearCssVarsForImport(files)
  
  // Import files in order: tokens first, then brand, then uikit
  // This ensures dependencies are resolved correctly
  if (files.tokens) {
    importTokensJson(files.tokens)
  }
  
  if (files.brand) {
    importBrandJson(files.brand)
  }
  
  if (files.uikit) {
    importUIKitJson(files.uikit)
  }
}

