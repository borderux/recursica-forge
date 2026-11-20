/**
 * LayerScope — carries a Recursica layer for CSS-variable resolution WITHOUT painting it.
 *
 * Forge and the adapter mean different things by "layer":
 *
 *   Forge's `layer` prop      → "resolve this component's tokens for layer N"
 *   the adapter's `<Layer>`   → "paint layer N's surface here"
 *
 * The adapter's Layer is a visual component: its root draws background-color, border-color,
 * border-width, border-radius, box-shadow and padding from --recursica_brand_layer_N_*. Using
 * it purely to scope tokens put a bordered, padded box around every control that asked for a
 * non-zero layer, and left an empty painted box wherever the wrapped component rendered
 * nothing.
 *
 * All the cascade actually needs is an element carrying data-recursica-layer, because the
 * scoped CSS selector is `[data-recursica-theme="…"] [data-recursica-layer="N"]` and custom
 * properties are inherited. `display: contents` gives exactly that: the attribute is present
 * so the variables are set and inherited by descendants, but the element generates no box, so
 * it cannot affect layout or paint anything.
 *
 * Use the adapter's `<Layer>` where a layer surface should genuinely be drawn; use this where
 * only token resolution is wanted.
 *
 * This exists because the adapter cannot currently express "scope tokens without painting":
 * `contentsOnly` suppresses the box but also drops `data-recursica-layer`. Recorded as gap 2.2
 * in docs/ADAPTER_CAPABILITY_GAPS.md — delete this in favour of `<Layer>` once it can.
 */

import type { ReactNode } from 'react'

export interface LayerScopeProps {
  /** Recursica layer (0–3) to resolve variables for. */
  layer: 0 | 1 | 2 | 3
  children?: ReactNode
}

export function LayerScope({ layer, children }: LayerScopeProps) {
  return (
    <div data-recursica-layer={layer} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}

export default LayerScope
