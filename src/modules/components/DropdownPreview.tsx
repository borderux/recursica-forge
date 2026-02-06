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

    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'
    const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const ChevronDownIcon = iconNameToReactComponent('chevron-down')
    const WarningIcon = iconNameToReactComponent('warning')
    const StarIcon = iconNameToReactComponent('star')
    const ChevronRightIcon = iconNameToReactComponent('chevron-right')

    const layoutsToShow: Array<'stacked' | 'side-by-side'> = selectedVariants.layouts
        ? [layout]
        : ['stacked', 'side-by-side']

    const items = [
        { value: 'option-1', label: 'Option 1', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-2', label: 'Option 2', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-3', label: 'Option 3', leadingIcon: StarIcon ? <StarIcon /> : undefined, leadingIconType: 'icon' as const },
        { value: 'option-4', label: 'Option 4', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-5', label: 'Option 5', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-6', label: 'Option 6', trailingIcon: ChevronRightIcon ? <ChevronRightIcon /> : undefined, leadingIconType: 'none' as const },
        { value: 'option-7', label: 'Option 7', leadingIconType: 'none' as const },
        { value: 'option-8', label: 'Option 8', leadingIconType: 'none' as const },
        { value: 'option-9', label: 'Option 9', leadingIconType: 'none' as const },
    ]

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={{ margin: 0, marginBottom: 16, textTransform: 'capitalize' }}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Default state */}
                        {state === 'default' && (
                            <>
                                <Dropdown
                                    label="Dropdown Label"
                                    placeholder="Select an option"
                                    items={items}
                                    leadingIcon={StarIcon ? <StarIcon /> : undefined}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Dropdown
                                    label="Dropdown with Value"
                                    placeholder="Select an option"
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
                                label="Dropdown Label"
                                placeholder="Select an option"
                                items={items}
                                leadingIcon={StarIcon ? <StarIcon /> : undefined}
                                errorText="This field is required"
                                state="error"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <Dropdown
                                label="Dropdown Label"
                                placeholder="Select an option"
                                items={items}
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state */}
                        {state === 'focus' && (
                            <Dropdown
                                label="Dropdown Label"
                                placeholder="Select an option"
                                items={items}
                                helpText="Choose wisely"
                                state="default"
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
