/**
 * Panel Component Adapter
 *
 * Unified Panel component that renders the appropriate library implementation based on the
 * current UI kit selection. A Panel is an edge-attached side panel that fills the full height
 * of its container, with optional header, footer, close button, and elevation.
 *
 * Panel has no shared interaction state to normalize here — visibility is driven directly by
 * `isOpen`/`onClose` — so this dispatcher just picks the implementation and forwards props.
 * Everything library-specific — Mantine's Panel being a Drawer with a composed `Panel.Footer`
 * child instead of a `footer` prop, for instance — lives in each library's own wrapper under
 * adapters/{mantine,material,carbon}/Panel.
 *
 * Panel is currently Mantine-only: Material and Carbon have no registered implementation, so
 * `useComponent` falls back to NoAdapterImplementation for those kits.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { PanelProps } from './common/Panel'

// Re-exported so existing `import type { PanelPosition } from '.../adapters/Panel'`
// call sites keep working — the types now live in common/Panel.ts.
export type { PanelPosition, PanelProps } from './common/Panel'

export function Panel(props: PanelProps) {
    const Component = useComponent('Panel')

    return (
        <Suspense fallback={<div className={props.className} style={props.style} />}>
            <Component {...props} />
        </Suspense>
    )
}
