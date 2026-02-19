import { useEffect, useState } from 'react'
import { Panel } from '../../components/adapters/Panel'
import { Button } from '../../components/adapters/Button'
import { X } from '@phosphor-icons/react'
import { Group } from '@mantine/core'
import { getComponentLevelCssVar } from '../../components/utils/cssVarNames'
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
    const hfBgVar = getComponentLevelCssVar('Panel', `colors.${layer}.header-footer-background`)
    const borderColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.border-color`)
    const dividerColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.divider-color`)
    const titleColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.title`)
    const contentColorVar = getComponentLevelCssVar('Panel', `colors.${layer}.content`)

    const borderRadiusVar = getComponentLevelCssVar('Panel', 'border-radius')
    const borderSizeVar = getComponentLevelCssVar('Panel', 'border-size')
    const dividerThicknessVar = getComponentLevelCssVar('Panel', 'divider-thickness')
    const hfHPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-horizontal-padding')
    const hfVPaddingVar = getComponentLevelCssVar('Panel', 'header-footer-vertical-padding')
    const contentHPaddingVar = getComponentLevelCssVar('Panel', 'content-horizontal-padding')
    const contentVPaddingVar = getComponentLevelCssVar('Panel', 'content-vertical-padding')
    const headerCloseGapVar = getComponentLevelCssVar('Panel', 'header-close-gap')
    const footerButtonGapVar = getComponentLevelCssVar('Panel', 'footer-button-gap')
    const minWidthVar = getComponentLevelCssVar('Panel', 'min-width')
    const maxWidthVar = getComponentLevelCssVar('Panel', 'max-width')

    const headerStyleVar = getComponentLevelCssVar('Panel', 'header-style')
    const headerStyleValue = readCssVar(headerStyleVar) || 'h3'

    const elevationVar = getComponentLevelCssVar('Panel', 'elevation')
    const elevationName = readCssVar(elevationVar) || componentElevation
    const elevationBoxShadow = getElevationBoxShadow(mode, elevationName)

    const headerStyle = {
        color: `var(${titleColorVar})`,
        fontFamily: `var(--recursica-brand-typography-${headerStyleValue}-font-family)`,
        fontSize: `var(--recursica-brand-typography-${headerStyleValue}-font-size)`,
        fontWeight: `var(--recursica-brand-typography-${headerStyleValue}-font-weight)`,
        letterSpacing: `var(--recursica-brand-typography-${headerStyleValue}-letter-spacing)`,
        lineHeight: `var(--recursica-brand-typography-${headerStyleValue}-line-height)`,
        fontStyle: `var(--recursica-brand-typography-${headerStyleValue}-font-style)`,
        textDecoration: 'none',
        textTransform: `var(--recursica-brand-typography-${headerStyleValue}-text-transform)`,
        flex: 1,
        minWidth: 0,
        overflow: 'clip',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingBottom: '0.15em',
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
        <Group justify="flex-end" gap={`var(${footerButtonGapVar})`}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-md)', ...bodyStyle }}>
            <p style={{ margin: 0 }}>{goblinChapter}</p>
            <p style={{ margin: 0 }}>{goblinParagraph2}</p>
            <p style={{ margin: 0 }}>{goblinParagraph3}</p>
        </div>
    )

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            marginTop: 'calc(var(--recursica-brand-dimensions-general-md) * -1)',
            marginRight: 'calc(var(--recursica-brand-dimensions-general-md) * -1)',
            marginBottom: 'calc(var(--recursica-brand-dimensions-general-md) * -1)',
            marginLeft: 'auto',
            height: 'calc(100% + var(--recursica-brand-dimensions-general-md) * 2)',
            alignSelf: 'stretch',
        } as any}>
            {/* Static Preview — Right panel filling full height */}
            <div
                key={`${updateKey}-static`}
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    minHeight: 0,
                }}
            >
                <div style={{
                    background: `var(${bgVar})`,
                    borderLeft: `var(${borderSizeVar}) solid var(${borderColorVar})`,
                    borderRadius: `var(${borderRadiusVar}) 0 0 var(${borderRadiusVar})`,
                    boxShadow: elevationBoxShadow || 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '400px',
                    height: '100%',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: `var(${hfVPaddingVar}) var(${hfHPaddingVar})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: `var(${headerCloseGapVar})`,
                        borderBottom: `var(${dividerThicknessVar}) solid var(${dividerColorVar})`,
                        flexShrink: 0,
                        background: `var(${hfBgVar})`,
                    }}>
                        <span style={headerStyle}>
                            Right panel
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
                        padding: `var(${contentVPaddingVar}) var(${contentHPaddingVar})`,
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--recursica-brand-dimensions-general-md)',
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
                        padding: `var(${hfVPaddingVar}) var(${hfHPaddingVar})`,
                        borderTop: `var(${dividerThicknessVar}) solid var(${dividerColorVar})`,
                        flexShrink: 0,
                        background: `var(${hfBgVar})`,
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
                        width: '400px',
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
