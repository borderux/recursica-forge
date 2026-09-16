/**
 * Layer expansion for the ui-kit.
 *
 * Almost every component property holds the same value on all four layers, so writing it out four
 * times is most of the ui-kit file for no information. The short form writes `layer-0` in full and
 * lets the layers above it carry only what they do differently:
 *
 *   "colors": {
 *     "layers": {
 *       "layer-0": { "text-color": { "$value": "{brand.layers.layer-0.elements.interactive.color}" } },
 *       "layer-3": { "border-color": { "$value": "{brand.layers.layer-3.properties.border-color}" } }
 *     }
 *   }
 *
 * Every reference is a real token path, correct as written for the layer it sits in. Expanding
 * `layer-0` into the layers above shifts its layer references by the same distance, because a
 * layer reference inside a layer block is relative to that block:
 *
 *   `{brand.layers.layer-0.…}` in the layer-0 block  → layer-2 gets `{brand.layers.layer-2.…}`
 *   `{brand.layers.layer-1.…}` in the layer-0 block  → layer-2 gets `{brand.layers.layer-3.…}`
 *
 * The second is how a card sits one layer proud of the surface behind it. Shifts stop at the top
 * layer, since there is nothing above it. An override block is only ever used at its own layer, so
 * nothing there is shifted.
 *
 * Expansion happens on load, before anything else looks at the ui-kit, so the store, the adapters
 * and the validators all see the same four-layer structure they always have.
 */

export const LAYERS = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
export type LayerName = (typeof LAYERS)[number]

/** The layer every other layer inherits from. */
export const BASE_LAYER: LayerName = 'layer-0'

/** The key marking a block of layers in the short form. */
export const LAYERS_KEY = 'layers'

const LAYER_KEY = /^layer-(\d+)$/
const LAYER_REF = /layers\.layer-(\d+)/g
const TOP_LAYER = LAYERS.length - 1

const layerNumber = (layer: string): number => Number(LAYER_KEY.exec(layer)?.[1] ?? 0)
const clone = <T,>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)))

/**
 * Moves every layer reference in a value by `distance` layers, stopping at the top layer.
 * A distance of 0 leaves the value alone.
 */
export function shiftLayerRefs<T>(value: T, distance: number): T {
  if (distance === 0) return value
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      return v.replace(LAYER_REF, (_m, n) => `layers.layer-${Math.min(Number(n) + distance, TOP_LAYER)}`)
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, inner] of Object.entries(v)) out[k] = walk(inner)
      return out
    }
    return v
  }
  return walk(value) as T
}

/** The layer blocks inside a `layers` key, or null when this node does not hold any. */
function layerBlocks(node: any): Record<string, any> | null {
  const blocks = node?.[LAYERS_KEY]
  if (!blocks || typeof blocks !== 'object' || Array.isArray(blocks)) return null
  const keys = Object.keys(blocks).filter((k) => !k.startsWith('$'))
  if (keys.length === 0 || !keys.every((k) => LAYER_KEY.test(k))) return null
  return blocks
}

/**
 * Expands every `layers` block into the full four-layer form: each layer starts from `layer-0`,
 * with its layer references shifted to match, then applies its own properties over that.
 */
export function expandLayers<T>(uikit: T): T {
  const walk = (node: any): any => {
    if (Array.isArray(node)) return node.map(walk)
    if (!node || typeof node !== 'object') return node

    const blocks = layerBlocks(node)
    if (blocks) {
      const out: Record<string, unknown> = {}
      // Anything sitting beside the `layers` key stays where it is.
      for (const [key, value] of Object.entries(node)) {
        if (key !== LAYERS_KEY) out[key] = walk(value)
      }
      const base = blocks[BASE_LAYER]
      for (const layer of LAYERS) {
        const distance = layerNumber(layer) - layerNumber(BASE_LAYER)
        const merged: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(base ?? {})) merged[k] = shiftLayerRefs(clone(v), distance)
        // An override is written for the layer it applies to, so it is used as-is.
        for (const [k, v] of Object.entries(blocks[layer] ?? {})) merged[k] = clone(v)
        out[layer] = walk(merged)
      }
      return out
    }

    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) out[key] = walk(value)
    return out
  }
  return walk(uikit)
}

/**
 * Collapses a fully expanded layer group into a `layers` block: `layer-0` keeps everything, and
 * each layer above it keeps only the properties it could not inherit — that is, the ones whose
 * value is not layer-0's with its layer references shifted along.
 */
export function collapseLayers<T>(uikit: T): T {
  const walk = (node: any): any => {
    if (Array.isArray(node)) return node.map(walk)
    if (!node || typeof node !== 'object') return node

    const keys = Object.keys(node).filter((k) => !k.startsWith('$'))
    const isFullGroup = keys.length === LAYERS.length && LAYERS.every((l) => keys.includes(l))
    if (isFullGroup) {
      const base = node[BASE_LAYER] as Record<string, unknown>
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(node)) if (k.startsWith('$')) out[k] = v
      const blocks: Record<string, unknown> = { [BASE_LAYER]: walk(base) }

      LAYERS.forEach((layer, index) => {
        if (index === 0) return
        const overrides: Record<string, unknown> = {}
        for (const [prop, value] of Object.entries(node[layer] ?? {})) {
          const inherited = shiftLayerRefs(clone(base?.[prop]), index)
          if (JSON.stringify(value) === JSON.stringify(inherited)) continue
          overrides[prop] = value
        }
        if (Object.keys(overrides).length > 0) blocks[layer] = walk(overrides)
      })
      out[LAYERS_KEY] = blocks
      return out
    }

    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) out[key] = walk(value)
    return out
  }
  return walk(uikit)
}
