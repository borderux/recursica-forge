/**
 * Timeline Component Adapter
 *
 * Unified Timeline component that renders the appropriate library implementation
 * based on the current UI kit selection. Display-only component for showing
 * events in chronological order.
 */

import { Suspense, ReactNode } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LibrarySpecificProps } from '../registry/types'

export type TimelineItemData = {
    title: string
    description?: string
    timestamp?: string
    bullet?: ReactNode
    lineVariant?: 'solid' | 'dashed' | 'dotted'
}

export type TimelineProps = {
    active?: number
    align?: 'left' | 'right'
    layer?: string
    children?: ReactNode
    items?: TimelineItemData[]
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function Timeline({
    active = 1,
    align = 'left',
    layer,
    children,
    items,
    className,
    style,
    mantine,
    material,
    carbon,
}: TimelineProps) {
    const Component = useComponent('Timeline')

    if (!Component) {
        // Fallback to simple div if component not available
        return (
            <div className={className} style={style}>
                {children}
            </div>
        )
    }

    const libraryProps = {
        active,
        align,
        layer,
        items,
        className,
        style,
        mantine,
        material,
        carbon,
    }

    return (
        <Suspense fallback={<span />}>
            <Component {...libraryProps}>{children}</Component>
        </Suspense>
    )
}
