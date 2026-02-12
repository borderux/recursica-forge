/**
 * Mantine Slider Implementation
 * 
 * Mantine-specific Slider component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Slider as MantineSlider } from '@mantine/core'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { getTypographyCssVar, extractTypographyStyleName } from '../../../utils/typographyUtils'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../../../utils/brandCssVars'
import { TextField } from '../../TextField'
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
  showMinMaxLabels = true,
  readOnly = false,
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
  const thumbElevationVar = getComponentLevelCssVar('Slider', 'thumb-elevation')
  
  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : null
  
  // Get input width and gap if showing input
  const inputWidthVar = getComponentLevelCssVar('Slider', 'input-width')
  const inputGapVar = getComponentLevelCssVar('Slider', 'input-gap')
  
  // Get disabled opacity CSS variable
  const disabledOpacityVar = getBrandStateCssVar(mode, 'disabled')
  
  // Reactively read thumb elevation from CSS variable
  const [thumbElevationFromVar, setThumbElevationFromVar] = useState<string | undefined>(() => {
    if (!thumbElevationVar) return undefined
    const value = readCssVar(thumbElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if this CSS var was updated or if no specific vars were specified
      if (!detail?.cssVars || detail.cssVars.includes(thumbElevationVar)) {
        if (thumbElevationVar) {
          const value = readCssVar(thumbElevationVar)
          setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
        }
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      if (thumbElevationVar) {
        const value = readCssVar(thumbElevationVar)
        setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [thumbElevationVar])
  
  // Determine thumb elevation from UIKit.json
  const thumbElevationBoxShadow = getElevationBoxShadow(mode, thumbElevationFromVar)
  
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

  // Get min-max label text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const minMaxLabelFontFamilyVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-family')
  const minMaxLabelFontSizeVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-size')
  const minMaxLabelFontWeightVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-weight')
  const minMaxLabelLetterSpacingVar = getComponentTextCssVar('Slider', 'min-max-label', 'letter-spacing')
  const minMaxLabelLineHeightVar = getComponentTextCssVar('Slider', 'min-max-label', 'line-height')
  const minMaxLabelTextDecorationVar = getComponentTextCssVar('Slider', 'min-max-label', 'text-decoration')
  const minMaxLabelTextTransformVar = getComponentTextCssVar('Slider', 'min-max-label', 'text-transform')
  const minMaxLabelFontStyleVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-style')
  
  // Get read-only value text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const readOnlyValueFontFamilyVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-family')
  const readOnlyValueFontSizeVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-size')
  const readOnlyValueFontWeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-weight')
  const readOnlyValueLetterSpacingVar = getComponentTextCssVar('Slider', 'read-only-value', 'letter-spacing')
  const readOnlyValueLineHeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'line-height')
  const readOnlyValueTextDecorationVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-decoration')
  const readOnlyValueTextTransformVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-transform')
  const readOnlyValueFontStyleVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-style')
  
  // Use layer text color directly for labels and values
  const layerTextColorVar = `--recursica-brand-themes-${mode}-layers-${layer}-elements-text-color`
  const layerTextEmphasisVar = `--recursica-brand-themes-${mode}-layers-${layer}-elements-text-high-emphasis`

  // State to force re-render when text CSS variables change
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      minMaxLabelFontFamilyVar, minMaxLabelFontSizeVar, minMaxLabelFontWeightVar, minMaxLabelLetterSpacingVar,
      minMaxLabelLineHeightVar, minMaxLabelTextDecorationVar, minMaxLabelTextTransformVar, minMaxLabelFontStyleVar,
      readOnlyValueFontFamilyVar, readOnlyValueFontSizeVar, readOnlyValueFontWeightVar, readOnlyValueLetterSpacingVar,
      readOnlyValueLineHeightVar, readOnlyValueTextDecorationVar, readOnlyValueTextTransformVar, readOnlyValueFontStyleVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Update if any text CSS var was updated, or if no specific vars were mentioned (global update)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
      if (shouldUpdate) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text vars
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [
    minMaxLabelFontFamilyVar, minMaxLabelFontSizeVar, minMaxLabelFontWeightVar, minMaxLabelLetterSpacingVar,
    minMaxLabelLineHeightVar, minMaxLabelTextDecorationVar, minMaxLabelTextTransformVar, minMaxLabelFontStyleVar,
    readOnlyValueFontFamilyVar, readOnlyValueFontSizeVar, readOnlyValueFontWeightVar, readOnlyValueLetterSpacingVar,
    readOnlyValueLineHeightVar, readOnlyValueTextDecorationVar, readOnlyValueTextTransformVar, readOnlyValueFontStyleVar
  ])

  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: (showInput || showValueLabel) ? `var(${inputGapVar}, 8px)` : 0, width: '100%', minWidth: 0 }}>
      {/* Min value display */}
      {showMinMaxLabels && (
        <span style={{ 
          fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
          fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
          fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
          letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
          lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
          textDecoration: minMaxLabelTextDecorationVar ? (readCssVar(minMaxLabelTextDecorationVar) || 'none') : 'none',
          textTransform: minMaxLabelTextTransformVar ? (readCssVar(minMaxLabelTextTransformVar) || 'none') : 'none',
          fontStyle: minMaxLabelFontStyleVar ? (readCssVar(minMaxLabelFontStyleVar) || 'normal') : 'normal',
          color: `var(${layerTextColorVar})`,
          opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar}, 0.7)`, 
          flexShrink: 0,
          marginRight: '8px',
        } as React.CSSProperties}>
          {minLabel ?? min}
        </span>
      )}
      <MantineSlider
        value={singleValue}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        label={tooltipText ? (val: number) => typeof tooltipText === 'function' ? tooltipText(val) : tooltipText : undefined}
        className={className}
        style={{
          flex: 1,
          '--slider-track-color': `var(${trackVar})`,
          '--track-bg': `var(${trackVar})`,
          '--slider-color': `var(${trackActiveVar})`,
          '--slider-thumb-color': `var(${thumbVar})`,
          '--slider-thumb-size': `var(${thumbSizeVar}, 20px)`,
          '--slider-size': `var(${trackHeightVar}, 4px)`,
          '--slider-radius': `var(${trackBorderRadiusVar})`,
          '--slider-thumb-radius': `var(${thumbBorderRadiusVar})`,
          '--slider-thumb-elevation': thumbElevationBoxShadow || '0 1px 2px rgba(0, 0, 0, 0.15)',
          ...(disabled ? {
            '--slider-opacity': `var(${disabledOpacityVar})`,
            '--slider-track-opacity': `var(${disabledOpacityVar})`,
            '--slider-thumb-opacity': `var(${disabledOpacityVar})`,
          } : {}),
          ...style,
        }}
        {...mantine}
        {...props}
      />
      {/* Max value display */}
      {showMinMaxLabels && (
        <span style={{ 
          fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
          fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
          fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
          letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
          lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
          textDecoration: minMaxLabelTextDecorationVar ? (readCssVar(minMaxLabelTextDecorationVar) || 'none') : 'none',
          textTransform: minMaxLabelTextTransformVar ? (readCssVar(minMaxLabelTextTransformVar) || 'none') : 'none',
          fontStyle: minMaxLabelFontStyleVar ? (readCssVar(minMaxLabelFontStyleVar) || 'normal') : 'normal',
          color: `var(${layerTextColorVar})`,
          opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar}, 0.7)`, 
          flexShrink: 0,
          marginLeft: '8px',
        } as React.CSSProperties}>
          {maxLabel ?? max}
        </span>
      )}
      {showInput && (
        <TextField
          type="number"
          min={min}
          max={max}
          step={step}
          value={singleValue}
          onChange={(e) => {
            if (!readOnly) {
              const newValue = Number(e.target.value)
              if (!isNaN(newValue)) {
                const clampedValue = Math.max(min, Math.min(max, newValue))
                if (isRange) {
                  onChange([clampedValue, value[1]])
                } else {
                  onChange(clampedValue)
                }
              }
            }
          }}
          state={disabled ? 'disabled' : 'default'}
          readOnly={readOnly}
          layer="layer-0"
          style={{
            width: `var(${inputWidthVar}, 60px)`,
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
          }}
        />
      )}
      {showValueLabel && !showInput && label && (
        <span
          style={{
            minWidth: `var(${inputWidthVar}, 60px)`,
            fontFamily: readOnlyValueFontFamilyVar ? `var(${readOnlyValueFontFamilyVar})` : undefined,
            fontSize: readOnlyValueFontSizeVar ? `var(${readOnlyValueFontSizeVar})` : undefined,
            fontWeight: readOnlyValueFontWeightVar ? `var(${readOnlyValueFontWeightVar})` : undefined,
            letterSpacing: readOnlyValueLetterSpacingVar ? `var(${readOnlyValueLetterSpacingVar})` : undefined,
            lineHeight: readOnlyValueLineHeightVar ? `var(${readOnlyValueLineHeightVar})` : undefined,
            textDecoration: readOnlyValueTextDecorationVar ? (readCssVar(readOnlyValueTextDecorationVar) || 'none') : 'none',
            textTransform: readOnlyValueTextTransformVar ? (readCssVar(readOnlyValueTextTransformVar) || 'none') : 'none',
            fontStyle: readOnlyValueFontStyleVar ? (readCssVar(readOnlyValueFontStyleVar) || 'normal') : 'normal',
            color: `var(${layerTextColorVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar})`,
            whiteSpace: 'nowrap',
            textAlign: 'right',
          } as React.CSSProperties}
        >
          {displayValueStr}
        </span>
      )}
    </div>
  )
  
  if (layout === 'side-by-side' && label) {
    // For side-by-side, use Label's gutter property
    const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: gapValue, width: '100%', ...style }}>
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
  
  // For stacked layout, Label's bottom-padding handles the spacing, so no gap needed
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', ...style }}>
      {label && <div>{label}</div>}
      {sliderElement}
    </div>
  )
}
