/**
 * Stepper Component Adapter
 *
 * Unified Stepper component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { StepperStepData, StepperProps } from './common/Stepper'

// Re-exported so existing `import type { StepperStepData, StepperProps } from
// '.../adapters/Stepper'` call sites keep working — the types now live in common/Stepper.ts.
export type { StepperStepData, StepperProps } from './common/Stepper'

export function Stepper({
    active,
    onStepClick,
    orientation = 'horizontal',
    size = 'large',
    layer,
    children,
    steps,
    className,
    style,
    mantine,
    material,
    carbon,
}: StepperProps) {
    const Component = useComponent('Stepper')

    const libraryProps = {
        active,
        onStepClick,
        orientation,
        size,
        layer,
        steps,
        className,
        style,
        mantine,
        material,
        carbon,
    }

    return (
        <Suspense fallback={<span />}>
            <Component {...libraryProps}>{children}</Component>
        </Suspense>
    )
}
