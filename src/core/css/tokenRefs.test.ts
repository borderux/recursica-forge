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
  const mockTokens = {
    tokens: {
      color: {
        gray: {
          '000': { $value: '#ffffff' },
          '500': { $value: '#808080' },
          '900': { $value: '#000000' },
          '1000': { $value: '#000000' }
        },
        salmon: {
          '500': { $value: '#ff6b6b' }
        }
      },
      colors: {
        'scale-01': {
          alias: 'gray',
          '500': { $value: '#808080' },
          '900': { $value: '#000000' },
          '1000': { $value: '#000000' }
        }
      },
      opacities: {
        solid: { $value: 1 }
      },
      sizes: {
        sm: { $value: 8 }
      }
    }
  }

  it('should convert token path to CSS variable', () => {
    // With tokens provided, should resolve alias to scale
    const result1 = tokenToCssVar('color/gray/1000', mockTokens)
    expect(result1).toBeTruthy()
    expect(result1).toContain('--recursica-tokens-colors-scale-')
    // Note: 1000 is preserved as-is in tokenToCssVar (not normalized to 900)
    expect(result1).toContain('-1000')
    
    const result2 = tokenToCssVar('color/gray/500', mockTokens)
    expect(result2).toBeTruthy()
    expect(result2).toContain('--recursica-tokens-colors-scale-')
    expect(result2).toContain('-500') // Uses scale
    
    expect(tokenToCssVar('color/salmon/500', mockTokens)).toBeNull() // salmon not in mock tokens
  })

  it('should handle tokens with different separators', () => {
    // Function uses plural forms (opacities, sizes)
    expect(tokenToCssVar('opacity/solid')).toBe('var(--recursica-tokens-opacities-solid)')
    expect(tokenToCssVar('opacities/solid')).toBe('var(--recursica-tokens-opacities-solid)')
    expect(tokenToCssVar('size/sm')).toBe('var(--recursica-tokens-sizes-sm)')
    expect(tokenToCssVar('sizes/sm')).toBe('var(--recursica-tokens-sizes-sm)')
  })

  it('should return null for invalid token paths', () => {
    expect(tokenToCssVar('invalid')).toBeNull()
    expect(tokenToCssVar('')).toBeNull()
  })

  it('should handle tokens with underscores and hyphens', () => {
    // With tokens provided, should resolve alias to scale
    const tokensWithHyphen = {
      tokens: {
        colors: {
          'scale-01': {
            alias: 'gray-blue',
            '100': { $value: '#e0e0e0' }
          }
        }
      }
    }
    expect(tokenToCssVar('color/gray-blue/100', tokensWithHyphen)).toMatch(/var\(--recursica-tokens-colors-scale-0\d+-100\)/)
  })
})

