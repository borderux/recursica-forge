/**
 * DatePicker Component Adapter
 *
 * Thin dispatcher: renders the local adapter's DatePicker, or forwards props to the real
 * adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { DatePickerProps } from './common/DatePicker'
import { isLocalAdapter } from '../registry/activeAdapter'
import { DatePicker as LocalDatePicker } from './local/dispatch/DatePicker'

// Re-exported so existing `import type { DatePickerProps } from '.../adapters/DatePicker'`
// call sites keep working — the types now live in common/DatePicker.ts.
export type { DatePickerProps } from './common/DatePicker'

function SharedDatePicker({ placeholder = 'MM / DD / YY', ...rest }: DatePickerProps) {
  const Component = useComponent('DatePicker')
  return (
    <Suspense fallback={<span />}>
      <Component {...rest} placeholder={placeholder} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const DatePicker = (isLocalAdapter ? LocalDatePicker : SharedDatePicker) as typeof SharedDatePicker
