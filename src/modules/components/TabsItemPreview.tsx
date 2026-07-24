/**
 * Tabs Item Preview
 *
 * Preview for the "Tabs item" theming sub-component. The individual tab's active/inactive
 * appearance (colors, border, text, spacing) is read by the Tabs adapter — so this preview
 * renders the tab in the selected style/orientation across three content shapes (plain text,
 * with an icon, with a badge) so every per-tab property (padding, icon size, element gap,
 * colors, text) is visible while editing. The Style + State dropdowns pick which style/state
 * the property controls edit.
 */

import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'
import { Badge } from '../../components/adapters/Badge'
import { iconNameToReactComponent } from './iconUtils'

interface TabsItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function TabsItemPreview({ selectedVariants, selectedLayer }: TabsItemPreviewProps) {
    const variant = (selectedVariants.style || 'default') as 'default' | 'pills' | 'outline'
    const orientation = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'
    const [plain, setPlain] = useState<string | null>('active')
    const [icons, setIcons] = useState<string | null>('active')
    const [badges, setBadges] = useState<string | null>('active')

    const FireIcon = iconNameToReactComponent('fire')
    const DiamondIcon = iconNameToReactComponent('diamond')

    const tabsProps = { variant, orientation, layer: selectedLayer }

    const gutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: gutter }}>
            {/* Plain text */}
            <Tabs value={plain ?? undefined} onChange={(v) => setPlain(v ?? null)} {...tabsProps}>
                <Tabs.List>
                    <Tabs.Tab value="active">Active tab</Tabs.Tab>
                    <Tabs.Tab value="inactive">Inactive tab</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* With icons */}
            <Tabs value={icons ?? undefined} onChange={(v) => setIcons(v ?? null)} {...tabsProps}>
                <Tabs.List>
                    <Tabs.Tab value="active" leftSection={FireIcon ? <FireIcon size={16} /> : undefined}>Active tab</Tabs.Tab>
                    <Tabs.Tab value="inactive" leftSection={DiamondIcon ? <DiamondIcon size={16} /> : undefined}>Inactive tab</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* With badges */}
            <Tabs value={badges ?? undefined} onChange={(v) => setBadges(v ?? null)} {...tabsProps}>
                <Tabs.List>
                    <Tabs.Tab value="active">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>Active tab</span>
                            <Badge variant="primary-color">42</Badge>
                        </div>
                    </Tabs.Tab>
                    <Tabs.Tab value="inactive">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>Inactive tab</span>
                            <Badge variant="primary-color">7</Badge>
                        </div>
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>
        </div>
    )
}
