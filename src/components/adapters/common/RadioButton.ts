/**
 * RadioButton — common types
 *
 * Single source of truth for the RadioButton prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButton.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/RadioButton`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type RadioButtonProps = {
    selected: boolean
    onChange: (selected: boolean) => void
    disabled?: boolean
    label?: React.ReactNode
    value?: string
    layer?: ComponentLayer
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
