/**
 * Mantine Slider Implementation
 * 
 * Mantine-specific Slider component that uses CSS variables for theming.
 */

import { Slider as MantineSlider } from '@mantine/core'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Slider.css'

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  layout = 'stacked',
  layer = 'layer-0',
  label,
  showInput = false,
  className,
  style,
  mantine,
  ...props
}: AdapterSliderProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables for colors
  const trackVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'track')
  const trackActiveVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'track-active')
  const thumbVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'thumb')
  
  // Get CSS variables for sizes
  const trackHeightVar = getComponentLevelCssVar('Slider', 'track-height')
  const thumbSizeVar = getComponentLevelCssVar('Slider', 'thumb-size')
  const trackBorderRadiusVar = getComponentLevelCssVar('Slider', 'track-border-radius')
  const thumbBorderRadiusVar = getComponentLevelCssVar('Slider', 'thumb-border-radius')
  
  // Get layout-specific gap
  const labelSliderGapVar = buildComponentCssVarPath('Slider', 'variants', 'layouts', layout, 'properties', 'label-slider-gap')
  
  // Get input width and gap if showing input
  const inputWidthVar = getComponentLevelCssVar('Slider', 'input-width')
  const inputGapVar = getComponentLevelCssVar('Slider', 'input-gap')
  
  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value
  
  const handleChange = (val: number | number[]) => {
    if (isRange && Array.isArray(val)) {
      onChange(val as [number, number])
    } else if (!isRange && typeof val === 'number') {
      onChange(val)
    }
  }
  
  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: showInput ? `var(${inputGapVar}, 8px)` : 0, width: '100%' }}>
      <MantineSlider
        value={singleValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={className}
        style={{
          flex: 1,
          '--slider-track-color': `var(${trackVar})`,
          '--slider-color': `var(${trackActiveVar})`,
          '--slider-thumb-size': `var(${thumbSizeVar}, 20px)`,
          '--slider-size': `var(${trackHeightVar}, 4px)`,
          '--slider-radius': `var(${trackBorderRadiusVar})`,
          ...style,
        }}
        {...mantine}
        {...props}
      />
      {showInput && (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={singleValue}
          onChange={(e) => {
            const newValue = Number(e.target.value)
            if (!isNaN(newValue)) {
              const clampedValue = Math.max(min, Math.min(max, newValue))
              if (isRange) {
                onChange([clampedValue, value[1]])
              } else {
                onChange(clampedValue)
              }
            }
          }}
          disabled={disabled}
          style={{
            width: `var(${inputWidthVar}, 60px)`,
            height: `var(${getFormCssVar('field', 'size', 'single-line-input-height')})`,
            paddingLeft: `var(${getFormCssVar('field', 'size', 'horizontal-padding')})`,
            paddingRight: `var(${getFormCssVar('field', 'size', 'horizontal-padding')})`,
            paddingTop: `var(${getFormCssVar('field', 'size', 'vertical-padding')})`,
            paddingBottom: `var(${getFormCssVar('field', 'size', 'vertical-padding')})`,
            borderWidth: `var(${getFormCssVar('field', 'size', 'border-thickness-default')})`,
            borderStyle: 'solid',
            borderColor: `var(${getFormCssVar('field', 'colors', 'border')})`,
            borderRadius: `var(${getFormCssVar('field', 'size', 'border-radius')})`,
            background: `var(${getFormCssVar('field', 'colors', 'background')})`,
            color: `var(${getFormCssVar('field', 'colors', 'text-valued')})`,
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            opacity: disabled ? 0.5 : 1,
          }}
        />
      )}
    </div>
  )
  
  if (layout === 'side-by-side' && label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: `var(${labelSliderGapVar}, 8px)`, ...style }}>
        {label}
        {sliderElement}
      </div>
    )
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelSliderGapVar}, 8px)`, ...style }}>
      {label && <div>{label}</div>}
      {sliderElement}
    </div>
  )
}
