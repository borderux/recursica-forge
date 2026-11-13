/**
 * The scoped export points each component's stable root names at the variant that owns the
 * property, selected by data-recursica-* attributes. See docs/UIKIT_GENERATOR_DECISIONS.md.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const css = recursicaJsonTransform({ tokens: tokensJson, brand: brandJson, uikit: uikitJson } as any)[0].contents
const P = '--recursica_ui-kit_components_button_'
const SEL = '[data-recursica="button"]'

/** Body of the block whose selector is exactly `selector`. */
function body(selector: string): string {
  const start = css.indexOf(`\n${selector} {\n`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('\n}', start))
}

describe('button component contract', () => {
  it('points the root colour names at the style that owns them', () => {
    expect(body(`${SEL}[data-recursica-styles="solid"]`)).toContain(
      `${P}properties_colors_background-color: var(${P}variants_styles_solid_properties_colors_background-color);`
    )
  })

  it('selects content by its size', () => {
    expect(body(`${SEL}[data-recursica-content="icon-only"][data-recursica-sizes="small"]`)).toContain(
      `${P}properties_min-width: var(${P}variants_content_icon-only_variants_sizes_small_properties_min-width);`
    )
  })

  it('emits disabled after the base blocks so it overrides them', () => {
    const disabled = `${SEL}[data-recursica-styles="solid"][data-recursica-disabled]`
    expect(body(disabled)).toContain(`${P}properties_opacity:`)
    expect(css.indexOf(`\n${disabled} {`)).toBeGreaterThan(css.indexOf(`\n${SEL}[data-recursica-styles="text"] {`))
  })

  it('defines no root name on :root, so an unset attribute leaves it undefined', () => {
    expect(body(':root')).not.toContain(`${P}properties_`)
  })

  it('points only at variables the export defines', () => {
    const defined = new Set([...css.matchAll(/^\s*(--recursica_[^:\s]+):/gm)].map((m) => m[1]))
    const section = css.slice(css.indexOf('button: component contract'))
    const refs = [...section.matchAll(/var\((--recursica_[^)]+)\)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    expect(refs.filter((r) => !defined.has(r))).toEqual([])
  })
})

describe('component contract for every component', () => {
  const components = (uikitJson as any)['ui-kit'].components as Record<string, any>
  // A component only gets a contract when some variant defines a property (segmented-control's variants are empty).
  const withVariants = Object.keys(components).filter((n) => JSON.stringify(components[n]?.variants ?? {}).includes('"$value"'))

  it('emits a contract section for each component that has variants', () => {
    expect(withVariants.length).toBeGreaterThan(1)
    const missing = withVariants.filter((n) => !css.includes(`${n}: component contract.`))
    expect(missing).toEqual([])
  })

  it('names each axis attribute after its JSON key', () => {
    const toast = css.slice(css.indexOf('toast: component contract'))
    expect(toast).toContain('[data-recursica="toast"][data-recursica-styles="default"] {')
    expect(css).not.toContain('data-recursica-style=')
  })

  it('points every contract name only at variables the export defines', () => {
    const defined = new Set([...css.matchAll(/^\s*(--recursica_[^:\s]+):/gm)].map((m) => m[1]))
    const section = css.slice(css.indexOf(': component contract.'))
    const refs = [...section.matchAll(/var\((--recursica_[^)]+)\)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    expect(refs.filter((r) => !defined.has(r))).toEqual([])
  })

  it('defines a name on :root only where a state overrides it', () => {
    // A base value on the component root plus a `states` override is the one allowed double definition.
    const root = body(':root')
    const section = css.slice(css.indexOf(': component contract.'))
    const states = '(visited|active|error|disabled)'
    const names = new Set<string>()
    for (const m of section.matchAll(/^(\[data-recursica[^\n]*) \{\n([\s\S]*?)\n\}/gm)) {
      if (new RegExp(`\\[data-recursica-${states}\\]`).test(m[1])) continue
      for (const n of m[2].matchAll(/^  (--recursica_ui-kit_components_[^:\s]+_properties_[^:\s]+):/gm)) names.add(n[1])
    }
    expect(names.size).toBeGreaterThan(0)
    expect([...names].filter((n) => root.includes(`  ${n}:`))).toEqual([])
  })
})

describe('states with a native pseudo-class', () => {
  it('emits both the data attribute and :visited in one rule for link', () => {
    expect(css).toContain('[data-recursica="link"][data-recursica-visited],\n[data-recursica="link"]:visited {\n')
  })
})

describe('axis values with a native ARIA signal', () => {
  it('emits aria-expanded alongside the appearance attribute for accordion-header', () => {
    expect(css).toContain('[data-recursica="accordion-header"][data-recursica-appearance="open"],\n[data-recursica="accordion-header"]:where([aria-expanded="true"]) {\n')
    expect(css).toContain('[data-recursica="accordion-header"]:where([aria-expanded="false"]) {\n')
  })
  it('emits aria-selected alongside the selection-states attribute for tabs-item', () => {
    expect(css).toMatch(/\[data-recursica="tabs-item"\]\[data-recursica-styles="default"\]\[data-recursica-selection-states="active"\],\n\[data-recursica="tabs-item"\]\[data-recursica-styles="default"\]:where\(\[aria-selected="true"\]\) \{/)
  })
})

describe('input-based controls with a native :checked signal', () => {
  it('emits :has(input:checked) alongside the selection-states attribute, at attribute specificity', () => {
    expect(css).toContain('[data-recursica="checkbox"][data-recursica-selection-states="checked"],\n[data-recursica="checkbox"]:where(:has(input:checked:not(:indeterminate))) {\n')
    expect(css).toContain('[data-recursica="checkbox"]:where(:has(input:indeterminate)) {\n')
    for (const c of ['radio-button', 'chip', 'switch']) {
      expect(css).toContain(`[data-recursica="${c}"]:where(:has(input:checked)) {\n`)
    }
  })
  it('gives disabled and error blocks nested under a selection state a native form too', () => {
    expect(css).toContain('[data-recursica="checkbox"]:where(:has(input:checked:not(:indeterminate)))[data-recursica-disabled] {')
    expect(css).toContain('[data-recursica="chip"]:where(:has(input:checked))[data-recursica-error]')
    expect(css).toContain('[data-recursica="segmented-control-item"]:where(:has(input:checked)) {\n')
  })
  it('never emits a direct-child :has(> input) form', () => {
    expect(css).not.toContain(':has(> input')
  })
})
