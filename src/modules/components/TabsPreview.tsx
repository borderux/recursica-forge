import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'
import { Tabs as MantineTabs } from '@mantine/core'
import { iconNameToReactComponent } from './iconUtils'
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
    backgroundColor: `var(--recursica_brand_palettes_neutral_100_color_tone)`,
    color: `var(--recursica_brand_palettes_neutral_100_color_on-tone)`,
    padding: 'var(--recursica_brand_dimensions_general_default)',
    fontFamily: 'var(--recursica_brand_typography_body-font-family)',
    fontSize: 'var(--recursica_brand_typography_body-font-size)',
    fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
    letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_body-line-height)',
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
                    <MantineTabs.Panel value="gallery" style={contentPanel}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={contentPanel}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={contentPanel}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">Forge</MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">Mines</MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">Armory</MantineTabs.Tab>
                    </MantineTabs.List>
                </>
            ) : (
                <>
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">Forge</MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">Mines</MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">Armory</MantineTabs.Tab>
                    </MantineTabs.List>
                    <MantineTabs.Panel value="gallery" style={contentPanel}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                    <MantineTabs.Panel value="messages" style={contentPanel}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                    <MantineTabs.Panel value="settings" style={contentPanel}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                </>
            )}
        </Tabs>
    )
}

const h2Style = {
    margin: 0,
    fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
    fontSize: 'var(--recursica_brand_typography_h2-font-size)',
    fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
    letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
} as React.CSSProperties

const h3Style = {
    margin: 0,
    fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
    fontSize: 'var(--recursica_brand_typography_h3-font-size)',
    fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
    letterSpacing: 'var(--recursica_brand_typography_h3-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_h3-line-height)',
    textAlign: 'left' as const,
} as React.CSSProperties

export default function TabsPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TabsPreviewProps) {
    const { mode } = useThemeMode()
    const modeLower = mode.toLowerCase()
    const textColorVar = `--recursica_brand_themes_${modeLower}_layers_${selectedLayer}-elements-text-color`
    const textEmphasisVar = `--recursica_brand_themes_${modeLower}_layers_${selectedLayer}-elements-text-high-emphasis`

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

    // Get contextual icons for tabs
    const FireIcon = iconNameToReactComponent('fire')
    const DiamondIcon = iconNameToReactComponent('diamond')
    const ShieldIcon = iconNameToReactComponent('shield')

    const headerToPreviewGap = 'var(--recursica_brand_dimensions_general_default)'
    const previewToHeaderGap = 'var(--recursica_brand_dimensions_gutters_vertical)'
    const vertGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'
    const headerMargin = { marginBottom: headerToPreviewGap }
    const previewMargin = { marginBottom: previewToHeaderGap }

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: vertGutter, width: '600px' }}>
            {isHorizontal ? (
                <>
                    {/* Section: Tabs on top */}
                    <div>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Top</h2>

                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>
                    </div>

                    {/* Section: Tabs on bottom */}
                    <div>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Bottom</h2>

                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ inverted: true }} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</MantineTabs.Tab>
                                </MantineTabs.List>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                </MantineTabs.List>
                            </Tabs>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Section: Tabs on left */}
                    <div>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Left</h2>

                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>
                    </div>

                    {/* Section: Tabs on right */}
                    <div>
                        <h2 style={{ ...h2Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Right</h2>

                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ placement: 'right' }} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                                <MantineTabs.List>
                                    <MantineTabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                    <MantineTabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </MantineTabs.Tab>
                                </MantineTabs.List>
                                <MantineTabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</MantineTabs.Panel>
                                <MantineTabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</MantineTabs.Panel>
                                <MantineTabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</MantineTabs.Panel>
                            </Tabs>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
