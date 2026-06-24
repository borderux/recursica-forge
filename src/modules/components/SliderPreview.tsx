import { useState } from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { SpeakerLow, SpeakerHigh } from '@phosphor-icons/react'
import { h2Style } from './typographyStyles'


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

  // State for sliders
  const [value1, setValue1] = useState(25)
  const [value2, setValue2] = useState(50)
  const [value3, setValue3] = useState(75)
  const [value4, setValue4] = useState(5)
  const [value5, setValue5] = useState(25)
  const [value6, setValue6] = useState(5)
  const [rangeValue1, setRangeValue1] = useState<[number, number]>([20, 60])
  const [rangeValue2, setRangeValue2] = useState<[number, number]>([30, 70])

  // Get form vertical gutter CSS variable
  const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

  // Label component for stacked layout
  const label1 = (
    <Label layer={actualLayer} layout="stacked">
      Dexterity
    </Label>
  )

  const label2 = (
    <Label layer={actualLayer} layout="stacked">
      Mana Capacity
    </Label>
  )

  const label3 = (
    <Label layer={actualLayer} layout="stacked">
      Goblin Stealth
    </Label>
  )

  const label4 = (
    <Label layer={actualLayer} layout="stacked">
      Dwarf Laziness
    </Label>
  )

  const label5 = (
    <Label layer={actualLayer} layout="side-by-side">
      Perception Range
    </Label>
  )

  const label6 = (
    <Label layer={actualLayer} layout="side-by-side">
      Anvil Heat
    </Label>
  )

  const label7 = (
    <Label layer={actualLayer} layout="side-by-side">
      Orc Volume
    </Label>
  )

  const label8 = (
    <Label layer={actualLayer} layout="side-by-side">
      Forge Resonance
    </Label>
  )

  const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: verticalGutter, width: '100%', maxWidth: 600 }}>
      {/* Stacked Layout Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})` }}>
        <h2 style={h2Style}>Stacked</h2>
        {/* With label, value (read-only), min and max */}
        <Slider
          errorText="The crystal walls shattered!"
          value={value1}
          onChange={(val) => setValue1(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="stacked"
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
          layout="stacked"
          layer={actualLayer}
          showInput={true}
          showValueLabel={false}
          readOnly={true}
          state={selectedState}
        />

        {/* Labels Below */}
        <Slider
          errorText="Stolen trinkets lost in the river."
          value={value3}
          onChange={(val) => setValue3(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="labels-below"
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
          layout="stacked"
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
          layout="stacked"
          layer={actualLayer}
          label={<Label layer={actualLayer} layout="stacked">Echo</Label>}
          showInput={true}
          showMinMaxLabels={false}
          minIcon={<SpeakerLow weight="bold" />}
          maxIcon={<SpeakerHigh weight="bold" />}
          state={selectedState}
        />
      </div>

      {/* Side-by-side Layout Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})` }}>
        <h2 style={h2Style}>Side-by-side</h2>
        {/* With label, value (read-only), min and max */}
        <Slider
          errorText="The fabled Lantern of Ereth broke."
          value={value5}
          onChange={(val) => setValue5(typeof val === 'number' ? val : val[0])}
          min={0}
          max={100}
          layout="side-by-side"
          layer={actualLayer}
          label={label5}
          showInput={false}
          showValueLabel={true}
          valueLabel={(val) => `${val}`}
          state={selectedState}
        />

        {/* Labels Below Side-by-side */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: `var(--recursica_ui-kit_components_label_variants_layouts_side-by-side_properties_gutter, 8px)`, 
          width: '100%' 
        }}>
          <div style={{ flexShrink: 0 }}>
            {label6}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Slider
              errorText="The anvil cracked under pressure."
              value={value3}
              onChange={(val) => setValue3(typeof val === 'number' ? val : val[0])}
              min={0}
              max={100}
              layout="labels-below"
              layer={actualLayer}
              showInput={true}
              showValueLabel={false}
              state={selectedState}
            />
          </div>
        </div>

        {/* With icons */}
        <Slider
          errorText="The dwarf awoke startled."
          value={value6}
          onChange={(val) => setValue6(typeof val === 'number' ? val : val[0])}
          min={0}
          max={10}
          step={1}
          type="discrete"
          layout="side-by-side"
          layer={actualLayer}
          label={label7}
          showInput={true}
          showMinMaxLabels={false}
          minIcon={<SpeakerLow weight="bold" />}
          maxIcon={<SpeakerHigh weight="bold" />}
          state={selectedState}
        />

        {/* Range Slider */}
        <Slider
          errorText="Obsidian gauntlets shattered."
          value={rangeValue2}
          onChange={(val) => setRangeValue2(val as [number, number])}
          min={0}
          max={100}
          layout="side-by-side"
          layer={actualLayer}
          label={label8}
          showInput={true}
          showValueLabel={false}
          state={selectedState}
        />
      </div>
    </div>
  )
}
