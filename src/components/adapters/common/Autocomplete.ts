/**
 * Autocomplete — common types
 *
 * Single source of truth for the Autocomplete prop vocabulary, shared by the dispatcher
 * (`adapters/Autocomplete.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Autocomplete`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type AutocompleteItem = {
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

export type AutocompleteProps = {
    items: AutocompleteItem[]
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
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
    zIndex?: number
} & LibrarySpecificProps
