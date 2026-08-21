/**
 * ReadOnlyField — common types
 *
 * Single source of truth for the ReadOnlyField prop vocabulary, shared by the dispatcher
 * (`adapters/ReadOnlyField.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/ReadOnlyField`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type ReadOnlyFieldProps = {
    value?: string | number
    label?: string
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
} & LibrarySpecificProps
