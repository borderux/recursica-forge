/**
 * Stepper Component Adapter
 *
 * Unified Stepper component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { StepperProps } from './common/Stepper'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Stepper as LocalStepper } from './local/dispatch/Stepper'

// Re-exported so existing `import type { StepperStepData, StepperProps } from
// '.../adapters/Stepper'` call sites keep working — the types now live in common/Stepper.ts.
export type { StepperStepData, StepperProps } from './common/Stepper'

function SharedStepper(props: StepperProps) {
  const Component = useComponent('Stepper')

  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Stepper = (isLocalAdapter ? LocalStepper : SharedStepper) as typeof SharedStepper
