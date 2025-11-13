import { describe, it, expect } from 'vitest'
import { isTokenVar, isBrandVar, validateCssVarValue, enforceBrandVarValue } from './varTypes'

describe('isTokenVar', () => {
  it('should return true for recursica-tokens- prefix', () => {
    expect(isTokenVar('--recursica-tokens-color-gray-1000')).toBe(true)
  })

  it('should return true for tokens- prefix', () => {
    expect(isTokenVar('--tokens-color-gray-1000')).toBe(true)
  })

  it('should return false for brand vars', () => {
    expect(isTokenVar('--recursica-brand-light-palettes-core-black')).toBe(false)
  })

  it('should return false for custom vars', () => {
    expect(isTokenVar('--custom-var')).toBe(false)
  })
})

describe('isBrandVar', () => {
  it('should return true for recursica-brand- prefix', () => {
    expect(isBrandVar('--recursica-brand-light-palettes-core-black')).toBe(true)
  })

  it('should return true for brand- prefix', () => {
    expect(isBrandVar('--brand-light-palettes-core-black')).toBe(true)
  })

  it('should return false for token vars', () => {
    expect(isBrandVar('--recursica-tokens-color-gray-1000')).toBe(false)
  })

  it('should return false for custom vars', () => {
    expect(isBrandVar('--custom-var')).toBe(false)
  })
})

describe('validateCssVarValue', () => {
  it('should validate brand var with var() reference', () => {
    const result = validateCssVarValue(
      '--recursica-brand-light-palettes-core-black',
      'var(--recursica-tokens-color-gray-1000)'
    )
    expect(result.valid).toBe(true)
  })

  it('should validate brand var with color-mix() containing token reference', () => {
    const result = validateCssVarValue(
      '--recursica-brand-light-palettes-core-black',
      'color-mix(in srgb, var(--recursica-tokens-color-gray-1000) 80%, transparent)'
    )
    expect(result.valid).toBe(true)
  })

  it('should validate brand var with unprefixed token reference', () => {
    const result = validateCssVarValue(
      '--recursica-brand-light-palettes-core-black',
      'var(--tokens-color-gray-1000)'
    )
    expect(result.valid).toBe(true)
  })

  it('should reject brand var with hardcoded hex value', () => {
    const result = validateCssVarValue(
      '--recursica-brand-light-palettes-core-black',
      '#000000'
    )
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must use a token reference')
  })

  it('should reject brand var with hardcoded RGB value', () => {
    const result = validateCssVarValue(
      '--recursica-brand-light-palettes-core-black',
      'rgb(0, 0, 0)'
    )
    expect(result.valid).toBe(false)
  })

  it('should accept any value for non-brand vars', () => {
    const result = validateCssVarValue('--custom-var', '#000000')
    expect(result.valid).toBe(true)
  })

  it('should accept any value for token vars', () => {
    const result = validateCssVarValue('--recursica-tokens-color-gray-1000', '#000000')
    expect(result.valid).toBe(true)
  })
})

describe('enforceBrandVarValue', () => {
  it('should return value as-is for non-brand vars', () => {
    expect(enforceBrandVarValue('--custom-var', '#000000')).toBe('#000000')
  })

  it('should return var() reference as-is for brand vars', () => {
    const value = 'var(--recursica-tokens-color-gray-1000)'
    expect(enforceBrandVarValue('--recursica-brand-test', value)).toBe(value)
  })

  it('should throw error for brand var with hex value', () => {
    expect(() => {
      enforceBrandVarValue('--recursica-brand-test', '#000000')
    }).toThrow('cannot be set to hardcoded color value')
  })

  it('should throw error for brand var with RGB value', () => {
    expect(() => {
      enforceBrandVarValue('--recursica-brand-test', 'rgb(0, 0, 0)')
    }).toThrow('cannot be set to hardcoded color value')
  })

  it('should throw error for brand var with raw value', () => {
    expect(() => {
      enforceBrandVarValue('--recursica-brand-test', '10px')
    }).toThrow('must reference a token')
  })
})

