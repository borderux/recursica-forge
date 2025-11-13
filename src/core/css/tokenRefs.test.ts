import { describe, it, expect } from 'vitest'
import { findTokenByHex, tokenToCssVar } from './tokenRefs'

describe('findTokenByHex', () => {
  const mockTokens = {
    tokens: {
      color: {
        gray: {
          '000': { $value: '#ffffff' },
          '050': { $value: '#f5f5f5' },
          '100': { $value: '#e0e0e0' },
          '500': { $value: '#808080' },
          '900': { $value: '#000000' } // Note: 1000 is normalized to 900
        },
        salmon: {
          '500': { $value: '#ff6b6b' }
        }
      }
    }
  }

  it('should find token by exact hex match', () => {
    const result = findTokenByHex('#000000', mockTokens)
    expect(result).toEqual({ family: 'gray', level: '900' })
  })

  it('should find token by hex without # prefix', () => {
    const result = findTokenByHex('000000', mockTokens)
    expect(result).toEqual({ family: 'gray', level: '900' })
  })

  it('should find token case-insensitively', () => {
    const result = findTokenByHex('#FFFFFF', mockTokens)
    expect(result).toEqual({ family: 'gray', level: '000' })
  })

  it('should return null when no match found', () => {
    const result = findTokenByHex('#123456', mockTokens)
    expect(result).toBeNull()
  })

  it('should return null for invalid hex', () => {
    const result = findTokenByHex('invalid', mockTokens)
    expect(result).toBeNull()
  })

  it('should handle empty tokens object', () => {
    const result = findTokenByHex('#000000', {})
    expect(result).toBeNull()
  })
})

describe('tokenToCssVar', () => {
  it('should convert token path to CSS variable', () => {
    expect(tokenToCssVar('color/gray/1000')).toBe('var(--recursica-tokens-color-gray-900)') // 1000 normalizes to 900
    expect(tokenToCssVar('color/gray/500')).toBe('var(--recursica-tokens-color-gray-500)')
    expect(tokenToCssVar('color/salmon/500')).toBe('var(--recursica-tokens-color-salmon-500)')
  })

  it('should handle tokens with different separators', () => {
    expect(tokenToCssVar('opacity/solid')).toBe('var(--recursica-tokens-opacity-solid)')
    expect(tokenToCssVar('size/sm')).toBe('var(--recursica-tokens-size-sm)')
  })

  it('should return null for invalid token paths', () => {
    expect(tokenToCssVar('invalid')).toBeNull()
    expect(tokenToCssVar('')).toBeNull()
  })

  it('should handle tokens with underscores and hyphens', () => {
    expect(tokenToCssVar('color/gray-blue/100')).toBe('var(--recursica-tokens-color-gray-blue-100)')
  })
})

