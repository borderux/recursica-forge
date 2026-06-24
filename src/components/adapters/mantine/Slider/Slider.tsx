/**
 * Mantine Slider Implementation
 * 
 * Mantine-specific Slider component that uses CSS variables for theming.
 */

import { useState, useEffect, useMemo } from 'react'
import { Slider as MantineSlider, RangeSlider as MantineRangeSlider } from '@mantine/core'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { getTypographyCssVar, extractTypographyStyleName } from '../../../utils/typographyUtils'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../../../utils/brandCssVars'
import { genericLayerText } from '../../../../core/css/cssVarBuilder'
import { TextField } from '../../TextField'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
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
  minIcon,
  maxIcon,
  iconSize,
  readOnly = false,
  state = 'default',
  errorText,
  type = 'continuous',
  className,
  style,
  mantine,
  ...props
}: AdapterSliderProps) {
  const { mode } = useThemeMode()

  // Determine effective state
  const effectiveState = disabled ? 'disabled' : state

  // Get CSS variables for colors
  const trackVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'track')
  const trackActiveVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'track-active')
  const thumbVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'thumb')

  // Get CSS variables for sizes
  const trackHeightVar = getComponentLevelCssVar('Slider', 'track-height')
  const thumbSizeVar = getComponentLevelCssVar('Slider', 'thumb-size')
  const trackBorderRadiusVar = getComponentLevelCssVar('Slider', 'track-border-radius')
  const thumbBorderRadiusVar = getComponentLevelCssVar('Slider', 'thumb-border-radius')
  const thumbElevationVar = getComponentLevelCssVar('Slider', 'thumb-elevation')
  const iconSizeVar = getComponentLevelCssVar('Slider', 'icon-size')
  const iconColorVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'icon-color')

  const inputBackgroundVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-background')
  const inputTextVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-text')
  const inputBorderColorVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-border-color')
  const inputBorderSizeVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'input-border-size')
  const inputBorderRadiusVar = getComponentLevelCssVar('Slider', 'input-border-radius')
  const inputHeightVar = getComponentLevelCssVar('Slider', 'input-height')
  const inputPaddingVerticalVar = getComponentLevelCssVar('Slider', 'input-padding-vertical')
  const inputPaddingLeftVar = getComponentLevelCssVar('Slider', 'input-padding-left')
  const inputPaddingRightVar = getComponentLevelCssVar('Slider', 'input-padding-right')
  const stepIndicatorBorderRadiusVar = getComponentLevelCssVar('Slider', 'step-indicator-border-radius')
  const stepIndicatorWidthVar = getComponentLevelCssVar('Slider', 'step-indicator-width')

  const inputTextFontSizeVar = getComponentTextCssVar('Slider', 'input-text', 'font-size')
  const inputTextFontFamilyVar = getComponentTextCssVar('Slider', 'input-text', 'font-family')
  const inputTextFontWeightVar = getComponentTextCssVar('Slider', 'input-text', 'font-weight')
  const inputTextLetterSpacingVar = getComponentTextCssVar('Slider', 'input-text', 'letter-spacing')
  const inputTextLineHeightVar = getComponentTextCssVar('Slider', 'input-text', 'line-height')
  const inputTextTextDecorationVar = getComponentTextCssVar('Slider', 'input-text', 'text-decoration')
  const inputTextTextTransformVar = getComponentTextCssVar('Slider', 'input-text', 'text-transform')
  const inputTextFontStyleVar = getComponentTextCssVar('Slider', 'input-text', 'font-style')

  const targetState = effectiveState

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

  // Determine thumb elevation from recursica_ui-kit.json
  const thumbElevationBoxShadow = getElevationBoxShadow(mode, thumbElevationFromVar)

  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value

  const marks = useMemo(() => {
    if (type !== 'discrete' || typeof step !== 'number') return undefined
    const calculatedMarks = []
    for (let i = min; i <= max; i += step) {
      calculatedMarks.push({ value: i })
    }
    return calculatedMarks
  }, [type, min, max, step])

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
  const layerNum = parseInt(layer.replace('layer-', ''), 10) || 0
  const layerTextColorVar = genericLayerText(layerNum, 'color')
  const layerTextEmphasisVar = genericLayerText(layerNum, 'high-emphasis')

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

  const labelsBelow = layout?.includes('labels-below')

  const labelsBelowContent = labelsBelow && (showMinMaxLabels || minIcon || maxIcon) ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {minIcon && (
          <span style={{ 
            display: 'flex', 
            fontSize: iconSize ?? `var(${iconSizeVar}, 16px)`,
            color: `var(${iconColorVar}, var(${layerTextColorVar}))`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1
          }}>
            {minIcon}
          </span>
        )}
        {showMinMaxLabels && (
          <span style={{
            fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
            fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
            fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
            letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
            lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
            textDecoration: minMaxLabelTextDecorationVar ? `var(${minMaxLabelTextDecorationVar})` : 'none',
            textTransform: minMaxLabelTextTransformVar ? `var(${minMaxLabelTextTransformVar})` : 'none',
            fontStyle: minMaxLabelFontStyleVar ? `var(${minMaxLabelFontStyleVar})` : 'normal',
            color: `var(${layerTextColorVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar})`,
          } as React.CSSProperties}>
            {minLabel ?? min}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {showMinMaxLabels && (
          <span style={{
            fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
            fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
            fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
            letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
            lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
            textDecoration: minMaxLabelTextDecorationVar ? `var(${minMaxLabelTextDecorationVar})` : 'none',
            textTransform: minMaxLabelTextTransformVar ? `var(${minMaxLabelTextTransformVar})` : 'none',
            fontStyle: minMaxLabelFontStyleVar ? `var(${minMaxLabelFontStyleVar})` : 'normal',
            color: `var(${layerTextColorVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar})`,
          } as React.CSSProperties}>
            {maxLabel ?? max}
          </span>
        )}
        {maxIcon && (
          <span style={{ 
            display: 'flex', 
            fontSize: iconSize ?? `var(${iconSizeVar}, 16px)`,
            color: `var(${iconColorVar}, var(${layerTextColorVar}))`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1
          }}>
            {maxIcon}
          </span>
        )}
      </div>
    </div>
  ) : null;

  const sliderElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: (showInput || showValueLabel) ? `var(${inputGapVar}, 8px)` : 0, width: '100%', minWidth: 0 }}>
      {/* Min Icon display */}
      {!labelsBelow && minIcon && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '8px' }}>
          <span style={{ 
            display: 'flex', 
            fontSize: iconSize ?? `var(${iconSizeVar}, 16px)`,
            color: `var(${iconColorVar}, var(${layerTextColorVar}))`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1
          }}>
            {minIcon}
          </span>
        </div>
      )}

      {showInput && isRange && (
        <TextField
          type="number"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            if (!readOnly) {
              const newValue = Number(e.target.value)
              if (!isNaN(newValue)) {
                onChange([newValue, value[1]])
              }
            }
          }}
          onBlur={() => {
            if (!readOnly) {
              const clampedValue = Math.max(min, Math.min(value[1], value[0]))
              if (value[0] !== clampedValue) {
                onChange([clampedValue, value[1]])
              }
              if (onChangeCommitted) {
                onChangeCommitted([clampedValue, value[1]])
              }
            }
          }}
          onKeyDown={(e) => {
            if (!readOnly && e.key === 'Enter') {
              const clampedValue = Math.max(min, Math.min(value[1], value[0]))
              if (value[0] !== clampedValue) {
                onChange([clampedValue, value[1]])
              }
              if (onChangeCommitted) {
                onChangeCommitted([clampedValue, value[1]])
              }
            }
          }}
          state={targetState}
          readOnly={readOnly}
          layer="layer-0"
          disableTopBottomMargin={true}
          style={{
            width: `var(${inputWidthVar}, 60px)`,
            fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background')]: `var(${inputBackgroundVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'text')]: `var(${inputTextVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'border-color')]: `var(${inputBorderColorVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'border-size')]: `var(${inputBorderSizeVar})`,
            [getComponentLevelCssVar('TextField', 'border-radius')]: `var(${inputBorderRadiusVar})`,
            [getComponentLevelCssVar('TextField', 'min-height')]: `var(${inputHeightVar})`,
            [getComponentLevelCssVar('TextField', 'vertical-padding')]: `var(${inputPaddingVerticalVar})`,
            [getComponentLevelCssVar('TextField', 'horizontal-padding')]: `var(${inputPaddingLeftVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-size')]: `var(${inputTextFontSizeVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-family')]: `var(${inputTextFontFamilyVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-weight')]: `var(${inputTextFontWeightVar})`,
            [getComponentTextCssVar('TextField', 'text', 'letter-spacing')]: `var(${inputTextLetterSpacingVar})`,
            [getComponentTextCssVar('TextField', 'text', 'line-height')]: `var(${inputTextLineHeightVar})`,
            [getComponentTextCssVar('TextField', 'text', 'text-decoration')]: `var(${inputTextTextDecorationVar})`,
            [getComponentTextCssVar('TextField', 'text', 'text-transform')]: `var(${inputTextTextTransformVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-style')]: `var(${inputTextFontStyleVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background')]: `var(${inputBackgroundVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'text')]: `var(${inputTextVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'border-color')]: `var(${inputBorderColorVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'border-size')]: `var(${inputBorderSizeVar})`,
            [getComponentLevelCssVar('NumberInput', 'border-radius')]: `var(${inputBorderRadiusVar})`,
            [getComponentLevelCssVar('NumberInput', 'min-height')]: `var(${inputHeightVar})`,
            [getComponentLevelCssVar('NumberInput', 'vertical-padding')]: `var(${inputPaddingVerticalVar})`,
            [getComponentLevelCssVar('NumberInput', 'horizontal-padding')]: `var(${inputPaddingLeftVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-size')]: `var(${inputTextFontSizeVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-family')]: `var(${inputTextFontFamilyVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-weight')]: `var(${inputTextFontWeightVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'letter-spacing')]: `var(${inputTextLetterSpacingVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'line-height')]: `var(${inputTextLineHeightVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'text-decoration')]: `var(${inputTextTextDecorationVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'text-transform')]: `var(${inputTextTextTransformVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-style')]: `var(${inputTextFontStyleVar})`,
          } as any}
        />
      )}

      {/* Min Label display */}
      {!labelsBelow && showMinMaxLabels && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '8px', marginLeft: (showInput && isRange) ? '8px' : 0 }}>
          <span style={{
            fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
            fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
            fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
            letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
            lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
            textDecoration: minMaxLabelTextDecorationVar ? `var(${minMaxLabelTextDecorationVar})` : 'none',
            textTransform: minMaxLabelTextTransformVar ? `var(${minMaxLabelTextTransformVar})` : 'none',
            fontStyle: minMaxLabelFontStyleVar ? `var(${minMaxLabelFontStyleVar})` : 'normal',
            color: `var(${layerTextColorVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar})`,
          } as React.CSSProperties}>
            {minLabel ?? min}
          </span>
        </div>
      )}
      {/* Slider component */}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isRange ? (
          <MantineRangeSlider
            value={value as [number, number]}
            onChange={handleChange as any}
            onChangeEnd={handleChangeEnd as any}
            min={min}
            max={max}
            step={step}
            marks={marks}
            disabled={disabled}
            label={tooltipText ? (val: number) => typeof tooltipText === 'function' ? tooltipText(val) : tooltipText : undefined}
            className={className}
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              ['--slider-track-color' as string]: `var(${trackVar})`,
              ['--slider-color' as string]: `var(${trackActiveVar})`,
              ['--slider-thumb-color' as string]: `var(${thumbVar})`,
              ['--custom-track-height' as string]: `var(${trackHeightVar}, 4px)`,
              ['--slider-size' as string]: `calc(var(${thumbSizeVar}, 20px) / 2)`,
              ['--slider-radius' as string]: `var(${trackBorderRadiusVar}, 100px)`,
              ['--slider-thumb-size' as string]: disabled ? '0px' : `var(${thumbSizeVar}, 20px)`,
              ['--slider-thumb-radius' as string]: `var(${thumbBorderRadiusVar}, 100px)`,
              ['--slider-thumb-elevation' as string]: thumbElevationBoxShadow,
              ['--step-indicator-color' as string]: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'step-indicator-color')})`,
              ['--step-indicator-color-active' as string]: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'step-indicator-color-active')})`,
              ...style,
            }}
            {...mantine}
            {...props}
          />
        ) : (
          <MantineSlider
            value={singleValue}
            onChange={handleChange as any}
            onChangeEnd={handleChangeEnd as any}
            min={min}
            max={max}
            step={step}
            marks={marks}
            disabled={disabled}
            label={tooltipText ? (val: number) => typeof tooltipText === 'function' ? tooltipText(val) : tooltipText : undefined}
            className={className}
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              ['--slider-track-color' as string]: `var(${trackVar})`,
              ['--slider-color' as string]: `var(${trackActiveVar})`,
              ['--slider-thumb-color' as string]: `var(${thumbVar})`,
              ['--custom-track-height' as string]: `var(${trackHeightVar}, 4px)`,
              ['--slider-size' as string]: `calc(var(${thumbSizeVar}, 20px) / 2)`,
              ['--slider-radius' as string]: `var(${trackBorderRadiusVar}, 100px)`,
              ['--slider-thumb-size' as string]: disabled ? '0px' : `var(${thumbSizeVar}, 20px)`,
              ['--slider-thumb-radius' as string]: `var(${thumbBorderRadiusVar}, 100px)`,
              ['--slider-thumb-elevation' as string]: thumbElevationBoxShadow,
              ['--step-indicator-radius' as string]: `var(${stepIndicatorBorderRadiusVar}, 2px)`,
              ['--step-indicator-width' as string]: `var(${stepIndicatorWidthVar}, 2px)`,
              ['--step-indicator-color' as string]: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'step-indicator-color')})`,
              ['--step-indicator-color-active' as string]: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'step-indicator-color-active')})`,
              ...style,
            }}
            {...mantine}
            {...props}
          />
        )}
        {labelsBelowContent}
      </div>
      {/* Max value display */}
      {!labelsBelow && (showMinMaxLabels || maxIcon) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
          {showMinMaxLabels && (
            <span style={{
              fontFamily: minMaxLabelFontFamilyVar ? `var(${minMaxLabelFontFamilyVar})` : undefined,
              fontSize: minMaxLabelFontSizeVar ? `var(${minMaxLabelFontSizeVar})` : '12px',
              fontWeight: minMaxLabelFontWeightVar ? `var(${minMaxLabelFontWeightVar})` : undefined,
              letterSpacing: minMaxLabelLetterSpacingVar ? `var(${minMaxLabelLetterSpacingVar})` : undefined,
              lineHeight: minMaxLabelLineHeightVar ? `var(${minMaxLabelLineHeightVar})` : undefined,
              textDecoration: minMaxLabelTextDecorationVar ? `var(${minMaxLabelTextDecorationVar})` : 'none',
              textTransform: minMaxLabelTextTransformVar ? `var(${minMaxLabelTextTransformVar})` : 'none',
              fontStyle: minMaxLabelFontStyleVar ? `var(${minMaxLabelFontStyleVar})` : 'normal',
              color: `var(${layerTextColorVar})`,
              opacity: disabled ? `var(${disabledOpacityVar})` : `var(${layerTextEmphasisVar})`,
            } as React.CSSProperties}>
              {maxLabel ?? max}
            </span>
          )}
          {maxIcon && (
            <span style={{ 
              display: 'flex', 
              fontSize: iconSize ?? `var(${iconSizeVar}, 16px)`,
              color: `var(${iconColorVar}, var(${layerTextColorVar}))`,
              opacity: disabled ? `var(${disabledOpacityVar})` : 1
            }}>
              {maxIcon}
            </span>
          )}
        </div>
      )}
      {showInput && (
        <TextField
          type="number"
          min={min}
          max={max}
          step={step}
          value={isRange ? value[1] : singleValue}
          onChange={(e) => {
            if (!readOnly) {
              const newValue = Number(e.target.value)
              if (!isNaN(newValue)) {
                if (isRange) {
                  onChange([value[0], newValue])
                } else {
                  onChange(newValue)
                }
              }
            }
          }}
          onBlur={() => {
            if (!readOnly) {
              if (isRange) {
                const clampedValue = Math.max(value[0], Math.min(max, value[1]))
                if (value[1] !== clampedValue) {
                  onChange([value[0], clampedValue])
                }
                if (onChangeCommitted) {
                  onChangeCommitted([value[0], clampedValue])
                }
              } else {
                const clampedValue = Math.max(min, Math.min(max, singleValue))
                if (singleValue !== clampedValue) {
                  onChange(clampedValue)
                }
                if (onChangeCommitted) {
                  onChangeCommitted(clampedValue)
                }
              }
            }
          }}
          onKeyDown={(e) => {
            if (!readOnly && e.key === 'Enter') {
              if (isRange) {
                const clampedValue = Math.max(value[0], Math.min(max, value[1]))
                if (value[1] !== clampedValue) {
                  onChange([value[0], clampedValue])
                }
                if (onChangeCommitted) {
                  onChangeCommitted([value[0], clampedValue])
                }
              } else {
                const clampedValue = Math.max(min, Math.min(max, singleValue))
                if (singleValue !== clampedValue) {
                  onChange(clampedValue)
                }
                if (onChangeCommitted) {
                  onChangeCommitted(clampedValue)
                }
              }
            }
          }}
          state={targetState}
          readOnly={readOnly}
          layer="layer-0"
          disableTopBottomMargin={true}
          style={{
            width: `var(${inputWidthVar}, 60px)`,
            fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background')]: `var(${inputBackgroundVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'text')]: `var(${inputTextVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'border-color')]: `var(${inputBorderColorVar})`,
            [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'border-size')]: `var(${inputBorderSizeVar})`,
            [getComponentLevelCssVar('TextField', 'border-radius')]: `var(${inputBorderRadiusVar})`,
            [getComponentLevelCssVar('TextField', 'min-height')]: `var(${inputHeightVar})`,
            [getComponentLevelCssVar('TextField', 'vertical-padding')]: `var(${inputPaddingVerticalVar})`,
            [getComponentLevelCssVar('TextField', 'horizontal-padding')]: `var(${inputPaddingLeftVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-size')]: `var(${inputTextFontSizeVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-family')]: `var(${inputTextFontFamilyVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-weight')]: `var(${inputTextFontWeightVar})`,
            [getComponentTextCssVar('TextField', 'text', 'letter-spacing')]: `var(${inputTextLetterSpacingVar})`,
            [getComponentTextCssVar('TextField', 'text', 'line-height')]: `var(${inputTextLineHeightVar})`,
            [getComponentTextCssVar('TextField', 'text', 'text-decoration')]: `var(${inputTextTextDecorationVar})`,
            [getComponentTextCssVar('TextField', 'text', 'text-transform')]: `var(${inputTextTextTransformVar})`,
            [getComponentTextCssVar('TextField', 'text', 'font-style')]: `var(${inputTextFontStyleVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background')]: `var(${inputBackgroundVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'text')]: `var(${inputTextVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'border-color')]: `var(${inputBorderColorVar})`,
            [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'border-size')]: `var(${inputBorderSizeVar})`,
            [getComponentLevelCssVar('NumberInput', 'border-radius')]: `var(${inputBorderRadiusVar})`,
            [getComponentLevelCssVar('NumberInput', 'min-height')]: `var(${inputHeightVar})`,
            [getComponentLevelCssVar('NumberInput', 'vertical-padding')]: `var(${inputPaddingVerticalVar})`,
            [getComponentLevelCssVar('NumberInput', 'horizontal-padding')]: `var(${inputPaddingLeftVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-size')]: `var(${inputTextFontSizeVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-family')]: `var(${inputTextFontFamilyVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-weight')]: `var(${inputTextFontWeightVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'letter-spacing')]: `var(${inputTextLetterSpacingVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'line-height')]: `var(${inputTextLineHeightVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'text-decoration')]: `var(${inputTextTextDecorationVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'text-transform')]: `var(${inputTextTextTransformVar})`,
            [getComponentTextCssVar('NumberInput', 'text', 'font-style')]: `var(${inputTextFontStyleVar})`,
          } as any}
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
            textDecoration: readOnlyValueTextDecorationVar ? `var(${readOnlyValueTextDecorationVar})` : 'none',
            textTransform: readOnlyValueTextTransformVar ? `var(${readOnlyValueTextTransformVar})` : 'none',
            fontStyle: readOnlyValueFontStyleVar ? `var(${readOnlyValueFontStyleVar})` : 'normal',
            color: `var(${inputTextVar}, var(${layerTextColorVar}))`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1,
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
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {sliderElement}
          </div>
          {errorText && state === 'error' && (() => {
            const ErrorIcon = iconNameToReactComponent('warning')
            return <AssistiveElement text={typeof errorText === 'string' ? errorText : ''} icon={typeof errorText !== 'string' ? errorText : (ErrorIcon ? <ErrorIcon /> : undefined)} variant="error" layer={layer} />
          })()}
        </div>
      </div>
    )
  }

  // For stacked layout, Label's bottom-padding handles the spacing, so no gap needed
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', ...style }}>
      {label && <div>{label}</div>}
      {sliderElement}
      {errorText && state === 'error' && (() => {
        const ErrorIcon = iconNameToReactComponent('warning')
        return <AssistiveElement text={typeof errorText === 'string' ? errorText : ''} icon={typeof errorText !== 'string' ? errorText : (ErrorIcon ? <ErrorIcon /> : undefined)} variant="error" layer={layer} />
      })()}
    </div>
  )
}
