/**
 * TimePicker — common types
 *
 * Single source of truth for the TimePicker prop vocabulary, shared by the dispatcher
 * (`adapters/TimePicker.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/TimePicker`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TimePickerProps = {
    value?: string
    defaultValue?: string
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    name?: string
    className?: string
    style?: React.CSSProperties
    autoFocus?: boolean
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
    period?: 'AM' | 'PM'
    onPeriodChange?: (period: 'AM' | 'PM') => void
} & LibrarySpecificProps
