/**
 * Tests for recursicaJsonTransformSpecific
 * Transform is self-contained; test imports only the transform.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformSpecific'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

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
    expect(css).toContain('--recursica_tokens_colors_scale-02_000')
    expect(css).toContain('--recursica_tokens_colors_scale-04_500')
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
    expect(css).not.toMatch(/percentage/)
    expect(css).toMatch(/\d+%/)
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

  it('throws an error if a typography group reference targets a non-existent typography set', () => {
    const invalidJson = {
      tokens: { tokens: {} },
      brand: { brand: { typography: { h2: { 'font-family': { $value: 'Arial' } } } } },
      uikit: {
        'ui-kit': {
          components: {
            card: {
              properties: {
                'header-style': {
                  $type: 'typography',
                  $value: '{brand.typography.invalid-set}'
                }
              }
            }
          }
        }
      }
    }
    
    expect(() => recursicaJsonTransform(invalidJson as any)).toThrow(/targets non-existent var/i)
  })

  it('emits literal CSS keyword and numeric string values bare, not quoted (link decoration/style/weight)', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    // text-decoration: "underline" must be a bare keyword, not a quoted string
    expect(css).toMatch(/--recursica_brand_themes_light_states_link_decoration:\s*underline;/)
    // font-style: "normal" was already correct; confirm it still is
    expect(css).toMatch(/--recursica_brand_themes_light_states_link_style:\s*normal;/)
    // font-weight: "400" (a numeric string) must be emitted bare, not quoted
    expect(css).toMatch(/--recursica_brand_themes_light_states_link_weight:\s*400;/)
    // None of the three should ever appear quoted
    expect(css).not.toMatch(/--recursica_brand_themes_light_states_link_decoration:\s*"underline";/)
    expect(css).not.toMatch(/--recursica_brand_themes_light_states_link_weight:\s*"400";/)
  })

  // `$value: null` means "emit no declaration", not "emit an empty value" — `""` is not valid for
  // any property. Keeping the aliases while dropping the primitive would leave the typography
  // declarations pointing at an undefined var.
  //
  // This is about the value, not the property: cases.original is null because CSS has no keyword
  // for "as authored", while decorations.none carries the real keyword `none` and must be emitted.
  describe('null string tokens', () => {
    const css = () => recursicaJsonTransform(json)[0].contents
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
    const decls = (s: string) => new Set([...strip(s).matchAll(/(--recursica_[\w-]+)\s*:/g)].map(m => m[1]))
    const refs = (s: string) => new Set([...strip(s).matchAll(/var\(\s*(--recursica_[\w-]+)/g)].map(m => m[1]))

    it('does not declare a null-valued string primitive', () => {
      const d = decls(css())
      expect(d.has('--recursica_tokens_font_cases_original')).toBe(false)
      expect(css()).not.toContain(': "";')
    })

    it('declares decorations.none as the CSS keyword — it is a real value, not an absence', () => {
      expect(strip(css())).toMatch(/--recursica_tokens_font_decorations_none:\s*none;/)
    })

    it('still declares the sibling primitives that have values', () => {
      const d = decls(css())
      expect(d.has('--recursica_tokens_font_cases_uppercase')).toBe(true)
      expect(d.has('--recursica_tokens_font_decorations_underline')).toBe(true)
    })

    it('prunes the declarations that alias an omitted primitive', () => {
      expect(strip(css())).not.toMatch(/var\(\s*--recursica_tokens_font_cases_original/)
    })

    it('keeps the text-decoration declarations that alias decorations.none', () => {
      expect(strip(css())).toMatch(/var\(\s*--recursica_tokens_font_decorations_none\s*\)/)
    })

    it('keeps declarations aliasing a primitive that does have a value', () => {
      expect(css()).toMatch(/var\(--recursica_tokens_font_cases_uppercase\)/)
    })

    it('leaves no reference without a declaration', () => {
      const c = css()
      const d = decls(c)
      const dangling = [...refs(c)].filter(r => !d.has(r))
      expect(dangling).toEqual([])
    })

    it('keeps the type fallback for null colours (a layer var must exist per layer)', () => {
      expect(css()).toContain('transparent')
    })
  })

})
