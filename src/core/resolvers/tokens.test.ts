import { describe, it, expect } from 'vitest'
import { buildTokenIndex, resolveBraceRef, type TokenIndex } from './tokens'
import type { JsonLike } from './tokens'

describe('buildTokenIndex', () => {
  const mockTokens: JsonLike = {
    tokens: {
      color: {
        gray: {
          '000': { $value: '#ffffff' },
          '050': { $value: '#f5f5f5' },
          '100': { $value: '#e0e0e0' },
          '500': { $value: '#808080' },
          '900': { $value: '#000000' },
          '1000': { $value: '#000000' }
        },
        salmon: {
          '500': { $value: '#ff6b6b' }
        }
      },
      opacity: {
        solid: { $value: 1 },
        smoky: { $value: 0.5 }
      },
      size: {
        sm: { $value: 8 },
        md: { $value: 16 },
        lg: { $value: 24 }
      },
      font: {
        weight: {
          regular: { $value: 400 },
          bold: { $value: 700 }
        },
        size: {
          sm: { $value: 12 },
          md: { $value: 16 },
          lg: { $value: 24 }
        },
        'letter-spacing': {
          default: { $value: 0 },
          tight: { $value: -0.5 }
        },
        'line-height': {
          default: { $value: 1.5 },
          tight: { $value: 1.2 }
        },
        family: {
          primary: { $value: 'Arial, sans-serif' }
        },
        typeface: {
          primary: { $value: 'Arial' }
        }
      }
    }
  }

  it('should build token index from tokens object', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index).toBeDefined()
    expect(typeof index.get).toBe('function')
  })

  it('should resolve color tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('color/gray/500')).toBe('#808080')
    expect(index.get('color/salmon/500')).toBe('#ff6b6b')
    expect(index.get('color/gray/000')).toBe('#ffffff')
  })

  it('should resolve opacity tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('opacity/solid')).toBe(1)
    expect(index.get('opacity/smoky')).toBe(0.5)
  })

  it('should resolve size tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('size/sm')).toBe(8)
    expect(index.get('size/md')).toBe(16)
    expect(index.get('size/lg')).toBe(24)
  })

  it('should resolve font weight tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/weight/regular')).toBe(400)
    expect(index.get('font/weight/bold')).toBe(700)
  })

  it('should resolve font size tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/size/sm')).toBe(12)
    expect(index.get('font/size/md')).toBe(16)
    expect(index.get('font/size/lg')).toBe(24)
  })

  it('should resolve font letter-spacing tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/letter-spacing/default')).toBe(0)
    expect(index.get('font/letter-spacing/tight')).toBe(-0.5)
  })

  it('should resolve font line-height tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/line-height/default')).toBe(1.5)
    expect(index.get('font/line-height/tight')).toBe(1.2)
  })

  it('should resolve font family tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/family/primary')).toBe('Arial, sans-serif')
  })

  it('should resolve font typeface tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('font/typeface/primary')).toBe('Arial')
  })

  it('should return undefined for non-existent tokens', () => {
    const index = buildTokenIndex(mockTokens)
    expect(index.get('color/nonexistent/500')).toBeUndefined()
    expect(index.get('invalid/path')).toBeUndefined()
    expect(index.get('')).toBeUndefined()
  })

  it('should handle tokens without $value wrapper', () => {
    const tokensWithoutWrapper: JsonLike = {
      color: {
        gray: {
          '500': { $value: '#808080' }
        }
      }
    }
    const index = buildTokenIndex(tokensWithoutWrapper)
    expect(index.get('color/gray/500')).toBe('#808080')
  })

  it('should handle empty tokens object', () => {
    const index = buildTokenIndex({})
    expect(index.get('color/gray/500')).toBeUndefined()
  })

  it('should handle null/undefined tokens', () => {
    const index1 = buildTokenIndex(null)
    const index2 = buildTokenIndex(undefined)
    expect(index1.get('color/gray/500')).toBeUndefined()
    expect(index2.get('color/gray/500')).toBeUndefined()
  })
})

describe('resolveBraceRef', () => {
  const mockTokens: JsonLike = {
    tokens: {
      color: {
        gray: {
          '500': { $value: '#808080' }
        }
      },
      opacity: {
        solid: { $value: 1 }
      }
    }
  }

  const tokenIndex = buildTokenIndex(mockTokens)

  it('should resolve simple token references', () => {
    const result = resolveBraceRef('{tokens.color.gray.500}', tokenIndex)
    expect(result).toBe('#808080')
  })

  it('should resolve token references with token prefix', () => {
    const result = resolveBraceRef('{token.color.gray.500}', tokenIndex)
    expect(result).toBe('#808080')
  })

  it('should resolve nested references', () => {
    const themeAccessor = (path: string) => {
      if (path === 'palette.neutral.500') {
        return '{tokens.color.gray.500}'
      }
      return undefined
    }
    const result = resolveBraceRef('{theme.palette.neutral.500}', tokenIndex, themeAccessor)
    expect(result).toBe('#808080')
  })

  it('should handle references with spaces', () => {
    const result = resolveBraceRef('{ tokens.color.gray.500 }', tokenIndex)
    expect(result).toBe('#808080')
  })

  it('should handle object with $value property', () => {
    const obj = { $value: '{tokens.color.gray.500}' }
    const result = resolveBraceRef(obj, tokenIndex)
    expect(result).toBe('#808080')
  })

  it('should handle object with value property', () => {
    const obj = { value: '{tokens.color.gray.500}' }
    const result = resolveBraceRef(obj, tokenIndex)
    expect(result).toBe('#808080')
  })

  it('should handle numbers directly', () => {
    const result = resolveBraceRef(42, tokenIndex)
    expect(result).toBe(42)
  })

  it('should handle null/undefined', () => {
    expect(resolveBraceRef(null, tokenIndex)).toBeUndefined()
    expect(resolveBraceRef(undefined, tokenIndex)).toBeUndefined()
  })

  it('should prevent infinite recursion', () => {
    // Create a circular reference scenario
    const themeAccessor = (path: string) => {
      if (path === 'circular') {
        return '{theme.circular}'
      }
      return undefined
    }
    const result = resolveBraceRef('{theme.circular}', tokenIndex, themeAccessor)
    // Should return undefined after max depth is reached (depth limit is 8)
    expect(result).toBeUndefined()
  })

  it('should return string for non-reference values', () => {
    const result = resolveBraceRef('plain string', tokenIndex)
    expect(result).toBe('plain string')
  })

  it('should handle theme references', () => {
    const themeAccessor = (path: string) => {
      if (path === 'palette.neutral.500') {
        return '#808080'
      }
      return undefined
    }
    const result = resolveBraceRef('{theme.palette.neutral.500}', tokenIndex, themeAccessor)
    expect(result).toBe('#808080')
  })

  it('should handle brand references', () => {
    const themeAccessor = (path: string) => {
      if (path === 'palette.neutral.500') {
        return '#808080'
      }
      return undefined
    }
    const result = resolveBraceRef('{brand.palette.neutral.500}', tokenIndex, themeAccessor)
    expect(result).toBe('#808080')
  })

  it('should handle empty string', () => {
    const result = resolveBraceRef('', tokenIndex)
    expect(result).toBeUndefined()
  })

  it('should handle whitespace-only string', () => {
    const result = resolveBraceRef('   ', tokenIndex)
    expect(result).toBeUndefined()
  })
})

