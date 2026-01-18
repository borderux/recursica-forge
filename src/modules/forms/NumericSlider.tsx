import React from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'

export interface NumericSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  formatValue?: (value: number) => string
}

export default function NumericSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  formatValue,
}: NumericSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString()
  const displayLabel = unit ? `${displayValue}${unit}` : displayValue

  const handleSliderChange = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    onChange(numValue)
  }

  return (
    <div className="control-group">
      <Slider
        value={value}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        layer="layer-3"
        layout="stacked"
        showInput={false}
        showValueLabel={true}
        valueLabel={displayLabel}
        label={label ? <Label layer="layer-3" layout="stacked">{label}</Label> : undefined}
      />
    </div>
  )
}
