import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { applyCssVars, applyCssVarsDelta, clearAllCssVars } from './apply'

describe('applyCssVars', () => {
  beforeEach(() => {
    clearAllCssVars()
  })

  afterEach(() => {
    clearAllCssVars()
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
    
    // In development, this should throw
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    expect(() => {
      applyCssVars(vars)
    }).toThrow()
    
    process.env.NODE_ENV = originalEnv
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
    const vars = {
      '': 'value',
      null as any: 'value'
    }
    
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
  beforeEach(() => {
    clearAllCssVars()
  })

  afterEach(() => {
    clearAllCssVars()
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
    
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    expect(() => {
      applyCssVarsDelta(prev, next)
    }).toThrow()
    
    process.env.NODE_ENV = originalEnv
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



