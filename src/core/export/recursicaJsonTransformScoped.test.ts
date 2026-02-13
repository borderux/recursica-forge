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

  it('refs in scoped blocks use scoped var names (no brand_themes_light/dark in var() targets)', () => {
    const result = recursicaJsonTransform(json)
    const css = result[0].contents
    expect(css).not.toMatch(/var\(--recursica_brand_themes_(light|dark)_/)
    expect(css).toMatch(/var\(--recursica_brand_palettes_/)
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
})
