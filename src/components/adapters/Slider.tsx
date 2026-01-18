/**
 * Slider Component Adapter
 * 
 * Unified Slider component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Label } from './Label'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type SliderProps = {
  value: number | [number, number]
  onChange: (value: number | [number, number]) => void
  onChangeCommitted?: (value: number | [number, number]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  layout?: 'stacked' | 'side-by-side'
  layer?: ComponentLayer
  label?: React.ReactNode
  showInput?: boolean
  showValueLabel?: boolean
  valueLabel?: string | ((value: number) => string)
  tooltipText?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Slider({
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
  mantine,
  material,
  carbon,
}: SliderProps) {
  const Component = useComponent('Slider')
  const { mode } = useThemeMode()
  
  if (!Component) {
    // Fallback to native input range
    const isRange = Array.isArray(value)
    const singleValue = isRange ? value[0] : value
    
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
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (isRange) {
        onChange([newValue, value[1]])
      } else {
        onChange(newValue)
      }
    }
    
    const sliderId = `slider-${Math.random().toString(36).substr(2, 9)}`
    const percentage = ((singleValue - min) / (max - min)) * 100
    
    // Read resolved values for thumb styling (CSS variables in template strings need resolved values)
    const thumbSizeValue = readCssVarResolved(thumbSizeVar) || readCssVar(thumbSizeVar) || '20px'
    const thumbColorValue = readCssVarResolved(thumbVar) || readCssVar(thumbVar) || '#000000'
    const thumbBorderRadiusValue = readCssVarResolved(thumbBorderRadiusVar) || readCssVar(thumbBorderRadiusVar) || '50%'
    const trackHeightValue = readCssVarResolved(trackHeightVar) || readCssVar(trackHeightVar) || '4px'
    
    // Parse thumb size to calculate padding (account for thumb half-width on each side)
    const thumbSizeNum = parseFloat(thumbSizeValue) || 20
    const thumbSizeUnit = thumbSizeValue.replace(/[\d.-]/g, '') || 'px'
    const thumbHalfSize = `${thumbSizeNum / 2}${thumbSizeUnit}`
    
    const sliderElement = (
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: showInput ? `var(${inputGapVar}, 8px)` : 0, overflow: 'visible' }}>
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
        <div style={{ 
          position: 'relative', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          overflow: 'visible', 
          minWidth: 0,
          paddingLeft: thumbHalfSize,
          paddingRight: thumbHalfSize,
        }}>
          {/* Track background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: `var(${trackHeightVar}, 4px)`,
            transform: 'translateY(-50%)',
            backgroundColor: `var(${trackVar})`,
            borderRadius: `var(${trackBorderRadiusVar})`,
            opacity: disabled ? 0.3 : 1,
            width: '100%',
          }} />
          
          {/* Active track */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: `${percentage}%`,
            height: `var(${trackHeightVar}, 4px)`,
            transform: 'translateY(-50%)',
            backgroundColor: `var(${trackActiveVar})`,
            borderRadius: `var(${trackBorderRadiusVar})`,
            opacity: disabled ? 0.3 : 1,
          }} />
          
          {/* Slider input */}
          <input
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={singleValue}
            onChange={handleChange}
            disabled={disabled}
            title={tooltipText}
            style={{
              position: 'relative',
              width: '100%',
              height: `var(${thumbSizeVar}, 20px)`,
              margin: 0,
              padding: 0,
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              zIndex: 1,
            }}
            className={className}
          />
          
          {/* Custom thumb styling */}
          <style>{`
            #${sliderId}::-webkit-slider-thumb {
              appearance: none;
              -webkit-appearance: none;
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
              opacity: ${disabled ? 0.3 : 1};
              margin-top: calc(-1 * (${thumbSizeValue} - ${trackHeightValue}) / 2);
            }
            
            #${sliderId}::-moz-range-thumb {
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
              opacity: ${disabled ? 0.3 : 1};
            }
            
            #${sliderId}::-ms-thumb {
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
              opacity: ${disabled ? 0.3 : 1};
            }
            
            #${sliderId}::-webkit-slider-runnable-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
            }
            
            #${sliderId}::-moz-range-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
            }
            
            #${sliderId}::-ms-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
              color: transparent;
            }
          `}</style>
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
        
        {/* Input field */}
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
    
    // Calculate the width of the max value display to align value label above it
    const maxValueWidth = 30 // Approximate width for max value display
    
    if (layout === 'side-by-side' && label) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelSliderGapVar}, 8px)`, ...style }}>
          {label && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {label}
              {showValueLabel && (
                <span style={{ 
                  fontSize: 12, 
                  opacity: 0.7, 
                  color: 'inherit',
                  width: maxValueWidth,
                  textAlign: 'right',
                }}>
                  {valueLabel ? (typeof valueLabel === 'function' ? valueLabel(singleValue) : valueLabel) : singleValue}
                </span>
              )}
            </div>
          )}
          {sliderElement}
        </div>
      )
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelSliderGapVar}, 8px)`, ...style }}>
        {label && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label}
            {showValueLabel && (
              <span style={{ 
                fontSize: 12, 
                opacity: 0.7, 
                color: 'inherit',
                width: maxValueWidth,
                textAlign: 'right',
              }}>
                {valueLabel ? (typeof valueLabel === 'function' ? valueLabel(singleValue) : valueLabel) : singleValue}
              </span>
            )}
          </div>
        )}
        {sliderElement}
      </div>
    )
  }
  
  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value
  const displayValue = valueLabel ? (typeof valueLabel === 'function' ? valueLabel(singleValue) : valueLabel) : singleValue
  
  // Calculate the width of the max value display to align value label above it
  const maxValueWidth = 30 // Approximate width for max value display
  
  // When showValueLabel is true, we handle the label row ourselves to avoid duplicates
  // and to position the value label correctly
  const shouldHandleLabelRow = showValueLabel && label
  
  const sliderComponent = (
    <Suspense fallback={<div style={{ width: '100%', height: 20 }} />}>
      <Component
        value={value}
        onChange={onChange}
        onChangeCommitted={onChangeCommitted}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        layout={layout}
        layer={layer}
        label={shouldHandleLabelRow ? undefined : label}
        showInput={showInput}
        showValueLabel={false}
        valueLabel={valueLabel}
        tooltipText={tooltipText}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
  
  // Get layout-specific gap for label row
  const labelSliderGapVarForLibrary = buildComponentCssVarPath('Slider', 'variants', 'layouts', layout, 'properties', 'label-slider-gap')
  
  // Render value label using Label component to match label styling
  const valueLabelElement = showValueLabel ? (
    <Label layer={layer} layout={layout} align="right" style={{ width: maxValueWidth, flexShrink: 0 }}>
      {displayValue}
    </Label>
  ) : null
  
  // When using library components, they handle their own label rendering
  // We only override this when showValueLabel is true to position the value label correctly
  // So we should NOT wrap with additional label rendering when shouldHandleLabelRow is false
  if (!shouldHandleLabelRow) {
    // Let the library component handle label rendering
    return sliderComponent
  }
  
  // When showValueLabel is true, we handle the label row ourselves
  // In side-by-side layout, hide the readonly value and let the library component handle the label
  if (layout === 'side-by-side' && label) {
    // In side-by-side, don't show the readonly value - just pass the label to the component
    // so it can handle the side-by-side layout with proper vertical centering
    return (
      <Suspense fallback={<div style={{ width: '100%', height: 20 }} />}>
        <Component
          value={value}
          onChange={onChange}
          onChangeCommitted={onChangeCommitted}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          layout={layout}
          layer={layer}
          label={label}
          showInput={showInput}
          showValueLabel={false}
          valueLabel={valueLabel}
          tooltipText={tooltipText}
          className={className}
          style={style}
          mantine={mantine}
          material={material}
          carbon={carbon}
        />
      </Suspense>
    )
  }
  
  // For stacked layout, show the label and value label on top
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelSliderGapVarForLibrary}, 8px)`, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ flex: 1 }}>{label}</div>
        {valueLabelElement}
      </div>
      {sliderComponent}
    </div>
  )
}
