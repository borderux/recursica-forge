/**
 * FileUpload — common types
 *
 * Single source of truth for the FileUpload prop vocabulary, shared by the dispatcher
 * (`adapters/FileUpload.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/FileUpload`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type FileUploadItem = {
    id: string
    name: string
    size?: number
    type?: string
    status?: 'success' | 'error' | 'uploading'
}

export type FileUploadProps = {
    files?: FileUploadItem[]
    onUpload?: (files: File[]) => void
    onRemove?: (fileId: string) => void
    label?: string
    helpText?: string
    errorText?: string
    layout?: string  // accepts custom layout variant names
    state?: string  // accepts custom state variant names
    layer?: ComponentLayer
    multiple?: boolean
    accept?: string
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Same vocabulary as `FileUploadProps`, plus the ids the
 * dispatcher generates once for its label/help/error triad. The real adapter wires its own
 * aria relationships and has no slot for a caller-supplied id, so every wrapper drops these.
 */
export type FileUploadAdapterProps = FileUploadProps & {
    labelId?: string
    helpId?: string
    errorId?: string
}
