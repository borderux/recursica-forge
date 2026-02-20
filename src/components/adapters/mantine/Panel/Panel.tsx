/**
 * Mantine Panel Implementation
 * 
 * Uses Mantine's Paper component as the foundation. The Panel is an edge-attached
 * side panel that fills the full height of its container, with optional header,
 * footer, close button, and elevation.
 */

import { Paper, Box } from '@mantine/core'
import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from '../../Button'
import type { PanelProps as AdapterPanelProps } from '../../Panel'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Panel.css'

export default function Panel({
    children,
    title,
    footer,
    position = 'right',
    layer = 'layer-0',
    elevation,
    onClose,
    overlay = false,
    width,
    zIndex,
    className,
    style,
    mantine,
    ...props
}: AdapterPanelProps) {
    const { mode } = useThemeMode()

    // Build CSS variable names for colors
    const bgVar = getComponentLevelCssVar('Panel', `colors.${layer}.background`)
    const borderColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.border-color`)
    const titleColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.title`)
    const contentColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.content`)
    const dividerColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.divider-color`)
    const hfBgVar = getComponentLevelCssVar('Panel', `colors.${layer}.header-footer-background`)

    // Build CSS variable names for component-level props
    const borderRadiusVar = getComponentLevelCssVar('Panel', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Panel', 'border-size')
    const hfHPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-horizontal-padding')
    const hfVPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-vertical-padding')
    const contentHPaddingVar = getComponentLevelCssVar('Panel', 'content-horizontal-padding')
    const contentVPaddingVar = getComponentLevelCssVar('Panel', 'content-vertical-padding')
    const headerCloseGapVar = getComponentLevelCssVar('Panel', 'header-close-gap')
    const footerButtonGapVar = getComponentLevelCssVar('Panel', 'footer-button-gap')
    const dividerSizeVar = getComponentLevelCssVar('Panel', 'divider-size')
    const minWidthVar = getComponentLevelCssVar('Panel', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Panel', 'max-width')

    // Header style
    const headerStyleVar = getComponentLevelCssVar('Panel', 'header-style')

    // Elevation variable
    const internalElevationVar = getComponentLevelCssVar('Panel', 'elevation')

    // State to force re-renders when CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => {
            setTextVarsUpdate(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setTextVarsUpdate(prev => prev + 1)
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

    // Get elevation value (either from prop or from CSS variable)
    const activeElevation = elevation || parseElevationValue(readCssVar(internalElevationVar))
    const elevationBoxShadow = getElevationBoxShadow(mode, activeElevation)

    // Determine border and border-radius based on position
    const borderStyle = position === 'right'
        ? {
            borderLeft: `var(${borderSizeVar}) solid var(${borderColorVar})`,
            borderRadius: `var(${borderRadiusVar}) 0 0 var(${borderRadiusVar})`,
        }
        : {
            borderRight: `var(${borderSizeVar}) solid var(${borderColorVar})`,
            borderRadius: `0 var(${borderRadiusVar}) var(${borderRadiusVar}) 0`,
        }

    // Get header style value
    const headerStyleValue = readCssVar(headerStyleVar) || 'h3'

    // CSS custom properties for the component
    const panelStyles = {
        '--panel-bg': `var(${bgVar})`,
        '--panel-border-color': `var(${borderColorVar})`,
        '--panel-title-color': `var(${titleColorVar})`,
        '--panel-content-color': `var(${contentColorVar})`,
        '--panel-hf-bg': `var(${hfBgVar})`,
        '--panel-border-size': `var(${borderSizeVar})`,
        '--panel-hf-padding-x': `var(${hfHPaddingVar})`,
        '--panel-hf-padding-y': `var(${hfVPaddingVar})`,
        '--panel-content-padding-x': `var(${contentHPaddingVar})`,
        '--panel-content-padding-y': `var(${contentVPaddingVar})`,
        '--panel-header-close-gap': `var(${headerCloseGapVar})`,
        '--panel-footer-button-gap': `var(${footerButtonGapVar})`,
        '--panel-divider-color': `var(${dividerColorVar})`,
        '--panel-divider-size': `var(${dividerSizeVar})`,
        '--panel-min-width': `var(${minWidthVar})`,
        '--panel-max-width': `var(${maxWidthVar})`,
        '--panel-border-radius': `var(${borderRadiusVar})`,
        ...style,
    } as React.CSSProperties

    const panelContent = (
        <Paper
            className={`recursica-panel recursica-panel--${position} ${className || ''}`}
            shadow={undefined}
            radius={0}
            p={0}
            style={{
                ...panelStyles,
                ...borderStyle,
                background: 'var(--panel-bg)',
                boxShadow: elevationBoxShadow || 'none',
                display: 'flex',
                flexDirection: 'column',
                width: width || '100%',
                height: '100%',
                overflow: 'hidden',
            }}
            {...mantine}
            {...props}
        >
            {title && (
                <Box
                    className="recursica-panel-header"
                    style={{
                        padding: 'var(--panel-hf-padding-y) var(--panel-hf-padding-x)',
                        borderBottom: `var(--panel-divider-size) solid var(--panel-divider-color)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--panel-header-close-gap)',
                        flexShrink: 0,
                        background: 'var(--panel-hf-bg)',
                    }}
                >
                    <span style={{
                        color: 'var(--panel-title-color)',
                        fontFamily: `var(--recursica-brand-typography-${headerStyleValue}-font-family)`,
                        fontSize: `var(--recursica-brand-typography-${headerStyleValue}-font-size)`,
                        fontWeight: `var(--recursica-brand-typography-${headerStyleValue}-font-weight)`,
                        letterSpacing: `var(--recursica-brand-typography-${headerStyleValue}-letter-spacing)`,
                        lineHeight: `var(--recursica-brand-typography-${headerStyleValue}-line-height)`,
                        fontStyle: `var(--recursica-brand-typography-${headerStyleValue}-font-style)`,
                        textDecoration: 'none',
                        textTransform: `var(--recursica-brand-typography-${headerStyleValue}-text-transform)`,
                        flex: 1,
                        minWidth: 0,
                        overflow: 'clip',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingBottom: '0.15em',
                    } as any}>
                        {title}
                    </span>
                    {onClose && (
                        <Button
                            variant="text"
                            layer={layer}
                            onClick={onClose}
                            style={{
                                padding: 0,
                                minWidth: 0,
                                width: 24,
                                height: 24,
                                '--button-icon-size': '16px',
                                '--button-padding': '0px',
                                '--button-padding-x': '0px'
                            } as any}
                            icon={<X size={16} />}
                        />
                    )}
                </Box>
            )}
            <Box
                className="recursica-panel-body"
                style={{
                    color: 'var(--panel-content-color)',
                    padding: 'var(--panel-content-padding-y) var(--panel-content-padding-x)',
                    flex: 1,
                    overflowY: 'auto',
                }}
            >
                {children}
            </Box>
            {footer && (
                <Box
                    className="recursica-panel-footer"
                    style={{
                        padding: 'var(--panel-hf-padding-y) var(--panel-hf-padding-x)',
                        borderTop: `var(--panel-divider-size) solid var(--panel-divider-color)`,
                        flexShrink: 0,
                        background: 'var(--panel-hf-bg)',
                    }}
                >
                    {footer}
                </Box>
            )}
        </Paper>
    )

    if (overlay) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    [position]: 0,
                    width: width || 'auto',
                    zIndex: zIndex || 1000,
                    pointerEvents: 'auto',
                }}
            >
                {panelContent}
            </div>
        )
    }

    return panelContent
}
