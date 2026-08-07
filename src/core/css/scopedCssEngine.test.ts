/**
 * Tests for the runtime scoped CSS engine.
 *
 * Background: Forge has two independent generators of scoped CSS — this runtime engine and
 * the export transform — and they had drifted. The runtime kept the layer segment inside
 * generic ui-kit names (`..._colors_layer-0_background-color`) while the export stripped it
 * and let `[data-recursica-layer]` resolve the layer. Consumers read the export's shape, so
 * a token edit moved nothing in a preview rendered by a real consumer.
 *
 * The parity test below checks against the strongest available oracle: the CSS actually
 * shipped inside @recursica/mantine-adapter. If the engine stops emitting a name that CSS
 * reads, that component silently loses the property, and this fails.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { updateScopedCss, resetScopedCssCache } from './scopedCssEngine'

/**
 * Specific (`:root`) var names in the exact shapes the running app produces — captured from
 * a live session rather than reconstructed, so the fixture can't drift from reality silently.
 */
const SPECIFIC_VARS: Record<string, string> = {
  // ui-kit component colour, layer embedded mid-path
  '--recursica_ui-kit_themes_light_components_badge_variants_styles_primary-color_properties_colors_layer-0_background-color':
    '#abcdef',
  '--recursica_ui-kit_themes_light_components_badge_variants_styles_primary-color_properties_colors_layer-2_background-color':
    '#123456',
  '--recursica_ui-kit_themes_dark_components_badge_variants_styles_primary-color_properties_colors_layer-0_background-color':
    '#000000',
  // ui-kit component property with no layer at all
  '--recursica_ui-kit_themes_light_components_badge_properties_border-radius': '32px',
  // Toast authors elevation as layer-N leaves; consumers read it WITH the layer in the name
  '--recursica_ui-kit_themes_light_components_toast_properties_elevation_layer-0': 'none',
  // brand layer var — consumers read the layer number in the name, so it must pass through
  '--recursica_brand_themes_light_layers_layer-0_properties_surface': '#ffffff',
  '--recursica_brand_themes_light_layers_layer-2_properties_surface': '#eeeeee',
  // unscoped token — should not appear in any scope block
  '--recursica_tokens_colors_scale-01_500': '#8b8b8b',
}

function generate(vars: Record<string, string> = SPECIFIC_VARS): string {
  resetScopedCssCache()
  updateScopedCss(vars)
  return document.getElementById('recursica-scoped')?.textContent ?? ''
}

/** Extracts the declarations inside one scope block. */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) return ''
  const open = css.indexOf('{', start)
  return css.slice(open + 1, css.indexOf('}', open))
}

