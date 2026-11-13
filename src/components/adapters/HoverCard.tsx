/**
 * HoverCard Component Adapter
 *
 * Thin dispatcher: renders the local adapter's HoverCard, or the real adapter's via
 * useComponent. Forge's defaults are kept for `layer` (layer-1, applied as a LayerScope by
 * useComponent) and `position` ('bottom'; the real adapter defaults to 'top').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { HoverCardProps } from './common/HoverCard'
import { isLocalAdapter } from '../registry/activeAdapter'
import { HoverCard as LocalHoverCard } from './local/dispatch/HoverCard'

// Re-exported so existing `import type { HoverCardProps } from '.../adapters/HoverCard'`
// call sites keep working — the types now live in common/HoverCard.ts.
export type { HoverCardProps } from './common/HoverCard'

function SharedHoverCard({ layer = 'layer-1', position = 'bottom', ...props }: HoverCardProps) {
  const Component = useComponent('HoverCard')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} layer={layer} position={position} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const HoverCard = (isLocalAdapter ? LocalHoverCard : SharedHoverCard) as typeof SharedHoverCard
