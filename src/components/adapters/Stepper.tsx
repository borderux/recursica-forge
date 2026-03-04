/**
 * Stepper Component Adapter
 *
 * Unified Stepper component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, ReactNode } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LibrarySpecificProps } from '../registry/types'

export type StepperStepData = {
    label: string
    description?: string
    icon?: ReactNode
    loading?: boolean
    allowStepSelect?: boolean
}

export type StepperProps = {
    active: number
    onStepClick?: (step: number) => void
    orientation?: 'horizontal' | 'vertical'
    size?: 'large' | 'small'
    layer?: string
    children?: ReactNode
    steps?: StepperStepData[]
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

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

    if (!Component) {
        // Fallback to simple div if component not available
        return (
            <div className={className} style={style}>
                {children}
            </div>
        )
    }

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
