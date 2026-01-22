import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { updateCssVar, updateCssVars, removeCssVar } from './updateCssVar'
import { readCssVar } from './readCssVar'

describe('updateCssVar', () => {
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
      '--recursica-brand-light-palettes-core-black',
      'var(--recursica-tokens-color-gray-1000)'
    )
    expect(result).toBe(true)
    expect(readCssVar('--recursica-brand-light-palettes-core-black')).toBe('var(--recursica-tokens-color-gray-1000)')
  })

  it('should reject brand CSS variable with hardcoded hex value', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = updateCssVar(
      '--recursica-brand-light-palettes-core-black',
      '#000000'
    )
    expect(result).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should auto-fix brand CSS variable with hex value when token match found', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tokens = {
      tokens: {
        color: {
          gray: {
            '900': { $value: '#000000' } // Note: 1000 normalizes to 900
          }
        }
      }
    }
    
    const result = updateCssVar(
      '--recursica-brand-light-palettes-core-black',
      '#000000',
      tokens
    )
    
    expect(result).toBe(true)
    expect(consoleWarnSpy).toHaveBeenCalled()
    const updatedValue = readCssVar('--recursica-brand-light-palettes-core-black')
    // The function may generate either old format (color-gray-900) or new format (colors-scale-XX-900)
    // Both are valid, so check for either
    expect(updatedValue).toMatch(/var\(--recursica-tokens-(color-gray-900|colors-scale-\d+-900)\)/)
    
    consoleWarnSpy.mockRestore()
  })

  it('should accept color-mix() with token references for brand vars', () => {
    const result = updateCssVar(
      '--recursica-brand-light-palettes-core-black',
      'color-mix(in srgb, var(--recursica-tokens-color-gray-1000) 80%, transparent)'
    )
    expect(result).toBe(true)
  })

  it('should accept var() references with unprefixed tokens', () => {
    const result = updateCssVar(
      '--recursica-brand-light-palettes-core-black',
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
      '--recursica-brand-invalid': '#000000' // This will fail validation
    }
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const count = updateCssVars(vars)
    expect(count).toBe(1) // Only one succeeded
    consoleErrorSpy.mockRestore()
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

  it('should remove unprefixed version when removing recursica-prefixed var', () => {
    document.documentElement.style.setProperty('--recursica-test-var', 'value1')
    document.documentElement.style.setProperty('--test-var', 'value2')
    
    removeCssVar('--recursica-test-var')
    
    expect(readCssVar('--recursica-test-var')).toBeUndefined()
    expect(readCssVar('--test-var')).toBeUndefined() // Should also be removed
  })

  it('should not remove unprefixed version if var does not start with --recursica-', () => {
    document.documentElement.style.setProperty('--test-var', 'value')
    document.documentElement.style.setProperty('--recursica-test-var', 'value2')
    
    removeCssVar('--test-var')
    
    expect(readCssVar('--test-var')).toBeUndefined()
    expect(readCssVar('--recursica-test-var')).toBe('value2') // Should remain
  })
})

