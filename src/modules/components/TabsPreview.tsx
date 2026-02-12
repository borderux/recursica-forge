import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'
import { Tabs as MantineTabs } from '@mantine/core'
import { Image, ChatCircle, Gear } from '@phosphor-icons/react'
import { Badge } from '../../components/adapters/Badge'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useCssVar } from '../../components/hooks/useCssVar'
import { buildComponentCssVarPath } from '../../components/utils/cssVarNames'

interface TabsPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

const contentPanelStyle = (mode: string) => ({
    backgroundColor: `var(--recursica-brand-themes-${mode}-palettes-neutral-100-tone)`,
    color: `var(--recursica-brand-themes-${mode}-palettes-neutral-100-on-tone)`,
    padding: 'var(--recursica-brand-dimensions-general-default)',
    fontFamily: 'var(--recursica-brand-typography-body-font-family)',
    fontSize: 'var(--recursica-brand-typography-body-font-size)',
    fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
    letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
    lineHeight: 'var(--recursica-brand-typography-body-line-height)',
} as React.CSSProperties)

function TabSet({
    value,
    onChange,
    variant,
    orientation,
    tabContentAlignment = 'left',
    layer,
    mantineOverrides,
    contentPanel,
}: {
    value: string | null
    onChange: (v: string | null) => void
    variant: 'default' | 'pills' | 'outline'
    orientation: 'horizontal' | 'vertical'
    tabContentAlignment?: 'left' | 'center' | 'right'
    layer: string
    mantineOverrides?: { inverted?: boolean; placement?: 'left' | 'right' }
    contentPanel: React.CSSProperties
}) {
    const isInverted = mantineOverrides?.inverted
    return (
        <Tabs
            value={value ?? undefined}
            onChange={(newValue) => onChange(newValue ?? null)}
            variant={variant}
            orientation={orientation}
            tabContentAlignment={tabContentAlignment}
            layer={layer}
            mantine={mantineOverrides}
        >
            {isInverted ? (
                <>
                    <MantineTabs.Panel value="gallery" style={contentPanel}>Gallery tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={contentPanel}>Messages tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={contentPanel}>Settings tab content</MantineTabs.Panel>
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">Gallery</MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">Messages</MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">Settings</MantineTabs.Tab>
                    </MantineTabs.List>
                </>
            ) : (
                <>
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">Gallery</MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">Messages</MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">Settings</MantineTabs.Tab>
                    </MantineTabs.List>
                    <MantineTabs.Panel value="gallery" style={contentPanel}>Gallery tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={contentPanel}>Messages tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={contentPanel}>Settings tab content</MantineTabs.Panel>
                </>
            )}
        </Tabs>
    )
}

const h2Style = {
    margin: 0,
    fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
    fontSize: 'var(--recursica-brand-typography-h2-font-size)',
    fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
    letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
    lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
} as React.CSSProperties

const h3Style = {
    margin: 0,
    fontFamily: 'var(--recursica-brand-typography-h3-font-family)',
    fontSize: 'var(--recursica-brand-typography-h3-font-size)',
    fontWeight: 'var(--recursica-brand-typography-h3-font-weight)',
    letterSpacing: 'var(--recursica-brand-typography-h3-font-letter-spacing)',
    lineHeight: 'var(--recursica-brand-typography-h3-line-height)',
    textAlign: 'left' as const,
} as React.CSSProperties

export default function TabsPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TabsPreviewProps) {
    const { mode } = useThemeMode()
    const modeLower = mode.toLowerCase()
    const textColorVar = `--recursica-brand-themes-${modeLower}-layers-${selectedLayer}-elements-text-color`
    const textEmphasisVar = `--recursica-brand-themes-${modeLower}-layers-${selectedLayer}-elements-text-high-emphasis`

    const [value1, setValue1] = useState<string | null>('gallery')
    const [value2, setValue2] = useState<string | null>('gallery')
    const [value3, setValue3] = useState<string | null>('gallery')
    const [value4, setValue4] = useState<string | null>('gallery')
    const [value5, setValue5] = useState<string | null>('gallery')
    const [value6, setValue6] = useState<string | null>('gallery')
    const variant = (selectedVariants.style || 'default') as 'default' | 'pills' | 'outline'
    const orientation = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'
    const tabContentAlignmentVar = buildComponentCssVarPath('Tabs', 'properties', 'tab-content-alignment')
    const tabContentAlignmentRaw = useCssVar(tabContentAlignmentVar, 'left')
    const tabContentAlignment = (tabContentAlignmentRaw?.trim().replace(/^["']|["']$/g, '') || 'left') as 'left' | 'center' | 'right'

    const isHorizontal = orientation === 'horizontal'
    const panelStyle = contentPanelStyle(modeLower)
    const tabSetProps = { variant, orientation, tabContentAlignment, layer: selectedLayer, contentPanel: panelStyle }

    const headerToPreviewGap = 'var(--recursica-brand-dimensions-general-default)'
    const previewToHeaderGap = 'var(--recursica-brand-dimensions-gutters-vertical)'
    const vertGutter = 'var(--recursica-brand-dimensions-gutters-vertical)'
    const headerMargin = { marginBottom: headerToPreviewGap }
    const previewMargin = { marginBottom: previewToHeaderGap }

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: vertGutter, width: '600px' }}>
            {isHorizontal ? (
                <>
                    {/* Section: Tabs on top */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Top</h2>
                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <div style={previewMargin}>
                        <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <div style={previewMargin}>
                        <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Gallery</span>
                                        <Badge variant="primary-color">42</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="messages">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Messages</span>
                                        <Badge variant="primary-color">7</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="settings">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Settings</span>
                                        <Badge variant="primary-color">104</Badge>
                                    </div>
                                </MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>
                    </section>

                    {/* Section: Tabs on bottom */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Bottom</h2>
                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ inverted: true }} />
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <div style={previewMargin}>
                        <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                        </Tabs>
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <div style={previewMargin}>
                        <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Gallery</span>
                                        <Badge variant="primary-color">42</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="messages">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Messages</span>
                                        <Badge variant="primary-color">7</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="settings">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Settings</span>
                                        <Badge variant="primary-color">104</Badge>
                                    </div>
                                </MantineTabs.Tab>
                            </MantineTabs.List>
                        </Tabs>
                        </div>
                    </section>
                </>
            ) : (
                <>
                    {/* Section: Tabs on left */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Left</h2>
                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <div style={previewMargin}>
                        <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <div style={previewMargin}>
                        <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Gallery</span>
                                        <Badge variant="primary-color">42</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="messages">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Messages</span>
                                        <Badge variant="primary-color">7</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="settings">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Settings</span>
                                        <Badge variant="primary-color">104</Badge>
                                    </div>
                                </MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>
                    </section>

                    {/* Section: Tabs on right */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Right</h2>
                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ placement: 'right' }} />
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <div style={previewMargin}>
                        <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>

                        <h3 style={{ ...h3Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <div style={previewMargin}>
                        <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Gallery</span>
                                        <Badge variant="primary-color">42</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="messages">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Messages</span>
                                        <Badge variant="primary-color">7</Badge>
                                    </div>
                                </MantineTabs.Tab>
                                <MantineTabs.Tab value="settings">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span>Settings</span>
                                        <Badge variant="primary-color">104</Badge>
                                    </div>
                                </MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={panelStyle}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={panelStyle}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={panelStyle}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
