import { useMemo } from 'react'
import { TimePicker } from '../../components/adapters/TimePicker'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface TimePickerPreviewProps {
    selectedVariants: Record<string, string> // e.g., { states: "default", layouts: "stacked" }
    selectedLayer: string // e.g., "layer-0"
    componentElevation?: string // Not used for TimePicker, but kept for consistency
}

export default function TimePickerPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TimePickerPreviewProps) {
    const { mode } = useThemeMode()

    // Extract variants from selectedVariants
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'

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
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Default state */}
                        {state === 'default' && (
                            <>
                                <TimePicker
                                    label="Start time"
                                    defaultValue="09:30"
                                    period="AM"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <TimePicker
                                    label="End time"
                                    placeholder="Select time"
                                    helpText="Help message"
                                    period="PM"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <>
                                <TimePicker
                                    label="Start time"
                                    defaultValue="09:30"
                                    errorText="Error message"
                                    period="AM"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <TimePicker
                                    label="End time"
                                    placeholder="Select time"
                                    errorText="Error message"
                                    period="PM"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <TimePicker
                                label="Start time"
                                defaultValue=""
                                period="AM"
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state */}
                        {state === 'focus' && (
                            <TimePicker
                                label="Start time"
                                placeholder="Select time"
                                period="AM"
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
