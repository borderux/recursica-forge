/**
 * Material UI Card Implementation
 * 
 * Uses MUI's Card component as the foundation.
 * Container appearance comes from UIKit per-layer CSS vars, which reference
 * brand layer props by default but can be overridden per layer via the toolbar.
 */

import { Card as MuiCard, CardHeader, CardContent, CardActions, Divider } from '@mui/material'
import { useState, useEffect } from 'react'
import type { CardProps as AdapterCardProps } from '../../Card'
import { getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Card.css'

export default function Card({
    children,
    title,
    footer,
    layer = 'layer-0',
    cardLayer,
    elevationBoxShadow,
    withBorder = true,
    withDividers = true,
    className,
    style,
    material,
    ...props
}: AdapterCardProps) {
    const { mode } = useThemeMode()

    // UIKit per-layer CSS vars (reference brand layer props by default, overridable)
    const bgVar = getComponentLevelCssVar('Card', `colors.${layer}.background`)
    const headerBgVar = getComponentLevelCssVar('Card', `colors.${layer}.header-background`)
    const footerBgVar = getComponentLevelCssVar('Card', `colors.${layer}.footer-background`)
    const borderColorVar = getComponentLevelCssVar('Card', `colors.${layer}.border-color`)
    const dividerColorVar = getComponentLevelCssVar('Card', `colors.${layer}.divider-color`)
    const titleColorVar = getComponentLevelCssVar('Card', `colors.${layer}.title`)
    const contentColorVar = getComponentLevelCssVar('Card', `colors.${layer}.content`)
    const borderSizeVar = getComponentLevelCssVar('Card', `borders.${layer}.border-size`)
    const borderRadiusVar = getComponentLevelCssVar('Card', `borders.${layer}.border-radius`)

    // UIKit component-specific properties (internal layout)
    const paddingVar = getComponentLevelCssVar('Card', 'padding')
    const headerPaddingVar = getComponentLevelCssVar('Card', 'header-padding')
    const footerPaddingVar = getComponentLevelCssVar('Card', 'footer-padding')
    const sectionGapVar = getComponentLevelCssVar('Card', 'section-gap')
    const verticalGutterVar = getComponentLevelCssVar('Card', 'vertical-gutter')
    const dividerSizeVar = getComponentLevelCssVar('Card', 'divider-size')
    const minWidthVar = getComponentLevelCssVar('Card', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Card', 'max-width')
    const headerStyleVar = getComponentLevelCssVar('Card', 'header-style')

    // State to force re-renders when CSS variables change
    const [, setUpdateCounter] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateCounter(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setUpdateCounter(prev => prev + 1)
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

    const headerStyleValue = readCssVar(headerStyleVar) || 'h3'

    const cardStyles = {
        '--card-bg': `var(${bgVar})`,
        '--card-header-bg': `var(${headerBgVar})`,
        '--card-footer-bg': `var(${footerBgVar})`,
        '--card-border-color': `var(${borderColorVar})`,
        '--card-divider-color': `var(${dividerColorVar})`,
        '--card-title-color': `var(${titleColorVar})`,
        '--card-content-color': `var(${contentColorVar})`,
        '--card-border-size': `var(${borderSizeVar})`,
        '--card-border-radius': `var(${borderRadiusVar})`,
        '--card-padding': `var(${paddingVar})`,
        '--card-header-padding': `var(${headerPaddingVar})`,
        '--card-footer-padding': `var(${footerPaddingVar})`,
        '--card-section-gap': `var(${sectionGapVar})`,
        '--card-vertical-gutter': `var(${verticalGutterVar})`,
        '--card-divider-size': `var(${dividerSizeVar})`,
        '--card-min-width': `var(${minWidthVar})`,
        '--card-max-width': `var(${maxWidthVar})`,
        ...style,
    } as React.CSSProperties

    return (
        <MuiCard
            className={`recursica-card ${className || ''}`}
            elevation={0}
            sx={{
                ...cardStyles,
                background: 'var(--card-bg)',
                border: withBorder ? 'var(--card-border-size) solid var(--card-border-color)' : 'none',
                borderRadius: 'var(--card-border-radius)',
                boxShadow: elevationBoxShadow || 'none',
                color: 'var(--card-content-color)',
                minWidth: 'var(--card-min-width)',
                maxWidth: 'var(--card-max-width)',
                overflow: 'hidden',
            }}
            {...material}
            {...props}
        >
            {title && (
                <>
                    <CardHeader
                        className="recursica-card-header"
                        title={
                            <span style={{
                                color: 'var(--card-title-color)',
                                fontFamily: `var(--recursica-brand-typography-${headerStyleValue}-font-family)`,
                                fontSize: `var(--recursica-brand-typography-${headerStyleValue}-font-size)`,
                                fontWeight: `var(--recursica-brand-typography-${headerStyleValue}-font-weight)`,
                                letterSpacing: `var(--recursica-brand-typography-${headerStyleValue}-letter-spacing)`,
                                lineHeight: `var(--recursica-brand-typography-${headerStyleValue}-line-height)`,
                            }}>
                                {title}
                            </span>
                        }
                        sx={{
                            background: 'var(--card-header-bg)',
                            padding: 'var(--card-header-padding)',
                        }}
                    />
                    {withDividers && (
                        <Divider sx={{
                            borderColor: 'var(--card-divider-color)',
                            borderBottomWidth: 'var(--card-divider-size)',
                        }} />
                    )}
                </>
            )}

            <CardContent
                className="recursica-card-body"
                sx={{
                    color: 'var(--card-content-color)',
                    padding: 'var(--card-padding) !important',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--card-section-gap)',
                }}
            >
                {children}
            </CardContent>

            {footer && (
                <>
                    {withDividers && (
                        <Divider sx={{
                            borderColor: 'var(--card-divider-color)',
                            borderBottomWidth: 'var(--card-divider-size)',
                        }} />
                    )}
                    <CardActions
                        className="recursica-card-footer"
                        sx={{
                            background: 'var(--card-footer-bg)',
                            padding: 'var(--card-footer-padding)',
                        }}
                    >
                        {footer}
                    </CardActions>
                </>
            )}
        </MuiCard>
    )
}
