/**
 * Mantine Slider Implementation
 * 
 * Mantine-specific Slider component that uses CSS variables for theming.
 */

import { Slider as MantineSlider } from '@mantine/core'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { getTypographyCssVar, extractTypographyStyleName } from '../../../utils/typographyUtils'
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
  minLabel,
  maxLabel,
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
  
  const handleChangeEnd = (val: number | number[]) => {
    if (onChangeCommitted) {
      if (isRange && Array.isArray(val)) {
        onChangeCommitted(val as [number, number])
      } else if (!isRange && typeof val === 'number') {
        onChangeCommitted(val)
      }
    }
  }
  
  // Calculate display value for readonly label
  let displayValue: string | number | undefined
  try {
    if (valueLabel) {
      if (typeof valueLabel === 'function') {
        displayValue = valueLabel(singleValue)
      } else {
        displayValue = valueLabel
      }
    } else {
      displayValue = singleValue
    }
  } catch (error) {
    console.warn('Error calculating value label:', error)
    displayValue = singleValue
  }
  const displayValueStr = (displayValue !== undefined && displayValue !== null && String(displayValue).trim() !== '') 
    ? String(displayValue).trim() 
    : (singleValue !== undefined && singleValue !== null ? String(singleValue) : '—')

  // Get label typography styles (not using Label component, just the typography)
  const labelFontVar = getComponentLevelCssVar('Label', 'label-font')
  const labelFontValue = readCssVar(labelFontVar)
  const labelFontStyle = extractTypographyStyleName(labelFontValue) || 'body-small'
  const labelFontSizeVar = getTypographyCssVar(labelFontStyle, 'font-size')
  const labelFontFamilyVar = getTypographyCssVar(labelFontStyle, 'font-family')
  const labelFontWeightVar = getTypographyCssVar(labelFontStyle, 'font-weight')
  const labelLetterSpacingVar = getTypographyCssVar(labelFontStyle, 'font-letter-spacing')
  const labelLineHeightVar = getTypographyCssVar(labelFontStyle, 'line-height')
  const labelTextColorVar = buildComponentCssVarPath('Label', 'properties', 'colors', layer, 'text')
  const highEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-high`

  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: (showInput || showValueLabel) ? `var(${inputGapVar}, 8px)` : 0, width: '100%', minWidth: 0 }}>
      {/* Min value display */}
      <span style={{ 
        fontSize: 12, 
        opacity: 0.7, 
        flexShrink: 0,
        marginRight: '8px',
        color: 'inherit',
      }}>
        {minLabel ?? min}
      </span>
      <MantineSlider
        value={singleValue}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        label={tooltipText ? (val) => tooltipText : undefined}
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
      {/* Max value display */}
      <span style={{ 
        fontSize: 12, 
        opacity: 0.7, 
        flexShrink: 0,
        marginLeft: '8px',
        color: 'inherit',
      }}>
        {maxLabel ?? max}
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
      {showValueLabel && !showInput && (
        <span
          style={{
            fontSize: `var(${labelFontSizeVar})`,
            fontFamily: `var(${labelFontFamilyVar})`,
            fontWeight: `var(${labelFontWeightVar})`,
            letterSpacing: labelLetterSpacingVar ? `var(${labelLetterSpacingVar})` : undefined,
            lineHeight: `var(${labelLineHeightVar})`,
            color: `var(${labelTextColorVar})`,
            opacity: disabled ? 0.5 : `var(${highEmphasisOpacityVar})`,
            whiteSpace: 'nowrap',
          }}
        >
          {displayValueStr}
        </span>
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
