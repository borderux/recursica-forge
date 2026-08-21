/**
 * Popover — common types
 *
 * Single source of truth for the Popover prop vocabulary, shared by the dispatcher
 * (`adapters/Popover.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Popover`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type PopoverProps = {
    children?: React.ReactNode
    content?: React.ReactNode
    isOpen?: boolean
    onClose?: () => void
    layer?: ComponentLayer
    elevation?: string
    className?: string
    style?: React.CSSProperties
    withBeak?: boolean
    position?: 'top' | 'right' | 'bottom' | 'left'
    zIndex?: number
} & LibrarySpecificProps
