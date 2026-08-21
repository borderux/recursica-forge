/**
 * RadioButtonGroup — common types
 *
 * Single source of truth for the RadioButtonGroup prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButtonGroup.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/RadioButtonGroup`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type RadioButtonGroupProps = {
    children?: React.ReactNode
    label?: string
    description?: React.ReactNode
    helpText?: string
    errorText?: string
    required?: boolean
    optional?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
    orientation?: 'horizontal' | 'vertical'
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
