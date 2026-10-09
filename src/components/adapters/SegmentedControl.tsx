/**
 * SegmentedControl Component Adapter
 *
 * Unified SegmentedControl component that renders the appropriate library implementation
 * based on the current UI kit selection. SegmentedControl has no shared interaction state to
 * normalize here — selection is already controlled/uncontrolled the same way `value`/
 * `defaultValue` always are — so this dispatcher just picks the implementation and forwards
 * props. Everything library-specific — translating `items` into whatever shape Mantine/
 * Material/Carbon actually render — lives in each library's own wrapper under
 * adapters/{mantine,material,carbon}/SegmentedControl.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SegmentedControlProps } from './common/SegmentedControl'
import { isLocalAdapter } from '../registry/activeAdapter'
import { SegmentedControl as LocalSegmentedControl } from './local/dispatch/SegmentedControl'

// Re-exported so existing `import type { SegmentedControlItem } from '.../adapters/SegmentedControl'`
// call sites keep working — the types now live in common/SegmentedControl.ts.
export type { SegmentedControlItem, SegmentedControlProps } from './common/SegmentedControl'

function SharedSegmentedControl(props: SegmentedControlProps) {
  const Component = useComponent('SegmentedControl')

  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const SegmentedControl = (isLocalAdapter ? LocalSegmentedControl : SharedSegmentedControl) as typeof SharedSegmentedControl
