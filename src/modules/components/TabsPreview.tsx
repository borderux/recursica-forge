import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'

import { iconNameToReactComponent } from './iconUtils'
import { Badge } from '../../components/adapters/Badge'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useRawCssVar } from '../../components/hooks/useCssVar'
import { buildComponentCssVarPath } from '../../components/utils/cssVarNames'
import { layerText } from '../../core/css/cssVarBuilder'
import { h4Style } from './typographyStyles'


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
                    <Tabs.Panel value="gallery" style={contentPanel}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                    <Tabs.Panel value="messages" style={contentPanel}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                    <Tabs.Panel value="settings" style={contentPanel}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                    <Tabs.List>
                        <Tabs.Tab value="gallery">Forge</Tabs.Tab>
                        <Tabs.Tab value="messages">Mines</Tabs.Tab>
                        <Tabs.Tab value="settings">Armory</Tabs.Tab>
                    </Tabs.List>
                </>
            ) : (
                <>
                    <Tabs.List>
                        <Tabs.Tab value="gallery">Forge</Tabs.Tab>
                        <Tabs.Tab value="messages">Mines</Tabs.Tab>
                        <Tabs.Tab value="settings">Armory</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="gallery" style={contentPanel}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                    <Tabs.Panel value="messages" style={contentPanel}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                    <Tabs.Panel value="settings" style={contentPanel}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                </>
            )}
        </Tabs>
    )
}

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
    const layerNum = selectedLayer.replace('layer-', '')
    const textColorVar = layerText(modeLower, layerNum, 'color')
    const textEmphasisVar = layerText(modeLower, layerNum, 'high-emphasis')

    const [value1, setValue1] = useState<string | null>('gallery')
    const [value2, setValue2] = useState<string | null>('gallery')
    const [value3, setValue3] = useState<string | null>('gallery')
    const [value4, setValue4] = useState<string | null>('gallery')
    const [value5, setValue5] = useState<string | null>('gallery')
    const [value6, setValue6] = useState<string | null>('gallery')
    const variant = (selectedVariants.style || 'default') as 'default' | 'pills' | 'outline'
    const orientation = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'
    const tabContentAlignmentVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'tab-content-alignment')
    const tabContentAlignmentRaw = useRawCssVar(tabContentAlignmentVar, 'left')
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

    const activeState = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null
  return (
        <div style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: vertGutter, width: '600px' }}>
      
            {isHorizontal ? (
                <>
                    {/* Section: Tabs on top */}
                    <div>
                        <h4 style={{ ...h4Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Top</h4>

                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</Tabs.Tab>
                                    <Tabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</Tabs.Tab>
                                    <Tabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>
                    </div>

                    {/* Section: Tabs on bottom */}
                    <div>
                        <h4 style={{ ...h4Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Bottom</h4>

                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ inverted: true }} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                                <Tabs.List>
                                    <Tabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</Tabs.Tab>
                                    <Tabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</Tabs.Tab>
                                    <Tabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</Tabs.Tab>
                                </Tabs.List>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ inverted: true }} >
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                                <Tabs.List>
                                    <Tabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>
                            </Tabs>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Section: Tabs on left */}
                    <div>
                        <h4 style={{ ...h4Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Left</h4>

                        <div style={previewMargin}>
                            <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value2 ?? undefined} onChange={(v) => setValue2(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</Tabs.Tab>
                                    <Tabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</Tabs.Tab>
                                    <Tabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value3 ?? undefined} onChange={(v) => setValue3(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>
                    </div>

                    {/* Section: Tabs on right */}
                    <div>
                        <h4 style={{ ...h4Style, ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }}>Right</h4>

                        <div style={previewMargin}>
                            <TabSet value={value4} onChange={setValue4} {...tabSetProps} mantineOverrides={{ placement: 'right' }} />
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value5 ?? undefined} onChange={(v) => setValue5(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Forge</Tabs.Tab>
                                    <Tabs.Tab value="messages" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Mines</Tabs.Tab>
                                    <Tabs.Tab value="settings" leftSection={ShieldIcon ? <ShieldIcon size={16} /> : undefined}>Armory</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>


                        <div style={previewMargin}>
                            <Tabs value={value6 ?? undefined} onChange={(v) => setValue6(v ?? null)} variant={variant} orientation={orientation} tabContentAlignment={tabContentAlignment} layer={selectedLayer} mantine={{ placement: 'right' }} >
                                <Tabs.List>
                                    <Tabs.Tab value="gallery">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Forge</span>
                                            <Badge variant="primary-color">42</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="messages">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Mines</span>
                                            <Badge variant="primary-color">7</Badge>
                                        </div>
                                    </Tabs.Tab>
                                    <Tabs.Tab value="settings">
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <span>Armory</span>
                                            <Badge variant="primary-color">104</Badge>
                                        </div>
                                    </Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="gallery" style={panelStyle}>The forge burns bright with molten ore and enchanted embers.</Tabs.Panel>
                                <Tabs.Panel value="messages" style={panelStyle}>Deep tunnels echo with the sound of pickaxes and distant rumbles.</Tabs.Panel>
                                <Tabs.Panel value="settings" style={panelStyle}>Racks of enchanted weapons gleam under the lantern light.</Tabs.Panel>
                            </Tabs>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
