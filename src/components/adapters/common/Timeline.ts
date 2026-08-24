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
    /**
     * Removed (2026-08): only a solid line is actually supported — styling comes from CSS,
     * not a runtime prop. Raw `@mantine/core`'s own `TimelineItem` does have an identically
     * shaped, real `lineVariant` prop, but the real adapter structurally removes it with no
     * escape hatch back, and no Material/Carbon Timeline implementation exists to weigh in.
     */
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
