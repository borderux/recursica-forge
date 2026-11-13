/**
 * Badge Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Badge, or forwards props to the real
 * adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BadgeProps } from './common/Badge'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Badge as LocalBadge } from './local/dispatch/Badge'

// Re-exported so existing `import type { BadgeProps } from '.../adapters/Badge'`
// call sites keep working — the types now live in common/Badge.ts.
export type { BadgeProps } from './common/Badge'

function SharedBadge(props: BadgeProps) {
  const Component = useComponent('Badge')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Badge = (isLocalAdapter ? LocalBadge : SharedBadge) as typeof SharedBadge
