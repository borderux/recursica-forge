import React from 'react'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'

type StyledSliderProps = {
  id?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  style?: React.CSSProperties
  label?: string
}

/**
 * StyledSlider - Replaced with Slider component
 * @deprecated Use Slider component directly instead
 */
export function StyledSlider({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  style,
  label,
}: StyledSliderProps) {
  const handleChange = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    onChange(numValue)
  }

  return (
    <Slider
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      layer="layer-3"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={(val) => `${val}`}
      label={label ? <Label layer="layer-3" layout="stacked">{label}</Label> : undefined}
      style={style}
    />
  )
}
