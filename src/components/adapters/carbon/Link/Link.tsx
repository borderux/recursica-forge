/**
 * Carbon Link Implementation
 * 
 * Carbon-specific Link component that uses CSS variables for theming.
 */

import { Link as CarbonLink } from '@carbon/react'
import { useState, useEffect } from 'react'
import type { LinkProps as AdapterLinkProps } from '../../Link'
import { getComponentCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
    carbon,
    ...props
}: AdapterLinkProps) {
    const { mode } = useThemeMode()

    // Determine size prefix for CSS variables
    const sizePrefix = size === 'small' ? 'small' : 'default'

    // Use UIKit.json link colors - always use default-text
    const textVar = getComponentCssVar('Link', 'colors', `default-text`, layer)

    // Get icon gap CSS variable
    const iconGapVar = getComponentCssVar('Link', 'size', `${sizePrefix}-icon-text-gap`, undefined)

    // Get all text properties from component text property group
    const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('Link', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('Link', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('Link', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('Link', 'text', 'font-style')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar, textVar, iconGapVar]

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
    }, [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar, textVar, iconGapVar])

    // Get CSS variables for text emphasis opacity
    const highEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-high`
    const lowEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-low`

    // Determine size prop for Carbon (sm, md, lg)
    const carbonSize = (size === 'small' ? 'sm' : 'md') as 'sm' | 'md' | 'lg'

    // Merge library-specific props
    const carbonProps = {
        href,
        target,
        rel,
        onClick,
        className,
        size: carbonSize,
        style: {
            // Use CSS variables for theming
            color: `var(${textVar})`,
            fontFamily: `var(${fontFamilyVar})`,
            fontSize: `var(${fontSizeVar})`,
            fontWeight: `var(${fontWeightVar})`,
            fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal',
            letterSpacing: `var(${letterSpacingVar})`,
            lineHeight: `var(${lineHeightVar})`,

            // Handle text decoration based on underline prop
            textDecoration: underline === 'always'
                ? 'underline'
                : underline === 'none'
                    ? 'none'
                    : (textDecorationVar ? (readCssVar(textDecorationVar) || 'underline') : 'underline'),

            textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') as any : 'none',

            // Apply emphasis opacity based on variant
            opacity: variant === 'subtle' ? `var(${lowEmphasisOpacityVar})` : `var(${highEmphasisOpacityVar})`,

            // Flex styles for icons
            display: 'inline-flex',
            alignItems: 'center',
            gap: startIcon || endIcon ? `var(${iconGapVar})` : 0,

            // Set CSS vars for CSS override
            '--link-color': `var(${textVar})`,
            '--link-icon-gap': `var(${iconGapVar})`,
            '--link-font-family': `var(${fontFamilyVar})`,
            '--link-font-size': `var(${fontSizeVar})`,
            '--link-font-weight': `var(${fontWeightVar})`,
            '--link-letter-spacing': `var(${letterSpacingVar})`,
            '--link-line-height': `var(${lineHeightVar})`,

            ...style,
        } as React.CSSProperties,
        ...carbon,
        ...props,
    }


    return (
        <CarbonLink {...carbonProps}>
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
        </CarbonLink>
    )
}
