/**
 * A ui-kit value outside the per-layer groups that references a theme-scoped brand group (an
 * elevation, a palette colour, a state) used to be written once on `:root`, resolved against the
 * light theme, so dark mode read the light value. It is now written once per mode and the theme
 * blocks alias the generic name to the right one.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const css = recursicaJsonTransform({
  tokens: tokensJson,
  brand: brandJson,
  uikit: uikitJson,
} as any)[0].contents

/** Declarations inside the first block whose selector line starts with `selector`. */
function block(selector: string): string {
  const start = css.indexOf(`\n${selector}`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

const ELEVATION = '--recursica_ui-kit_components_button_variants_styles_solid_properties_elevation'
const FIELD_BG = '--recursica_ui-kit_globals_form_field_colors_background-color'

describe('theme-dependent ui-kit values outside the layer groups', () => {
  it('are not written on :root under their generic name', () => {
    const root = block(':root')
    expect(root).not.toContain(`${ELEVATION}:`)
    expect(root).not.toContain(`${FIELD_BG}:`)
  })

  it('are written once per mode, each reading that mode of the brand', () => {
    expect(css).toContain(
      `${ELEVATION.replace('ui-kit_', 'ui-kit_modes_light_')}: var(--recursica_brand_modes_light_elevations_elevation-0);`
    )
    expect(css).toContain(
      `${ELEVATION.replace('ui-kit_', 'ui-kit_modes_dark_')}: var(--recursica_brand_modes_dark_elevations_elevation-0);`
    )
    expect(css).toContain(
      `${FIELD_BG.replace('ui-kit_', 'ui-kit_modes_dark_')}: var(--recursica_brand_modes_dark_palettes_neutral_000_color_tone);`
    )
  })

  it('are aliased to the matching mode in each theme block', () => {
    const light = block('[data-recursica-theme="light"] {')
    const dark = block('[data-recursica-theme="dark"] {')
    expect(light).toContain(`${ELEVATION}: var(${ELEVATION.replace('ui-kit_', 'ui-kit_modes_light_')});`)
    expect(dark).toContain(`${ELEVATION}: var(${ELEVATION.replace('ui-kit_', 'ui-kit_modes_dark_')});`)
    expect(dark).toContain(`${FIELD_BG}: var(${FIELD_BG.replace('ui-kit_', 'ui-kit_modes_dark_')});`)
  })

  it('follow a reference to another theme-dependent ui-kit value per mode', () => {
    const disabledOpacity = '--recursica_ui-kit_components_button_variants_styles_solid_variants_states_disabled_properties_opacity'
    expect(css).toContain(
      `${disabledOpacity.replace('ui-kit_', 'ui-kit_modes_dark_')}: var(--recursica_ui-kit_modes_dark_globals_states_disabled);`
    )
  })
})
