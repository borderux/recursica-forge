import { describe, it, expect } from 'vitest'
import { cssVarToRef } from './cssVarBuilder'

describe('cssVarToRef', () => {
  it('converts raw brand generic palette variables to reference maps', () => {
    expect(cssVarToRef('--recursica_brand_palettes_palette-2_500_color_tone'))
      .toBe('{brand.palettes.palette-2.500.color.tone}')
  })

  it('converts var() wrapped brand generic palette variables', () => {
    expect(cssVarToRef('var(--recursica_brand_palettes_palette-2_500_color_tone)'))
      .toBe('{brand.palettes.palette-2.500.color.tone}')
  })

  it('converts var() wrapped brand themes parameters', () => {
    expect(cssVarToRef('var(--recursica_brand_themes_light_palettes_palette-1_500_color_tone)'))
      .toBe('{brand.themes.light.palettes.palette-1.500.color.tone}')
  })

  it('converts var() dimensions parameter correctly', () => {
    expect(cssVarToRef('var(--recursica_brand_dimensions_border-radii_default)'))
      .toBe('{brand.dimensions.border-radii.default}')
  })

  it('converts raw color tokens successfully', () => {
    expect(cssVarToRef('--recursica_tokens_colors_scale-05_500'))
      .toBe('{tokens.colors.scale-05.500}')
  })

  it('converts var() wrapped tokens correctly', () => {
    expect(cssVarToRef('var(--recursica_tokens_colors_scale-01_500)'))
      .toBe('{tokens.colors.scale-01.500}')
  })

  it('returns null for non-recursica variables', () => {
    expect(cssVarToRef('var(--radix-ui-color-3)')).toBeNull()
    expect(cssVarToRef('--something_else')).toBeNull()
  })

  it('returns null for invalid inputs', () => {
    expect(cssVarToRef('')).toBeNull()
    expect(cssVarToRef('var()')).toBeNull()
  })
})
