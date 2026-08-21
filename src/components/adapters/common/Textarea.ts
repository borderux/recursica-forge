/**
 * Textarea — common types
 *
 * Single source of truth for the Textarea prop vocabulary, shared by the dispatcher
 * (`adapters/Textarea.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Textarea`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TextareaProps = {
    value?: string
    defaultValue?: string
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLTextAreaElement>) => void
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
    autoFocus?: boolean
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
} & LibrarySpecificProps
