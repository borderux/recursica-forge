/**
 * Popover Component Adapter
 *
 * Unified Popover component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { PopoverProps } from './common/Popover'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Popover as LocalPopover } from './local/dispatch/Popover'

// Re-exported so existing `import type { PopoverProps } from '.../adapters/Popover'`
// call sites keep working — the types now live in common/Popover.ts.
export type { PopoverProps } from './common/Popover'

function SharedPopover({ layer = 'layer-1', ...props }: PopoverProps) {
  const Component = useComponent('Popover')

  // `layer` defaults to layer-1: useComponent turns it into a LayerScope wrapper.
  return (
    <Suspense fallback={<span />}>
      <Component {...props} layer={layer} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Popover = (isLocalAdapter ? LocalPopover : SharedPopover) as typeof SharedPopover
