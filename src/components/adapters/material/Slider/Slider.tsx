/**
 * Material UI Slider Implementation
 * 
 * Material UI-specific Slider component that uses CSS variables for theming.
 */

import { Slider as MaterialSlider } from '@mui/material'
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
  material,
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
  
  const handleChange = (_event: Event, val: number | number[]) => {
    if (isRange && Array.isArray(val)) {
      onChange(val as [number, number])
    } else if (!isRange && typeof val === 'number') {
      onChange(val)
    }
  }
  
  const handleChangeCommitted = (_event: Event | React.SyntheticEvent, val: number | number[]) => {
    if (onChangeCommitted) {
      if (isRange && Array.isArray(val)) {
        onChangeCommitted(val as [number, number])
      } else if (!isRange && typeof val === 'number') {
        onChangeCommitted(val)
      }
    }
  }
  
  const trackColor = `var(${trackVar})`
  const trackActiveColor = `var(${trackActiveVar})`
  const thumbColor = `var(${thumbVar})`
  
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
  
  // Use layer text color directly for labels and values
  const layerTextColorVar = `--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-color`
  const layerTextEmphasisVar = `--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-high-emphasis`

  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: (showInput || showValueLabel) ? `var(${inputGapVar}, 8px)` : 0, width: '100%', minWidth: 0 }}>
      {/* Min value display */}
      <span style={{ 
        fontSize: 12, 
        color: `var(${layerTextColorVar})`,
        opacity: `var(${layerTextEmphasisVar}, 0.7)`, 
        flexShrink: 0,
        marginRight: '8px',
      }}>
        {minLabel ?? min}
      </span>
      <MaterialSlider
        value={singleValue}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        valueLabelDisplay="auto"
        valueLabelFormat={tooltipText ? (val: number) => typeof tooltipText === 'function' ? tooltipText(val) : tooltipText : undefined}
        className={className}
        sx={{
          color: trackActiveColor,
          height: `var(${trackHeightVar}, 4px)`,
          '& .MuiSlider-track': {
            backgroundColor: trackActiveColor,
            height: `var(${trackHeightVar}, 4px)`,
            borderRadius: `var(${trackBorderRadiusVar})`,
          },
          '& .MuiSlider-rail': {
            backgroundColor: trackColor,
            height: `var(${trackHeightVar}, 4px)`,
            borderRadius: `var(${trackBorderRadiusVar})`,
            opacity: disabled ? 0.3 : 1,
          },
          '& .MuiSlider-thumb': {
            backgroundColor: thumbColor,
            width: `var(${thumbSizeVar}, 20px)`,
            height: `var(${thumbSizeVar}, 20px)`,
            border: 'none',
            borderRadius: `var(${thumbBorderRadiusVar})`,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
            opacity: disabled ? 0.3 : 1,
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focusVisible': {
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
          },
          ...style,
        }}
        {...material}
        {...props}
      />
      {/* Max value display */}
      <span style={{ 
        fontSize: 12, 
        color: `var(${layerTextColorVar})`,
        opacity: `var(${layerTextEmphasisVar}, 0.7)`, 
        flexShrink: 0,
        marginLeft: '8px',
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
            minWidth: `var(${inputWidthVar}, 60px)`,
            fontSize: `var(${labelFontSizeVar})`,
            fontFamily: `var(${labelFontFamilyVar})`,
            fontWeight: `var(${labelFontWeightVar})`,
            letterSpacing: labelLetterSpacingVar ? `var(${labelLetterSpacingVar})` : undefined,
            lineHeight: `var(${labelLineHeightVar})`,
            color: `var(${layerTextColorVar})`,
            opacity: disabled ? 0.5 : `var(${layerTextEmphasisVar})`,
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}
        >
          {displayValueStr}
        </span>
      )}
    </div>
  )
  
  if (layout === 'side-by-side' && label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: `var(${labelSliderGapVar}, 8px)`, width: '100%', ...style }}>
        <div style={{ flexShrink: 0 }}>
          {label}
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: 0,
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
