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
    /**
     * Corrected (2026-08) from a `ChangeEvent`-based signature to match what the real
     * Mantine adapter actually delivers (`onChange?: (value: number | string) => void`) —
     * the old declared type never matched what came through this path; Mantine's wrapper had
     * to build a synthetic event just to satisfy it. Material/Carbon's native `<input>` still
     * fires a real event internally; their wrappers adapt it to this same value-based shape.
     */
    onChange?: (value: number | string) => void
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
    /**
     * Narrowed (2026-08) to document the two values the real adapter actually
     * recognizes ('stacked'/'side-by-side' — anything else silently falls back to
     * 'stacked'), while still allowing custom strings through for other CSS-variable
     * lookup uses elsewhere in the app.
     */
    layout?: 'stacked' | 'side-by-side' | (string & {})
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
