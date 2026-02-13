import { useMemo } from 'react'
import { NumberInput } from '../../components/adapters/NumberInput'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface NumberInputPreviewProps {
    selectedVariants: Record<string, string> // e.g., { states: "default", layouts: "stacked" }
    selectedLayer: string // e.g., "layer-0"
    componentElevation?: string // Not used for NumberInput, but kept for consistency
}

export default function NumberInputPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: NumberInputPreviewProps) {
    const { mode } = useThemeMode()

    // Extract variants from selectedVariants
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'
    const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Get icon components for examples
    const StarIcon = iconNameToReactComponent('star')
    const WarningIcon = iconNameToReactComponent('warning')

    // Show both layouts if no specific layout is selected, otherwise show selected layout
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = selectedVariants.layouts
        ? [layout]
        : ['stacked', 'side-by-side']

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
                        {/* Default state - show two examples: one with value, one with placeholder only */}
                        {state === 'default' && (
                            <>
                                <NumberInput
                                    label="Quantity"
                                    placeholder="Enter quantity"
                                    defaultValue={42}
                                    leadingIcon={StarIcon ? <StarIcon /> : <span>⭐</span>}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                    min={0}
                                    max={100}
                                    step={1}
                                />
                                <NumberInput
                                    label="Price"
                                    placeholder="Enter price"
                                    helpText="Enter amount in USD"
                                    trailingIcon={StarIcon ? <StarIcon /> : <span>⭐</span>}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                    min={0}
                                    step={0.01}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <>
                                <NumberInput
                                    label="Age"
                                    placeholder="Enter age"
                                    defaultValue={150}
                                    errorText="Value must be between 0 and 120"
                                    leadingIcon={WarningIcon ? <WarningIcon /> : <span>⚠</span>}
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                    min={0}
                                    max={120}
                                />
                                <NumberInput
                                    label="Count"
                                    placeholder="Enter count"
                                    errorText="Invalid value"
                                    trailingIcon={WarningIcon ? <WarningIcon /> : <span>⚠</span>}
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                    min={0}
                                />
                            </>
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <NumberInput
                                label="Disabled"
                                placeholder="Enter number"
                                defaultValue={0}
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state (shows default with focus styling via CSS) */}
                        {state === 'focus' && (
                            <NumberInput
                                label="Amount"
                                placeholder="Enter amount"
                                state="focus"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                                min={0}
                                step={1}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
