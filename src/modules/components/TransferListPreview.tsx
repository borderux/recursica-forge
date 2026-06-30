import { useMemo } from 'react'
import { TransferList } from '../../components/adapters/TransferList'
import type { TransferListData } from '../../components/adapters/TransferList'
import { useThemeMode } from '../theme/ThemeModeContext'
import { h2Style, h3Style } from './typographyStyles'


interface TransferListPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

// Goblin-themed sample data with groups
const DEFAULT_DATA: TransferListData = [
    [
        { value: 'forge-hammer', label: 'Forge Hammer', group: 'Tools' },
        { value: 'enchanted-anvil', label: 'Enchanted Anvil', group: 'Tools' },
        { value: 'runic-tongs', label: 'Runic Tongs', group: 'Tools' },
        { value: 'fire-bellows', label: 'Fire Bellows', group: 'Tools' },
        { value: 'mithril-ore', label: 'Mithril Ore', group: 'Materials' },
        { value: 'dragon-scale', label: 'Dragon Scale', group: 'Materials' },
        { value: 'moonstone', label: 'Moonstone', group: 'Materials' },
        { value: 'shadow-essence', label: 'Shadow Essence', group: 'Materials' },
        { value: 'goblin-grease', label: 'Goblin Grease', group: 'Materials' },
    ],
    [
        { value: 'obsidian-blade', label: 'Obsidian Blade', group: 'Artifacts' },
        { value: 'phoenix-feather', label: 'Phoenix Feather', group: 'Materials' },
    ],
]

export default function TransferListPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TransferListPreviewProps) {
    const { mode } = useThemeMode()

    // Extract state variant — allows custom states
    const state = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null

    // Show the selected layout; fall back to showing both built-in layouts when none selected
    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
            width: '100%',
            alignItems: 'flex-start',
        }}>
            
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                    
                    <TransferList
                        label="Forge Inventory"
                        sourceLabel="Available"
                        targetLabel="Selected for crafting"
                        defaultData={DEFAULT_DATA}
                        state={state === null ? undefined : state}
                        layer={selectedLayer as any}
                        layout={layoutVariant}
                        searchable
                        searchPlaceholder="Filter items..."
                        helpText={state !== 'error' ? 'Select items and use the arrows to transfer them' : undefined}
                        errorText={state === 'error' ? 'At least 3 materials must be selected for crafting' : undefined}
                    />
                </div>
            ))}
        </div>
    )
}
