/**
 * Material UI Link Implementation
 * 
 * Material UI-specific Link component that uses CSS variables for theming.
 */

import { Link as MaterialLink } from '@mui/material'
import { useState, useEffect } from 'react'
import type { LinkProps as AdapterLinkProps } from '../../Link'
import { getComponentCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getBrandStateCssVar } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { useCssVar } from '../../../hooks/useCssVar'
import './Link.css'

export default function Link({
    children,
    href,
    target,
    rel,
    variant = 'default',
    size = 'default',
    layer = 'layer-0',
    underline,
    onClick,
    className,
    style,
    startIcon,
    endIcon,
    forceState,
    material,
    ...props
}: AdapterLinkProps) {
    const { mode } = useThemeMode()

    // Use recursica_ui-kit.json link colors - state-variant colors
    const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'text')
    const textHoverVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', layer, 'text')

    // Get icon gap and icon size CSS variables (at component properties level, not under size variants)
    const iconGapVar = buildComponentCssVarPath('Link', 'properties', 'icon-text-gap')
    const iconSizeVar = buildComponentCssVarPath('Link', 'properties', 'icon-size')

    // Icon color CSS variables (per-state)
    const defaultIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'icon')
    const hoverIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', layer, 'icon')
    const visitedIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'colors', layer, 'icon')

    // Shared text properties (component level)
    const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
    const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')

    // State-dependent text properties (default state)
    const defaultFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-weight')
    const defaultTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-decoration')
    const defaultTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-transform')
    const defaultFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-style')

    // State-dependent text properties (hover state)
    const hoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-weight')
    const hoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-decoration')
    const hoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-transform')
    const hoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-style')

    // State-dependent text properties (visited state)
    const visitedFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'font-weight')
    const visitedTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'text-decoration')
    const visitedTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'text-transform')
    const visitedFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'font-style')
    const visitedTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'colors', layer, 'text')

    // State-dependent text properties (visited-hover state)
    const visitedHoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-weight')
    const visitedHoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-decoration')
    const visitedHoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-transform')
    const visitedHoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-style')
    const visitedHoverTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'colors', layer, 'text')
    const visitedHoverIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'colors', layer, 'icon')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const textCssVars = [
            fontFamilyVar, fontSizeVar, letterSpacingVar, lineHeightVar,
            defaultFontWeightVar, defaultTextDecorationVar, defaultTextTransformVar, defaultFontStyleVar,
            hoverFontWeightVar, hoverTextDecorationVar, hoverTextTransformVar, hoverFontStyleVar,
            visitedFontWeightVar, visitedTextDecorationVar, visitedTextTransformVar, visitedFontStyleVar, visitedTextColorVar,
            defaultIconColorVar, hoverIconColorVar, visitedIconColorVar,
            textVar, textHoverVar, iconGapVar
        ]

        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))

            if (shouldUpdateText) {
                // Force re-render by updating state
                setTextVarsUpdate(prev => prev + 1)
            }
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        // Also watch for direct style changes using MutationObserver
        const observer = new MutationObserver(() => {
            // Force re-render for text vars
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
    }, [fontFamilyVar, fontSizeVar, letterSpacingVar, lineHeightVar,
        defaultFontWeightVar, defaultTextDecorationVar, defaultTextTransformVar, defaultFontStyleVar,
        hoverFontWeightVar, hoverTextDecorationVar, hoverTextTransformVar, hoverFontStyleVar,
        visitedFontWeightVar, visitedTextDecorationVar, visitedTextTransformVar, visitedFontStyleVar, visitedTextColorVar,
        visitedHoverFontWeightVar, visitedHoverTextDecorationVar, visitedHoverTextTransformVar, visitedHoverFontStyleVar, visitedHoverTextColorVar, visitedHoverIconColorVar,
        defaultIconColorVar, hoverIconColorVar, visitedIconColorVar,
        textVar, textHoverVar, iconGapVar])

    // Get CSS variables for text emphasis opacity
    const highEmphasisOpacityVar = `--recursica_brand_text-emphasis_high`
    const lowEmphasisOpacityVar = `--recursica_brand_text-emphasis_low`

    // Determine underline behavior for Material UI
    const materialUnderline = (underline === 'always' ? 'always' : underline === 'hover' ? 'hover' : 'none') as 'always' | 'hover' | 'none'

    // Extract sx from material prop
    const { sx: materialSx, ...restMaterial } = material || {}

    // Merge library-specific props
    const materialProps = {
        href,
        target,
        rel,
        underline: materialUnderline,
        onClick,
        className,
        sx: {
            // Use CSS variables for theming
            color: `var(${textVar})`,
            fontFamily: `var(${fontFamilyVar})`,
            fontSize: `var(${fontSizeVar})`,
            fontWeight: `var(${defaultFontWeightVar})`,
            letterSpacing: `var(${letterSpacingVar})`,
            lineHeight: `var(${lineHeightVar})`,

            // Apply emphasis opacity based on variant
            opacity: variant === 'subtle' ? `var(${lowEmphasisOpacityVar})` : `var(${highEmphasisOpacityVar})`,

            // Flex styles for icons
            display: 'inline-flex',
            alignItems: 'center',
            gap: startIcon || endIcon ? `var(${iconGapVar})` : 0,

            // Set CSS vars for CSS override
            '--link-color': `var(${textVar})`,
            '--link-hover-color': `var(${textHoverVar})`,
            '--link-icon-gap': `var(${iconGapVar})`,
            '--link-icon-size': `var(${iconSizeVar})`,
            '--link-font-family': `var(${fontFamilyVar})`,
            '--link-font-size': `var(${fontSizeVar})`,
            '--link-font-weight': `var(${defaultFontWeightVar})`,
            '--link-letter-spacing': `var(${letterSpacingVar})`,
            '--link-line-height': `var(${lineHeightVar})`,
            '--link-text-decoration': `var(${defaultTextDecorationVar})`,
            '--link-text-transform': `var(${defaultTextTransformVar})`,
            '--link-font-style': `var(${defaultFontStyleVar})`,
            '--link-hover-font-weight': `var(${hoverFontWeightVar})`,
            '--link-hover-text-decoration': `var(${hoverTextDecorationVar})`,
            '--link-hover-text-transform': `var(${hoverTextTransformVar})`,
            '--link-hover-font-style': `var(${hoverFontStyleVar})`,

            // CSS custom properties for visited state
            '--link-visited-color': `var(${visitedTextColorVar})`,
            '--link-visited-font-weight': `var(${visitedFontWeightVar})`,
            '--link-visited-text-decoration': `var(${visitedTextDecorationVar})`,
            '--link-visited-text-transform': `var(${visitedTextTransformVar})`,
            '--link-visited-font-style': `var(${visitedFontStyleVar})`,

            // CSS custom properties for visited-hover state
            '--link-visited-hover-color': `var(${visitedHoverTextColorVar})`,
            '--link-visited-hover-font-weight': `var(${visitedHoverFontWeightVar})`,
            '--link-visited-hover-text-decoration': `var(${visitedHoverTextDecorationVar})`,
            '--link-visited-hover-text-transform': `var(${visitedHoverTextTransformVar})`,
            '--link-visited-hover-font-style': `var(${visitedHoverFontStyleVar})`,

            // CSS custom properties for icon color
            '--link-icon-color': `var(${defaultIconColorVar})`,
            '--link-hover-icon-color': `var(${hoverIconColorVar})`,
            '--link-visited-icon-color': `var(${visitedIconColorVar})`,
            '--link-visited-hover-icon-color': `var(${visitedHoverIconColorVar})`,

            ...style,
            ...materialSx,
        },
        ...restMaterial,
        ...props,
    }


    // Read dynamic values for inline style props
// Removed static computation in favor of native injection

    const additionalStyles: React.CSSProperties = {
        fontStyle: `var(${defaultFontStyleVar})` as any,
        textTransform: `var(${defaultTextTransformVar})` as any,
    }

    if (underline === 'always') {
        additionalStyles.textDecoration = 'underline'
    } else if (underline === 'none') {
        additionalStyles.textDecoration = 'none'
    } else {
        additionalStyles.textDecoration = `var(${defaultTextDecorationVar})` as any
    }

    return (
        <MaterialLink
            {...materialProps as any}
            style={{ ...additionalStyles, ...style }}
            {...(forceState && forceState !== 'default' ? { 'data-force-state': forceState } : {})}
        >
            {startIcon && (
                <span className="recursica-link-icon-start">
                    {startIcon}
                </span>
            )}
            {children}
            {endIcon && (
                <span className="recursica-link-icon-end">
                    {endIcon}
                </span>
            )}
        </MaterialLink>
    )
}
