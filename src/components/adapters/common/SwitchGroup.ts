/**
 * SwitchGroup — common types
 *
 * Single source of truth for the SwitchGroup prop vocabulary, shared by the dispatcher
 * (`adapters/SwitchGroup.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/SwitchGroup`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SwitchGroupProps = {
    children?: React.ReactNode
    label?: string
    helpText?: string
    errorText?: string
    required?: boolean
    optional?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
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
