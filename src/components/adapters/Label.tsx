/**
 * Label Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Label, or the real adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LabelProps } from './common/Label'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Label as LocalLabel } from './local/dispatch/Label'

// Re-exported so existing `import type { LabelProps } from '.../adapters/Label'`
// call sites keep working — the types now live in common/Label.ts.
export type { LabelProps } from './common/Label'

function SharedLabel(props: LabelProps) {
  const Component = useComponent('Label')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Label = (isLocalAdapter ? LocalLabel : SharedLabel) as typeof SharedLabel
