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

function TabSet({
    value,
    onChange,
    variant,
    orientation,
    tabContentAlignment = 'left',
    layer,
    mantineOverrides,
}: {
    value: string | null
    onChange: (v: string | null) => void
    variant: 'default' | 'pills' | 'outline'
    orientation: 'horizontal' | 'vertical'
    tabContentAlignment?: 'left' | 'center' | 'right'
    layer: string
    mantineOverrides?: { inverted?: boolean; placement?: 'left' | 'right' }
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
                    <MantineTabs.Panel value="gallery" style={{ paddingBlock: '0 8px' }}>Gallery tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={{ paddingBlock: '0 8px' }}>Messages tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={{ paddingBlock: '0 8px' }}>Settings tab content</MantineTabs.Panel>
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
                    <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
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
    const textColorVar = `--recursica-brand-themes-${modeLower}-layer-${selectedLayer}-property-element-text-color`
    const textEmphasisVar = `--recursica-brand-themes-${modeLower}-layer-${selectedLayer}-property-element-text-high-emphasis`

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
    const tabSetProps = { variant, orientation, tabContentAlignment, layer: selectedLayer }

    const vertGutter = 'var(--recursica-brand-dimensions-gutters-vertical)'

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: vertGutter, width: '600px' }}>
            {isHorizontal ? (
                <>
                    {/* Section: Tabs on top */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: vertGutter }}>
                        <h2 style={{ ...h2Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Top</h2>
                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <TabSet value={value1} onChange={setValue1} {...tabSetProps} />

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer}>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer}>
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
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                    </section>

                    {/* Section: Tabs on bottom */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: vertGutter }}>
                        <h2 style={{ ...h2Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Bottom</h2>
                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ inverted: true }} />

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }}>
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '0 8px' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '0 8px' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '0 8px' }}>Settings tab content</MantineTabs.Panel>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                        </Tabs>

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }}>
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '0 8px' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '0 8px' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '0 8px' }}>Settings tab content</MantineTabs.Panel>
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
                    </section>
                </>
            ) : (
                <>
                    {/* Section: Tabs on left */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: vertGutter }}>
                        <h2 style={{ ...h2Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Left</h2>
                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <TabSet value={value1} onChange={setValue1} {...tabSetProps} />

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer}>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer}>
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
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                    </section>

                    {/* Section: Tabs on right */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: vertGutter }}>
                        <h2 style={{ ...h2Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Right</h2>
                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text</h3>
                        <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ placement: 'right' }} />

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with icons</h3>
                        <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }}>
                            <MantineTabs.List>
                                <MantineTabs.Tab value="gallery" leftSection={<Image size={16} weight="regular" />}>Gallery</MantineTabs.Tab>
                                <MantineTabs.Tab value="messages" leftSection={<ChatCircle size={16} weight="regular" />}>Messages</MantineTabs.Tab>
                                <MantineTabs.Tab value="settings" leftSection={<Gear size={16} weight="regular" />}>Settings</MantineTabs.Tab>
                            </MantineTabs.List>
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>

                        <h3 style={{ ...h3Style, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Text with badges</h3>
                        <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }}>
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
                            <MantineTabs.Panel value="gallery" style={{ paddingBlock: '8px 0' }}>Gallery tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="messages" style={{ paddingBlock: '8px 0' }}>Messages tab content</MantineTabs.Panel>
                            <MantineTabs.Panel value="settings" style={{ paddingBlock: '8px 0' }}>Settings tab content</MantineTabs.Panel>
                        </Tabs>
                    </section>
                </>
            )}
        </div>
    )
}
