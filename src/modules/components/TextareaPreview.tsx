import { useMemo } from 'react'
import { Textarea } from '../../components/adapters/Textarea'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

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
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Show both layouts
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

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
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
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
                            <Textarea
                                label="Forge Notes"
                                placeholder="Describe the enchantment process..."
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {/* Focus state (shows default with focus styling via CSS) */}
                        {state === 'focus' && (
                            <Textarea
                                label="Forge Notes"
                                placeholder="Describe the enchantment process..."
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
