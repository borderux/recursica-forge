/**
 * The ui-kit ships in the short layer form, so import and export both have to handle it.
 *
 * Import expands on the way into the store, because everything downstream — the resolvers, the
 * adapters, the validators — reads all four layers. Export collapses on the way out, so a file
 * that leaves the app has the same shape as the one that ships, instead of the four-times-larger
 * version the store keeps in memory.
 */

import { describe, it, expect } from 'vitest'
import { expandLayers, collapseLayers, LAYERS } from './expandLayers'
import { migrateImportedJson } from '../import/migrateImportedJson'
import { validateUIKitJson, validateReferences } from '../utils/validateJsonSchemas'
import uikitJson from '../../../recursica_ui-kit.json'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const asText = (v: unknown) => JSON.stringify(v)

/** A sample of properties that exercise each way a layer value can behave. */
const PROBES: Array<{ what: string; at: (uikit: any) => any }> = [
  {
    what: 'a value relative to its own layer',
    at: (u) => u.components.button.variants.styles.text.properties.colors,
  },
  {
    what: 'a value one layer above its own',
    at: (u) => u.components.card.properties.colors,
  },
  {
    what: 'a value that genuinely differs per layer',
    at: (u) => u.components.toast.variants.styles.default.properties.colors,
  },
]

describe('the shipped file', () => {
  it('is written in the short form', () => {
    expect(asText(uikitJson)).toContain('"layers"')
  })

  it('passes schema validation as written, without being expanded first', () => {
    expect(() => validateUIKitJson(clone(uikitJson) as any)).not.toThrow()
  })

  it('holds only real token paths — no placeholder standing in for a layer', () => {
    expect(asText(uikitJson)).not.toContain('layers.self')
  })

  it('passes reference validation, which expands it first', () => {
    const results = validateReferences(clone(brandJson) as any, clone(tokensJson) as any, clone(uikitJson) as any)
    expect(results.filter((r) => !r.valid)).toEqual([])
  })
})

describe('import', () => {
  it('survives migration with its short form intact', () => {
    const migrated: any = migrateImportedJson(clone(uikitJson) as any, 'uikit')
    const colors = migrated['ui-kit'].components.button.variants.styles.text.properties.colors
    expect(Object.keys(colors)).toEqual(['layers'])
  })

  it('expands to all four layers before it reaches the store', () => {
    const migrated: any = migrateImportedJson(clone(uikitJson) as any, 'uikit')
    const expanded: any = expandLayers(migrated)
    const colors = expanded['ui-kit'].components.button.variants.styles.text.properties.colors
    expect(Object.keys(colors).sort()).toEqual([...LAYERS])
    // and each layer reads its own layer's token
    expect(colors['layer-2']['text-color'].$value).toBe('{brand.layers.layer-2.elements.interactive.color}')
  })

  it('accepts a file that was written out in full, unchanged', () => {
    // Anything exported before this change, or hand-written the long way, still imports.
    const written = expandLayers(clone(uikitJson))
    expect(expandLayers(clone(written))).toEqual(written)
  })
})

describe('export', () => {
  it('writes the short form the store does not hold', () => {
    const inStore = expandLayers(clone(uikitJson))
    const exported = collapseLayers(clone(inStore))
    expect(asText(exported)).toContain('"layers"')
    expect(asText(exported).length).toBeLessThan(asText(inStore).length * 0.75)
  })

  it('round trips: what comes out goes back in unchanged', () => {
    const inStore = expandLayers(clone(uikitJson))
    const exported = collapseLayers(clone(inStore))
    expect(expandLayers(clone(exported))).toEqual(inStore)
  })

  it('is stable across repeated export → import cycles', () => {
    let file = clone(uikitJson)
    for (let i = 0; i < 3; i++) file = collapseLayers(expandLayers(clone(file)))
    expect(file).toEqual(clone(uikitJson))
  })
})

describe('every kind of layer value survives a round trip', () => {
  it.each(PROBES)('$what', ({ at }) => {
    const before = at(expandLayers(clone(uikitJson))['ui-kit'])
    const after = at(expandLayers(collapseLayers(expandLayers(clone(uikitJson))))['ui-kit'])
    expect(after).toEqual(before)
    // and it really does hold four distinct layer blocks
    expect(Object.keys(before).sort()).toEqual([...LAYERS])
  })
})
