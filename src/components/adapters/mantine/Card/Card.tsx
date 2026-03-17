/**
 * Mantine Card Implementation
 * 
 * Uses Mantine's Card component as the foundation. The Card is a container
 * with optional header (title), content sections with dividers, footer, and elevation.
 * Card.Section provides edge-to-edge content areas.
 * 
 * Container appearance (surface, border, text color, border-size, border-radius)
 * comes from UIKit per-layer CSS vars, which reference brand layer props by default
 * but can be overridden per layer via the toolbar.
 */

import { Card as MantineCard, Box } from '@mantine/core'
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
    mantine,
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

    // UIKit component-specific properties (internal layout, not per-layer)
    const paddingVar = getComponentLevelCssVar('Card', 'padding')
    const headerPaddingVar = getComponentLevelCssVar('Card', 'header-padding')
    const footerPaddingVar = getComponentLevelCssVar('Card', 'footer-padding')
    const sectionGapVar = getComponentLevelCssVar('Card', 'section-gap')
    const verticalGutterVar = getComponentLevelCssVar('Card', 'vertical-gutter')
    const dividerSizeVar = getComponentLevelCssVar('Card', 'divider-size')
    const minWidthVar = getComponentLevelCssVar('Card', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Card', 'max-width')

    // Header style (h1-h6 typography reference)
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

    // Get header style value
    const headerStyleValue = readCssVar(headerStyleVar) || 'h3'

    // CSS custom properties — all from UIKit per-layer refs
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

    const headerStyle = {
        color: 'var(--card-title-color)',
        fontFamily: `var(--recursica_brand_typography_${headerStyleValue}-font-family)`,
        fontSize: `var(--recursica_brand_typography_${headerStyleValue}-font-size)`,
        fontWeight: `var(--recursica_brand_typography_${headerStyleValue}-font-weight)`,
        letterSpacing: `var(--recursica_brand_typography_${headerStyleValue}-letter-spacing)`,
        lineHeight: `var(--recursica_brand_typography_${headerStyleValue}-line-height)`,
        fontStyle: `var(--recursica_brand_typography_${headerStyleValue}-font-style)`,
        textDecoration: 'none',
        textTransform: `var(--recursica_brand_typography_${headerStyleValue}-text-transform)`,
        flex: 1,
        minWidth: 0,
        overflow: 'clip',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingBottom: '0.15em',
    } as any

    return (
        <MantineCard
            className={`recursica-card ${className || ''}`}
            shadow={undefined}
            radius={0}
            padding={0}
            withBorder={false}
            style={{
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
            {...mantine}
            {...props}
        >
            {title && (
                <MantineCard.Section
                    withBorder={withDividers}
                    inheritPadding={false}
                    className="recursica-card-header"
                    style={{
                        padding: 'var(--card-header-padding)',
                        background: 'var(--card-header-bg)',
                        borderBottomColor: withDividers ? 'var(--card-divider-color)' : 'transparent',
                        borderBottomWidth: withDividers ? 'var(--card-divider-size)' : '0',
                    }}
                >
                    <span style={headerStyle}>
                        {title}
                    </span>
                </MantineCard.Section>
            )}

            <Box
                className="recursica-card-body"
                style={{
                    color: 'var(--card-content-color)',
                    padding: 'var(--card-padding)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--card-section-gap)',
                }}
            >
                {children}
            </Box>

            {footer && (
                <MantineCard.Section
                    withBorder={withDividers}
                    inheritPadding={false}
                    className="recursica-card-footer"
                    style={{
                        padding: 'var(--card-footer-padding)',
                        background: 'var(--card-footer-bg)',
                        borderTopColor: withDividers ? 'var(--card-divider-color)' : 'transparent',
                        borderTopWidth: withDividers ? 'var(--card-divider-size)' : '0',
                    }}
                >
                    {footer}
                </MantineCard.Section>
            )}
        </MantineCard>
    )
}
