/**
 * Timeline — common types
 *
 * Single source of truth for the Timeline prop vocabulary, shared by the dispatcher
 * (`adapters/Timeline.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Timeline`).
 */

import type { ReactNode } from 'react'
import type { LibrarySpecificProps } from '../../registry/types'

export type TimelineItemData = {
    title: string
    description?: string
    timestamp?: string
    bullet?: ReactNode
    lineVariant?: 'solid' | 'dashed' | 'dotted'
}

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TimelineProps = {
    active?: number
    align?: 'left' | 'right'
    layer?: string
    children?: ReactNode
    items?: TimelineItemData[]
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps
