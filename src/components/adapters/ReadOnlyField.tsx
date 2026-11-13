/**
 * ReadOnlyField Component Adapter
 *
 * Unified ReadOnlyField component that displays read-only text in a form-like structure.
 * Similar to TextField but without input functionality - just displays text.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ReadOnlyFieldProps } from './common/ReadOnlyField'
import { isLocalAdapter } from '../registry/activeAdapter'
import { ReadOnlyField as LocalReadOnlyField } from './local/dispatch/ReadOnlyField'

// Re-exported so existing `import type { ReadOnlyFieldProps } from '.../adapters/ReadOnlyField'`
// call sites keep working — the types now live in common/ReadOnlyField.ts.
export type { ReadOnlyFieldProps } from './common/ReadOnlyField'

function SharedReadOnlyField(props: ReadOnlyFieldProps) {
  const Component = useComponent('ReadOnlyField')

  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const ReadOnlyField = (isLocalAdapter ? LocalReadOnlyField : SharedReadOnlyField) as typeof SharedReadOnlyField
