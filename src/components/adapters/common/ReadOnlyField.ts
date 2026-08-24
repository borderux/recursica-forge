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
    /**
     * Narrowed (2026-08) to document the two values the real adapter actually
     * recognizes ('stacked'/'side-by-side' — anything else silently falls back to
     * 'stacked'), while still allowing custom strings through for other CSS-variable
     * lookup uses elsewhere in the app.
     */
    layout?: 'stacked' | 'side-by-side' | (string & {})
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
