/**
 * CheckboxGroup Component Adapter
 *
 * Thin dispatcher: renders the local adapter's CheckboxGroup, or forwards props to the real
 * adapter's via useComponent. Groups multiple CheckboxItems together.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxGroupProps } from './common/CheckboxGroup'
import { isLocalAdapter } from '../registry/activeAdapter'
import { CheckboxGroup as LocalCheckboxGroup } from './local/dispatch/CheckboxGroup'

// Re-exported so existing `import type { CheckboxGroupProps } from '.../adapters/CheckboxGroup'`
// call sites keep working — the types now live in common/CheckboxGroup.ts.
export type { CheckboxGroupProps } from './common/CheckboxGroup'

function SharedCheckboxGroup(props: CheckboxGroupProps) {
  const Component = useComponent('CheckboxGroup')
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const CheckboxGroup = (isLocalAdapter ? LocalCheckboxGroup : SharedCheckboxGroup) as typeof SharedCheckboxGroup
