/**
 * Comprehensive Export Validation Test
 * 
 * This test modifies every user-modifiable variable in the app and validates
 * that all exports (JSON and CSS) pass validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getVarsStore } from '../store/varsStore'
import { exportTokensJson, exportBrandJson, exportUIKitJson, exportCssStylesheet } from './jsonExport'
import { validateTokensJson, validateBrandJson, validateUIKitJson } from '../utils/validateJsonSchemas'
import { validateCssExport } from './validateCss'
import type { JsonLike } from '../resolvers/tokens'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'
import uikitJson from '../../vars/UIKit.json'

// Mock DOM environment
beforeEach(() => {
  // Set up document.documentElement
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-recursica-theme', 'light')
    document.documentElement.setAttribute('data-recursica-layer', '0')
    document.documentElement.style.cssText = ''
  }
})

/**
 * Recursively finds all $value properties in an object and returns paths to them
 */
function findAllValuePaths(
  obj: any,
  prefix: string[] = [],
  paths: Array<{ path: string[]; value: any; parent: any; key: string }> = []
): Array<{ path: string[]; value: any; parent: any; key: string }> {
  if (obj == null || typeof obj !== 'object') return paths
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findAllValuePaths(item, [...prefix, String(index)], paths)
    })
    return paths
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip metadata keys
    if (key.startsWith('$')) {
      if (key === '$value') {
        paths.push({ path: prefix, value, parent: obj, key })
      }
      return
    }
    
    if (value && typeof value === 'object') {
      findAllValuePaths(value, [...prefix, key], paths)
    }
  })
  
  return paths
}

/**
 * Modifies a value at a given path in an object
 */
function modifyValueAtPath(obj: any, path: string[], newValue: any): void {
  let current = obj
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      // Last key - modify the value
      if (current[key] && typeof current[key] === 'object' && '$value' in current[key]) {
        current[key].$value = newValue
      } else if (current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])) {
        // If it's an object without $value, try to add $value or replace
        if ('$value' in current[key]) {
          current[key].$value = newValue
        } else {
          current[key] = { $value: newValue }
        }
      } else {
        current[key] = newValue
      }
      return
    }
    
    // Navigate deeper
    if (current[key] == null) {
      current[key] = {}
    }
    current = current[key]
  }
}

/**
 * Gets a value at a given path in an object
 */
function getValueAtPath(obj: any, path: string[]): any {
  let current = obj
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[key]
  }
  return current
}

/**
 * Generates a modified value based on the original value type
 */
