/**
 * Tests for recursicaJsonTransformSpecific
 * Transform is self-contained; test imports only the transform.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformSpecific'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'
import uikitJson from '../../vars/UIKit.json'

describe('recursicaJsonTransform (Specific)', () => {
  const json = {
    tokens: tokensJson,
    brand: brandJson,
    uikit: uikitJson
  }

  it('returns one file with correct filename', () => {
    const result = recursicaJsonTransform(json)
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('recursica_variables_specific.css')
  })

  it('produces valid CSS structure', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toContain(':root {')
    expect(css).toContain('}\n')
    expect(css).toMatch(/--recursica_[a-z0-9_-]+:\s*[^;]+;/)
  })

  it('includes token color variables', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toContain('--recursica_tokens_colors_scale-01_000')
    expect(css).toContain('--recursica_tokens_colors_scale-02_500')
  })

  it('includes token font variables', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_tokens_font_/)
  })

  it('includes brand variables', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_brand_/)
  })

  it('includes ui-kit variables', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_ui-kit_/)
  })

  it('percentage unit outputs as % not literal "percentage"', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).not.toMatch(/10percentage/)
    expect(css).toMatch(/10%/)
  })

  it('handles minimal input without throwing', () => {
    const minimal = {
      tokens: { tokens: { colors: {}, sizes: {}, opacities: {}, font: {} } },
      brand: { brand: { themes: { light: {}, dark: {} } } },
      uikit: { 'ui-kit': {} }
    }
    const result = recursicaJsonTransform(minimal)
    expect(result).toHaveLength(1)
    expect(result[0].contents).toContain(':root {')
  })

  it('dark layer-0 emits tone/on-tone for ui-kit (not only color/hover-color)', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_brand_themes_dark_layers_layer-0_elements_interactive_tone\b/)
    expect(css).toMatch(/--recursica_brand_themes_dark_layers_layer-0_elements_interactive_on-tone\b/)
  })
})
