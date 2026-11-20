/**
 * Menu Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Menu, or the real adapter's via useComponent.
 * No `maxHeight` default: the real Menu turns any `maxHeight` prop into an inline style that
 * would override its own `max-height` token (set from the toolbar).
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { MenuProps } from './common/Menu'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Menu as LocalMenu } from './local/dispatch/Menu'

// Re-exported so existing `import type { MenuProps } from '.../adapters/Menu'`
// call sites keep working — the types now live in common/Menu.ts.
export type { MenuProps } from './common/Menu'

function SharedMenu(props: MenuProps) {
  const Component = useComponent('Menu')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Menu = (isLocalAdapter ? LocalMenu : SharedMenu) as typeof SharedMenu
