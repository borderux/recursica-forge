/**
 * A ui-kit property that reads the same on every layer is emitted once instead of once per
 * (mode, layer), and the layer blocks supply the layer-agnostic brand vars it points at. That is
 * only sound if the value a component ends up with is unchanged.
 *
 * So this resolves the variable chain the way a browser would — the theme+layer block, then the
 * theme block, then `:root` — and checks every ui-kit variable at every mode and layer.
 */

import { describe, it, expect } from 'vitest'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

type Blocks = {
  root: Map<string, string>
  theme: Map<string, Map<string, string>>
  layer: Map<string, Map<string, string>>
}

/** Splits the stylesheet into the blocks a browser would apply. */
function parse(css: string): Blocks {
  const root = new Map<string, string>()
  const theme = new Map<string, Map<string, string>>()
  const layer = new Map<string, Map<string, string>>()
  let current: Map<string, string> | null = null

  for (const line of css.split('\n')) {
    const text = line.trim()
    if (text.endsWith('{')) {
      const selector = text.slice(0, -1).trim()
      const themeAndLayer = /\[data-recursica-theme="(light|dark)"\][\s\S]*\[data-recursica-layer="(\d)"\]/.exec(selector)
      if (selector.startsWith(':root')) {
        current = root
      } else if (themeAndLayer) {
        const key = `${themeAndLayer[1]}+${themeAndLayer[2]}`
        if (!layer.has(key)) layer.set(key, new Map())
        current = layer.get(key)!
      } else {
        const themeOnly = /\[data-recursica-theme="(light|dark)"\]/.exec(selector)
        if (themeOnly && !/layer/.test(selector)) {
          if (!theme.has(themeOnly[1])) theme.set(themeOnly[1], new Map())
          current = theme.get(themeOnly[1])!
        } else {
          current = null
        }
      }
      continue
    }
    if (text === '}') { current = null; continue }
    const decl = /^(--[\w-]+)\s*:\s*(.+?);$/.exec(text)
    if (decl && current) current.set(decl[1], decl[2])
  }
  return { root, theme, layer }
}

/** What a variable resolves to for an element at this mode and layer. */
function resolve(name: string, blocks: Blocks, mode: string, lay: string, seen = new Set<string>()): string {
  if (seen.has(name)) return '<cycle>'
  seen.add(name)
  const raw = blocks.layer.get(`${mode}+${lay}`)?.get(name)
    ?? blocks.theme.get(mode)?.get(name)
    ?? blocks.root.get(name)
  if (raw == null) return '<missing>'
  const singleRef = /^var\((--[\w-]+)\)$/.exec(raw.trim())
  return singleRef ? resolve(singleRef[1], blocks, mode, lay, seen) : raw
}

describe('layer cascade', () => {
  const css = recursicaJsonTransform({
    tokens: clone(tokensJson), brand: clone(brandJson), uikit: clone(uikitJson),
  } as any)[0].contents
  const blocks = parse(css)

  /** The names components use, which never carry a mode or a layer. */
  const canonical = [...new Set([
    ...blocks.root.keys(),
    ...[...blocks.theme.values()].flatMap((m) => [...m.keys()]),
    ...[...blocks.layer.values()].flatMap((m) => [...m.keys()]),
  ])].filter((n) => n.startsWith('--recursica_ui-kit_') && !/_modes_(light|dark)_/.test(n))

  it('covers the whole ui-kit surface', () => {
    expect(canonical.length).toBeGreaterThan(400)
  })

  it.each(['light', 'dark'])('%s: every ui-kit variable has a value at every layer', (mode) => {
    const missing: string[] = []
    for (const lay of ['0', '1', '2', '3']) {
      for (const name of canonical) {
        if (resolve(name, blocks, mode, lay) === '<missing>') missing.push(`${name} @ layer ${lay}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('the properties that differ per layer still do', () => {
    // Toast's background is one of the few genuinely per-layer values: layer 0 uses a lighter
    // neutral than the layers above it. If the cascade work flattened it, this catches that.
    const toast = '--recursica_ui-kit_components_toast_variants_styles_default_properties_colors_background-color'
    const atLayer = ['0', '1', '2', '3'].map((l) => resolve(toast, blocks, 'dark', l))
    expect(atLayer[0]).not.toBe(atLayer[1])
    expect(atLayer[1]).toBe(atLayer[2])
  })

  it('a card sits one layer proud of the surface behind it', () => {
    const cardBg = '--recursica_ui-kit_components_card_properties_colors_background-color'
    const surface = (l: string) => resolve(`--recursica_brand_layer_${l}_properties_surface`, blocks, 'dark', l)
    // On layer 0 the card paints with layer 1's surface, not layer 0's.
    expect(resolve(cardBg, blocks, 'dark', '0')).toBe(surface('1'))
    expect(resolve(cardBg, blocks, 'dark', '1')).toBe(surface('2'))
  })

  it('is much smaller than writing every layer out', () => {
    const declarations = css.split('\n').filter((l) => /^\s*--recursica_/.test(l)).length
    // Was 10,438 when every layer-specific property was emitted per (mode, layer).
    expect(declarations).toBeLessThan(7000)
  })
})
