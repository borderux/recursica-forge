import { useMemo, useState } from 'react'
import { Autocomplete } from '../../components/adapters/Autocomplete'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


interface AutocompletePreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function AutocompletePreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: AutocompletePreviewProps) {
    const { mode } = useThemeMode()

    const state = (selectedVariants.states || 'default') 
    const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const StarIcon = iconNameToReactComponent('star')
    const SearchIcon = iconNameToReactComponent('search')

    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    const items = [
        { value: 'forge-hammer', label: 'Forge Hammer', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'goblin-pickaxe', label: 'Goblin Pickaxe', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'enchanted-anvil', label: 'Enchanted Anvil', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'mithril-tongs', label: 'Mithril Tongs', leadingIconType: 'none' as const },
        { value: 'dragon-bellows', label: 'Dragon Bellows', leadingIconType: 'none' as const },
        { value: 'crystal-quenching-oil', label: 'Crystal Quenching Oil', leadingIconType: 'none' as const },
        { value: 'runic-chisel', label: 'Runic Chisel', leadingIconType: 'none' as const },
        { value: 'shadow-ingot', label: 'Shadow Ingot', leadingIconType: 'none' as const },
        { value: 'phoenix-flux', label: 'Phoenix Flux', leadingIconType: 'none' as const },
    ]

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'flex-start'
        }}>
            
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Default state */}
                        {state === 'default' && (
                            <>
                                <Autocomplete
                                    label="Forge Tool"
                                    placeholder="Search goblin forge tools..."
                                    items={items}
                                    leadingIcon={SearchIcon ? <SearchIcon /> : undefined}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Autocomplete
                                    label="Selected Tool"
                                    placeholder="Search goblin forge tools..."
                                    items={items}
                                    defaultValue="Forge Hammer"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <Autocomplete
                                label="Forge Tool"
                                placeholder="Search goblin forge tools..."
                                items={items}
                                leadingIcon={SearchIcon ? <SearchIcon /> : undefined}
                                errorText="A goblin must choose a tool"
                                state="error"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <Autocomplete
                                label="Forge Tool"
                                placeholder="Search goblin forge tools..."
                                items={items}
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state */}
                        {state === 'focus' && (
                            <Autocomplete
                                label="Forge Tool"
                                placeholder="Search goblin forge tools..."
                                items={items}
                                state="focus"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
