/**
 * CheckboxGroup — common types
 *
 * Single source of truth for the CheckboxGroup prop vocabulary, shared by the dispatcher
 * (`adapters/CheckboxGroup.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/CheckboxGroup`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type CheckboxGroupProps = {
    children?: React.ReactNode
    label?: string
    description?: React.ReactNode
    helpText?: string
    errorText?: string
    required?: boolean
    optional?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
    /**
     * The real `@recursica/mantine-adapter`'s own `RecursicaCheckboxGroupProps.row` field
     * (the intended destination for this) is confirmed dead code — declared but never
     * destructured or read by the real `CheckboxGroup.tsx`, so it falls into `...rest` and is
     * spread onto `Mantine.Checkbox.Group`, which has no `row` prop of its own either. Filed
     * as a bug upstream, see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md`.
     */
    orientation?: 'horizontal' | 'vertical'
    /**
     * Narrowed (2026-08) to document the two values the real adapter actually
     * recognizes ('stacked'/'side-by-side' — anything else silently falls back to
     * 'stacked'), while still allowing custom strings through for other CSS-variable
     * lookup uses elsewhere in the app.
     */
    layout?: 'stacked' | 'side-by-side' | (string & {})
    layer?: ComponentLayer
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
