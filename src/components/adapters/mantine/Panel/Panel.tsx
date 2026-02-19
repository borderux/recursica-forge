/**
 * Mantine Panel Implementation
 * 
 * Uses Mantine's Paper component as the foundation. The Panel is an edge-attached
 * side panel that fills the full height of its container, with optional header,
 * footer, close button, and elevation.
 */

import { Paper, Box } from '@mantine/core'
import { useState, useEffect } from 'react'
import type { PanelProps as AdapterPanelProps } from '../../Panel'
import { getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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

    // Build CSS variable names for component-level props
    const borderSizeVar = getComponentLevelCssVar('Panel', 'border-size')
    const horizontalPaddingVar = getComponentLevelCssVar('Panel', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Panel', 'vertical-padding')
    const headerContentGapVar = getComponentLevelCssVar('Panel', 'header-content-gap')
    const minWidthVar = getComponentLevelCssVar('Panel', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Panel', 'max-width')

    // Text properties for header
    const headerFontFamilyVar = getComponentTextCssVar('Panel', 'header-text', 'font-family')
    const headerFontSizeVar = getComponentTextCssVar('Panel', 'header-text', 'font-size')
    const headerFontWeightVar = getComponentTextCssVar('Panel', 'header-text', 'font-weight')
    const headerLetterSpacingVar = getComponentTextCssVar('Panel', 'header-text', 'letter-spacing')
    const headerLineHeightVar = getComponentTextCssVar('Panel', 'header-text', 'line-height')
    const headerFontStyleVar = getComponentTextCssVar('Panel', 'header-text', 'font-style')
    const headerTextDecorationVar = getComponentTextCssVar('Panel', 'header-text', 'text-decoration')
    const headerTextTransformVar = getComponentTextCssVar('Panel', 'header-text', 'text-transform')

    // Elevation variable
    const internalElevationVar = getComponentLevelCssVar('Panel', 'elevation')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    useEffect(() => {
        const textCssVars = [
            headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar,
            headerLetterSpacingVar, headerLineHeightVar, headerFontStyleVar,
            headerTextDecorationVar, headerTextTransformVar,
            internalElevationVar
        ]

        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdate = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))

            if (shouldUpdate) {
                setTextVarsUpdate(prev => prev + 1)
            }
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
    }, [headerFontFamilyVar, headerFontSizeVar, headerFontWeightVar, headerLetterSpacingVar, headerLineHeightVar, headerFontStyleVar, headerTextDecorationVar, headerTextTransformVar, internalElevationVar])

    // Get elevation value (either from prop or from CSS variable)
    const activeElevation = elevation || parseElevationValue(readCssVar(internalElevationVar))
    const elevationBoxShadow = getElevationBoxShadow(mode, activeElevation)

    // Determine border based on position
    const borderStyle = position === 'right'
        ? { borderLeft: `var(${borderSizeVar}) solid var(${borderColorVar})` }
        : { borderRight: `var(${borderSizeVar}) solid var(${borderColorVar})` }

    // CSS custom properties for the component
    const panelStyles = {
        '--panel-bg': `var(${bgVar})`,
        '--panel-border-color': `var(${borderColorVar})`,
        '--panel-title-color': `var(${titleColorVar})`,
        '--panel-content-color': `var(${contentColorVar})`,
        '--panel-border-size': `var(${borderSizeVar})`,
        '--panel-padding-x': `var(${horizontalPaddingVar})`,
        '--panel-padding-y': `var(${verticalPaddingVar})`,
        '--panel-header-content-gap': `var(${headerContentGapVar})`,
        '--panel-min-width': `var(${minWidthVar})`,
        '--panel-max-width': `var(${maxWidthVar})`,
        '--panel-header-font-family': `var(${headerFontFamilyVar})`,
        '--panel-header-font-size': `var(${headerFontSizeVar})`,
        '--panel-header-font-weight': `var(${headerFontWeightVar})`,
        '--panel-header-letter-spacing': `var(${headerLetterSpacingVar})`,
        '--panel-header-line-height': `var(${headerLineHeightVar})`,
        '--panel-header-font-style': `var(${headerFontStyleVar})`,
        '--panel-header-text-decoration': `var(${headerTextDecorationVar})`,
        '--panel-header-text-transform': `var(${headerTextTransformVar})`,
        ...style,
    } as React.CSSProperties

    return (
        <Paper
            className={`recursica-panel recursica-panel--${position} ${className || ''}`}
            shadow={undefined}
            radius={0}
            p={0}
            style={{
                ...panelStyles,
                backgroundColor: 'var(--panel-bg)',
                ...borderStyle,
                minWidth: 'var(--panel-min-width)',
                maxWidth: 'var(--panel-max-width)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: elevationBoxShadow || 'none',
            }}
            {...mantine}
            {...props}
        >
            {title && (
                <Box
                    className="recursica-panel-header"
                    style={{
                        padding: 'var(--panel-padding-y) var(--panel-padding-x)',
                        borderBottom: `var(--panel-border-size) solid var(--panel-border-color)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <span style={{
                        color: 'var(--panel-title-color)',
                        fontFamily: 'var(--panel-header-font-family)',
                        fontSize: 'var(--panel-header-font-size)',
                        fontWeight: 'var(--panel-header-font-weight)',
                        letterSpacing: 'var(--panel-header-letter-spacing)',
                        lineHeight: 'var(--panel-header-line-height)',
                        fontStyle: 'var(--panel-header-font-style)',
                        textDecoration: 'var(--panel-header-text-decoration)',
                        textTransform: 'var(--panel-header-text-transform)',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    } as any}>
                        {title}
                    </span>
                </Box>
            )}
            <Box
                className="recursica-panel-body"
                style={{
                    color: 'var(--panel-content-color)',
                    padding: 'var(--panel-padding-y) var(--panel-padding-x)',
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
                        padding: 'var(--panel-padding-y) var(--panel-padding-x)',
                        borderTop: `var(--panel-border-size) solid var(--panel-border-color)`,
                        flexShrink: 0,
                    }}
                >
                    {footer}
                </Box>
            )}
        </Paper>
    )
}
