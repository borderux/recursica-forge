import { useMemo } from 'react'
import { DatePicker } from '../../components/adapters/DatePicker'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


interface DatePickerPreviewProps {
    selectedVariants: Record<string, string> // e.g., { states: "default" }
    selectedLayer: string // e.g., "layer-0"
    componentElevation?: string // Not used for DatePicker, but kept for consistency
}

export default function DatePickerPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: DatePickerPreviewProps) {
    const { mode } = useThemeMode()

    // Extract variants from selectedVariants
    const state = (selectedVariants.states || 'default') 

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    // Show both layouts
    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    // Example date for populated fields
    const exampleDate = new Date(2025, 0, 25) // Jan 25, 2025

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
                        {/* Default state - show one with value, one with placeholder */}
                        {state === 'default' && (
                            <>
                                <DatePicker
                                    label="Label"
                                    placeholder="MM / DD / YY"
                                    defaultValue={exampleDate}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <DatePicker
                                    label="Label"
                                    placeholder="MM / DD / YY"
                                    helpText="Help message"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <>
                                <DatePicker
                                    label="Label"
                                    placeholder="MM / DD / YY"
                                    defaultValue={exampleDate}
                                    errorText="This date is in the past, change it!"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <DatePicker
                                    label="Label"
                                    placeholder="MM / DD / YY"
                                    errorText="Error message"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <DatePicker
                                label="Label"
                                placeholder="MM / DD / YY"
                                defaultValue={exampleDate}
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state */}
                        {state === 'focus' && (
                            <DatePicker
                                label="Label"
                                placeholder="MM / DD / YY"
                                state="focus"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Custom/unknown state — renders a basic field so styling changes are visible */}
                        {state !== 'default' && state !== 'error' && state !== 'disabled' && state !== 'focus' && (
                            <DatePicker
                                label="Label"
                                placeholder="MM / DD / YY"
                                state={state as any}
                                layout={layoutVariant as any}
                                layer={selectedLayer as any}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
