import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'

import { useThemeMode } from '../theme/ThemeModeContext'
import { useRawCssVar } from '../../components/hooks/useCssVar'
import { buildComponentCssVarPath } from '../../components/utils/cssVarNames'
import { layerText } from '../../core/css/cssVarBuilder'
import { getTypographyStyle } from './typographyStyles'


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

export default function TabsPreview({
    selectedVariants,
    selectedLayer,
}: TabsPreviewProps) {
    const { mode } = useThemeMode()
    const modeLower = mode.toLowerCase()
    const layerNum = selectedLayer.replace('layer-', '')
    const textColorVar = layerText(modeLower, layerNum, 'color')
    const textEmphasisVar = layerText(modeLower, layerNum, 'high-emphasis')

    const [value1, setValue1] = useState<string | null>('gallery')
    const [value2, setValue2] = useState<string | null>('gallery')
    const variant = (selectedVariants.style || 'default') as 'default' | 'pills' | 'outline'
    const orientation = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'
    // Content alignment now lives on TabsItem, per style × orientation.
    const tabContentAlignmentVar = buildComponentCssVarPath('TabsItem', 'variants', 'styles', variant, 'variants', 'orientation', orientation, 'properties', 'tab-content-alignment')
    const tabContentAlignmentRaw = useRawCssVar(tabContentAlignmentVar, 'left')
    const tabContentAlignment = (tabContentAlignmentRaw?.trim().replace(/^["']|["']$/g, '') || 'left') as 'left' | 'center' | 'right'

    const isHorizontal = orientation === 'horizontal'
    const panelStyle = contentPanelStyle(modeLower)
    const tabSetProps = { variant, orientation, tabContentAlignment, layer: selectedLayer, contentPanel: panelStyle }

    const vertGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'
    const headerMargin = { marginBottom: vertGutter }
    const headerStyle = { ...getTypographyStyle('h4'), ...headerMargin, color: `var(${textColorVar})`, opacity: `var(${textEmphasisVar})` }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vertGutter, width: '600px' }}>
            {isHorizontal ? (
                <>
                    <div>
                        <h4 style={headerStyle}>Top</h4>
                        <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                    </div>
                    <div>
                        <h4 style={headerStyle}>Bottom</h4>
                        <TabSet value={value2} onChange={setValue2} {...tabSetProps} mantineOverrides={{ inverted: true }} />
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <h4 style={headerStyle}>Left</h4>
                        <TabSet value={value1} onChange={setValue1} {...tabSetProps} />
                    </div>
                    <div>
                        <h4 style={headerStyle}>Right</h4>
                        <TabSet value={value2} onChange={setValue2} {...tabSetProps} mantineOverrides={{ placement: 'right' }} />
                    </div>
                </>
            )}
        </div>
    )
}
