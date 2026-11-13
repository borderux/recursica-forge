/**
 * Tooltip Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Tooltip, or forwards props to the real adapter
 * via useComponent('Tooltip').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TooltipProps } from './common/Tooltip'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Tooltip as LocalTooltip } from './local/dispatch/Tooltip'

// Re-exported so existing `import type { TooltipProps } from '.../adapters/Tooltip'`
// call sites keep working — the types now live in common/Tooltip.ts.
export type { TooltipProps } from './common/Tooltip'

function SharedTooltip(props: TooltipProps) {
  const Component = useComponent('Tooltip')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Tooltip = (isLocalAdapter ? LocalTooltip : SharedTooltip) as typeof SharedTooltip
