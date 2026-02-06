import { useState } from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface SliderPreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
}

export default function SliderPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: SliderPreviewProps) {
  const { mode } = useThemeMode()

  // Determine the actual layer to use
  const actualLayer = selectedLayer as any

  // State for sliders
  const [value1, setValue1] = useState(25)
  const [value2, setValue2] = useState(50)
  const [value3, setValue3] = useState(75)

  // Get form vertical gutter CSS variable
  const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

  // Label component for stacked layout
  const stackedLabel = (
    <Label layer={actualLayer} layout="stacked">
      Label
    </Label>
  )

  // Label component for side-by-side layout
  const sideBySideLabel = (
    <Label layer={actualLayer} layout="side-by-side">
      Label
    </Label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', maxWidth: 600 }}>
      {/* Stacked Layout Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})` }}>
        <h2 style={{ margin: 0, marginBottom: 16 }}>Stacked</h2>
        {/* With label, value (read-only), min and max */}
        <Slider
          value={value1}
          onChange={(val) => setValue1(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="stacked"
          layer={actualLayer}
          label={stackedLabel}
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}`}
        />
        
        {/* With label, value (read-only), min and max - DISABLED */}
        <Slider
          value={value1}
          onChange={(val) => setValue1(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="stacked"
          layer={actualLayer}
          label={stackedLabel}
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}`}
          disabled
        />
        
        {/* No label, read-only input, with min and max */}
        <Slider
          value={value2}
          onChange={(val) => setValue2(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="stacked"
          layer={actualLayer}
          showInput={true}
          showValueLabel={false}
          readOnly={true}
        />
        
        {/* Disabled with label and input */}
        <Slider
          value={value3}
          onChange={(val) => setValue3(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="stacked"
          layer={actualLayer}
          label={stackedLabel}
          showInput={true}
          showValueLabel={false}
          readOnly={true}
          disabled
        />
      </div>

      {/* Side-by-side Layout Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})` }}>
        <h2 style={{ margin: 0, marginBottom: 16 }}>Side-by-side</h2>
        {/* With label, value (read-only), min and max */}
        <Slider
          value={value1}
          onChange={(val) => setValue1(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="side-by-side"
          layer={actualLayer}
          label={sideBySideLabel}
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}`}
        />
        
        {/* Disabled */}
        <Slider
          value={value3}
          onChange={(val) => setValue3(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="side-by-side"
          layer={actualLayer}
          label={sideBySideLabel}
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}`}
          disabled
        />
      </div>
    </div>
  )
}
