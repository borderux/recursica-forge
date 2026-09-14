/**
 * Breakpoint overrides — the optional `breakpoints` group in tokens/brand.
 *
 * The group holds a sparse tree at base paths, carrying only what differs at that breakpoint.
 * Both transforms render it as media blocks after the base CSS, and a file without the group must
 * produce byte-identical output to before the feature existed.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform as scoped } from './recursicaJsonTransformScoped'
import { recursicaJsonTransform as specific } from './recursicaJsonTransformSpecific'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const clone = (o: unknown) => JSON.parse(JSON.stringify(o))

/** Base input plus whatever breakpoint groups the test needs. */
const build = (opts: { tokenBps?: any; brandBps?: any } = {}) => {
  const tokens = clone(tokensJson)
  const brand = clone(brandJson)
  // Declare the grids the tests derive conditions from. The shipped brand ships a single
  // `default` grid on purpose — breakpoints are created deliberately — so the fixture supplies
  // its own rather than depending on data the product is free to change.
  brand.brand['layout-grids'] = {
    ...(brand.brand['layout-grids'] ?? {}),
    mobile: { 'max-width': { $type: 'number', $value: 480 }, columns: { $type: 'number', $value: 4 } },
    tablet: { 'max-width': { $type: 'number', $value: 810 }, columns: { $type: 'number', $value: 6 } },
  }
  if (opts.tokenBps) tokens.tokens.breakpoints = opts.tokenBps
  if (opts.brandBps) brand.brand.breakpoints = opts.brandBps
  return { tokens, brand, uikit: clone(uikitJson) } as any
}

const px = (value: number) => ({ $type: 'dimension', $value: { value, unit: 'px' } })
const run = (fn: any, input: any): string => fn(input)[0].contents
const mediaPart = (css: string) => (css.includes('/* Breakpoint:') ? css.slice(css.indexOf('/* Breakpoint:')) : '')
const basePart = (css: string) => (css.includes('/* Breakpoint:') ? css.slice(0, css.indexOf('/* Breakpoint:')) : css)
/** The header stamps the time of generation, which differs between two calls a second apart. */
const stable = (css: string) => css.replace(/^ \* Generated: .*$/m, ' * Generated: <time>').trim()

describe.each([
  ['scoped', scoped],
  ['specific', specific],
])('breakpoint overrides (%s)', (_name, transform) => {
  it('emits nothing when there is no breakpoints group', () => {
    const css = run(transform, build())
    expect(css).not.toContain('@media')
    expect(css).not.toContain('/* Breakpoint:')
  })

  it('leaves the base output byte-identical when a group is present', () => {
    const without = run(transform, build())
    const withBp = run(transform, build({ tokenBps: { mobile: { font: { sizes: { '6xl': px(40) } } } } }))
    expect(stable(basePart(withBp))).toBe(stable(without))
  })

  it('emits only the overridden declaration, not the whole graph', () => {
    const css = run(transform, build({ tokenBps: { mobile: { font: { sizes: { '6xl': px(40) } } } } }))
    const media = mediaPart(css)
    expect(media).toContain('--recursica_tokens_font_sizes_6xl: 40px;')
    // one declaration only — the dependent typography/ui-kit vars are not re-emitted
    expect((media.match(/--recursica_/g) || []).length).toBe(1)
  })

  it('derives the condition from brand.layout-grids when none is declared', () => {
    const css = run(transform, build({ tokenBps: { mobile: { font: { sizes: { '6xl': px(40) } } } } }))
    // the fixture declares layout-grids.mobile.max-width = 480
    expect(mediaPart(css)).toContain('@media (max-width: 480px)')
  })

  it('prefers an explicitly declared condition over the grid width', () => {
    const css = run(transform, build({
      tokenBps: {
        mobile: {
          $extensions: { 'com.recursica.breakpoint': { condition: '(max-width: 599px)' } },
          font: { sizes: { '6xl': px(40) } },
        },
      },
    }))
    expect(mediaPart(css)).toContain('@media (max-width: 599px)')
    expect(mediaPart(css)).not.toContain('480px')
  })

  it('keeps brand overrides as references rather than resolving them', () => {
    const css = run(transform, build({
      brandBps: { mobile: { dimensions: { general: { xl: { $type: 'dimension', $value: '{tokens.sizes.2x}' } } } } },
    }))
    expect(mediaPart(css)).toContain('--recursica_brand_dimensions_general_xl: var(--recursica_tokens_sizes_2x);')
  })

  it('merges token and brand overrides into one block per breakpoint', () => {
    const css = run(transform, build({
      tokenBps: { mobile: { font: { sizes: { '6xl': px(40) } } } },
      brandBps: { mobile: { dimensions: { general: { xl: { $type: 'dimension', $value: '{tokens.sizes.2x}' } } } } },
    }))
    expect((mediaPart(css).match(/@media/g) || []).length).toBe(1)
    expect(mediaPart(css)).toContain('--recursica_tokens_font_sizes_6xl')
    expect(mediaPart(css)).toContain('--recursica_brand_dimensions_general_xl')
  })

  it('orders blocks widest first so the narrowest match wins', () => {
    const css = run(transform, build({
      tokenBps: {
        mobile: { font: { sizes: { '6xl': px(40) } } },
        tablet: { font: { sizes: { '6xl': px(52) } } },
      },
    }))
    const media = mediaPart(css)
    // both match at 400px; the later block is the one that applies, so mobile must come last
    expect(media.indexOf('max-width: 810px')).toBeLessThan(media.indexOf('max-width: 480px'))
  })

  it('reports a breakpoint that has no condition and no grid to derive one from', () => {
    expect(() => run(transform, build({
      tokenBps: { watch: { font: { sizes: { '6xl': px(24) } } } },
    }))).toThrow(/breakpoints\.watch|no condition/i)
  })
  it('re-declares the same typography var the base declares, so a type override actually lands', () => {
    // The page stores per-breakpoint type as brand.breakpoints.<bp>.typography.<style>.<camelProp>,
    // matching the sub-keys of the base composite — that is the whole reason it works.
    const css = run(transform, build({
      brandBps: {
        mobile: { typography: { h1: { fontSize: { $type: 'dimension', $value: '{tokens.font.sizes.4xl}' } } } },
      },
    }))
    expect(basePart(css)).toContain('--recursica_brand_typography_h1_fontSize:')
    expect(mediaPart(css)).toContain('--recursica_brand_typography_h1_fontSize: var(--recursica_tokens_font_sizes_4xl);')
    expect((mediaPart(css).match(/--recursica_/g) || []).length).toBe(2) // the declaration and its reference
  })
  it('combines both bounds into one query when a breakpoint declares a range', () => {
    const input = build({ tokenBps: { tablet: { font: { sizes: { '6xl': px(40) } } } } })
    input.brand.brand['layout-grids'].tablet['min-width'] = { $type: 'number', $value: 481 }
    const css = run(transform, input)
    expect(mediaPart(css)).toContain('@media (min-width: 481px) and (max-width: 810px)')
  })

  it('derives a min-width-only query for a breakpoint with no ceiling', () => {
    const input = build({ tokenBps: { giant: { font: { sizes: { '6xl': px(80) } } } } })
    input.brand.brand['layout-grids'].giant = { 'min-width': { $type: 'number', $value: 1600 } }
    const css = run(transform, input)
    expect(mediaPart(css)).toContain('@media (min-width: 1600px)')
    expect(mediaPart(css)).not.toContain('max-width')
  })
})
