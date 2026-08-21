/**
 * Dropdown — common types
 *
 * Single source of truth for the Dropdown prop vocabulary, shared by the dispatcher
 * (`adapters/Dropdown.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Dropdown`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type DropdownItem = {
    value: string
    label?: React.ReactNode
    disabled?: boolean
    icon?: React.ReactNode
    leadingIcon?: React.ReactNode
    leadingIconType?: 'none' | 'icon' | 'radio' | 'checkbox'
    trailingIcon?: React.ReactNode
    supportingText?: string
    divider?: 'none' | 'bottom'
}

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type DropdownProps = {
    items: DropdownItem[]
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    minWidth?: number
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    maxHeight?: number
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
    zIndex?: number
    disabled?: boolean
    editIcon?: React.ReactNode
    onEditIconClick?: (e: React.MouseEvent) => void
    editIconTitle?: string
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Same vocabulary as `DropdownProps`, plus the ids the
 * dispatcher generates once (so a label/help/error triad shares one accessible relationship
 * regardless of which library renders it) and the resolved controlled `value`.
 */
export type DropdownAdapterProps = DropdownProps & {
    labelId?: string
    helpId?: string
    errorId?: string
}
