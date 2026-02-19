import { useEffect, useState } from 'react'
import { Panel } from '../../components/adapters/Panel'
import { Button } from '../../components/adapters/Button'
import { X } from '@phosphor-icons/react'
import { Group } from '@mantine/core'
import { getComponentLevelCssVar, getComponentTextCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { getElevationBoxShadow } from '../../components/utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer } from '../../components/registry/types'
import type { PanelPosition } from '../../components/adapters/Panel'

interface PanelPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

const goblinChapter = "After his legendary leap, Zog the goblin found himself standing at the edge of the Crystalline Abyss—a vast chasm where the walls shimmered with veins of raw amethyst and moonstone. The air hummed with an ancient resonance, as if the mountain itself was breathing. Zog's keen eyes caught a glint far below: the fabled Lantern of Ereth, a relic said to hold the first light ever kindled beneath the earth."

const goblinParagraph2 = "\"Down, then,\" Zog muttered, tightening the straps of his obsidian gauntlets. He had not come this far—past the sleeping wyrm, through the Thornroot Maze, and over the lazy dwarf—to turn back now. The lantern's glow pulsed like a heartbeat, casting shifting patterns on the crystal walls."

const goblinParagraph3 = "With each step down the narrow ledge, Zog felt the weight of a thousand years of stories pressing against his back. He was no longer just a swift creature in a dark world; he was the next chapter in a legend that refused to end."

export default function PanelPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: PanelPreviewProps) {
    const { mode } = useThemeMode()
    const [updateKey, setUpdateKey] = useState(0)
    const [activePanel, setActivePanel] = useState<PanelPosition | null>(null)

    // Listen for CSS variable updates to force re-render
    useEffect(() => {
        const handler = () => setUpdateKey((k) => k + 1)
        window.addEventListener('cssVarsUpdated', handler as any)

        const observer = new MutationObserver(() => {
            setUpdateKey((k) => k + 1)
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handler as any)
            observer.disconnect()
        }
    }, [])

    const layer = selectedLayer as ComponentLayer

    // CSS variable names for the static preview
    const bgVar = getComponentLevelCssVar('Panel', `colors.${layer}.background`)
    const borderColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.border-color`)
    const titleColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.title`)
    const contentColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.content`)

    const borderSizeVar = getComponentLevelCssVar('Panel', 'border-size')
    const horizontalPaddingVar = getComponentLevelCssVar('Panel', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Panel', 'vertical-padding')
    const headerContentGapVar = getComponentLevelCssVar('Panel', 'header-content-gap')
    const minWidthVar = getComponentLevelCssVar('Panel', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Panel', 'max-width')

    const headerFontFamilyVar = getComponentTextCssVar('Panel', 'header-text', 'font-family')
    const headerFontSizeVar = getComponentTextCssVar('Panel', 'header-text', 'font-size')
    const headerFontWeightVar = getComponentTextCssVar('Panel', 'header-text', 'font-weight')
    const headerLetterSpacingVar = getComponentTextCssVar('Panel', 'header-text', 'letter-spacing')
    const headerLineHeightVar = getComponentTextCssVar('Panel', 'header-text', 'line-height')
    const headerFontStyleVar = getComponentTextCssVar('Panel', 'header-text', 'font-style')
    const headerTextDecorationVar = getComponentTextCssVar('Panel', 'header-text', 'text-decoration')
    const headerTextTransformVar = getComponentTextCssVar('Panel', 'header-text', 'text-transform')

    const elevationVar = getComponentLevelCssVar('Panel', 'elevation')
    const elevationName = readCssVar(elevationVar) || componentElevation
    const elevationBoxShadow = getElevationBoxShadow(mode, elevationName)

    const headerStyle = {
        color: `var(${titleColorVar})`,
        fontFamily: `var(${headerFontFamilyVar})`,
        fontSize: `var(${headerFontSizeVar})`,
        fontWeight: `var(${headerFontWeightVar})`,
        letterSpacing: `var(${headerLetterSpacingVar})`,
        lineHeight: `var(${headerLineHeightVar})`,
        fontStyle: `var(${headerFontStyleVar})`,
        textDecoration: `var(${headerTextDecorationVar})`,
        textTransform: `var(${headerTextTransformVar})`,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as any

    const bodyStyle = {
        color: `var(${contentColorVar})`,
        fontFamily: 'var(--recursica-brand-typography-body-font-family)',
        fontSize: 'var(--recursica-brand-typography-body-font-size)',
        fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
        lineHeight: 'var(--recursica-brand-typography-body-line-height)',
        letterSpacing: 'var(--recursica-brand-typography-body-letter-spacing)',
    } as React.CSSProperties

    // The panel footer content
    const panelFooter = (onClose?: () => void) => (
        <Group justify="flex-end" gap="var(--recursica-brand-dimensions-general-md)">
            <Button variant="text" layer={layer} onClick={onClose}>
                Close
            </Button>
            <Button variant="solid" layer={layer}>
                Continue
            </Button>
        </Group>
    )

    // The panel body content
    const panelBody = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${headerContentGapVar})`, ...bodyStyle }}>
            <p style={{ margin: 0 }}>{goblinChapter}</p>
            <p style={{ margin: 0 }}>{goblinParagraph2}</p>
            <p style={{ margin: 0 }}>{goblinParagraph3}</p>
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', margin: 'calc(var(--recursica-brand-dimensions-general-xl) * -1)', width: 'calc(100% + var(--recursica-brand-dimensions-general-xl) * 2)', height: 'calc(100% + var(--recursica-brand-dimensions-general-xl) * 2)' } as any}>
            {/* Static Preview — Right panel filling full height */}
            <div
                key={`${updateKey}-static`}
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    minHeight: 0,
                    width: '100%',
                }}
            >
                <div style={{
                    background: `var(${bgVar})`,
                    borderLeft: `var(${borderSizeVar}) solid var(${borderColorVar})`,
                    boxShadow: elevationBoxShadow || 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: `var(${minWidthVar})`,
                    maxWidth: `var(${maxWidthVar})`,
                    width: '100%',
                    height: '100%',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `var(${borderSizeVar}) solid var(${borderColorVar})`,
                        flexShrink: 0,
                    }}>
                        <span style={headerStyle}>
                            The Crystalline Abyss
                        </span>
                        <Button
                            variant="text"
                            layer={layer}
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

                    {/* Body */}
                    <div style={{
                        padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: `var(${headerContentGapVar})`,
                    }}>
                        {panelBody}

                        {/* Launch Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
                            <Button
                                variant="outline"
                                onClick={() => setActivePanel('left')}
                                layer={layer}
                            >
                                Launch Left Panel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setActivePanel('right')}
                                layer={layer}
                            >
                                Launch Right Panel
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: `var(${verticalPaddingVar}) var(${horizontalPaddingVar})`,
                        borderTop: `var(${borderSizeVar}) solid var(${borderColorVar})`,
                        flexShrink: 0,
                    }}>
                        {panelFooter()}
                    </div>
                </div>
            </div>

            {/* Active Panel */}
            {activePanel && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        bottom: 0,
                        [activePanel]: 0,
                        zIndex: 1000,
                        pointerEvents: 'auto',
                    }}
                >
                    <Panel
                        title="The Crystalline Abyss"
                        position={activePanel}
                        layer={layer}
                        elevation={componentElevation}
                        onClose={() => setActivePanel(null)}
                        footer={panelFooter(() => setActivePanel(null))}
                    >
                        {panelBody}
                    </Panel>
                </div>
            )}
        </div>
    )
}
