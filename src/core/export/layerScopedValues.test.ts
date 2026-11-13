/**
 * A layer-specific ui-kit value is written in its theme+layer block, not as a root variable that
 * the block aliases. See docs/UIKIT_GENERATOR_DECISIONS.md (decision 13).
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const css = recursicaJsonTransform({ tokens: tokensJson, brand: brandJson, uikit: uikitJson } as any)[0].contents
const MODAL = '--recursica_ui-kit_components_modal_properties_colors_content-background-color'

/** Body of the first block whose selector list contains `selector`. */
function body(selector: string): string {
  const start = css.indexOf(`${selector} {\n`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

describe('layer-scoped ui-kit values', () => {
  it('declares no per-layer ui-kit root variable', () => {
    expect(css).not.toMatch(/^\s+--recursica_ui-kit_modes_(light|dark)_layer_\d_/m)
  })

  it('writes a pinned value in each layer block, reading the layer it pins', () => {
    // Modal content reads the surface one layer up, on every layer it is placed in.
    for (const theme of ['light', 'dark']) {
      expect(body(`[data-recursica-theme="${theme}"] [data-recursica-layer="0"]`)).toContain(
        `${MODAL}: var(--recursica_brand_modes_${theme}_layers_layer-1_properties_surface);`
      )
    }
  })

  it('gives the theme block the layer-0 value for an element with no layer attribute', () => {
    expect(body('[data-recursica-theme="light"]')).toContain(
      `${MODAL}: var(--recursica_brand_modes_light_layers_layer-1_properties_surface);`
    )
  })
})
