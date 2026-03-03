/**
 * Loader Component Adapter
 * 
 * Unified Loader component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Shows all three loader types (oval, bars, dots) side by side.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LibrarySpecificProps } from '../registry/types'

export type LoaderProps = {
    size?: 'small' | 'default' | 'large'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function Loader({
    size = 'default',
    className,
    style,
    mantine,
    material,
    carbon,
}: LoaderProps) {
    const Component = useComponent('Loader')

    if (!Component) {
        return null
    }

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
