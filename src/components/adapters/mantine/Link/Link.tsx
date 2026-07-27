/**
 * Mantine Link Implementation
 * 
 * Mantine-specific Link component that uses CSS variables for theming.
 */

import { Anchor as MantineAnchor } from '@mantine/core'
import { useState, useEffect } from 'react'
import type { LinkProps as AdapterLinkProps } from '../../Link'
import { getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
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
    mantine,
    showIcon,
    iconPosition,
    ...props
}: AdapterLinkProps) {
    const { mode } = useThemeMode()

    // Use recursica_ui-kit.json link colors - state-variant colors
    const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'text-color')
    const textHoverVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', layer, 'text-color')

    // Get icon gap and icon size CSS variables (at component properties level, not under size variants)
    const iconGapVar = buildComponentCssVarPath('Link', 'properties', 'icon-text-gap')
    const iconSizeVar = buildComponentCssVarPath('Link', 'properties', 'icon-size')

    // Icon color CSS variables (per-state)
    const defaultIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'icon')
    const hoverIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', layer, 'icon')
    const visitedIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'colors', layer, 'icon-color')

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
    const visitedTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'colors', layer, 'text-color')

    // State-dependent text properties (visited-hover state)
    const visitedHoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-weight')
    const visitedHoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-decoration')
    const visitedHoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-transform')
    const visitedHoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-style')
    const visitedHoverTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'colors', layer, 'text-color')
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
            visitedHoverFontWeightVar, visitedHoverTextDecorationVar, visitedHoverTextTransformVar, visitedHoverFontStyleVar, visitedHoverTextColorVar, visitedHoverIconColorVar,
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

    // Determine underline behavior for Mantine
    const mantineUnderline = underline === 'always' ? 'always' : underline === 'hover' ? 'hover' : 'never'

    // Merge library-specific props
    const mantineProps = {
        component: 'a',
        href,
        target,
        rel,
        underline: mantineUnderline as "hover" | "always" | "never",
        onClick,
        className,
        style: {
            // CSS custom properties for default state
            '--link-color': `var(${textVar})`,
            '--link-hover-color': `var(${textHoverVar})`,
            '--link-icon-gap': `var(${iconGapVar})`,
            '--link-icon-size': `var(${iconSizeVar})`,
            '--link-font-family': `var(${fontFamilyVar})`,
            '--link-font-size': `var(${fontSizeVar})`,
            '--link-font-weight': `var(${defaultFontWeightVar})`,
            '--link-letter-spacing': `var(${letterSpacingVar})`,
            '--link-line-height': `var(${lineHeightVar})`,
            '--link-text-decoration': readCssVar(defaultTextDecorationVar) || 'underline',
            '--link-text-transform': readCssVar(defaultTextTransformVar) || 'none',
            '--link-font-style': readCssVar(defaultFontStyleVar) || 'normal',

            // CSS custom properties for hover state
            '--link-hover-font-weight': `var(${hoverFontWeightVar})`,
            '--link-hover-text-decoration': readCssVar(hoverTextDecorationVar) || 'underline',
            '--link-hover-text-transform': readCssVar(hoverTextTransformVar) || 'none',
            '--link-hover-font-style': readCssVar(hoverFontStyleVar) || 'normal',

            // CSS custom properties for visited state
            '--link-visited-color': `var(${visitedTextColorVar})`,
            '--link-visited-font-weight': `var(${visitedFontWeightVar})`,
            '--link-visited-text-decoration': readCssVar(visitedTextDecorationVar) || 'underline',
            '--link-visited-text-transform': readCssVar(visitedTextTransformVar) || 'none',
            '--link-visited-font-style': readCssVar(visitedFontStyleVar) || 'normal',

            // CSS custom properties for visited-hover state
            '--link-visited-hover-color': `var(${visitedHoverTextColorVar})`,
            '--link-visited-hover-font-weight': `var(${visitedHoverFontWeightVar})`,
            '--link-visited-hover-text-decoration': readCssVar(visitedHoverTextDecorationVar) || 'underline',
            '--link-visited-hover-text-transform': readCssVar(visitedHoverTextTransformVar) || 'none',
            '--link-visited-hover-font-style': readCssVar(visitedHoverFontStyleVar) || 'normal',

            // CSS custom properties for icon color
            '--link-icon-color': `var(${defaultIconColorVar})`,
            '--link-hover-icon-color': `var(${hoverIconColorVar})`,
            '--link-visited-icon-color': `var(${visitedIconColorVar})`,
            '--link-visited-hover-icon-color': `var(${visitedHoverIconColorVar})`,

            // Compute active text color based on forceState
            ...(() => {
                const activeTextVar = forceState === 'hover' ? textHoverVar
                    : forceState === 'visited' ? visitedTextColorVar
                        : forceState === 'visited-hover' ? visitedHoverTextColorVar
                            : textVar
                const activeFontWeightVar = forceState === 'hover' ? hoverFontWeightVar
                    : forceState === 'visited' ? visitedFontWeightVar
                        : forceState === 'visited-hover' ? visitedHoverFontWeightVar
                            : defaultFontWeightVar
                const activeTextDecoration = forceState === 'hover' ? `var(${hoverTextDecorationVar})`
                    : forceState === 'visited' ? `var(${visitedTextDecorationVar})`
                        : forceState === 'visited-hover' ? `var(${visitedHoverTextDecorationVar})`
                            : `var(${defaultTextDecorationVar})`
                const activeFontStyle = forceState === 'hover' ? `var(${hoverFontStyleVar})`
                    : forceState === 'visited' ? `var(${visitedFontStyleVar})`
                        : forceState === 'visited-hover' ? `var(${visitedHoverFontStyleVar})`
                            : `var(${defaultFontStyleVar})`

                return {
                    color: `var(${activeTextVar})`,
                    fontFamily: `var(${fontFamilyVar})`,
                    fontSize: `var(${fontSizeVar})`,
                    fontWeight: `var(${activeFontWeightVar})`,
                    fontStyle: activeFontStyle as any,
                    textTransform: (() => {
                        const activeTextTransformVar = forceState === 'hover' ? hoverTextTransformVar
                            : forceState === 'visited' ? visitedTextTransformVar
                                : forceState === 'visited-hover' ? visitedHoverTextTransformVar
                                    : defaultTextTransformVar
                        return (readCssVar(activeTextTransformVar) || 'none') as any
                    })(),
                    letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
                    lineHeight: `var(${lineHeightVar})`,
                    textDecoration: (underline === 'always' ? 'underline'
                        : underline === 'none' ? 'none'
                            : activeTextDecoration) as any,
                }
            })(),

            // Custom interaction-state override.
            // The ternary above only resolves the four built-in states; an unknown/custom
            // forceState falls through to the `default` branch, so a custom state's tokens
            // were never read. Here we build the state's CSS-var paths GENERICALLY from the
            // passed name (variants.states.<forceState>.properties…) — the same properties the
            // built-in states set. We redirect the base `--link-*` custom properties (the base
            // .mantine-Anchor-root rule reads these, and its color/text-decoration use
            // !important, which would otherwise beat the inline values) AND set the resolved
            // inline values, mirroring how the built-in IIFE produces its output. For built-in
            // states and the no-forceState case this returns {}, preserving exact behavior.
            ...(() => {
                const builtInStates = ['default', 'hover', 'visited', 'visited-hover']
                if (!forceState || builtInStates.includes(forceState)) return {} as React.CSSProperties

                const customTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'colors', layer, 'text-color')
                const customIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'colors', layer, 'icon')
                const customFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'text', 'font-weight')
                const customTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'text', 'text-decoration')
                const customTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'text', 'text-transform')
                const customFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', forceState, 'properties', 'text', 'font-style')

                return {
                    // Redirect the base `--link-*` custom properties the .mantine-Anchor-root rule consumes
                    '--link-color': `var(${customTextColorVar})`,
                    '--link-font-weight': `var(${customFontWeightVar})`,
                    '--link-text-decoration': readCssVar(customTextDecorationVar) || 'underline',
                    '--link-text-transform': readCssVar(customTextTransformVar) || 'none',
                    '--link-font-style': readCssVar(customFontStyleVar) || 'normal',
                    '--link-icon-color': `var(${customIconColorVar})`,
                    // Resolved inline values (mirrors the built-in IIFE output)
                    color: `var(${customTextColorVar})`,
                    fontWeight: `var(${customFontWeightVar})`,
                    fontStyle: `var(${customFontStyleVar})` as any,
                    textTransform: (readCssVar(customTextTransformVar) || 'none') as any,
                    textDecoration: (underline === 'always' ? 'underline'
                        : underline === 'none' ? 'none'
                            : `var(${customTextDecorationVar})`) as any,
                } as React.CSSProperties
            })(),

            // Apply emphasis opacity based on variant
            opacity: variant === 'subtle' ? `var(${lowEmphasisOpacityVar})` : `var(${highEmphasisOpacityVar})`,

            // Flex styles for icons
            display: 'inline-flex',
            alignItems: 'center',
            gap: startIcon || endIcon ? `var(${iconGapVar})` : 0,

            ...style,
        } as React.CSSProperties,
        ...mantine,
        ...props,
    }


    return (
        <MantineAnchor
            {...mantineProps as any}
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
        </MantineAnchor>
    )
}
