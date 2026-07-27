import { useState } from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { SpeakerLow, SpeakerHigh } from '@phosphor-icons/react'


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

  // Determine the selected state variant
  const selectedState = (selectedVariants?.states || 'default') as 'default' | 'focus' | 'error' | 'disabled'

  // Determine the selected layout variant so a custom layout variant mounts and
  // reflects prop edits (falls back to the built-in default 'stacked').
  const layoutVariant = selectedVariants?.layout || 'stacked'

  // State for sliders
  const [value1, setValue1] = useState(25)
  const [value2, setValue2] = useState(50)
  const [value3, setValue3] = useState(75)
  const [value4, setValue4] = useState(5)
  const [rangeValue1, setRangeValue1] = useState<[number, number]>([20, 60])

  // Get form vertical gutter CSS variable
  const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

  // Label components follow the selected layout variant so labels stay coherent
  // with their sliders (stacked, side-by-side, labels-below, or a custom variant)
  const label1 = (
    <Label layer={actualLayer} layout={layoutVariant}>
      Dexterity
    </Label>
  )

  const label3 = (
    <Label layer={actualLayer} layout={layoutVariant}>
      Goblin Stealth
    </Label>
  )

  const label4 = (
    <Label layer={actualLayer} layout={layoutVariant}>
      Dwarf Laziness
    </Label>
  )

  const label5 = (
    <Label layer={actualLayer} layout={layoutVariant}>
      Perception Range
    </Label>
  )

  return (
    // A single set of representative sliders, all rendered in the currently-selected layout
    // variant (stacked / side-by-side / labels-below / a custom layout) chosen in the toolbar.
    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%', maxWidth: 600 }}>
      {/* With label, value (read-only), min and max */}
      <Slider
        errorText="The crystal walls shattered!"
        value={value1}
        onChange={(val) => setValue1(typeof val === 'number' ? val : val[0])}
        min={0}
        max={100}
        layout={layoutVariant}
        layer={actualLayer}
        label={label1}
        showInput={false}
        showValueLabel={true}
        valueLabel={(val) => `${val}`}
        state={selectedState}
      />

      {/* No label, read-only input, with min and max */}
      <Slider
        errorText="The goblin king's spell failed."
        value={value2}
        onChange={(val) => setValue2(typeof val === 'number' ? val : val[0])}
        min={0}
        max={100}
        layout={layoutVariant}
        layer={actualLayer}
        showInput={true}
        showValueLabel={false}
        readOnly={true}
        state={selectedState}
      />

      {/* With label + input */}
      <Slider
        errorText="Stolen trinkets lost in the river."
        value={value3}
        onChange={(val) => setValue3(typeof val === 'number' ? val : val[0])}
        min={0}
        max={100}
        layout={layoutVariant}
        layer={actualLayer}
        label={label3}
        showInput={true}
        showValueLabel={false}
        state={selectedState}
      />

      {/* Range Slider */}
      <Slider
        errorText="Maneuver executed with poor zeal."
        value={rangeValue1}
        onChange={(val) => setRangeValue1(val as [number, number])}
        min={0}
        max={100}
        layout={layoutVariant}
        layer={actualLayer}
        label={label4}
        showInput={true}
        showValueLabel={false}
        state={selectedState}
      />

      {/* With icons */}
      <Slider
        errorText="Too loud for a sneaky goblin."
        value={value4}
        onChange={(val) => setValue4(typeof val === 'number' ? val : val[0])}
        min={0}
        max={10}
        step={1}
        type="discrete"
        layout={layoutVariant}
        layer={actualLayer}
        label={label5}
        showInput={true}
        showMinMaxLabels={false}
        minIcon={<SpeakerLow weight="bold" />}
        maxIcon={<SpeakerHigh weight="bold" />}
        state={selectedState}
      />
    </div>
  )
}
