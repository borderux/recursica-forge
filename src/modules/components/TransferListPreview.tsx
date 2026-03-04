import { useMemo } from 'react'
import { TransferList } from '../../components/adapters/TransferList'
import type { TransferListData } from '../../components/adapters/TransferList'
import { useThemeMode } from '../theme/ThemeModeContext'

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

    // Extract state variant
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled'

    // Show both layouts if no specific layout is selected, otherwise show selected layout
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = selectedVariants.layouts
        ? [(selectedVariants.layouts as 'stacked' | 'side-by-side')]
        : ['stacked', 'side-by-side']

    const h2Style = {
        margin: 0,
        marginBottom: 16,
        textTransform: 'capitalize' as const,
        fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
        fontSize: 'var(--recursica-brand-typography-h2-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
    } as React.CSSProperties

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
            width: '100%',
            alignItems: 'center',
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '680px' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <TransferList
                        label="Forge Inventory"
                        sourceLabel="Available"
                        targetLabel="Selected for crafting"
                        defaultData={DEFAULT_DATA}
                        state={state}
                        layer={selectedLayer as any}
                        layout={layoutVariant}
                        searchable
                        searchPlaceholder="Filter items..."
                        helpText={state === 'default' ? 'Select items and use the arrows to transfer them' : undefined}
                        errorText={state === 'error' ? 'At least 3 materials must be selected for crafting' : undefined}
                    />
                </div>
            ))}
        </div>
    )
}
