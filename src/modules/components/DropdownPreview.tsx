import { useMemo } from 'react'
import { Dropdown } from '../../components/adapters/Dropdown'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

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

    const layoutsToShow: string[] = selectedVariants.layouts
        ? [layout]
        : ['stacked', 'side-by-side']

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

    const h2Style = {
        margin: 0,
        marginBottom: 16,
        textTransform: 'capitalize' as const,
        fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
        fontSize: 'var(--recursica_brand_typography_h2-font-size)',
        fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
        letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
        lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
    } as React.CSSProperties

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
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
