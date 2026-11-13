/**
 * MenuItem Component Adapter
 *
 * Thin dispatcher: renders the local adapter's MenuItem, or the real adapter's via
 * useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { MenuItemProps } from './common/MenuItem'
import { isLocalAdapter } from '../registry/activeAdapter'
import { MenuItem as LocalMenuItem } from './local/dispatch/MenuItem'

// Re-exported so existing `import type { MenuItemProps } from '.../adapters/MenuItem'`
// call sites keep working — the types now live in common/MenuItem.ts.
export type { MenuItemProps } from './common/MenuItem'

function SharedMenuItem(props: MenuItemProps) {
  const Component = useComponent('MenuItem')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const MenuItem = (isLocalAdapter ? LocalMenuItem : SharedMenuItem) as typeof SharedMenuItem