describe('scopedCssEngine', () => {
  beforeEach(() => {
    document.getElementById('recursica-scoped')?.remove()
    resetScopedCssCache()
  })

  it('emits the theme and theme+layer scope blocks consumers rely on', () => {
    const css = generate()
    expect(css).toMatch(/\[data-recursica-theme="light"\]\s*\{/)
    expect(css).toMatch(/\[data-recursica-theme="dark"\]\s*\{/)
    expect(css).toContain('[data-recursica-theme="light"] [data-recursica-layer="0"]')
    expect(css).toContain('[data-recursica-theme="light"] [data-recursica-layer="2"]')
  })

  it('emits a layer-free ui-kit name into the matching layer block', () => {
    const css = generate()
    const layer0 = block(css, '[data-recursica-theme="light"][data-recursica-layer="0"]')
    const layer2 = block(css, '[data-recursica-theme="light"][data-recursica-layer="2"]')

    const generic =
      '--recursica_ui-kit_components_badge_variants_styles_primary-color_properties_colors_background-color'

    // Same generic name in both blocks, each aliasing its own layer's specific var.
    expect(layer0).toContain(`${generic}: var(--recursica_ui-kit_themes_light_components_badge_variants_styles_primary-color_properties_colors_layer-0_background-color)`)
    expect(layer2).toContain(`${generic}: var(--recursica_ui-kit_themes_light_components_badge_variants_styles_primary-color_properties_colors_layer-2_background-color)`)
  })

  it('keeps the layer-in-name form too, which Toast elevation depends on', () => {
    const css = generate()
    expect(css).toContain('--recursica_ui-kit_components_toast_properties_elevation_layer-0:')
    // ...and additionally exposes the layer-free form in the layer block.
    expect(block(css, '[data-recursica-theme="light"][data-recursica-layer="0"]')).toContain(
      '--recursica_ui-kit_components_toast_properties_elevation:'
    )
  })

  it('passes layer-free ui-kit properties through unchanged, in the theme block', () => {
    const themeBlock = block(generate(), '[data-recursica-theme="light"]')
    expect(themeBlock).toContain('--recursica_ui-kit_components_badge_properties_border-radius:')
  })

  it('leaves brand layer names alone — consumers read the layer number in the name', () => {
    const css = generate()
    expect(block(css, '[data-recursica-theme="light"][data-recursica-layer="0"]')).toContain(
      '--recursica_brand_layer_0_properties_surface:'
    )
    expect(block(css, '[data-recursica-theme="light"][data-recursica-layer="2"]')).toContain(
      '--recursica_brand_layer_2_properties_surface:'
    )
    // No layer-stripped brand alias should be invented.
    expect(css).not.toContain('--recursica_brand_properties_surface:')
  })

  it('does not scope raw tokens', () => {
    const css = generate()
    expect(css).not.toContain('--recursica_tokens_colors_scale-01_500')
  })

  it('does not regenerate when only values change', () => {
    generate()
    const el = document.getElementById('recursica-scoped') as HTMLStyleElement
    const before = el.textContent

    // Same names, different values. The sheet maps names to names, so it must not change.
    const recoloured = Object.fromEntries(Object.keys(SPECIFIC_VARS).map((k) => [k, '#ff00ff']))
    updateScopedCss(recoloured)

    expect(el.textContent).toBe(before)
  })

  it('regenerates when a name is added', () => {
    generate()
    const el = document.getElementById('recursica-scoped') as HTMLStyleElement
    const before = el.textContent

    updateScopedCss({
      ...SPECIFIC_VARS,
      '--recursica_ui-kit_themes_light_components_badge_properties_colors_layer-0_novel-prop': 'red',
    })

    expect(el.textContent).not.toBe(before)
    expect(el.textContent).toContain('--recursica_ui-kit_components_badge_properties_colors_novel-prop:')
  })

  it('produces the layer-free shape @recursica/mantine-adapter actually reads', () => {
    // Parity against the real consumer: take the adapter's shipped CSS, keep the ui-kit
    // component variables it reads, and confirm none of them carry a layer segment. That is
    // the property this engine has to satisfy — emit the layer-free name, scoped by layer.
    const adapterCss = readFileSync(
      resolve(process.cwd(), 'node_modules/@recursica/mantine-adapter/dist/mantine-adapter.css'),
      'utf8'
    )
    const read = [
      ...new Set(
        [...adapterCss.matchAll(/var\(\s*(--recursica_ui-kit_components_[A-Za-z0-9_-]+)/g)].map(
          (m) => m[1]
        )
      ),
    ]
    expect(read.length).toBeGreaterThan(100) // sanity: we really parsed the adapter CSS

    // Toast elevation is the documented exception that keeps the layer in the name.
    const withLayer = read.filter((n) => /_layer-\d/.test(n) && !/_toast_/.test(n))
    expect(
      withLayer,
      'Adapter reads ui-kit names containing a layer segment; the layer-stripping rule in ' +
        'aliasesFor() needs a matching exception for these.'
    ).toEqual([])

    // Two-sided check on one concrete variable: the adapter reads this exact name, and the
    // engine emits it for the corresponding layered token in the fixture.
    const badgeName =
      '--recursica_ui-kit_components_badge_variants_styles_primary-color_properties_colors_background-color'
    expect(read, 'adapter no longer reads the badge background name this test pins').toContain(
      badgeName
    )
    expect(generate()).toContain(`${badgeName}:`)
  })
})
