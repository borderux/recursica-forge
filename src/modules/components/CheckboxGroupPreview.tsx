import React, { useState } from 'react'
import { CheckboxGroup } from '../../components/adapters/CheckboxGroup'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../theme/ThemeModeContext'

interface CheckboxGroupPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function CheckboxGroupPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: CheckboxGroupPreviewProps) {
    const { mode } = useThemeMode()

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Show both layouts
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

    const h2Style = {
        margin: 0,
        marginBottom: 16,
        textTransform: 'capitalize' as const,
        fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
        fontSize: 'var(--recursica-brand-typography-h2-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
    } as React.CSSProperties

    const verticalGutter = 'var(--recursica-brand-dimensions-gutters-vertical)'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <CheckboxGroupSection
                    key={layoutVariant}
                    layout={layoutVariant}
                    selectedLayer={selectedLayer}
                    formVerticalGutterVar={formVerticalGutterVar}
                    h2Style={h2Style}
                />
            ))}
        </div>
    )
}

function CheckboxGroupSection({
    layout,
    selectedLayer,
    formVerticalGutterVar,
    h2Style,
}: {
    layout: 'stacked' | 'side-by-side'
    selectedLayer: string
    formVerticalGutterVar: string
    h2Style: React.CSSProperties
}) {
    const [values, setValues] = useState({
        opt1: false,
        opt2: true,
        opt3: false,
    })

    return (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h2 style={h2Style}>
                {layout === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                <CheckboxGroup
                    label="Checkbox group"
                    helpText="Help message"
                    layout={layout}
                    layer={selectedLayer as any}
                    orientation="vertical"
                >
                    <CheckboxItem
                        label="Option 1"
                        checked={values.opt1}
                        onChange={(c) => setValues(p => ({ ...p, opt1: c }))}
                        layer={selectedLayer as any}
                    />
                    <CheckboxItem
                        label="Option 2"
                        checked={values.opt2}
                        onChange={(c) => setValues(p => ({ ...p, opt2: c }))}
                        layer={selectedLayer as any}
                    />
                    <CheckboxItem
                        label="Option 3"
                        checked={values.opt3}
                        onChange={(c) => setValues(p => ({ ...p, opt3: c }))}
                        layer={selectedLayer as any}
                    />
                </CheckboxGroup>

                <CheckboxGroup
                    label="Required group"
                    required
                    layout={layout}
                    layer={selectedLayer as any}
                    orientation="vertical"
                >
                    <CheckboxItem
                        label="Option A"
                        checked={false}
                        onChange={() => { }}
                        layer={selectedLayer as any}
                    />
                    <CheckboxItem
                        label="Option B"
                        checked={false}
                        onChange={() => { }}
                        layer={selectedLayer as any}
                    />
                </CheckboxGroup>
            </div>
        </div>
    )
}
