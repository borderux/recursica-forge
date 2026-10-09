/**
 * CheckboxItem Component Adapter
 * 
 * CheckboxItem represents a Checkbox with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxItemProps } from './common/CheckboxItem'
import { isLocalAdapter } from '../registry/activeAdapter'
import { CheckboxItem as LocalCheckboxItem } from './local/dispatch/CheckboxItem'

// Re-exported so existing `import type { CheckboxItemProps } from '.../adapters/CheckboxItem'`
// call sites keep working — the types now live in common/CheckboxItem.ts.
export type { CheckboxItemProps } from './common/CheckboxItem'

function SharedCheckboxItem(props: CheckboxItemProps) {
  const Component = useComponent('CheckboxItem')

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const CheckboxItem = (isLocalAdapter ? LocalCheckboxItem : SharedCheckboxItem) as typeof SharedCheckboxItem
