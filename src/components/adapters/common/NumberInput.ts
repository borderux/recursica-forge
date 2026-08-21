/**
 * NumberInput — common types
 *
 * Single source of truth for the NumberInput prop vocabulary, shared by the dispatcher
 * (`adapters/NumberInput.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/NumberInput`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type NumberInputProps = {
    value?: string | number
    defaultValue?: string | number
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => void
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
    name?: string
    min?: number | string
    max?: number | string
    step?: number | string
    className?: string
    style?: React.CSSProperties
    autoFocus?: boolean
    readOnly?: boolean
    disableTopBottomMargin?: boolean
} & LibrarySpecificProps
