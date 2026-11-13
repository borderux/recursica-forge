/**
 * Checkbox Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Checkbox, or forwards props to the real
 * adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxProps } from './common/Checkbox'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Checkbox as LocalCheckbox } from './local/dispatch/Checkbox'

// Re-exported so existing `import type { CheckboxProps } from '.../adapters/Checkbox'`
// call sites keep working — the types now live in common/Checkbox.ts.
export type { CheckboxProps } from './common/Checkbox'

function SharedCheckbox(props: CheckboxProps) {
  const Component = useComponent('Checkbox')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Checkbox = (isLocalAdapter ? LocalCheckbox : SharedCheckbox) as typeof SharedCheckbox
