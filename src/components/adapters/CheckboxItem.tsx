/**
 * CheckboxItem Component Adapter
 * 
 * CheckboxItem represents a Checkbox with a label, configured in the Forge.
 * It wraps the platform-specific implementation.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxItemProps } from './common/CheckboxItem'

// Re-exported so existing `import type { CheckboxItemProps } from '.../adapters/CheckboxItem'`
// call sites keep working — the types now live in common/CheckboxItem.ts.
export type { CheckboxItemProps } from './common/CheckboxItem'

export function CheckboxItem(props: CheckboxItemProps) {
  const Component = useComponent('CheckboxItem')

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}
