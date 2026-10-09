/**
 * Layer expansion must be invisible. Everything downstream — the store, the adapters, the
 * validators, the exported CSS — sees the same four-layer structure it always did, so the only
 * thing that can change is the size of the source file.
 */

import { describe, it, expect } from 'vitest'
import { expandLayers, collapseLayers, shiftLayerRefs, LAYERS } from './expandLayers'
import uikitJson from '../../../recursica_ui-kit.json'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import { recursicaJsonTransform as scoped } from '../export/recursicaJsonTransformScoped'
import { recursicaJsonTransform as specific } from '../export/recursicaJsonTransformSpecific'
import { buildUIKitVars } from '../resolvers/uikit'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

describe('shiftLayerRefs', () => {
  it('moves a layer reference along by the distance', () => {
    expect(shiftLayerRefs('{brand.layers.layer-0.elements.text.color}', 2))
      .toBe('{brand.layers.layer-2.elements.text.color}')
  })

  it('keeps the gap when the reference already points above its own layer', () => {
    // A card reads the layer above it, so shifting it by one keeps it one ahead.
    expect(shiftLayerRefs('{brand.layers.layer-1.properties.surface}', 1))
      .toBe('{brand.layers.layer-2.properties.surface}')
  })

  it('stops at the top layer, because nothing sits above it', () => {
    expect(shiftLayerRefs('{brand.layers.layer-1.properties.surface}', 3))
      .toBe('{brand.layers.layer-3.properties.surface}')
  })

  it('leaves a value alone when there is nothing to shift', () => {
    expect(shiftLayerRefs('{brand.palettes.neutral.100.color.tone}', 2))
      .toBe('{brand.palettes.neutral.100.color.tone}')
    expect(shiftLayerRefs('{brand.layers.layer-2.properties.surface}', 0))
      .toBe('{brand.layers.layer-2.properties.surface}')
  })
})

describe('expandLayers', () => {
  it('gives every layer the shared value', () => {
    const out: any = expandLayers({
      colors: { layers: { 'layer-0': { 'text-color': { $type: 'color', $value: '#fff' } } } },
    })
    expect(Object.keys(out.colors)).toEqual([...LAYERS])
    for (const layer of LAYERS) {
      expect(out.colors[layer]['text-color']).toEqual({ $type: 'color', $value: '#fff' })
    }
  })

  it('lets one layer override a single property without repeating the rest', () => {
    const out: any = expandLayers({
      colors: {
        layers: {
          'layer-0': { 'text-color': { $value: 'a' }, 'border-color': { $value: null } },
          'layer-3': { 'border-color': { $value: 'b' } },
        },
      },
    })
    expect(out.colors['layer-1']['border-color'].$value).toBeNull()
    expect(out.colors['layer-3']['border-color'].$value).toBe('b')
    // the property it did not override still comes from layer-0
    expect(out.colors['layer-3']['text-color'].$value).toBe('a')
  })

  it('expands a group already written out per layer to exactly itself', () => {
    const full = {
      colors: {
        'layer-0': { 'text-color': { $value: '0' } },
        'layer-1': { 'text-color': { $value: '1' } },
        'layer-2': { 'text-color': { $value: '2' } },
        'layer-3': { 'text-color': { $value: '3' } },
      },
    }
    expect(expandLayers(clone(full))).toEqual(full)
  })

  it('does not share one object between layers', () => {
    const out: any = expandLayers({ colors: { layers: { 'layer-0': { c: { $value: 'x' } } } } })
    out.colors['layer-1'].c.$value = 'changed'
    expect(out.colors['layer-0'].c.$value).toBe('x')
  })
})

describe('round trip against the shipped ui-kit', () => {
  it('collapsing loses nothing: expand → collapse → expand lands in the same place', () => {
    // The file is converted a component at a time, so it holds both forms. Expanding first gives
    // the common ground both can be compared on.
    const expanded = expandLayers(clone(uikitJson))
    const roundTripped = expandLayers(collapseLayers(clone(expanded)))
    expect(roundTripped).toEqual(expanded)
  })

  it('actually makes the file smaller', () => {
    const expanded = expandLayers(clone(uikitJson))
    const collapsed = collapseLayers(clone(expanded))
    expect(JSON.stringify(collapsed).length).toBeLessThan(JSON.stringify(expanded).length * 0.75)
  })
})

describe('the collapsed file produces the same CSS as a fully written-out one', () => {
  const stable = (css: string) => css.replace(/^ \* Generated: .*$/m, ' * Generated: <time>')
  const render = (transform: any, uikit: unknown) =>
    stable(transform({ tokens: clone(tokensJson), brand: clone(brandJson), uikit } as any)[0].contents)

  it.each([['scoped', scoped], ['specific', specific]] as const)(
    '%s transform', (_name, transform) => {
      // Expanding, collapsing and expanding again lands on the same tree, so the CSS built from a
      // collapsed source matches the CSS built from a written-out one exactly.
      const expanded = expandLayers(clone(uikitJson))
      const viaCollapse = expandLayers(collapseLayers(clone(expanded)))
      expect(render(transform, viaCollapse)).toBe(render(transform, expanded))
    })
})

describe('the runtime vars the adapters read are unchanged', () => {
  // The exported CSS and the vars applied at runtime are built by different code, so the CSS
  // parity check above does not cover this path. Every layer-specific var must come out the same
  // whether the ui-kit was written in the short form or in full.
  it.each(['light', 'dark'] as const)('%s mode', (mode) => {
    const expanded = expandLayers(clone(uikitJson))
    const viaShortForm = expandLayers(collapseLayers(clone(expanded)))
    const brand = clone(brandJson)
    const tokens = clone(tokensJson)

    const was = buildUIKitVars(tokens, brand, expanded, mode)
    const now = buildUIKitVars(tokens, brand, viaShortForm, mode)

    const layerVars = Object.keys(was).filter((n) => /_layer-\d_/.test(n))
    expect(layerVars.length).toBeGreaterThan(500)
    expect(now).toEqual(was)
  })
})
