/**
 * Switch Component Adapter
 *
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SwitchProps } from './common/Switch'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Switch as LocalSwitch } from './local/dispatch/Switch'

// Re-exported so existing `import type { SwitchProps } from '.../adapters/Switch'`
// call sites keep working — the types now live in common/Switch.ts.
export type { SwitchProps } from './common/Switch'

function SharedSwitch(props: SwitchProps) {
  const Component = useComponent('Switch')

  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Switch = (isLocalAdapter ? LocalSwitch : SharedSwitch) as typeof SharedSwitch
