/**
 * TextField Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TextField, or forwards props to the real adapter
 * via useComponent('TextField').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TextFieldProps } from './common/TextField'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TextField as LocalTextField } from './local/dispatch/TextField'

// Re-exported so existing `import type { TextFieldProps } from '.../adapters/TextField'`
// call sites keep working — the types now live in common/TextField.ts.
export type { TextFieldProps } from './common/TextField'

function SharedTextField(props: TextFieldProps) {
  const Component = useComponent('TextField')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TextField = (isLocalAdapter ? LocalTextField : SharedTextField) as typeof SharedTextField
