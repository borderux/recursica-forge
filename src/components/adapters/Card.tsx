/**
 * Card Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Card, or forwards props to the real
 * adapter's via useComponent. A Card is a container component with optional header
 * (title), body, and footer — composed in mantine/Card/Card.tsx.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer } from '../registry/types'
import type { CardProps } from './common/Card'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Card as LocalCard } from './local/dispatch/Card'

// Re-exported so existing `import type { CardProps } from '.../adapters/Card'`
// call sites keep working — the types now live in common/Card.ts.
export type { CardProps } from './common/Card'

/** The four layers available in the system */
const LAYERS: ComponentLayer[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

/** Given a container layer, return the next layer up (capped at layer-3). Used by CardPreview. */
export function getCardElevationLayer(containerLayer: ComponentLayer): ComponentLayer {
  const idx = LAYERS.indexOf(containerLayer)
  return LAYERS[Math.min(idx + 1, LAYERS.length - 1)]
}

function SharedCard(props: CardProps) {
  const Component = useComponent('Card')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Card = (isLocalAdapter ? LocalCard : SharedCard) as typeof SharedCard
