import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

// Mock varsStore to prevent full VarsStore initialization (heavy DOM work that hangs tests)
vi.mock('../store/varsStore', () => ({
  getVarsStore: vi.fn(() => ({
    scheduleComplianceScan: vi.fn(),
    getState: vi.fn(() => ({ tokens: {}, theme: {}, uikit: {} })),
    getLatestThemeCopy: vi.fn(() => ({})),
    setThemeSilent: vi.fn(),
    setUiKitSilent: vi.fn(),
  })),
}))

// Mock updateBrandValue and updateUIKitValue to avoid transitive varsStore calls
vi.mock('./updateBrandValue', () => ({
  updateBrandValue: vi.fn(() => true),
}))

vi.mock('./updateUIKitValue', () => ({
  updateUIKitValue: vi.fn(() => true),
  removeUIKitValue: vi.fn(() => true),
}))

import { updateCssVar } from './updateCssVar'
import { readCssVar, readCssVarResolved } from './readCssVar'
import { applyCssVars } from './apply'

describe('CSS Variable Propagation', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should propagate token changes to brand vars', () => {
    // Set up token
    updateCssVar('--recursica_tokens_color_gray_500', '#808080')
    
    // Set brand var to reference token
    updateCssVar('--recursica_brand_light_palettes_core_black', 'var(--recursica_tokens_color_gray_500)')
    
    // Change token
    updateCssVar('--recursica_tokens_color_gray_500', '#404040')
    
    // Brand var should still reference token (propagation happens via CSS cascade)
    const brandVar = readCssVar('--recursica_brand_light_palettes_core_black')
    expect(brandVar).toBe('var(--recursica_tokens_color_gray_500)')
    
    // Resolved value should reflect new token value
    const resolved = readCssVarResolved('--recursica_brand_light_palettes_core_black')
    expect(resolved).toBe('#404040')
  })

  it('should handle nested var() references', () => {
    updateCssVar('--recursica_tokens_color_gray_500', '#808080')
    updateCssVar('--recursica_brand_light_palettes_core_black', 'var(--recursica_tokens_color_gray_500)')
    updateCssVar('--recursica_brand_light_layers_layer-0_properties_surface', 'var(--recursica_brand_light_palettes_core_black)')
    
    const resolved = readCssVarResolved('--recursica_brand_light_layers_layer-0_properties_surface')
    expect(resolved).toBe('#808080')
  })

  it('should maintain references when applying multiple vars', () => {
    const vars = {
      '--recursica_tokens_color_gray_500': '#808080',
      '--recursica_brand_light_palettes_core_black': 'var(--recursica_tokens_color_gray_500)',
      '--recursica_brand_light_layers_layer-0_properties_surface': 'var(--recursica_brand_light_palettes_core_black)'
    }
    
    applyCssVars(vars)
    
    expect(readCssVar('--recursica_tokens_color_gray_500')).toBe('#808080')
    expect(readCssVar('--recursica_brand_light_palettes_core_black')).toBe('var(--recursica_tokens_color_gray_500)')
    expect(readCssVar('--recursica_brand_light_layers_layer-0_properties_surface')).toBe('var(--recursica_brand_light_palettes_core_black)')
    
    // Change token
    updateCssVar('--recursica_tokens_color_gray_500', '#404040')
    
    // Resolved chain should reflect new value
    const resolved = readCssVarResolved('--recursica_brand_light_layers_layer-0_properties_surface')
    expect(resolved).toBe('#404040')
  })
})



