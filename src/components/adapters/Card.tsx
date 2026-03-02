/**
 * Card Component Adapter
 * 
 * Unified Card component that renders the appropriate library implementation
 * based on the current UI kit selection. A Card is a container component with
 * optional header (title), sections, footer, and elevation.
 * 
 * The card's container appearance defaults come from UIKit.json per-layer
 * properties which reference the brand layer system (one level above the
 * container layer). Users can override these per layer via the toolbar.
 * 
 * Uses Mantine's Card component (wrapper around Paper) which supports Card.Section
 * for edge-to-edge content areas.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar } from '../utils/cssVarNames'
import { getLayerElevationBoxShadow } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

/** The four layers available in the system */
const LAYERS: ComponentLayer[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

/** Given a container layer, return the next layer up (capped at layer-3) */
export function getCardElevationLayer(containerLayer: ComponentLayer): ComponentLayer {
    const idx = LAYERS.indexOf(containerLayer)
    return LAYERS[Math.min(idx + 1, LAYERS.length - 1)]
}

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

    // UIKit per-layer CSS vars (these reference brand layer props by default)
    const bgVar = getComponentLevelCssVar('Card', `colors.${layer}.background`)
    const borderColorVar = getComponentLevelCssVar('Card', `colors.${layer}.border-color`)
    const borderSizeVar = getComponentLevelCssVar('Card', `borders.${layer}.border-size`)
    const borderRadiusVar = getComponentLevelCssVar('Card', `borders.${layer}.border-radius`)
    const titleColorVar = getComponentLevelCssVar('Card', `colors.${layer}.title`)
    const contentColorVar = getComponentLevelCssVar('Card', `colors.${layer}.content`)

    if (!Component) {
        // Basic fallback — uses UIKit CSS vars (which ref brand layer by default)
        return (
            <div
                className={className}
                style={{
                    backgroundColor: `var(${bgVar}, #fff)`,
                    border: withBorder
                        ? `var(${borderSizeVar}, 1px) solid var(${borderColorVar}, #e0e0e0)`
                        : 'none',
                    borderRadius: `var(${borderRadiusVar}, 8px)`,
                    boxShadow: elevationBoxShadow || undefined,
                    color: `var(${contentColorVar})`,
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {title && (
                    <div style={{ fontWeight: 'bold', padding: '16px 16px 8px', color: `var(${titleColorVar})` }}>
                        {title}
                    </div>
                )}
                <div style={{ padding: '16px', color: `var(${contentColorVar})` }}>{children}</div>
                {footer && <div style={{ padding: '8px 16px 16px' }}>{footer}</div>}
            </div>
        )
    }

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
