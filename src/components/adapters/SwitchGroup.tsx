/**
 * SwitchGroup Component Adapter
 *
 * Groups multiple SwitchItems together. Label, assistive text and layout are composed by
 * each library's own wrapper.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SwitchGroupProps } from './common/SwitchGroup'
import { isLocalAdapter } from '../registry/activeAdapter'
import { SwitchGroup as LocalSwitchGroup } from './local/dispatch/SwitchGroup'

// Re-exported so existing `import type { SwitchGroupProps } from '.../adapters/SwitchGroup'`
// call sites keep working — the types now live in common/SwitchGroup.ts.
export type { SwitchGroupProps } from './common/SwitchGroup'

function SharedSwitchGroup(props: SwitchGroupProps) {
  const Component = useComponent('SwitchGroup')

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const SwitchGroup = (isLocalAdapter ? LocalSwitchGroup : SharedSwitchGroup) as typeof SharedSwitchGroup
