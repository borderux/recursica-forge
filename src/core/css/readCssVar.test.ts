import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readCssVar, readCssVarNumber, readCssVarResolved } from './readCssVar'

describe('readCssVar', () => {
  beforeEach(() => {
    // Clear all CSS variables before each test
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    // Clean up after each test
    document.documentElement.style.cssText = ''
  })

  it('should return undefined when variable does not exist and no fallback provided', () => {
    expect(readCssVar('--non-existent-var')).toBeUndefined()
  })

  it('should return fallback when variable does not exist', () => {
    expect(readCssVar('--non-existent-var', 'fallback-value')).toBe('fallback-value')
  })

  it('should read CSS variable from inline style', () => {
    document.documentElement.style.setProperty('--test-var', 'test-value')
    expect(readCssVar('--test-var')).toBe('test-value')
  })

  it('should read CSS variable from computed style when not in inline', () => {
    // Set via a style element to test computed style fallback
    const style = document.createElement('style')
    style.textContent = ':root { --test-var: computed-value; }'
    document.head.appendChild(style)
    
    expect(readCssVar('--test-var')).toBe('computed-value')
    
    document.head.removeChild(style)
  })

  it('should prefer inline style over computed style', () => {
    const style = document.createElement('style')
    style.textContent = ':root { --test-var: computed-value; }'
    document.head.appendChild(style)
    
    document.documentElement.style.setProperty('--test-var', 'inline-value')
    expect(readCssVar('--test-var')).toBe('inline-value')
    
    document.head.removeChild(style)
  })

  it('should trim whitespace from values', () => {
    document.documentElement.style.setProperty('--test-var', '  spaced-value  ')
    expect(readCssVar('--test-var')).toBe('spaced-value')
  })

  it('should handle empty string values', () => {
    document.documentElement.style.setProperty('--test-var', '')
    // Empty strings are treated as "not set" and return undefined/fallback
    // This is consistent behavior - empty CSS var values are effectively unset
    expect(readCssVar('--test-var')).toBeUndefined()
  })
})

describe('readCssVarNumber', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should return fallback when variable does not exist', () => {
    expect(readCssVarNumber('--non-existent', 42)).toBe(42)
  })

  it('should parse numeric values', () => {
    document.documentElement.style.setProperty('--test-num', '123')
    expect(readCssVarNumber('--test-num')).toBe(123)
  })

  it('should parse decimal values', () => {
    document.documentElement.style.setProperty('--test-num', '0.5')
    expect(readCssVarNumber('--test-num')).toBe(0.5)
  })

  it('should parse negative values', () => {
    document.documentElement.style.setProperty('--test-num', '-10')
    expect(readCssVarNumber('--test-num')).toBe(-10)
  })

  it('should return fallback for invalid numeric values', () => {
    document.documentElement.style.setProperty('--test-num', 'not-a-number')
    expect(readCssVarNumber('--test-num', 0)).toBe(0)
  })

  it('should return fallback for empty values', () => {
    document.documentElement.style.setProperty('--test-num', '')
    expect(readCssVarNumber('--test-num', 1)).toBe(1)
  })

  it('should default to 0 when no fallback provided', () => {
    expect(readCssVarNumber('--non-existent')).toBe(0)
  })
})

describe('readCssVarResolved', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should return direct value when not a var() reference', () => {
    document.documentElement.style.setProperty('--test-var', 'direct-value')
    expect(readCssVarResolved('--test-var')).toBe('direct-value')
  })

  it('should resolve single-level var() reference', () => {
    document.documentElement.style.setProperty('--base-var', 'base-value')
    document.documentElement.style.setProperty('--test-var', 'var(--base-var)')
    expect(readCssVarResolved('--test-var')).toBe('base-value')
  })

  it('should resolve nested var() references', () => {
    document.documentElement.style.setProperty('--level1', 'final-value')
    document.documentElement.style.setProperty('--level2', 'var(--level1)')
    document.documentElement.style.setProperty('--level3', 'var(--level2)')
    expect(readCssVarResolved('--level3')).toBe('final-value')
  })

  it('should respect maxDepth limit', () => {
    document.documentElement.style.setProperty('--level1', 'var(--level2)')
    document.documentElement.style.setProperty('--level2', 'var(--level1)')
    // This creates a circular reference, but maxDepth should prevent infinite loop
    expect(readCssVarResolved('--level1', 2)).toBeUndefined()
  })

  it('should return fallback when variable does not exist', () => {
    expect(readCssVarResolved('--non-existent', 10, 'fallback')).toBe('fallback')
  })

  it('should return fallback when resolution fails', () => {
    document.documentElement.style.setProperty('--test-var', 'var(--non-existent)')
    expect(readCssVarResolved('--test-var', 10, 'fallback')).toBe('fallback')
  })

  it('should handle var() with whitespace', () => {
    document.documentElement.style.setProperty('--base-var', 'base-value')
    document.documentElement.style.setProperty('--test-var', 'var( --base-var )')
    expect(readCssVarResolved('--test-var')).toBe('base-value')
  })
})

