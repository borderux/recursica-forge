/**
 * DatePicker — common types
 *
 * Single source of truth for the DatePicker prop vocabulary, shared by the dispatcher
 * (`adapters/DatePicker.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/DatePicker`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type DatePickerProps = {
    value?: Date | null
    defaultValue?: Date | null
    onChange?: (date: Date | null) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
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
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    dateFormat?: string // e.g., 'MM / DD / YY'
} & LibrarySpecificProps
