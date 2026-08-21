/**
 * Card — common types
 *
 * Single source of truth for the Card prop vocabulary, shared by the dispatcher
 * (`adapters/Card.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Card`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type CardProps = {
    children?: React.ReactNode
    title?: React.ReactNode
    footer?: React.ReactNode
    layer?: ComponentLayer
    /** The brand layer used for the card's container (one above the container layer) */
    cardLayer?: ComponentLayer
    /** Pre-computed box-shadow from the brand layer system (one layer above container) */
    elevationBoxShadow?: string
    className?: string
    style?: React.CSSProperties
    /** Whether to show a border around the card */
    withBorder?: boolean
    /** Whether the card has section dividers */
    withDividers?: boolean
} & LibrarySpecificProps
