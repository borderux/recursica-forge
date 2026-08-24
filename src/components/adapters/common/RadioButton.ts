/**
 * RadioButton — common types
 *
 * Single source of truth for the RadioButton prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButton.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/RadioButton`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type RadioButtonProps = {
    /**
     * Renamed from `selected` to `checked` (2026-08) to match raw `@mantine/core`'s and raw
     * `@mui/material`'s own native `Radio` prop name — both ecosystems already agreed on
     * `checked`; `selected` was Forge's own, unnecessary divergence. Matches `Checkbox`/
     * `Switch`, which already used `checked`.
     */
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    label?: React.ReactNode
    value?: string
    layer?: ComponentLayer
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
