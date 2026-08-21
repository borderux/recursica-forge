/**
 * Loader Component Adapter
 * 
 * Unified Loader component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Shows all three loader types (oval, bars, dots) side by side.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LoaderProps } from './common/Loader'

// Re-exported so existing `import type { LoaderProps } from '.../adapters/Loader'`
// call sites keep working — the types now live in common/Loader.ts.
export type { LoaderProps } from './common/Loader'

export function Loader({
    size = 'default',
    className,
    style,
    mantine,
    material,
    carbon,
}: LoaderProps) {
    const Component = useComponent('Loader')

    return (
        <Suspense fallback={<span />}>
            <Component
                size={size}
                className={className}
                style={style}
                mantine={mantine}
                material={material}
                carbon={carbon}
            />
        </Suspense>
    )
}
