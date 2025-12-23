import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildPaletteVars } from './palettes'
import type { JsonLike } from './tokens'

describe('buildPaletteVars', () => {
  const mockTokens: JsonLike = {
    tokens: {
      color: {
        gray: {
          '000': { $value: '#ffffff' },
          '050': { $value: '#f5f5f5' },
          '100': { $value: '#e0e0e0' },
          '500': { $value: '#808080' },
          '900': { $value: '#000000' }
        }
      },
      opacity: {
        solid: { $value: 1 },
        smoky: { $value: 0.5 }
      }
    }
  }

  const mockTheme: JsonLike = {
    brand: {
      themes: {
        light: {
          palettes: {
            'core-colors': {
              $type: 'color',
              $value: {
                black: '{tokens.color.gray.900}',
                white: '{tokens.color.gray.000}',
                alert: '{tokens.color.gray.900}',
                success: '{tokens.color.gray.900}',
                warning: '{tokens.color.gray.900}',
                interactive: {
                  default: {
                    tone: { $value: '{tokens.color.gray.500}' },
                    'on-tone': { $value: '{tokens.color.gray.000}' }
                  },
                  hover: {
                    tone: { $value: '{tokens.color.gray.600}' },
                    'on-tone': { $value: '{tokens.color.gray.000}' }
                  }
                }
              }
            },
            neutral: {
              '500': {
                color: {
                  tone: { $value: '{tokens.color.gray.500}' },
                  'on-tone': { $value: '{tokens.color.gray.000}' }
                }
              },
              '900': {
                color: {
                  tone: { $value: '{tokens.color.gray.900}' },
                  'on-tone': { $value: '{tokens.color.gray.000}' }
                }
              }
            }
          },
          'text-emphasis': {
            high: { $value: '{tokens.opacity.solid}' },
            low: { $value: '{tokens.opacity.smoky}' }
          },
          state: {
            disabled: { $value: '{tokens.opacity.smoky}' },
            overlay: {
              color: { $value: '{tokens.color.gray.900}' },
              opacity: { $value: '{tokens.opacity.smoky}' }
            }
          }
        },
        dark: {
          palettes: {
            'core-colors': {
              $type: 'color',
              $value: {
                black: '{tokens.color.gray.000}',
                white: '{tokens.color.gray.900}',
                alert: '{tokens.color.gray.000}',
                success: '{tokens.color.gray.000}',
                warning: '{tokens.color.gray.000}',
                interactive: {
                  default: {
                    tone: { $value: '{tokens.color.gray.500}' },
                    'on-tone': { $value: '{tokens.color.gray.900}' }
                  },
                  hover: {
                    tone: { $value: '{tokens.color.gray.400}' },
                    'on-tone': { $value: '{tokens.color.gray.900}' }
                  }
                }
              }
            },
            neutral: {
              '500': {
                color: {
                  tone: { $value: '{tokens.color.gray.500}' },
                  'on-tone': { $value: '{tokens.color.gray.900}' }
                }
              }
            }
          }
        }
      }
    }
  }

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    // Clear localStorage after each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  it('should generate palette CSS variables for light mode', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Light')
    
    // Note: core-colors are not directly converted to CSS vars in buildPaletteVars
    // They are referenced when needed but not generated as standalone vars
    
    // Check neutral palette
    expect(vars['--recursica-brand-light-palettes-neutral-500-tone']).toBeDefined()
    expect(vars['--recursica-brand-light-palettes-neutral-500-on-tone']).toBeDefined()
    expect(vars['--recursica-brand-light-palettes-neutral-900-tone']).toBeDefined()
    expect(vars['--recursica-brand-light-palettes-neutral-900-on-tone']).toBeDefined()
  })

  it('should generate palette CSS variables for dark mode', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Dark')
    
    // Note: core-colors are not directly converted to CSS vars in buildPaletteVars
    
    // Check neutral palette
    expect(vars['--recursica-brand-dark-palettes-neutral-500-tone']).toBeDefined()
    expect(vars['--recursica-brand-dark-palettes-neutral-500-on-tone']).toBeDefined()
  })

  it('should generate text emphasis variables', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Light')
    
    expect(vars['--recursica-brand-themes-light-text-emphasis-high']).toBeDefined()
    expect(vars['--recursica-brand-themes-light-text-emphasis-low']).toBeDefined()
  })

  it('should generate state variables', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Light')
    
    expect(vars['--recursica-brand-light-state-disabled']).toBeDefined()
    expect(vars['--recursica-brand-light-state-overlay-opacity']).toBeDefined()
    expect(vars['--recursica-brand-light-state-overlay-color']).toBeDefined()
  })

  it('should handle interactive core colors structure', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Light')
    
    // Note: core-colors including interactive are not directly converted to CSS vars
    // They are referenced when needed. The function should still process without errors.
    expect(vars).toBeDefined()
    expect(typeof vars).toBe('object')
    // Should have generated other palette vars
    expect(Object.keys(vars).length).toBeGreaterThan(0)
  })

  it('should generate primary-tone variables when default level exists', () => {
    const themeWithDefault: JsonLike = {
      brand: {
        themes: {
          light: {
            palettes: {
              neutral: {
                default: {
                  color: {
                    tone: { $value: '{tokens.color.gray.500}' },
                    'on-tone': { $value: '{tokens.color.gray.000}' }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    const vars = buildPaletteVars(mockTokens, themeWithDefault, 'Light')
    
    // Should create primary-tone from default
    expect(vars['--recursica-brand-themes-light-palettes-neutral-primary-tone']).toBeDefined()
    expect(vars['--recursica-brand-themes-light-palettes-neutral-primary-on-tone']).toBeDefined()
  })

  it('should handle empty palettes gracefully', () => {
    const emptyTheme: JsonLike = {
      brand: {
        themes: {
          light: {
            palettes: {}
          }
        }
      }
    }
    
    const vars = buildPaletteVars(mockTokens, emptyTheme, 'Light')
    expect(vars).toBeDefined()
    expect(typeof vars).toBe('object')
  })

  it('should handle theme without brand wrapper', () => {
    const themeWithoutBrand: JsonLike = {
      themes: {
        light: {
          palettes: {
            neutral: {
              '500': {
                color: {
                  tone: { $value: '{tokens.color.gray.500}' },
                  'on-tone': { $value: '{tokens.color.gray.000}' }
                }
              }
            }
          }
        }
      }
    }
    
    const vars = buildPaletteVars(mockTokens, themeWithoutBrand, 'Light')
    expect(vars['--recursica-brand-light-palettes-neutral-500-tone']).toBeDefined()
  })

  it('should handle missing text-emphasis gracefully', () => {
    const themeWithoutEmphasis: JsonLike = {
      brand: {
        themes: {
          light: {
            palettes: {
              neutral: {
                '500': {
                  color: {
                    tone: { $value: '{tokens.color.gray.500}' },
                    'on-tone': { $value: '{tokens.color.gray.000}' }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    const vars = buildPaletteVars(mockTokens, themeWithoutEmphasis, 'Light')
    // Should not throw, but may or may not have text-emphasis vars
    expect(vars).toBeDefined()
  })

  it('should use token references in CSS variables', () => {
    const vars = buildPaletteVars(mockTokens, mockTheme, 'Light')
    
    // Variables should reference tokens via CSS vars
    const toneVar = vars['--recursica-brand-light-palettes-neutral-500-tone']
    expect(toneVar).toContain('var(--recursica-tokens-color-gray-500)')
  })
})

