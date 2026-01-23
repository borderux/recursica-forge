import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { applyCssVars, applyCssVarsDelta, clearAllCssVars } from './apply'

describe('applyCssVars', () => {
  let originalError: typeof console.error
  let originalWarn: typeof console.warn

  beforeEach(() => {
    clearAllCssVars()
    // Suppress expected validation error/warning messages in tests
    originalError = console.error
    originalWarn = console.warn
    console.error = vi.fn()
    console.warn = vi.fn()
  })

  afterEach(() => {
    clearAllCssVars()
    // Restore console methods
    console.error = originalError
    console.warn = originalWarn
  })

  it('should apply valid CSS variables', () => {
    const vars = {
      '--recursica-tokens-color-gray-500': '#808080',
      '--recursica-brand-light-palettes-core-black': 'var(--recursica-tokens-color-gray-1000)'
    }
    
    const result = applyCssVars(vars)
    
    expect(result.applied).toBe(2)
    expect(result.errors).toBe(0)
    expect(result.warnings).toBe(0)
    expect(document.documentElement.style.getPropertyValue('--recursica-tokens-color-gray-500')).toBe('#808080')
    expect(document.documentElement.style.getPropertyValue('--recursica-brand-light-palettes-core-black')).toBe('var(--recursica-tokens-color-gray-1000)')
  })

  it('should reject brand vars with hardcoded hex values', () => {
    const vars = {
      '--recursica-brand-light-palettes-core-black': '#000000'
    }
    
    // Function collects errors instead of throwing
    const result = applyCssVars(vars)
    
    // Should have errors (validation failed, no tokens to auto-fix)
    expect(result.errors).toBeGreaterThan(0)
    // Note: function still applies vars even with errors (marks them as errors)
    expect(result.applied).toBeGreaterThanOrEqual(0)
  })

  it('should auto-fix brand vars with hex values when tokens provided', () => {
    const tokens = {
      tokens: {
        color: {
          gray: {
            '1000': { $value: '#000000' }
          }
        }
      }
    }
    
    const vars = {
      '--recursica-brand-light-palettes-core-black': '#000000'
    }
    
    const result = applyCssVars(vars, tokens)
    
    expect(result.applied).toBe(1)
    expect(result.errors).toBe(0)
    expect(result.warnings).toBeGreaterThan(0) // Should have warning about auto-fix
  })

  it('should validate token vars format', () => {
    const vars = {
      '--recursica-tokens-color-gray-500': 'var(--some-other-var)'
    }
    
    const result = applyCssVars(vars)
    
    expect(result.applied).toBe(1)
    expect(result.warnings).toBeGreaterThan(0) // Should warn about non-recursica reference
  })

  it('should reject invalid variable names', () => {
    const vars: Record<string, string> = {
      '': 'value',
    }
    vars[null as any] = 'value'
    
    const result = applyCssVars(vars)
    
    expect(result.errors).toBeGreaterThan(0)
  })

  it('should reject null/undefined values', () => {
    const vars = {
      '--test-var': null as any,
      '--test-var-2': undefined as any
    }
    
    const result = applyCssVars(vars)
    
    expect(result.errors).toBeGreaterThan(0)
  })
})

describe('applyCssVarsDelta', () => {
  let originalError: typeof console.error
  let originalWarn: typeof console.warn

  beforeEach(() => {
    clearAllCssVars()
    // Suppress expected validation error/warning messages in tests
    originalError = console.error
    originalWarn = console.warn
    console.error = vi.fn()
    console.warn = vi.fn()
  })

  afterEach(() => {
    clearAllCssVars()
    // Restore console methods
    console.error = originalError
    console.warn = originalWarn
  })

  it('should apply delta changes', () => {
    const prev = {
      '--recursica-test-var-1': 'value1',
      '--recursica-test-var-2': 'value2'
    }
    
    const next = {
      '--recursica-test-var-1': 'value1-updated',
      '--recursica-test-var-3': 'value3'
    }
    
    const result = applyCssVarsDelta(prev, next)
    
    expect(result.applied).toBe(2)
    expect(document.documentElement.style.getPropertyValue('--recursica-test-var-1')).toBe('value1-updated')
    expect(document.documentElement.style.getPropertyValue('--recursica-test-var-3')).toBe('value3')
    // var-2 should be removed
    expect(document.documentElement.style.getPropertyValue('--recursica-test-var-2')).toBe('')
  })

  it('should validate delta changes', () => {
    const prev = {}
    const next = {
      '--recursica-brand-light-palettes-core-black': '#000000'
    }
    
    // Function collects errors instead of throwing
    const result = applyCssVarsDelta(prev, next)
    
    // Should have errors (validation failed, no tokens to auto-fix)
    expect(result.errors).toBeGreaterThan(0)
    // Note: function still applies vars even with errors (marks them as errors)
    expect(result.applied).toBeGreaterThanOrEqual(0)
  })
})

describe('clearAllCssVars', () => {
  beforeEach(() => {
    clearAllCssVars()
  })

  it('should remove all recursica CSS variables', () => {
    document.documentElement.style.setProperty('--recursica-test-var-1', 'value1')
    document.documentElement.style.setProperty('--recursica-test-var-2', 'value2')
    document.documentElement.style.setProperty('--other-var', 'value3')
    
    clearAllCssVars()
    
    expect(document.documentElement.style.getPropertyValue('--recursica-test-var-1')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--recursica-test-var-2')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--other-var')).toBe('value3') // Should keep non-recursica vars
  })
})



