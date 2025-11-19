import { describe, it, expect } from 'vitest'
import { buildDimensionVars } from './dimensions'
import type { JsonLike } from './tokens'

describe('buildDimensionVars', () => {
  const mockTokens: JsonLike = {
    tokens: {
      size: {
        sm: { $value: 8 },
        md: { $value: 16 },
        lg: { $value: 24 }
      }
    }
  }

  const mockTheme: JsonLike = {
    brand: {
      dimensions: {
        sm: {
          $type: 'number',
          $value: '{tokens.size.sm}'
        },
        md: {
          $type: 'number',
          $value: '{tokens.size.md}'
        },
        lg: {
          $type: 'number',
          $value: '{tokens.size.lg}'
        },
        'border-radius': {
          default: {
            $type: 'number',
            $value: 4
          },
          sm: {
            $type: 'number',
            $value: 2
          },
          lg: {
            $type: 'number',
            $value: 8
          }
        },
        spacer: {
          sm: {
            $type: 'number',
            $value: 8
          },
          md: {
            $type: 'number',
            $value: 16
          },
          lg: {
            $type: 'number',
            $value: 24
          }
        }
      }
    }
  }

  it('should generate dimension CSS variables', () => {
    const vars = buildDimensionVars(mockTokens, mockTheme, 'light')
    
    expect(vars['--recursica-brand-dimensions-sm']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-md']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-lg']).toBeDefined()
  })

  it('should resolve token references in dimensions', () => {
    const vars = buildDimensionVars(mockTokens, mockTheme, 'light')
    
    // Should resolve token references to CSS vars
    const smVar = vars['--recursica-brand-dimensions-sm']
    expect(smVar).toContain('var(--recursica-tokens-size-sm)')
  })

  it('should handle numeric values directly', () => {
    const vars = buildDimensionVars(mockTokens, mockTheme, 'light')
    
    // border-radius values are numeric, should have px suffix
    const borderRadiusVar = vars['--recursica-brand-dimensions-border-radius-default']
    expect(borderRadiusVar).toBe('4px')
  })

  it('should handle nested dimension structures', () => {
    const vars = buildDimensionVars(mockTokens, mockTheme, 'light')
    
    expect(vars['--recursica-brand-dimensions-border-radius-default']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-border-radius-sm']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-border-radius-lg']).toBeDefined()
    
    expect(vars['--recursica-brand-dimensions-spacer-sm']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-spacer-md']).toBeDefined()
    expect(vars['--recursica-brand-dimensions-spacer-lg']).toBeDefined()
  })

  it('should handle brand dimension references', () => {
    const themeWithBrandRef: JsonLike = {
      brand: {
        dimensions: {
          sm: {
            $type: 'number',
            $value: '{brand.dimensions.md}'
          }
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithBrandRef, 'light')
    // Should resolve to CSS var reference
    const smVar = vars['--recursica-brand-dimensions-sm']
    expect(smVar).toContain('var(--recursica-brand-dimensions-md)')
  })

  it('should handle legacy theme dimension references', () => {
    const themeWithLegacyRef: JsonLike = {
      brand: {
        dimensions: {
          sm: {
            $type: 'number',
            $value: '{theme.light.dimension.sm}'
          }
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithLegacyRef, 'light')
    // Should resolve to CSS var reference
    const smVar = vars['--recursica-brand-dimensions-sm']
    expect(smVar).toContain('var(--recursica-brand-dimensions-sm)')
  })

  it('should handle empty dimensions gracefully', () => {
    const emptyTheme: JsonLike = {
      brand: {
        dimensions: {}
      }
    }
    
    const vars = buildDimensionVars(mockTokens, emptyTheme, 'light')
    expect(vars).toBeDefined()
    expect(Object.keys(vars).length).toBe(0)
  })

  it('should handle theme without brand wrapper', () => {
    const themeWithoutBrand: JsonLike = {
      dimensions: {
        sm: {
          $type: 'number',
          $value: 8
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithoutBrand, 'light')
    expect(vars['--recursica-brand-dimensions-sm']).toBeDefined()
  })

  it('should handle string values with units', () => {
    const themeWithString: JsonLike = {
      brand: {
        dimensions: {
          sm: {
            $type: 'number',
            $value: '8px'
          }
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithString, 'light')
    const smVar = vars['--recursica-brand-dimensions-sm']
    expect(smVar).toBe('8px')
  })

  it('should handle numeric values without units', () => {
    const themeWithNumber: JsonLike = {
      brand: {
        dimensions: {
          sm: {
            $type: 'number',
            $value: 8
          }
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithNumber, 'light')
    const smVar = vars['--recursica-brand-dimensions-sm']
    expect(smVar).toBe('8px')
  })

  it('should skip metadata keys', () => {
    const themeWithMetadata: JsonLike = {
      brand: {
        dimensions: {
          $type: 'dimensions',
          sm: {
            $type: 'number',
            $value: 8
          }
        }
      }
    }
    
    const vars = buildDimensionVars(mockTokens, themeWithMetadata, 'light')
    // Should not create vars for $type
    expect(vars['--recursica-brand-dimensions-$type']).toBeUndefined()
    expect(vars['--recursica-brand-dimensions-sm']).toBeDefined()
  })
})

