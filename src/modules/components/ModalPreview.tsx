import { useState, useMemo, useEffect } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { X } from '@phosphor-icons/react'
import { Box, Group, Text } from '@mantine/core'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { getElevationBoxShadow } from '../../components/utils/brandCssVars'
import { readCssVar, readRawCssVar } from '../../core/css/readCssVar'
import { h2Style, pStyle } from './typographyStyles'

interface ModalPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

const goblinStory = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. This legendary encounter has been told for generations in the deep mines of the Obsidian Mountains. Every word of this story carries the weight of a thousand hammers striking the anvil of truth. The goblin, known as Zog, was not merely swift; he was a master of the dance between light and shadow, and his leap was more than just a movement—it was a statement of freedom in a world carved from unyielding stone."

export default function ModalPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: ModalPreviewProps) {
    const { mode } = useThemeMode()
    const [isOpen, setIsOpen] = useState(false)
    const [updateKey, setUpdateKey] = useState(0)
    const sizeVariant = selectedVariants.size || 'md'
    const showHeader = selectedVariants.header !== 'false'
    const showFooter = selectedVariants.footer !== 'false'
    const scrollable = selectedVariants.scrollable === 'true'
    const padding = selectedVariants.padding !== 'false'

    // Listen for CSS variable updates to force re-render.
    // UIKit vars are always dispatched silently (no cssVarsUpdated event), so we also
    // watch the documentElement style attribute via MutationObserver which fires whenever
    // root.style.setProperty() is called by updateCssVar.
    useEffect(() => {
        const handler = () => setUpdateKey((k) => k + 1)
        window.addEventListener('cssVarsUpdated', handler as any)

        const observer = new MutationObserver(handler)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handler as any)
            observer.disconnect()
        }
    }, [])

    // Get CSS variable names for the static preview
    const bgVar = buildComponentCssVarPath('Modal', 'properties', 'colors', selectedLayer, 'background')
    const titleColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', selectedLayer, 'title')
    const borderColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', selectedLayer, 'border-color')
    const dividerColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', selectedLayer, 'scroll-divider')
    const contentColorVar = buildComponentCssVarPath('Modal', 'properties', 'colors', selectedLayer, 'content')

    const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Modal', 'border-size')
    const scrollDividerThicknessVar = getComponentLevelCssVar('Modal', 'scroll-divider-thickness')
    const horizontalPaddingVar = getComponentLevelCssVar('Modal', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Modal', 'vertical-padding')
    const buttonGapVar = getComponentLevelCssVar('Modal', 'button-gap')
    const minWidthVar = getComponentLevelCssVar('Modal', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Modal', 'max-width')
    const minHeightVar = getComponentLevelCssVar('Modal', 'min-height')
    const maxHeightVar = getComponentLevelCssVar('Modal', 'max-height')

    const headerStyleVar = getComponentLevelCssVar('Modal', 'header-style')

    const contentStyleVar = getComponentLevelCssVar('Modal', 'content-style')

    const elevationVar = getComponentLevelCssVar('Modal', 'elevation')

    const elevationName = readCssVar(elevationVar) || componentElevation
    const elevationBoxShadow = getElevationBoxShadow(mode, elevationName)

    const rawHeaderStyleValue = readRawCssVar(headerStyleVar) || 'h3'
    let headerStyleValue = 'h3'
    if (rawHeaderStyleValue.startsWith('{brand.typography.')) {
        headerStyleValue = rawHeaderStyleValue.replace(/^\{brand\.typography\.(.+)\}$/, '$1')
    } else if (rawHeaderStyleValue.includes('--recursica_brand_typography_')) {
        const match = /--recursica_brand_typography_(.+)-font-size/.exec(rawHeaderStyleValue)
        if (match) {
            headerStyleValue = match[1]
        }
    } else {
        headerStyleValue = rawHeaderStyleValue
    }
    const HeadingTag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(headerStyleValue) ? headerStyleValue : 'div') as keyof JSX.IntrinsicElements

    const headerStyle = {
        color: `var(${titleColorVar})`,
        fontFamily: `var(--recursica_brand_typography_${headerStyleValue}-font-family)`,
        fontSize: `var(--recursica_brand_typography_${headerStyleValue}-font-size)`,
        fontWeight: `var(--recursica_brand_typography_${headerStyleValue}-font-weight)`,
        letterSpacing: `var(--recursica_brand_typography_${headerStyleValue}-font-letter-spacing)`,
        lineHeight: `var(--recursica_brand_typography_${headerStyleValue}-line-height)`,
        fontStyle: `var(--recursica_brand_typography_${headerStyleValue}-font-style)`,
        textDecoration: 'none',
        textTransform: `var(--recursica_brand_typography_${headerStyleValue}-text-transform)` as any,
        margin: 0,
    } as any

    const rawContentStyleValue = readRawCssVar(contentStyleVar) || 'body'
    let contentStyleValue = 'body'
    if (rawContentStyleValue.startsWith('{brand.typography.')) {
        contentStyleValue = rawContentStyleValue.replace(/^\{brand\.typography\.(.+)\}$/, '$1')
    } else if (rawContentStyleValue.includes('--recursica_brand_typography_')) {
        const match = /--recursica_brand_typography_(.+)-font-size/.exec(rawContentStyleValue)
        if (match) {
            contentStyleValue = match[1]
        }
    } else {
        contentStyleValue = rawContentStyleValue
    }

    const contentStyle = {
        fontFamily: `var(--recursica_brand_typography_${contentStyleValue}-font-family)`,
        fontSize: `var(--recursica_brand_typography_${contentStyleValue}-font-size)`,
        fontWeight: `var(--recursica_brand_typography_${contentStyleValue}-font-weight)`,
        letterSpacing: `var(--recursica_brand_typography_${contentStyleValue}-font-letter-spacing)`,
        lineHeight: `var(--recursica_brand_typography_${contentStyleValue}-line-height)`,
        fontStyle: `var(--recursica_brand_typography_${contentStyleValue}-font-style)`,
        textDecoration: 'none',
        textTransform: `var(--recursica_brand_typography_${contentStyleValue}-text-transform)` as any,
        color: `var(${contentColorVar})`,
    } as any

    const staticModalStyles = {
        background: `var(${bgVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        boxShadow: elevationBoxShadow || 'none',
        border: `var(${borderSizeVar}) solid var(${borderColorVar})`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: `var(${maxWidthVar})`,
        minWidth: `var(${minWidthVar})`,
        minHeight: `var(${minHeightVar})`,
        maxHeight: `var(${maxHeightVar})`,
        margin: '0 auto',
        position: 'relative',
    } as React.CSSProperties

    const h2Style = {
        margin: 0,
        fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
        fontSize: 'var(--recursica_brand_typography_h2-font-size)',
        fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
        letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
        lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
    } as React.CSSProperties

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: verticalGutter, width: '100%' }}>
            {/* Primary Static Preview */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h2 style={h2Style}>Static</h2>
                <div key={`${updateKey}-primary`} style={staticModalStyles}>
                    {/* Header */}
                    {showHeader && (
                        <div style={{
                            padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                            background: `var(${bgVar})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: scrollable ? `var(${scrollDividerThicknessVar}) solid var(${dividerColorVar})` : 'none',
                        }}>
                            <HeadingTag style={headerStyle}>
                                The Legend of Zog
                            </HeadingTag>
                            <Button
                                variant="text"
                                layer={selectedLayer as any}
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
                        </div>
                    )}

                    {/* Body */}
                    <div style={{
                        padding: padding ? `var(${verticalPaddingVar}) var(${horizontalPaddingVar})` : 0,
                        flex: 1,
                        minHeight: 0,
                        overflowY: scrollable ? 'auto' : 'visible',
                        ...contentStyle
                    } as any}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, ...pStyle }}>
                                {goblinStory}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    {showFooter && (
                        <div style={{
                            padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                            background: `var(${bgVar})`,
                            marginTop: 'auto',
                            borderTop: scrollable ? `var(${scrollDividerThicknessVar}) solid var(${dividerColorVar})` : 'none',
                        }}>
                            <Group justify="flex-end" gap={`var(${buttonGapVar})`}>
                                <Button
                                    variant="text"
                                    layer={selectedLayer as any}
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="solid"
                                    layer={selectedLayer as any}
                                >
                                    Read More
                                </Button>
                            </Group>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrolling Static Preview */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h2 style={h2Style}>Scrolling</h2>
                <div key={`${updateKey}-scrolling`} style={staticModalStyles}>
                    {/* Header with mandatory divider for scrolling example */}
                    <div style={{
                        padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                        background: `var(${bgVar})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `var(${scrollDividerThicknessVar}) solid var(${dividerColorVar})`,
                    }}>
                        <HeadingTag style={headerStyle}>
                            The Legend of Zog
                        </HeadingTag>
                        <Button
                            variant="text"
                            layer={selectedLayer as any}
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
                    </div>

                    {/* Body with forced scrolling */}
                    <div style={{
                        padding: padding ? `var(${verticalPaddingVar}) var(${horizontalPaddingVar})` : 0,
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        ...contentStyle
                    } as any}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, ...pStyle }}>
                                {goblinStory} {goblinStory}
                            </p>
                        </div>
                    </div>

                    {/* Footer with mandatory divider for scrolling example */}
                    <div style={{
                        padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                        background: `var(${bgVar})`,
                        marginTop: 'auto',
                        borderTop: `var(${scrollDividerThicknessVar}) solid var(${dividerColorVar})`,
                    }}>
                        <Group justify="flex-end" gap={`var(${buttonGapVar})`}>
                            <Button
                                variant="text"
                                layer={selectedLayer as any}
                            >
                                Close
                            </Button>
                            <Button
                                variant="solid"
                                layer={selectedLayer as any}
                            >
                                Read More
                            </Button>
                        </Group>
                    </div>
                </div>
            </div>

            {/* Active Modal Trigger */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <Button
                    variant="solid"
                    onClick={() => setIsOpen(true)}
                    layer={selectedLayer as any}
                >
                    Launch Active Modal (Overlay)
                </Button>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="The Legend of Zog"
                size={sizeVariant as any}
                layer={selectedLayer as any}
                elevation={componentElevation}
                showHeader={showHeader}
                showFooter={showFooter}
                scrollable={scrollable}
                padding={padding}
                primaryActionLabel="Read More"
                onPrimaryAction={() => alert('The story continues...')}
                secondaryActionLabel="Close"
                onSecondaryAction={() => setIsOpen(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ margin: 0, ...pStyle }}>
                        The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. This legendary encounter has been told for generations in the deep mines of the Obsidian Mountains. Every word of this story carries the weight of a thousand hammers striking the anvil of truth. The goblin, known as Zog, was not merely swift; he was a master of the dance between light and shadow, and his leap was more than just a movement—it was a statement of freedom in a world carved from unyielding stone.
                    </p>
                    <p style={{ margin: 0, ...pStyle }}>
                        Observers noted that the dwarf, while lazy, seemed impressed by the sheer audacity of the maneuver. The onyx scales of the goblin glistened in the emerald glow of the cavern, creating a spectacle that would be immortalized in the tapestries of the Northern Keep.
                    </p>
                    <p style={{ margin: 0, ...pStyle }}>
                        Generations later, the story is still told in the taverns of the deep earth, often accompanied by the rhythmic clinking of tankards and the hearty laughter of those who honor the legend of the swift goblin and the lazy dwarf.
                    </p>
                </div>
            </Modal>
        </div>
    )
}
