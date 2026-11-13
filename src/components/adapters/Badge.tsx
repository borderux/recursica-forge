/**
 * Badge Component Adapter
 * 
 * Unified Badge component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BadgeProps } from './common/Badge'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Badge as LocalBadge } from './local/dispatch/Badge'

// Re-exported so existing `import type { BadgeProps } from '.../adapters/Badge'`
// call sites keep working — the types now live in common/Badge.ts.
export type { BadgeProps } from './common/Badge'

function SharedBadge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
}: BadgeProps) {
  const Component = useComponent('Badge')

  return (
    <Suspense fallback={<span />}>
      <Component
        variant={variant}
        size={size}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
      >
        {children}
      </Component>
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Badge = (isLocalAdapter ? LocalBadge : SharedBadge) as typeof SharedBadge
