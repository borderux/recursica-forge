/**
 * Mantine Popover Implementation
 * 
 * Mantine-specific Popover component that uses CSS variables for theming.
 * Shares recursica_ui-kit.json styling with HoverCard under 'hover-card-popover'.
 */

import { useState, useEffect } from 'react'
import { Popover as MantinePopover, Box } from '@mantine/core'
import type { PopoverProps as AdapterPopoverProps } from '../../Popover'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import '../HoverCard/HoverCard.css'

export default function Popover({
    children,
    content,
    isOpen,
    onClose,
    layer = 'layer-1',
    elevation,
    className,
    style,
    withBeak = false,
    position = 'bottom',
    zIndex,
    mantine,
    ...props
}: AdapterPopoverProps) {
    const { mode } = useThemeMode()
    const [, setUpdateKey] = useState(0)

    // Build CSS variable names — use 'HoverCardPopover' as the component name for shared styling
    // Colors are at the component top level (not under properties)
    const bgVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'background')
    const contentColorVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'content')
    const borderColorVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'border-color')


    const borderRadiusVar = getComponentLevelCssVar('HoverCardPopover', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('HoverCardPopover', 'border-size')
    const horizontalPaddingVar = getComponentLevelCssVar('HoverCardPopover', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('HoverCardPopover', 'vertical-padding')
    const minWidthVar = getComponentLevelCssVar('HoverCardPopover', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('HoverCardPopover', 'max-width')
    const beakSizeVar = getComponentLevelCssVar('HoverCardPopover', 'beak-size')

    // Text properties
    const contentFontFamilyVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-family')
    const contentFontSizeVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-size')
    const contentFontWeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-weight')
    const contentLetterSpacingVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'letter-spacing')
    const contentLineHeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'line-height')
    const contentFontStyleVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-style')
    const contentTextDecorationVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'text-decoration')
    const contentTextTransformVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'text-transform')

    // Elevation variable
    const internalElevationVar = getComponentLevelCssVar('HoverCardPopover', 'elevation')

    useEffect(() => {
        const textCssVars = [
            contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar,
            contentLetterSpacingVar, contentLineHeightVar, contentFontStyleVar,
            contentTextDecorationVar, contentTextTransformVar,
            internalElevationVar, beakSizeVar
        ]

        const handleCssVarUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const shouldUpdate = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
            if (shouldUpdate) {
                setUpdateKey(prev => prev + 1)
            }
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

        const observer = new MutationObserver(() => {
            setUpdateKey(prev => prev + 1)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [contentFontFamilyVar, contentFontSizeVar, contentFontWeightVar, contentLetterSpacingVar, contentLineHeightVar, contentFontStyleVar, contentTextDecorationVar, contentTextTransformVar, internalElevationVar, beakSizeVar])

    const beakSizeValue = parseInt(readCssVar(beakSizeVar) || '16')

    // Get elevation value
    const activeElevation = elevation || parseElevationValue(readCssVar(internalElevationVar))
    const elevationBoxShadow = getElevationBoxShadow(mode, activeElevation)

    // Calculate drop-shadow parameters for the beak
    const shadowParams = (() => {
        if (!activeElevation || activeElevation === 'elevation-0') return '0 0 0 rgba(0,0,0,0)'
        const match = activeElevation.match(/elevation-(\d+)/)
        if (!match) return '0 0 0 rgba(0,0,0,0)'
        const level = match[1]
        const xAxis = `var(--recursica-brand-themes-${mode}-elevations-elevation-${level}-x-axis, 0px)`
        const yAxis = `var(--recursica-brand-themes-${mode}-elevations-elevation-${level}-y-axis, 0px)`
        const blur = `var(--recursica-brand-themes-${mode}-elevations-elevation-${level}-blur, 0px)`
        const color = `var(--recursica-brand-themes-${mode}-elevations-elevation-${level}-shadow-color, rgba(0, 0, 0, 0))`
        return `${xAxis} ${yAxis} ${blur} ${color}`
    })()

    const dropdownStyles = {
        '--hcp-bg': `var(${bgVar})`,
        '--hcp-content-color': `var(${contentColorVar})`,
        '--hcp-border-color': `var(${borderColorVar})`,
        '--hcp-border-radius': `var(${borderRadiusVar})`,
        '--hcp-border-size': `var(${borderSizeVar})`,
        '--hcp-padding-x': `var(${horizontalPaddingVar})`,
        '--hcp-padding-y': `var(${verticalPaddingVar})`,
        '--hcp-min-width': `var(${minWidthVar})`,
        '--hcp-max-width': `var(${maxWidthVar})`,
        '--hcp-content-font-family': `var(${contentFontFamilyVar})`,
        '--hcp-content-font-size': `var(${contentFontSizeVar})`,
        '--hcp-content-font-weight': `var(${contentFontWeightVar})`,
        '--hcp-content-letter-spacing': `var(${contentLetterSpacingVar})`,
        '--hcp-content-line-height': `var(${contentLineHeightVar})`,
        '--hcp-content-font-style': `var(${contentFontStyleVar})`,
        '--hcp-content-text-decoration': `var(${contentTextDecorationVar})`,
        '--hcp-content-text-transform': `var(${contentTextTransformVar})`,
        '--hcp-box-shadow': elevationBoxShadow || 'none',
        '--hcp-shadow-params': shadowParams,
        ...style,
    } as React.CSSProperties

    return (
        <MantinePopover
            opened={isOpen}
            onChange={(opened) => { if (!opened) onClose?.() }}
            position={position}
            withArrow={withBeak}
            arrowSize={beakSizeValue}
            zIndex={zIndex ?? 300}
            {...mantine}
            {...props}
        >
            <MantinePopover.Target>
                <Box component="span" className={className} style={{ display: 'inline-block' }}>
                    {children}
                </Box>
            </MantinePopover.Target>
            <MantinePopover.Dropdown
                className="recursica-hcp-dropdown"
                style={dropdownStyles}
            >
                <Box
                    className="recursica-hcp-content"
                    style={{
                        color: 'var(--hcp-content-color)',
                        fontFamily: 'var(--hcp-content-font-family)',
                        fontSize: 'var(--hcp-content-font-size)',
                        fontWeight: 'var(--hcp-content-font-weight)',
                        letterSpacing: 'var(--hcp-content-letter-spacing)',
                        lineHeight: 'var(--hcp-content-line-height)',
                        fontStyle: 'var(--hcp-content-font-style)',
                        textDecoration: 'var(--hcp-content-text-decoration)',
                        textTransform: 'var(--hcp-content-text-transform)',
                    } as any}
                >
                    {content}
                </Box>
            </MantinePopover.Dropdown>
        </MantinePopover>
    )
}
