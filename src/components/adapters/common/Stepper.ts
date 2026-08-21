/**
 * Stepper — common types
 *
 * Single source of truth for the Stepper prop vocabulary, shared by the dispatcher
 * (`adapters/Stepper.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Stepper`).
 */

import type { ReactNode } from 'react'
import type { LibrarySpecificProps } from '../../registry/types'

export type StepperStepData = {
    label: string
    description?: string
    icon?: ReactNode
    loading?: boolean
    allowStepSelect?: boolean
}

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
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
