/**
 * RadioButtonGroup — common types
 *
 * Single source of truth for the RadioButtonGroup prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButtonGroup.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/RadioButtonGroup`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type RadioButtonGroupProps = {
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
     * No `row` equivalent exists on the real adapter's Radio group type at all (unlike
     * Checkbox's group, which declares one, if dead — see common/CheckboxGroup.ts). Raw
     * Mantine's own `RadioGroup` has no orientation-like field either, so this isn't a
     * capability gap, just an internal inconsistency between the adapter's own group types.
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
