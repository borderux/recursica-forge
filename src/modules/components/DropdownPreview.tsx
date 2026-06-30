import { useMemo } from 'react'
import { Dropdown } from '../../components/adapters/Dropdown'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


interface DropdownPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function DropdownPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: DropdownPreviewProps) {
    const { mode } = useThemeMode()

    const state = (selectedVariants.states || 'default') 
    const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const ChevronDownIcon = iconNameToReactComponent('chevron-down')
    const WarningIcon = iconNameToReactComponent('warning')
    const StarIcon = iconNameToReactComponent('star')
    const ChevronRightIcon = iconNameToReactComponent('chevron-right')

    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    const items = [
        { value: 'option-1', label: 'Obsidian Ingot', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-2', label: 'Moonstone Shard', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-3', label: 'Dragon Scale', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-4', label: 'Mithril Wire', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-5', label: 'Phoenix Flux', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-6', label: 'Runic Dust', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-7', label: 'Enchanted Leather', leadingIconType: 'none' as const },
        { value: 'option-8', label: 'Crystal Quenching Oil', leadingIconType: 'none' as const },
        { value: 'option-9', label: 'Shadow Ingot', leadingIconType: 'none' as const },
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
                                <Dropdown
                                    label="Forge Material"
                                    placeholder="Choose a material"
                                    items={items}
                                    leadingIcon={StarIcon ? <StarIcon /> : undefined}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Dropdown
                                    label="Selected Material"
                                    placeholder="Choose a material"
                                    items={items}
                                    defaultValue="option-1"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <Dropdown
                                label="Forge Material"
                                placeholder="Choose a material"
                                items={items}
                                leadingIcon={StarIcon ? <StarIcon /> : undefined}
                                errorText="A material must be selected before forging"
                                state="error"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <Dropdown
                                label="Forge Material"
                                placeholder="Choose a material"
                                items={items}
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state */}
                        {state === 'focus' && (
                            <Dropdown
                                label="Forge Material"
                                placeholder="Choose a material"
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
