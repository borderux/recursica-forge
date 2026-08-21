/**
 * Card Component Adapter
 * 
 * Unified Card component that renders the appropriate library implementation
 * based on the current UI kit selection. A Card is a container component with
 * optional header (title), sections, footer, and elevation.
 * 
 * The card's container appearance defaults come from recursica_ui-kit.json per-layer
 * properties which reference the brand layer system (one level above the
 * container layer). Users can override these per layer via the toolbar.
 * 
 * Uses Mantine's Card component (wrapper around Paper) which supports Card.Section
 * for edge-to-edge content areas.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getLayerElevationBoxShadow } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { ComponentLayer } from '../registry/types'
import type { CardProps } from './common/Card'

// Re-exported so existing `import type { CardProps } from '.../adapters/Card'`
// call sites keep working — the types now live in common/Card.ts.
export type { CardProps } from './common/Card'

/** The four layers available in the system */
const LAYERS: ComponentLayer[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

/** Given a container layer, return the next layer up (capped at layer-3) */
export function getCardElevationLayer(containerLayer: ComponentLayer): ComponentLayer {
    const idx = LAYERS.indexOf(containerLayer)
    return LAYERS[Math.min(idx + 1, LAYERS.length - 1)]
}

export function Card({
    children,
    title,
    footer,
    layer = 'layer-0',
    className,
    style,
    withBorder = true,
    withDividers = true,
    mantine,
    material,
    carbon,
}: CardProps) {
    const Component = useComponent('Card')
    const { mode } = useThemeMode()

    // State to force re-renders when CSS variables change
    const [layoutUpdateCounter, setLayoutUpdateCounter] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const handleCssVarUpdate = () => {
            setLayoutUpdateCounter(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setLayoutUpdateCounter(prev => prev + 1)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [])

    // Card uses the brand layer one level above its container
    const cardLayer = getCardElevationLayer(layer)
    const elevationBoxShadow = getLayerElevationBoxShadow(mode, cardLayer)

    return (
        <Suspense fallback={<div className={className} style={style} />}>
            <Component
                key={`${mode}-${layoutUpdateCounter}`}
                title={title}
                footer={footer}
                children={children}
                layer={layer}
                cardLayer={cardLayer}
                elevationBoxShadow={elevationBoxShadow}
                withBorder={withBorder}
                withDividers={withDividers}
                className={className}
                style={style}
                mantine={mantine}
                material={material}
                carbon={carbon}
            />
        </Suspense>
    )
}
