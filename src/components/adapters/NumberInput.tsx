/**
 * NumberInput Component Adapter
 *
 * Thin dispatcher: renders the local adapter's NumberInput, or the real adapter's via
 * useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { NumberInputProps } from './common/NumberInput'
import { isLocalAdapter } from '../registry/activeAdapter'
import { NumberInput as LocalNumberInput } from './local/dispatch/NumberInput'

// Re-exported so existing `import type { NumberInputProps } from '.../adapters/NumberInput'`
// call sites keep working — the types now live in common/NumberInput.ts.
export type { NumberInputProps } from './common/NumberInput'

function SharedNumberInput(props: NumberInputProps) {
  const Component = useComponent('NumberInput')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const NumberInput = (isLocalAdapter ? LocalNumberInput : SharedNumberInput) as typeof SharedNumberInput
