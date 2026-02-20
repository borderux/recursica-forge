/**
 * Panel Component Adapter
 * 
 * Unified Panel component that renders the appropriate library implementation
 * based on the current UI kit selection. A Panel is an edge-attached side panel
 * that fills the full height of its container, with optional header, footer,
 * close button, and elevation.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type PanelPosition = 'left' | 'right'

export type PanelProps = {
    children?: React.ReactNode
    title?: React.ReactNode
    footer?: React.ReactNode
    position?: PanelPosition
    isOpen?: boolean
    onClose?: () => void
    layer?: ComponentLayer
    elevation?: string
    className?: string
    style?: React.CSSProperties
    /** When true, renders as a fixed overlay panel (full viewport height) */
    overlay?: boolean
    /** Custom width for the panel (e.g., '320px') */
    width?: string
    /** z-index for overlay panels */
    zIndex?: number
} & LibrarySpecificProps

export function Panel({
    children,
    title,
    footer,
    position = 'right',
    isOpen,
    onClose,
    layer = 'layer-0',
    elevation,
    className,
    style,
    overlay = false,
    width,
    zIndex,
    mantine,
    material,
    carbon,
}: PanelProps) {
    const Component = useComponent('Panel')
    const { mode } = useThemeMode()

    // Get elevation from CSS vars if not provided as props
    const elevationVar = getComponentLevelCssVar('Panel', 'elevation')

    // Reactively read elevation from CSS variable
    const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
        const value = readCssVar(elevationVar)
        return value ? parseElevationValue(value) : undefined
    })

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(elevationVar)

            if (shouldUpdateElevation) {
                const value = readCssVar(elevationVar)
                setElevationFromVar(value ? parseElevationValue(value) : undefined)
            }
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            const elevationValue = readCssVar(elevationVar)
            setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [elevationVar])

    const componentElevation = elevation ?? elevationFromVar ?? undefined

    if (!Component) {
        // Basic fallback if no library implementation is available
        return (
            <div
                className={className}
                style={getPanelFallbackStyles(layer, position, componentElevation, mode, style)}
            >
                {title && (
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        {title}
                    </div>
                )}
                <div style={{ flex: 1 }}>{children}</div>
                {footer && <div>{footer}</div>}
            </div>
        )
    }

    return (
        <Suspense fallback={<div className={className} style={style} />}>
            <Component
                title={title}
                footer={footer}
                children={children}
                position={position}
                isOpen={isOpen}
                onClose={onClose}
                layer={layer}
                elevation={componentElevation}
                overlay={overlay}
                width={width}
                zIndex={zIndex}
                className={className}
                style={style}
                mantine={mantine}
                material={material}
                carbon={carbon}
            />
        </Suspense>
    )
}

function getPanelFallbackStyles(
    layer: ComponentLayer,
    position: PanelPosition,
    elevation?: string,
    mode: 'light' | 'dark' = 'light',
    additionalStyle?: React.CSSProperties
): React.CSSProperties {
    const bgVar = getComponentCssVar('Panel', 'colors', 'background', layer)
    const borderColorVar = getComponentCssVar('Panel', 'colors', 'border-color', layer)
    const hfHPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-horizontal-padding')
    const hfVPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-vertical-padding')
    const maxWidthVar = getComponentLevelCssVar('Panel', 'max-width')

    const styles: React.CSSProperties = {
        backgroundColor: `var(${bgVar}, #fff)`,
        borderLeft: position === 'right' ? `1px solid var(${borderColorVar}, #e0e0e0)` : 'none',
        borderRight: position === 'left' ? `1px solid var(${borderColorVar}, #e0e0e0)` : 'none',
        padding: `var(${hfVPaddingVar}, 16px) var(${hfHPaddingVar}, 24px)`,
        maxWidth: `var(${maxWidthVar}, 400px)`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...additionalStyle,
    }

    const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
    if (elevationBoxShadow) {
        styles.boxShadow = elevationBoxShadow
    }

    return styles
}
