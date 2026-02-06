import { useState, useMemo, useEffect } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { Box, Group, Text } from '@mantine/core'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { getElevationBoxShadow } from '../../components/utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'

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

    // Listen for CSS variable updates to force re-render
    useEffect(() => {
        const handler = () => setUpdateKey((k) => k + 1)
        window.addEventListener('cssVarsUpdated', handler as any)
        return () => window.removeEventListener('cssVarsUpdated', handler as any)
    }, [])

    // Get CSS variable names for the static preview
    const bgVar = getComponentCssVar('Modal', 'colors', 'background', selectedLayer as ComponentLayer)
    const titleColorVar = getComponentCssVar('Modal', 'colors', 'title', selectedLayer as ComponentLayer)
    const borderColorVar = getComponentCssVar('Modal', 'colors', 'border-color', selectedLayer as ComponentLayer)
    const dividerColorVar = getComponentCssVar('Modal', 'colors', 'scroll-divider', selectedLayer as ComponentLayer)

    const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Modal', 'border-size')
    const scrollDividerThicknessVar = getComponentLevelCssVar('Modal', 'scroll-divider-thickness')
    const horizontalPaddingVar = getComponentLevelCssVar('Modal', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Modal', 'vertical-padding')
    const buttonGapVar = getComponentLevelCssVar('Modal', 'button-gap')
    const minWidthVar = getComponentLevelCssVar('Modal', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Modal', 'max-width')

    const headerFontFamilyVar = getComponentTextCssVar('Modal', 'header-text', 'font-family')
    const headerFontSizeVar = getComponentTextCssVar('Modal', 'header-text', 'font-size')
    const headerFontWeightVar = getComponentTextCssVar('Modal', 'header-text', 'font-weight')

    const contentFontFamilyVar = getComponentTextCssVar('Modal', 'content-text', 'font-family')
    const contentFontSizeVar = getComponentTextCssVar('Modal', 'content-text', 'font-size')
    const contentFontWeightVar = getComponentTextCssVar('Modal', 'content-text', 'font-weight')

    const elevationVar = getComponentLevelCssVar('Modal', 'elevation')

    const elevationName = readCssVar(elevationVar) || componentElevation
    const elevationBoxShadow = getElevationBoxShadow(mode, elevationName)

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
        margin: '0 auto',
        position: 'relative',
    } as React.CSSProperties

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', width: '100%' }}>
            {/* Primary Static Preview */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontFamily: `var(${headerFontFamilyVar})` }}>Static</h2>
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
                            <span style={{
                                color: `var(${titleColorVar})`,
                                fontFamily: `var(${headerFontFamilyVar})`,
                                fontSize: `var(${headerFontSizeVar})`,
                                fontWeight: `var(${headerFontWeightVar})`,
                            }}>
                                The Legend of Zog
                            </span>
                            <Button
                                variant="text"
                                layer={selectedLayer as any}
                                style={{ padding: 4, minWidth: 0, width: 24, height: 24 }}
                                icon="x"
                            />
                        </div>
                    )}

                    {/* Body */}
                    <div style={{
                        padding: padding ? `var(${verticalPaddingVar}) var(${horizontalPaddingVar})` : 0,
                        maxHeight: '200px',
                        overflowY: scrollable ? 'auto' : 'visible',
                        flex: 1,
                        fontFamily: `var(${contentFontFamilyVar})`,
                        fontSize: `var(${contentFontSizeVar})`,
                        fontWeight: `var(${contentFontWeightVar})`,
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, lineHeight: 1.6 }}>
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
                            <Group justify="flex-end" gap={`var(${buttonGapVar}, 0px)`}>
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
                <h2 style={{ margin: 0, fontFamily: `var(${headerFontFamilyVar})` }}>Scrolling</h2>
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
                        <span style={{
                            color: `var(${titleColorVar})`,
                            fontFamily: `var(${headerFontFamilyVar})`,
                            fontSize: `var(${headerFontSizeVar})`,
                            fontWeight: `var(${headerFontWeightVar})`,
                        }}>
                            The Legend of Zog
                        </span>
                        <Button
                            variant="text"
                            layer={selectedLayer as any}
                            style={{ padding: 4, minWidth: 0, width: 24, height: 24 }}
                            icon="x"
                        />
                    </div>

                    {/* Body with forced scrolling */}
                    <div style={{
                        padding: padding ? `var(${verticalPaddingVar}) var(${horizontalPaddingVar})` : 0,
                        maxHeight: '150px',
                        overflowY: 'auto',
                        flex: 1,
                        fontFamily: `var(${contentFontFamilyVar})`,
                        fontSize: `var(${contentFontSizeVar})`,
                        fontWeight: `var(${contentFontWeightVar})`,
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, lineHeight: 1.6 }}>
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
                        <Group justify="flex-end" gap={`var(${buttonGapVar}, 0px)`}>
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
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        {goblinStory}
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        Observers noted that the dwarf, while lazy, seemed impressed by the sheer audacity of the maneuver. The onyx scales of the goblin glistened in the emerald glow of the cavern, creating a spectacle that would be immortalized in the tapestries of the Northern Keep.
                    </p>
                </div>
            </Modal>
        </div>
    )
}
