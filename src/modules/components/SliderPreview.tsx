import { useState, useMemo } from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'

interface SliderPreviewProps {
  selectedVariants: Record<string, string> // e.g., { layout: "stacked" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function SliderPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: SliderPreviewProps) {
  const { mode } = useThemeMode()

  // Extract layout variant
  const layoutVariant = (selectedVariants.layout || 'stacked') as 'stacked' | 'side-by-side'

  // Determine the actual layer to use
  const actualLayer = selectedLayer as any

  // State for single value sliders
  const [value1, setValue1] = useState(25)
  const [value2, setValue2] = useState(25)
  const [value3, setValue3] = useState(25)
  const [value4, setValue4] = useState(25)

  // Label component
  const labelElement = (
    <Label layer={actualLayer} layout={layoutVariant}>
      Label
    </Label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', maxWidth: 600 }}>
      {/* Single Value Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* With label, with input */}
        <Slider
          value={value1}
          onChange={setValue1}
          min={0}
          max={100}
          layout={layoutVariant}
          layer={actualLayer}
          label={labelElement}
          showInput={true}
        />
        
        {/* With label, without input */}
        <Slider
          value={value2}
          onChange={setValue2}
          min={0}
          max={100}
          layout={layoutVariant}
          layer={actualLayer}
          label={labelElement}
          showInput={false}
        />
        
        {/* Without label, with input */}
        <Slider
          value={value3}
          onChange={setValue3}
          min={0}
          max={100}
          layout={layoutVariant}
          layer={actualLayer}
          showInput={true}
        />
        
        {/* Disabled */}
        <Slider
          value={value4}
          onChange={setValue4}
          min={0}
          max={100}
          layout={layoutVariant}
          layer={actualLayer}
          label={labelElement}
          showInput={true}
          disabled
        />
      </div>
    </div>
  )
}
