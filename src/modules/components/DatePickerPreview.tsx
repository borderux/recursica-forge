import { useMemo } from 'react'
import { DatePicker } from '../../components/adapters/DatePicker'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

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

    // Show both layouts
    const layoutsToShow: string[] = selectedVariants.layouts
    ? [selectedVariants.layouts]
    : ['stacked', 'side-by-side']

    // Example date for populated fields
    const exampleDate = new Date(2025, 0, 25) // Jan 25, 2025

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
