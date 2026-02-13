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
    material,
    ...props
}: AdapterLinkProps) {
    const { mode } = useThemeMode()

    // Determine size prefix for CSS variables
    const sizePrefix = size === 'small' ? 'small' : 'default'

    // Use UIKit.json link colors - always use default-text
    const textVar = buildComponentCssVarPath('Link', 'properties', 'colors', layer, `default-text`)

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
            fontWeight: `var(${fontWeightVar})`,
            // fontStyle: Handle using style prop as MUI sx doesn't handle CSS vars for enums well
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
            '--link-font-family': `var(${fontFamilyVar})`,
            '--link-font-size': `var(${fontSizeVar})`,
            '--link-font-weight': `var(${fontWeightVar})`,
            '--link-letter-spacing': `var(${letterSpacingVar})`,
            '--link-line-height': `var(${lineHeightVar})`,

            ...style,
            ...materialSx,
        },
        ...restMaterial,
        ...props,
    }


    // Read dynamic values for inline style props
    const fontStyleValue = fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal'
    const textDecorationValue = textDecorationVar ? (readCssVar(textDecorationVar) || null) : null
    const textTransformValue = textTransformVar ? (readCssVar(textTransformVar) || 'none') : 'none'

    const additionalStyles: React.CSSProperties = {
        fontStyle: fontStyleValue as any,
        textTransform: textTransformValue as any,
    }

    if (underline === 'always') {
        additionalStyles.textDecoration = 'underline'
    } else if (underline === 'none') {
        additionalStyles.textDecoration = 'none'
    } else if (textDecorationValue) {
        additionalStyles.textDecoration = textDecorationValue
    }

    return (
        <MaterialLink {...materialProps as any} style={{ ...additionalStyles, ...style }}>
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
