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
    /**
     * Corrected (2026-08) from a `ChangeEvent`-based signature to match what the real
     * Mantine adapter actually delivers (`onChange?: (value: string) => void`) — the old
     * declared type never matched what came through this path; Mantine's wrapper had to
     * build a synthetic event just to satisfy it. Material/Carbon's native `<input>` still
     * fires a real event internally; their wrappers adapt it to this same value-based shape.
     */
    onChange?: (value: string) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
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
