/**
 * HoverCard / Popover Preview
 *
 * Shows two static examples (with and without beak) and a button to trigger
 * a live HoverCard and Popover.
 */

import { useState, useEffect } from 'react'
import { HoverCard } from '../../components/adapters/HoverCard'
import { Popover } from '../../components/adapters/Popover'
import { Button } from '../../components/adapters/Button'
import { useThemeMode } from '../theme/ThemeModeContext'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../components/utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'

interface HoverCardPopoverPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function HoverCardPopoverPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: HoverCardPopoverPreviewProps) {
    const { mode } = useThemeMode()
    const layer = selectedLayer as ComponentLayer
    const [, setUpdateKey] = useState(0)
    const [popoverOpen, setPopoverOpen] = useState(false)

    // Force re-render when CSS variables change
    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateKey(prev => prev + 1)
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
    }, [])

    // Read CSS vars for static preview rendering
    const bgVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'background')
    const contentColorVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'content')
    const borderColorVar = buildComponentCssVarPath('HoverCardPopover', 'colors', layer, 'border-color')
    const borderRadiusVar = getComponentLevelCssVar('HoverCardPopover', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('HoverCardPopover', 'border-size')
    const hPaddingVar = getComponentLevelCssVar('HoverCardPopover', 'horizontal-padding')
    const vPaddingVar = getComponentLevelCssVar('HoverCardPopover', 'vertical-padding')
    const minWidthVar = getComponentLevelCssVar('HoverCardPopover', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('HoverCardPopover', 'max-width')
    const beakSizeVar = getComponentLevelCssVar('HoverCardPopover', 'beak-size')
    const beakInsetVar = getComponentLevelCssVar('HoverCardPopover', 'beak-inset')
    const elevationVar = getComponentLevelCssVar('HoverCardPopover', 'elevation')

    const fontFamilyVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('HoverCardPopover', 'content-text', 'line-height')

    // Get the elevation value
    const activeElevation = componentElevation || parseElevationValue(readCssVar(elevationVar))

    // Build drop-shadow params for the beak
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

    const beakSize = parseInt(readCssVar(beakSizeVar) || '16')

    // Common styling for static previews
    const cardStyle: React.CSSProperties = {
        backgroundColor: `var(${bgVar})`,
        color: `var(${contentColorVar})`,
        border: `var(${borderSizeVar}) solid var(${borderColorVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        padding: `var(${vPaddingVar}) var(${hPaddingVar})`,
        minWidth: `var(${minWidthVar})`,
        maxWidth: `var(${maxWidthVar})`,
        fontFamily: `var(${fontFamilyVar})`,
        fontSize: `var(${fontSizeVar})`,
        fontWeight: `var(${fontWeightVar})`,
        letterSpacing: `var(${letterSpacingVar})`,
        lineHeight: `var(${lineHeightVar})`,
        filter: `drop-shadow(${shadowParams})`,
        position: 'relative',
    }

    // Beak (arrow) styles
    const beakStyle: React.CSSProperties = {
        position: 'absolute',
        top: -beakSize / 2,
        left: `var(${beakInsetVar}, 16px)`,
        width: beakSize,
        height: beakSize,
        backgroundColor: `var(${bgVar})`,
        border: `var(${borderSizeVar}) solid var(${borderColorVar})`,
        transform: 'rotate(45deg)',
        borderBottom: 'none',
        borderRight: 'none',
        boxSizing: 'border-box',
    }

    const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica-brand-dimensions-general-xl)',
            width: '100%',
            alignItems: 'center',
        }}>
            {/* Static preview — Without beak */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-sm)', alignItems: 'center' }}>
                <h2 style={{
                    margin: 0,
                    fontFamily: 'var(--recursica-brand-typography-h5-font-family)',
                    fontSize: 'var(--recursica-brand-typography-h5-font-size)',
                    fontWeight: 'var(--recursica-brand-typography-h5-font-weight)',
                    letterSpacing: 'var(--recursica-brand-typography-h5-font-letter-spacing)',
                    lineHeight: 'var(--recursica-brand-typography-h5-line-height)',
                    color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                    opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`,
                }}>
                    Without beak
                </h2>
                <div style={cardStyle}>
                    <p style={{ margin: 0 }}>
                        This is a hover card / popover without a beak (arrow pointer).
                    </p>
                </div>
            </div>

            {/* Static preview — With beak */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-sm)', alignItems: 'center' }}>
                <h2 style={{
                    margin: 0,
                    fontFamily: 'var(--recursica-brand-typography-h5-font-family)',
                    fontSize: 'var(--recursica-brand-typography-h5-font-size)',
                    fontWeight: 'var(--recursica-brand-typography-h5-font-weight)',
                    letterSpacing: 'var(--recursica-brand-typography-h5-font-letter-spacing)',
                    lineHeight: 'var(--recursica-brand-typography-h5-line-height)',
                    color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                    opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`,
                }}>
                    With beak
                </h2>
                <div style={{ paddingTop: beakSize / 2 + 4 }}>
                    <div style={cardStyle}>
                        <div style={beakStyle} />
                        <p style={{ margin: 0 }}>
                            This hover card / popover includes a beak (arrow pointer) to indicate the trigger element.
                        </p>
                    </div>
                </div>
            </div>

            {/* Interactive: HoverCard */}
            <div style={{
                display: 'flex',
                gap: 'var(--recursica-brand-dimensions-general-lg)',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 'var(--recursica-brand-dimensions-general-lg)',
            }}>
                <HoverCard
                    content={<p style={{ margin: 0 }}>Hover card content — appears on hover</p>}
                    layer={layer}
                    withBeak
                    position="bottom"
                >
                    <Button variant="outline" size="default" layer={layer}>
                        Hover me (HoverCard)
                    </Button>
                </HoverCard>

                <Popover
                    content={<p style={{ margin: 0 }}>Popover content — toggle with click</p>}
                    layer={layer}
                    isOpen={popoverOpen}
                    onClose={() => setPopoverOpen(false)}
                    withBeak
                    position="bottom"
                >
                    <Button
                        variant="outline"
                        size="default"
                        layer={layer}
                        onClick={() => setPopoverOpen(!popoverOpen)}
                    >
                        {popoverOpen ? 'Close Popover' : 'Open Popover'}
                    </Button>
                </Popover>
            </div>
        </div>
    )
}
