import { useMemo } from 'react'
import { TimePicker } from '../../components/adapters/TimePicker'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


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
    const state = (selectedVariants.states || 'default') 

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    // Show both layouts
    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            alignItems: 'flex-start',
        }}>
            
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ maxWidth: '700px', width: '100%', alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Default state */}
                        {state === 'default' && (
                            <>
                                <TimePicker
                                    label="Raid begins"
                                    defaultValue="09:30"
                                    period="AM"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <TimePicker
                                    label="Raid ends"
                                    placeholder="Set ambush hour"
                                    helpText="Goblins sleep after midnight"
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
                                    label="Potion brew start"
                                    defaultValue="09:30"
                                    errorText="The cauldron overflowed!"
                                    period="AM"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <TimePicker
                                    label="Brew finish"
                                    placeholder="Set brew hour"
                                    errorText="Invalid moon phase detected"
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
                                label="Lair closing time"
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
                                label="Dungeon curfew"
                                placeholder="Set curfew hour"
                                period="AM"
                                state="focus"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Custom/unknown state — renders a basic field so styling changes are visible */}
                        {state !== 'default' && state !== 'error' && state !== 'disabled' && state !== 'focus' && (
                            <TimePicker
                                label="Goblin market hours"
                                state={state as any}
                                period="AM"
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