function generateModifiedValue(originalValue: any, index: number): any {
  if (typeof originalValue === 'string') {
    // For color hex values
    if (/^#[0-9a-fA-F]{6}$/.test(originalValue)) {
      // Modify hex color slightly
      const r = parseInt(originalValue.slice(1, 3), 16)
      const g = parseInt(originalValue.slice(3, 5), 16)
      const b = parseInt(originalValue.slice(5, 7), 16)
      const newR = Math.max(0, Math.min(255, r + (index % 3 === 0 ? 10 : -10)))
      const newG = Math.max(0, Math.min(255, g + (index % 3 === 1 ? 10 : -10)))
      const newB = Math.max(0, Math.min(255, b + (index % 3 === 2 ? 10 : -10)))
      return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`
    }
    // For token references, keep them as-is (they reference other values)
    if (originalValue.startsWith('{') && originalValue.endsWith('}')) {
      return originalValue
    }
    // For other strings, append a suffix
    return `${originalValue}_modified_${index}`
  }
  
  if (typeof originalValue === 'number') {
    // Modify number slightly
    return originalValue + (index % 2 === 0 ? 1 : -1)
  }
  
  if (typeof originalValue === 'boolean') {
    return !originalValue
  }
  
  return originalValue
}

describe('Export Validation - Comprehensive Variable Modification Test', () => {
  it('should export valid JSON and CSS after modifying all user-modifiable variables', { timeout: 30000 }, async () => {
    // Initialize store
    const store = getVarsStore()
    
    // Get initial state
    const initialState = store.getState()
    const initialTokens = JSON.parse(JSON.stringify(initialState.tokens)) as JsonLike
    const initialTheme = JSON.parse(JSON.stringify(initialState.theme)) as JsonLike
    const initialUiKit = JSON.parse(JSON.stringify(initialState.uikit)) as JsonLike
    
    // Find all modifiable values
    const tokenValuePaths = findAllValuePaths(initialTokens)
    const themeValuePaths = findAllValuePaths(initialTheme)
    const uikitValuePaths = findAllValuePaths(initialUiKit)
    
    console.log(`Found ${tokenValuePaths.length} token values, ${themeValuePaths.length} theme values, ${uikitValuePaths.length} uikit values to modify`)
    
    // Modify tokens - use store.updateToken for token values
    tokenValuePaths.forEach(({ path, value }, index) => {
      // Skip if it's a token reference (starts with {)
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return
      }
      // Skip if it's not a direct $value (complex objects)
      if (value && typeof value === 'object' && !Array.isArray(value) && !('$value' in value)) {
        return
      }
      
      // Build token name from path (e.g., ['tokens', 'colors', 'scale-01', '500'] -> 'colors/scale-01/500')
      const tokenPath = path.slice(1) // Skip 'tokens' prefix
      if (tokenPath.length >= 2) {
        const tokenName = tokenPath.join('/')
        const newValue = generateModifiedValue(value, index)
        try {
          store.updateToken(tokenName, newValue)
        } catch (e) {
          // Some tokens might not be updatable via updateToken, skip them
          console.warn(`Could not update token ${tokenName}:`, e)
        }
      }
    })
    
    // Modify theme/brand - directly modify JSON structure
    const modifiedTheme = JSON.parse(JSON.stringify(initialTheme)) as JsonLike
    themeValuePaths.forEach(({ path, value }, index) => {
      // Skip token references
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return
      }
      // Skip typography $value objects (they're complex objects, not simple values)
      if (value && typeof value === 'object' && '$type' in value && value.$type === 'typography') {
        return
      }
      // Skip if parent has $type typography
      const parent = path.length > 0 ? getValueAtPath(modifiedTheme, path.slice(0, -1)) : null
      if (parent && typeof parent === 'object' && '$type' in parent && parent.$type === 'typography') {
        return
      }
      const newValue = generateModifiedValue(value, index)
      modifyValueAtPath(modifiedTheme, path, newValue)
    })
    
    // Modify UIKit - directly modify JSON structure
    const modifiedUiKit = JSON.parse(JSON.stringify(initialUiKit)) as JsonLike
    uikitValuePaths.forEach(({ path, value }, index) => {
      // Skip token/brand references
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return
      }
      // Skip typography $value objects
      if (value && typeof value === 'object' && '$type' in value && value.$type === 'typography') {
        return
      }
      // Skip if parent has $type typography
      const parent = path.length > 0 ? getValueAtPath(modifiedUiKit, path.slice(0, -1)) : null
      if (parent && typeof parent === 'object' && '$type' in parent && parent.$type === 'typography') {
        return
      }
      const newValue = generateModifiedValue(value, index)
      modifyValueAtPath(modifiedUiKit, path, newValue)
    })
    
    // Update store with modified theme and uikit
    store.setTheme(modifiedTheme)
    store.setUiKit(modifiedUiKit)
    
    // Trigger recomputation to update CSS variables
    store.recomputeAndApplyAll()
    
    // Wait for CSS variables to be applied
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Export JSON files
    const exportedTokens = exportTokensJson()
    const exportedBrand = exportBrandJson()
    const exportedUIKit = exportUIKitJson()
    
    // Validate JSON schemas
    expect(() => validateTokensJson(exportedTokens as JsonLike)).not.toThrow()
    expect(() => validateBrandJson(exportedBrand as JsonLike)).not.toThrow()
    expect(() => validateUIKitJson(exportedUIKit as JsonLike)).not.toThrow()
    
    // Export CSS
    const cssExports = exportCssStylesheet({ specific: true, scoped: true })
    
    // Validate CSS
    const cssErrors = validateCssExport({ specific: true, scoped: true })
    expect(cssErrors).toHaveLength(0)
    
    // Verify CSS exports exist
    expect(cssExports.specific).toBeDefined()
    expect(cssExports.scoped).toBeDefined()
    expect(cssExports.specific?.length).toBeGreaterThan(0)
    expect(cssExports.scoped?.length).toBeGreaterThan(0)
  })
  
  it('should handle modifications to color tokens', async () => {
    const store = getVarsStore()
    
    // Modify a few color tokens
    store.updateToken('colors/scale-01/500', '#ff0000')
    store.updateToken('colors/scale-02/500', '#00ff00')
    store.updateToken('size/default', '20px')
    store.updateToken('opacity/solid', 0.9)
    
    store.recomputeAndApplyAll()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const exportedTokens = exportTokensJson()
    expect(() => validateTokensJson(exportedTokens as JsonLike)).not.toThrow()
  })
  
  it('should handle modifications to brand theme values', async () => {
    const store = getVarsStore()
    const state = store.getState()
    const theme = JSON.parse(JSON.stringify(state.theme)) as JsonLike
    
    // Modify a palette value
    const root: any = theme?.brand ? theme.brand : theme
    const themes = root?.themes || root
    if (themes?.light?.palettes?.['core-colors']?.['alert']?.['tone']?.['$value']) {
      themes.light.palettes['core-colors'].alert.tone.$value = '{tokens.colors.scale-05.700}'
    }
    
    store.setTheme(theme)
    store.recomputeAndApplyAll()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const exportedBrand = exportBrandJson()
    expect(() => validateBrandJson(exportedBrand as JsonLike)).not.toThrow()
  })
  
  it('should handle modifications to UIKit values', async () => {
    const store = getVarsStore()
    const state = store.getState()
    const uikit = JSON.parse(JSON.stringify(state.uikit)) as JsonLike
    
    // Modify a UIKit component property
    const uikitRoot: any = uikit?.['ui-kit'] ? uikit['ui-kit'] : uikit
    if (uikitRoot?.components?.Button?.variants?.styles?.solid?.properties?.colors?.layer?.layer?.layer?.layer?.['0']?.background?.['$value']) {
      uikitRoot.components.Button.variants.styles.solid.properties.colors.layer.layer.layer.layer['0'].background.$value = '{tokens.colors.scale-05.600}'
    }
    
    store.setUiKit(uikit)
    store.recomputeAndApplyAll()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const exportedUIKit = exportUIKitJson()
    expect(() => validateUIKitJson(exportedUIKit as JsonLike)).not.toThrow()
  })
  
  it('should validate CSS export after all modifications', async () => {
    const store = getVarsStore()
    
    // Make various modifications
    store.updateToken('colors/scale-01/500', '#123456')
    store.updateToken('size/default', '16px')
    store.updateToken('opacity/solid', 1.0)
    
    store.recomputeAndApplyAll()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cssErrors = validateCssExport({ specific: true, scoped: true })
    expect(cssErrors).toHaveLength(0)
  })
})
