import React, { useState } from 'react'
import { RadioButtonGroup } from '../../components/adapters/RadioButtonGroup'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { useThemeMode } from '../theme/ThemeModeContext'
import { h4Style } from './typographyStyles'

interface RadioButtonGroupPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function RadioButtonGroupPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: RadioButtonGroupPreviewProps) {
    const { mode } = useThemeMode()

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Only show active layout
    const layout = selectedVariants.layout || selectedVariants.layouts || 'stacked'

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'flex-start'
        }}>
            <RadioButtonGroupSection
                layout={layout}
                selectedLayer={selectedLayer}
                formVerticalGutterVar={formVerticalGutterVar}
            />
        </div>
    )
}

function RadioButtonGroupSection({
    layout,
    selectedLayer,
    formVerticalGutterVar,
}: {
    layout: string
    selectedLayer: string
    formVerticalGutterVar: string
}) {
    const [value, setValue] = useState('opt2')

    return (
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                <RadioButtonGroup
                    label="Forge Weapon"
                    layout={layout}
                    layer={selectedLayer as any}
                    orientation="vertical"
                >
                    <RadioButtonItem
                        label="Obsidian Hammer"
                        value="opt1"
                        selected={value === 'opt1'}
                        onChange={() => setValue('opt1')}
                        layer={selectedLayer as any}
                    />
                    <RadioButtonItem
                        label="Runic Longsword"
                        value="opt2"
                        selected={value === 'opt2'}
                        onChange={() => setValue('opt2')}
                        layer={selectedLayer as any}
                    />
                    <RadioButtonItem
                        label="Crystal Spear"
                        value="opt3"
                        selected={value === 'opt3'}
                        onChange={() => setValue('opt3')}
                        layer={selectedLayer as any}
                    />
                </RadioButtonGroup>
            </div>
        </div>
    )
}
