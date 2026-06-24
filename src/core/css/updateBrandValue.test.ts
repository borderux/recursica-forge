import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBrandValue } from './updateBrandValue'
import { getVarsStore } from '../store/varsStore'

// Mock varsStore
const mockTheme = {
  brand: {
    typography: {
      h3: {
        $type: 'typography',
        $value: {
          fontFamily: '{brand.fonts.primary}',
          fontSize: '{tokens.font.sizes.4xl}',
          fontWeight: '{tokens.font.weights.regular}',
        }
      }
    },
    themes: {
      light: {
        palettes: {
          'core-colors': {
            alert: {
              tone: {
                $type: 'color',
                $value: '{tokens.colors.scale-05.500}'
              }
            }
          }
        },
        elevations: {
          'elevation-1': {
            $type: 'shadow',
            $value: {
              blur: {
                $type: 'number',
                $value: {
                  value: 3,
                  unit: 'px'
                }
              }
            }
          }
        }
      }
    }
  }
}

let mockThemeCopy = JSON.parse(JSON.stringify(mockTheme))
const mockSetThemeSilent = vi.fn((newTheme) => {
  mockThemeCopy = newTheme
})

vi.mock('../store/varsStore', () => ({
  getVarsStore: vi.fn(() => ({
    scheduleComplianceScan: vi.fn(),
    getLatestThemeCopy: vi.fn(() => JSON.parse(JSON.stringify(mockThemeCopy))),
    setThemeSilent: mockSetThemeSilent,
  })),
}))

describe('updateBrandValue', () => {
  beforeEach(() => {
    mockThemeCopy = JSON.parse(JSON.stringify(mockTheme))
    mockSetThemeSilent.mockClear()
  })

  it('should update single-value tokens directly under $value', () => {
    // Alert tone CSS var: --recursica_brand_themes_light_palettes_core-colors_alert_tone
    const result = updateBrandValue(
      '--recursica_brand_themes_light_palettes_core-colors_alert_tone',
      'var(--recursica_tokens_colors_scale-05_600)'
    )
    
    expect(result).toBe(true)
    expect(mockSetThemeSilent).toHaveBeenCalled()
    expect(mockThemeCopy.brand.themes.light.palettes['core-colors'].alert.tone.$value).toBe(
      '{tokens.colors.scale-05.600}'
    )
  })

  it('should update composite typography token properties inside $value object', () => {
    // h3 font-size CSS var: --recursica_brand_typography_h3-font-size
    const result = updateBrandValue(
      '--recursica_brand_typography_h3-font-size',
      'var(--recursica_tokens_font_sizes_xl)'
    )

    expect(result).toBe(true)
    expect(mockSetThemeSilent).toHaveBeenCalled()
    
    // Check that we updated the value inside h3.$value, and did NOT create a new root key
    expect(mockThemeCopy.brand.typography.h3.$value.fontSize).toBe(
      '{tokens.font.sizes.xl}'
    )
    expect(mockThemeCopy.brand.typography.h3.fontSize).toBeUndefined()
  })

  it('should update composite shadow elevation sub-properties inside $value object', () => {
    // elevation-1 blur CSS var: --recursica_brand_themes_light_elevations_elevation-1_blur
    const result = updateBrandValue(
      '--recursica_brand_themes_light_elevations_elevation-1_blur',
      '6px'
    )

    expect(result).toBe(true)
    expect(mockSetThemeSilent).toHaveBeenCalled()

    // Check that we updated the nested elevation value
    expect(mockThemeCopy.brand.themes.light.elevations['elevation-1'].$value.blur.$value).toEqual({
      value: 6,
      unit: 'px'
    })
    expect(mockThemeCopy.brand.themes.light.elevations['elevation-1'].blur).toBeUndefined()
  })
})
