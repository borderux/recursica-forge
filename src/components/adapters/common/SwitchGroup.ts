/**
 * SwitchGroup — common types
 *
 * Single source of truth for the SwitchGroup prop vocabulary, shared by the dispatcher
 * (`adapters/SwitchGroup.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/SwitchGroup`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SwitchGroupProps = {
    children?: React.ReactNode
    label?: string
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
