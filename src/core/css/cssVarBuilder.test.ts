import { describe, it, expect } from 'vitest'
import {
  token,
  brandTypography,
  brandDimensions,
  palette,
  paletteCore,
  layerProperty,
  layerText,
  layerInteractive,
  layerElement,
  state,
  textEmphasis,
  elevation,
  genericPalette,
  genericPaletteCore,
  genericLayerProperty,
  genericLayerText,
  genericLayerInteractive,
  genericState,
  genericTextEmphasis,
  genericElevation,
} from './cssVarBuilder'

describe('cssVarBuilder', () => {
  // ─── Tokens ─────────────────────────────────────────────────────────────
  describe('token', () => {
    it('builds token color var', () => {
      expect(token('color', 'scale-01-500')).toBe('--recursica_tokens_color_scale-01-500')
    })
    it('builds token sizes var', () => {
      expect(token('sizes', 'md')).toBe('--recursica_tokens_sizes_md')
    })
    it('builds token opacities var', () => {
      expect(token('opacities', 'solid')).toBe('--recursica_tokens_opacities_solid')
    })
    it('builds token font var', () => {
      expect(token('font_sizes', 'lg')).toBe('--recursica_tokens_font_sizes_lg')
    })
  })

  // ─── Brand Typography ──────────────────────────────────────────────────
  describe('brandTypography', () => {
    it('builds caption font-size', () => {
      expect(brandTypography('caption', 'font-size')).toBe(
        '--recursica_brand_typography_caption-font-size'
      )
    })
    it('builds body-small line-height', () => {
      expect(brandTypography('body-small', 'line-height')).toBe(
        '--recursica_brand_typography_body-small-line-height'
      )
    })
    it('joins style and property with hyphen, not underscore', () => {
      const result = brandTypography('subtitle', 'font-family')
      expect(result).toContain('subtitle-font-family')
      expect(result).not.toContain('subtitle_font-family')
    })
  })

  // ─── Brand Dimensions ─────────────────────────────────────────────────
  describe('brandDimensions', () => {
    it('builds dimensions var', () => {
      expect(brandDimensions('general', 'md')).toBe(
        '--recursica_brand_dimensions_general_md'
      )
    })
  })

  // ─── Palette (specific) ───────────────────────────────────────────────
  describe('palette', () => {
    it('builds palette tone var', () => {
      expect(palette('light', 'neutral', '500', 'tone')).toBe(
        '--recursica_brand_themes_light_palettes_neutral_500_tone'
      )
    })
    it('builds palette on-tone var', () => {
      expect(palette('dark', 'palette-1', 'primary', 'on-tone')).toBe(
        '--recursica_brand_themes_dark_palettes_palette-1_primary_on-tone'
      )
    })
  })

  describe('paletteCore', () => {
    it('builds core black', () => {
      expect(paletteCore('light', 'black')).toBe(
        '--recursica_brand_themes_light_palettes_core_black'
      )
    })
    it('builds core interactive default tone', () => {
      expect(paletteCore('light', 'interactive', 'default', 'tone')).toBe(
        '--recursica_brand_themes_light_palettes_core_interactive_default_tone'
      )
    })
  })

  // ─── Layer (specific) ─────────────────────────────────────────────────
  describe('layerProperty', () => {
    it('builds layer property surface', () => {
      expect(layerProperty('light', 0, 'surface')).toBe(
        '--recursica_brand_themes_light_layers_layer-0_properties_surface'
      )
    })
    it('builds layer property border-color', () => {
      expect(layerProperty('dark', '1', 'border-color')).toBe(
        '--recursica_brand_themes_dark_layers_layer-1_properties_border-color'
      )
    })
  })

  describe('layerText', () => {
    it('builds layer text color', () => {
      expect(layerText('light', 0, 'color')).toBe(
        '--recursica_brand_themes_light_layers_layer-0_elements_text-color'
      )
    })
    it('builds layer text high-emphasis', () => {
      expect(layerText('light', 0, 'high-emphasis')).toBe(
        '--recursica_brand_themes_light_layers_layer-0_elements_text-high-emphasis'
      )
    })
  })

  describe('layerInteractive', () => {
    it('builds layer interactive tone', () => {
      expect(layerInteractive('light', 0, 'tone')).toBe(
        '--recursica_brand_themes_light_layers_layer-0_elements_interactive-tone'
      )
    })
    it('builds layer interactive on-tone-hover', () => {
      expect(layerInteractive('dark', 2, 'on-tone-hover')).toBe(
        '--recursica_brand_themes_dark_layers_layer-2_elements_interactive-on-tone-hover'
      )
    })
  })

  describe('layerElement', () => {
    it('builds raw element path', () => {
      expect(layerElement('light', 0, 'interactive-color')).toBe(
        '--recursica_brand_themes_light_layers_layer-0_elements_interactive-color'
      )
    })
  })

  // ─── State / TextEmphasis / Elevation (specific) ──────────────────────
  describe('state', () => {
    it('builds state disabled', () => {
      expect(state('light', 'disabled')).toBe(
        '--recursica_brand_themes_light_states_disabled'
      )
    })
    it('builds state overlay opacity', () => {
      expect(state('light', 'overlay', 'opacity')).toBe(
        '--recursica_brand_themes_light_states_overlay_opacity'
      )
    })
  })

  describe('textEmphasis', () => {
    it('builds text-emphasis high', () => {
      expect(textEmphasis('light', 'high')).toBe(
        '--recursica_brand_themes_light_text-emphasis_high'
      )
    })
  })

  describe('elevation', () => {
    it('builds elevation blur', () => {
      expect(elevation('light', 1, 'blur')).toBe(
        '--recursica_brand_themes_light_elevations_elevation-1_blur'
      )
    })
    it('builds elevation shadow-color', () => {
      expect(elevation('dark', 2, 'shadow-color')).toBe(
        '--recursica_brand_themes_dark_elevations_elevation-2_shadow-color'
      )
    })
  })

  // ─── Generic (consumer) names ─────────────────────────────────────────
  describe('genericLayerProperty', () => {
    it('builds generic layer property surface', () => {
      expect(genericLayerProperty(0, 'surface')).toBe(
        '--recursica_brand_layer_0_properties_surface'
      )
    })
    it('builds generic layer property border-color', () => {
      expect(genericLayerProperty(1, 'border-color')).toBe(
        '--recursica_brand_layer_1_properties_border-color'
      )
    })
  })

  describe('genericLayerText', () => {
    it('builds generic layer text color', () => {
      expect(genericLayerText(0, 'color')).toBe(
        '--recursica_brand_layer_0_elements_text-color'
      )
    })
    it('builds generic layer text low-emphasis', () => {
      expect(genericLayerText(0, 'low-emphasis')).toBe(
        '--recursica_brand_layer_0_elements_text-low-emphasis'
      )
    })
  })

  describe('genericLayerInteractive', () => {
    it('builds generic layer interactive tone', () => {
      expect(genericLayerInteractive(0, 'tone')).toBe(
        '--recursica_brand_layer_0_elements_interactive-tone'
      )
    })
  })

  describe('genericPalette', () => {
    it('builds generic palette tone', () => {
      expect(genericPalette('neutral', '500', 'tone')).toBe(
        '--recursica_brand_palettes_neutral_500_tone'
      )
    })
  })

  describe('genericPaletteCore', () => {
    it('builds generic core black', () => {
      expect(genericPaletteCore('black')).toBe(
        '--recursica_brand_palettes_core_black'
      )
    })
  })

  describe('genericState', () => {
    it('builds generic state disabled', () => {
      expect(genericState('disabled')).toBe(
        '--recursica_brand_states_disabled'
      )
    })
  })

  describe('genericTextEmphasis', () => {
    it('builds generic text-emphasis high', () => {
      expect(genericTextEmphasis('high')).toBe(
        '--recursica_brand_text-emphasis_high'
      )
    })
  })

  describe('genericElevation', () => {
    it('builds generic elevation blur', () => {
      expect(genericElevation(1, 'blur')).toBe(
        '--recursica_brand_elevations_elevation-1_blur'
      )
    })
  })
})
