import { useMemo } from 'react'
import { Textarea } from '../../components/adapters/Textarea'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


interface TextareaPreviewProps {
    selectedVariants: Record<string, string> // e.g., { states: "default", layouts: "stacked" }
    selectedLayer: string // e.g., "layer-0"
    componentElevation?: string // Not used for Textarea, but kept for consistency
}

export default function TextareaPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TextareaPreviewProps) {
    const { mode } = useThemeMode()

    // Extract variants from selectedVariants
    const state = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Get icon components for examples
    const SmileyIcon = iconNameToReactComponent('star')
    const HeartIcon = iconNameToReactComponent('warning')

    // Show both layouts
    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

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
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Default state - show two examples: one with value, one with placeholder only */}
                        {state === 'default' && (
                            <>
                                <Textarea
                                    label="Forge Notes"
                                    placeholder="Describe the enchantment process..."
                                    defaultValue="The obsidian gauntlets require three coats of moonstone lacquer before the rune inscription can begin. Each coat must dry under starlight for at least one full cycle."
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Textarea
                                    label="Expedition Log"
                                    placeholder="Record your journey through the deep mines..."
                                    helpText="Include any unusual sightings or ore deposits"
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <>
                                <Textarea
                                    label="Forge Notes"
                                    placeholder="Describe the enchantment process..."
                                    defaultValue="The obsidian gauntlets require three coats of moonstone lacquer."
                                    errorText="Incomplete enchantment — missing rune sequence"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Textarea
                                    label="Expedition Log"
                                    placeholder="Record your journey through the deep mines..."
                                    errorText="Log entry cannot be empty"
                                    state="error"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Disabled state */}
                        {state === 'disabled' && (
                            <>
                                <Textarea
                                    label="Forge Notes"
                                    placeholder="Describe the enchantment process..."
                                    leadingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                                    state="disabled"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Textarea
                                    label="Expedition Log"
                                    placeholder="Record your journey through the deep mines..."
                                    trailingIcon={HeartIcon ? <HeartIcon /> : <span>⚠</span>}
                                    state="disabled"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Focus state (shows default with focus styling via CSS) */}
                        {state === 'focus' && (
                            <>
                                <Textarea
                                    label="Forge Notes"
                                    placeholder="Describe the enchantment process..."
                                    leadingIcon={SmileyIcon ? <SmileyIcon /> : <span>😊</span>}
                                    state="focus"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <Textarea
                                    label="Expedition Log"
                                    placeholder="Record your journey through the deep mines..."
                                    trailingIcon={HeartIcon ? <HeartIcon /> : <span>⚠</span>}
                                    state="focus"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {/* Custom/unknown state — renders a basic field so styling changes are visible */}
                        {state !== 'default' && state !== 'error' && state !== 'disabled' && state !== 'focus' && (
                            <Textarea
                                label="Forge Notes"
                                placeholder="Describe the enchantment process..."
                                defaultValue="The obsidian gauntlets require three coats of moonstone lacquer."
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
