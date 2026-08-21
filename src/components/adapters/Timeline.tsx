/**
 * Timeline Component Adapter
 *
 * Unified Timeline component that renders the appropriate library implementation
 * based on the current UI kit selection. Display-only component for showing
 * events in chronological order.
 */

import { Suspense, ReactNode } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TimelineItemData, TimelineProps } from './common/Timeline'

// Re-exported so existing `import type { TimelineItemData } from '.../adapters/Timeline'`
// call sites keep working — the types now live in common/Timeline.ts.
export type { TimelineItemData, TimelineProps } from './common/Timeline'

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
