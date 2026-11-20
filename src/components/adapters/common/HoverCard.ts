/**
 * HoverCard — common types
 *
 * Single source of truth for the HoverCard prop vocabulary, shared by the dispatcher
 * (`adapters/HoverCard.tsx`) and the per-library wrapper (`adapters/mantine/HoverCard`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type HoverCardProps = {
    children?: React.ReactNode
    content?: React.ReactNode
    isOpen?: boolean
    layer?: ComponentLayer
    elevation?: string
    className?: string
    style?: React.CSSProperties
    withBeak?: boolean
    position?: 'top' | 'right' | 'bottom' | 'left'
    zIndex?: number
} & LibrarySpecificProps
