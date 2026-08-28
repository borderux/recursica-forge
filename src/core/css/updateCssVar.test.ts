import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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

import { updateCssVar, updateCssVars, removeCssVar, modeIndependentLayerCounterpart } from './updateCssVar'
import { readCssVar } from './readCssVar'

describe('updateCssVar', { timeout: 60000 }, () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should update non-brand CSS variable', () => {
    const result = updateCssVar('--custom-var', 'test-value')
    expect(result).toBe(true)
    expect(readCssVar('--custom-var')).toBe('test-value')
  })

  it('should trim whitespace from values', () => {
    updateCssVar('--test-var', '  spaced-value  ')
    expect(readCssVar('--test-var')).toBe('spaced-value')
  })

  it('should update brand CSS variable with valid token reference', () => {
    const result = updateCssVar(
      '--recursica_brand_themes_light_palettes_core-colors_high-contrast',
      'var(--recursica_tokens_color_gray_1000)'
    )
    expect(result).toBe(true)
    expect(readCssVar('--recursica_brand_themes_light_palettes_core-colors_high-contrast')).toBe('var(--recursica_tokens_color_gray_1000)')
  })

  it('should reject brand CSS variable with hardcoded hex value', () => {
    const result = updateCssVar(
      '--recursica_brand_themes_light_palettes_core-colors_high-contrast',
      '#000000'
    )
    expect(result).toBe(false)
  })

  it('should auto-fix brand CSS variable with hex value when token match found', () => {
    const tokens = {
      tokens: {
        colors: {
          'scale-02': {
            alias: 'gray',
            '900': { $value: '#000000' } // Note: 1000 normalizes to 900
          }
        }
      }
    }
    
    const result = updateCssVar(
      '--recursica_brand_themes_light_palettes_core-colors_high-contrast',
      '#000000',
      tokens
    )
    
    expect(result).toBe(true)
    const updatedValue = readCssVar('--recursica_brand_themes_light_palettes_core-colors_high-contrast')
    // The function may generate either old format (color-gray-900) or new format (colors-scale-XX-900)
    // Both are valid, so check for either
    expect(updatedValue).toMatch(/var\(--recursica_tokens_(color_gray_900|colors_scale-\d+_900)\)/)
  })

  it('should accept color-mix() with token references for brand vars', () => {
    const result = updateCssVar(
      '--recursica_brand_themes_light_palettes_core-colors_high-contrast',
      'color-mix(in srgb, var(--recursica_tokens_color_gray_1000) 80%, transparent)'
    )
    expect(result).toBe(true)
  })

  it('should accept var() references with unprefixed tokens', () => {
    const result = updateCssVar(
      '--recursica_brand_themes_light_palettes_core-colors_high-contrast',
      'var(--tokens-color-gray-1000)'
    )
    expect(result).toBe(true)
  })
})

describe('updateCssVars', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should update multiple CSS variables', () => {
    const vars = {
      '--var1': 'value1',
      '--var2': 'value2',
      '--var3': 'value3'
    }
    
    const count = updateCssVars(vars)
    expect(count).toBe(3)
    expect(readCssVar('--var1')).toBe('value1')
    expect(readCssVar('--var2')).toBe('value2')
    expect(readCssVar('--var3')).toBe('value3')
  })

  it('should return count of successful updates', () => {
    const vars = {
      '--valid-var': 'value',
      '--recursica_brand_invalid': '#000000' // This will fail validation
    }
    
    const count = updateCssVars(vars)
    expect(count).toBe(1) // Only one succeeded
  })
})

describe('removeCssVar', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should remove CSS variable', () => {
    document.documentElement.style.setProperty('--test-var', 'test-value')
    expect(readCssVar('--test-var')).toBe('test-value')
    
    removeCssVar('--test-var')
    expect(readCssVar('--test-var')).toBeUndefined()
  })

  it('should remove unprefixed version when removing recursica_-prefixed var', () => {
    document.documentElement.style.setProperty('--recursica_test_var', 'value1')
    document.documentElement.style.setProperty('--test_var', 'value2')
    
    removeCssVar('--recursica_test_var')
    
    expect(readCssVar('--recursica_test_var')).toBeUndefined()
    expect(readCssVar('--test_var')).toBeUndefined() // Should also be removed
  })

  it('should not remove unprefixed version if var does not start with --recursica_', () => {
    document.documentElement.style.setProperty('--test-var', 'value')
    document.documentElement.style.setProperty('--recursica_test_var', 'value2')
    
    removeCssVar('--test-var')
    
    expect(readCssVar('--test-var')).toBeUndefined()
    expect(readCssVar('--recursica_test_var')).toBe('value2') // Should remain
  })
})

// brand.themes.<mode>.layers.layer-N.properties.{padding,border-radius,border-size} holds the same
// value in light and dark by design, but the Layers page writes only the mode being viewed, so an
// edit used to leave the other mode stale in the exported brand JSON.
describe('modeIndependentLayerCounterpart', () => {
  const V = (mode: string, layer: number, prop: string) =>
    `--recursica_brand_themes_${mode}_layers_layer-${layer}_properties_${prop}`

  it('pairs layer geometry across the two modes, both directions', () => {
    for (const prop of ['padding', 'border-radius', 'border-size']) {
      expect(modeIndependentLayerCounterpart(V('light', 0, prop))).toBe(V('dark', 0, prop))
      expect(modeIndependentLayerCounterpart(V('dark', 3, prop))).toBe(V('light', 3, prop))
    }
  })

  it('leaves genuinely mode-dependent layer properties alone', () => {
    // colours differ per mode; elevation references mode-specific elevation tokens
    for (const prop of ['surface', 'border-color', 'elevation']) {
      expect(modeIndependentLayerCounterpart(V('light', 1, prop))).toBeNull()
    }
  })

  it('ignores vars that are not brand layer properties', () => {
    expect(modeIndependentLayerCounterpart('--recursica_brand_dimensions_border-radii_default')).toBeNull()
    expect(modeIndependentLayerCounterpart('--recursica_tokens_sizes_3x')).toBeNull()
    expect(modeIndependentLayerCounterpart(
      '--recursica_ui-kit_components_button_properties_border-radius')).toBeNull()
    expect(modeIndependentLayerCounterpart(
      '--recursica_brand_themes_light_layers_layer-0_elements_text-color')).toBeNull()
  })

  it('is symmetric — applying it twice returns the original', () => {
    const v = V('light', 2, 'border-radius')
    const once = modeIndependentLayerCounterpart(v)!
    expect(modeIndependentLayerCounterpart(once)).toBe(v)
  })
})
