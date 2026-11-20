/**
 * TimePicker Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TimePicker, or forwards props to the real adapter
 * via useComponent('TimePicker').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TimePickerProps } from './common/TimePicker'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TimePicker as LocalTimePicker } from './local/dispatch/TimePicker'

// Re-exported so existing `import type { TimePickerProps } from '.../adapters/TimePicker'`
// call sites keep working — the types now live in common/TimePicker.ts.
export type { TimePickerProps } from './common/TimePicker'

function SharedTimePicker(props: TimePickerProps) {
  const Component = useComponent('TimePicker')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TimePicker = (isLocalAdapter ? LocalTimePicker : SharedTimePicker) as typeof SharedTimePicker
