/**
 * Tests for recursicaJsonTransformScoped
 * Transform is self-contained; test imports only the transform.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../vars/Tokens.json'
import brandJson from '../../vars/Brand.json'
import uikitJson from '../../vars/UIKit.json'

describe('recursicaJsonTransform (Scoped)', () => {
  const json = {
    tokens: tokensJson,
    brand: brandJson,
    uikit: uikitJson
  }

  it('returns one file with correct filename', () => {
    const result = recursicaJsonTransform(json)
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('recursica_variables_scoped.css')
  })

  it('produces valid CSS structure', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toContain(':root {')
    expect(css).toMatch(/\[data-recursica-theme="light"\]\s*\{/)
    expect(css).toMatch(/\[data-recursica-theme="dark"\]\s*\{/)
    expect(css).toMatch(/--recursica_[a-z0-9_-]+:\s*[^;]+;/)
  })

  it('includes unscoped :root with token variables', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toContain('--recursica_tokens_colors_scale-01_000')
    expect(css).toContain('--recursica_tokens_colors_scale-02_500')
  })

  it('includes theme-scoped blocks', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toContain('[data-recursica-theme="light"]')
    expect(css).toContain('[data-recursica-theme="dark"]')
    expect(css).toMatch(/\[data-recursica-theme="light"\]\s*\{[\s\S]*?--recursica_brand_/)
  })

  it('includes theme+layer scoped blocks when layers exist', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/\[data-recursica-theme="[^"]+"\]\[data-recursica-layer="\d+"\]/)
  })

  it('layer blocks include descendant selector so nested div with layer inherits to children', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/\[data-recursica-theme="light"\] \[data-recursica-layer="1"\]/)
  })

  it('includes brand variables in scoped blocks with base names (no theme in var name)', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_brand_palettes_/)
    expect(css).toMatch(/--recursica_brand_dimensions_/)
  })

  it('theme/layer blocks alias to root (generic name: var(specific root name))', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    // Root holds all specific names; blocks only alias. Theme blocks reference root vars.
    expect(css).toMatch(/var\(--recursica_brand_(palettes|themes)_/)
    expect(css).toMatch(/\[data-recursica-theme="light"\][\s\S]*?--recursica_brand_[^:]+:\s*var\(--recursica_/)
    expect(css).toMatch(/\[data-recursica-theme="dark"\][\s\S]*?--recursica_brand_[^:]+:\s*var\(--recursica_/)
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

  it('theme blocks include layer-0 vars so theme-only implies layer-0 by default', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    // Match theme-only block (selector followed by {), not theme+layer selector
    const lightBlock = css.match(/\[data-recursica-theme="light"\]\s*\{[\s\S]*?^}/m)?.[0] ?? ''
    const darkBlock = css.match(/\[data-recursica-theme="dark"\]\s*\{[\s\S]*?^}/m)?.[0] ?? ''
    expect(lightBlock).toMatch(/--recursica_brand_layer_0_/)
    expect(darkBlock).toMatch(/--recursica_brand_layer_0_/)
  })

  it('dark layer-0 emits tone/on-tone for ui-kit (not only color/hover-color)', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).toMatch(/--recursica_brand_layer_0_elements_interactive_tone\b/)
    expect(css).toMatch(/--recursica_brand_layer_0_elements_interactive_on-tone\b/)
  })
})
