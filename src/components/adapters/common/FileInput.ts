/**
 * FileInput — common types
 *
 * Single source of truth for the FileInput prop vocabulary, shared by the dispatcher
 * (`adapters/FileInput.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/FileInput`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type FileInputProps = {
    value?: File | File[] | null
    defaultValue?: File | File[] | null
    onChange?: (files: File | File[] | null) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    multiple?: boolean
    accept?: string
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
    verticalPadding?: string | number
    iconSize?: string | number
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Same vocabulary as `FileInputProps`, plus the ids the
 * dispatcher generates once for its label/help/error triad. The real adapter wires its own
 * aria relationships and has no slot for a caller-supplied id, so every wrapper drops these.
 */
export type FileInputAdapterProps = FileInputProps & {
    labelId?: string
    helpId?: string
    errorId?: string
}
