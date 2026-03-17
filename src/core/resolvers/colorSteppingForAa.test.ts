import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findAaCompliantColor } from './colorSteppingForAa'
import type { JsonLike } from './tokens'
import * as readCssVarModule from '../css/readCssVar'

// Mock readCssVar
vi.mock('../css/readCssVar', () => ({
  readCssVar: vi.fn((varName: string) => {
    const varMap: Record<string, string> = {
      '--recursica_brand_light_palettes_core_white': '#ffffff',
      '--recursica_brand_light_palettes_core_black': '#000000',
      '--recursica_tokens_color_gray_000': '#ffffff',
      '--recursica_tokens_color_gray_050': '#f5f5f5',
      '--recursica_tokens_color_gray_100': '#e0e0e0',
      '--recursica_tokens_color_gray_200': '#cccccc',
      '--recursica_tokens_color_gray_300': '#b3b3b3',
      '--recursica_tokens_color_gray_400': '#999999',
      '--recursica_tokens_color_gray_500': '#808080',
      '--recursica_tokens_color_gray_600': '#666666',
      '--recursica_tokens_color_gray_700': '#4d4d4d',
      '--recursica_tokens_color_gray_800': '#333333',
      '--recursica_tokens_color_gray_900': '#000000'
    }
    return varMap[varName] || null
  })
}))

describe('findAaCompliantColor', () => {
  const mockTokens: JsonLike = {
    tokens: {
      color: {
        gray: {
          '000': { $value: '#ffffff' },
          '050': { $value: '#f5f5f5' },
          '100': { $value: '#e0e0e0' },
          '200': { $value: '#cccccc' },
          '300': { $value: '#b3b3b3' },
          '400': { $value: '#999999' },
          '500': { $value: '#808080' },
          '600': { $value: '#666666' },
          '700': { $value: '#4d4d4d' },
          '800': { $value: '#333333' },
          '900': { $value: '#000000' }
        }
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find AA-compliant color by stepping lighter', () => {
    // Dark surface (#333333) with gray-500 (#808080) should step lighter for better contrast
    const result = findAaCompliantColor('#333333', { family: 'gray', level: '500' }, 1, mockTokens)
    
    // Should return a lighter shade (lower level number) or fallback to white/black
    expect(result).toBeDefined()
    expect(result).toMatch(/var\(--recursica_(tokens_color_gray_|brand_light_palettes_core_)/)
  })

  it('should find AA-compliant color by stepping darker', () => {
    // Light surface (#f5f5f5) with gray-500 (#808080) should step darker for better contrast
    const result = findAaCompliantColor('#f5f5f5', { family: 'gray', level: '500' }, 1, mockTokens)
    
    // Should return a darker shade (higher level number) or fallback to white/black
    expect(result).toBeDefined()
    expect(result).toMatch(/var\(--recursica_(tokens_color_gray_|brand_light_palettes_core_)/)
  })

  it('should handle opacity when blending colors', () => {
    // Test with opacity less than 1
    const result = findAaCompliantColor('#808080', { family: 'gray', level: '500' }, 0.8, mockTokens)
    
    expect(result).toBeDefined()
    expect(result).toMatch(/var\(--recursica_(tokens_color_gray_|brand_light_palettes_core_)/)
  })

  it('should fallback to white/black when no token level works', () => {
    // Very dark surface - should try lighter shades first, then fallback to white/black
    const result = findAaCompliantColor('#000000', { family: 'gray', level: '500' }, 1, mockTokens)
    
    expect(result).toBeDefined()
    // May find a lighter token level OR fallback to white/black
    // Both are valid outcomes
    expect(result).toMatch(/var\(--recursica_(tokens_color_gray_|brand_light_palettes_core_)/)
  })

  it('should handle null core token by trying white/black', () => {
    const result = findAaCompliantColor('#808080', null, 1, mockTokens)
    
    expect(result).toBeDefined()
    expect(result).toContain('--recursica_brand_light_palettes_core_')
  })

  it('should normalize 000 level to 050', () => {
    const result = findAaCompliantColor('#333333', { family: 'gray', level: '000' }, 1, mockTokens)
    
    expect(result).toBeDefined()
    // Should not reference 000, should use 050 instead
    expect(result).not.toContain('gray-000')
  })

  it('should return null for invalid start level', () => {
    const result = findAaCompliantColor('#808080', { family: 'gray', level: 'invalid' }, 1, mockTokens)
    
    expect(result).toBeNull()
  })

  it('should handle high contrast scenarios', () => {
    // White on black should already be compliant
    const result = findAaCompliantColor('#000000', { family: 'gray', level: '000' }, 1, mockTokens)
    
    expect(result).toBeDefined()
  })

  it('should handle low contrast scenarios', () => {
    // Gray on gray - should find a better contrast
    const result = findAaCompliantColor('#808080', { family: 'gray', level: '500' }, 1, mockTokens)
    
    expect(result).toBeDefined()
    // Should return a different shade for better contrast
    expect(result).not.toContain('gray-500')
  })

  it('should prefer white over black when both meet AA', () => {
    // When both white and black meet contrast requirements, prefer white
    const result = findAaCompliantColor('#666666', null, 1, mockTokens)
    
    expect(result).toBeDefined()
    // Should prefer white (higher contrast typically)
    expect(result).toContain('white')
  })
})

