/**
 * Carbon Slider Implementation
 * 
 * Carbon-specific Slider component that uses CSS variables for theming.
 */

import { Slider as CarbonSlider } from '@carbon/react'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Slider.css'

export default function Slider({
  value,
  onChange,
  onChangeCommitted,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  layout = 'stacked',
  layer = 'layer-0',
  label,
  showInput = false,
  showValueLabel = false,
  valueLabel,
  tooltipText,
  className,
  style,
  carbon,
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
  
  // Get min/max gap
  const minMaxGapVar = getComponentLevelCssVar('Slider', 'min-max-slider-gap')
  
  // Get min/max gap
  const minMaxGapVar = getComponentLevelCssVar('Slider', 'min-max-slider-gap')
  
  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value
  
  const handleChange = (val: { value: number | number[] }) => {
    if (isRange && Array.isArray(val.value)) {
      onChange(val.value as [number, number])
    } else if (!isRange && typeof val.value === 'number') {
      onChange(val.value)
    }
  }
  
  const handleRelease = (val: { value: number | number[] }) => {
    if (onChangeCommitted) {
      if (isRange && Array.isArray(val.value)) {
        onChangeCommitted(val.value as [number, number])
      } else if (!isRange && typeof val.value === 'number') {
        onChangeCommitted(val.value)
      }
    }
  }
  
  const trackColor = `var(${trackVar})`
  const trackActiveColor = `var(${trackActiveVar})`
  const thumbColor = `var(${thumbVar})`
  
  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: showInput ? `var(${inputGapVar}, 8px)` : 0, width: '100%', minWidth: 0 }}>
      {/* Min value display */}
      <span style={{ 
        fontSize: 12, 
        opacity: 0.7, 
        flexShrink: 0,
        marginRight: `var(${minMaxGapVar}, 8px)`,
        color: 'inherit',
      }}>
        {min}
      </span>
      <div
        className="recursica-carbon-slider-wrapper"
        title={tooltipText}
        style={{
          flex: 1,
          '--recursica-ui-kit-components-slider-track-color': trackColor,
          '--recursica-ui-kit-components-slider-track-active-color': trackActiveColor,
          '--recursica-ui-kit-components-slider-thumb-color': thumbColor,
          '--recursica-ui-kit-components-slider-track-height': `var(${trackHeightVar}, 4px)`,
          '--recursica-ui-kit-components-slider-thumb-size': `var(${thumbSizeVar}, 20px)`,
          '--recursica-ui-kit-components-slider-track-border-radius': `var(${trackBorderRadiusVar})`,
          '--recursica-ui-kit-components-slider-thumb-border-radius': `var(${thumbBorderRadiusVar})`,
        }}
      >
        <CarbonSlider
          value={singleValue}
          onChange={handleChange}
          onRelease={handleRelease}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          ariaLabel={tooltipText}
          className={className}
          style={style}
          {...carbon}
          {...props}
        />
      </div>
      {/* Max value display */}
      <span style={{ 
        fontSize: 12, 
        opacity: 0.7, 
        flexShrink: 0,
        marginLeft: `var(${minMaxGapVar}, 8px)`,
        color: 'inherit',
      }}>
        {max}
      </span>
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
    // Get min-width CSS variable for slider if it exists
    const sliderMinWidthVar = getComponentLevelCssVar('Slider', 'min-width')
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: `var(${labelSliderGapVar}, 8px)`, width: '100%', ...style }}>
        <div style={{ flexShrink: 0 }}>
          {label}
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: sliderMinWidthVar ? `var(${sliderMinWidthVar})` : 0,
          display: 'flex',
          alignItems: 'center',
        }}>
          {sliderElement}
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelSliderGapVar}, 8px)`, width: '100%', ...style }}>
      {label && <div>{label}</div>}
      {sliderElement}
    </div>
  )
}
