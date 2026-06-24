/**
 * Carbon Slider Implementation
 * 
 * Carbon-specific Slider component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Slider as CarbonSlider } from '@carbon/react'
import type { SliderProps as AdapterSliderProps } from '../../Slider'
import { getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { getTypographyCssVar, extractTypographyStyleName } from '../../../utils/typographyUtils'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../../../utils/brandCssVars'
import { genericLayerText } from '../../../../core/css/cssVarBuilder'
import { NumberInput } from '../../NumberInput'
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
  carbon,
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

  // Input override vars
  const inputBackgroundVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-background')
  const inputTextVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-text')
  const inputBorderColorVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-border-color')
  const inputBorderSizeVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'input-border-size')
  const inputBorderRadiusVar = getComponentLevelCssVar('Slider', 'input-border-radius')
  const targetState = effectiveState

  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : null

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
  // Get input width and gap if showing input
  const inputWidthVar = getComponentLevelCssVar('Slider', 'input-width')
  const disabledOpacityVar = getBrandStateCssVar(mode, 'disabled')
  const inputGapVar = getComponentLevelCssVar('Slider', 'input-gap')

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

  // Calculate tooltip text
  let computedTooltipText: string | undefined
  try {
    if (tooltipText) {
      if (typeof tooltipText === 'function') {
        computedTooltipText = tooltipText(singleValue)
      } else {
        computedTooltipText = tooltipText
      }
    }
  } catch (error) {
    computedTooltipText = undefined
  }

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

  const labelsBelow = layout === 'labels-below'

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
        <>
          <style>{`
            .recursica-slider-number-input > div > .recursica-number-input-wrapper {
              min-width: var(${inputWidthVar}, 60px) !important;
              max-width: var(${inputWidthVar}, 60px) !important;
            }
          `}</style>
          <NumberInput
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={(e) => {
              if (!readOnly) {
                const newValue = Number(e.target.value)
                if (!isNaN(newValue)) {
                  const clampedValue = Math.max(min, Math.min(value[1], newValue))
                  onChange([clampedValue, value[1]])
                  if (onChangeCommitted) onChangeCommitted([clampedValue, value[1]])
                }
              }
            }}
            onBlur={() => {
              if (!readOnly && onChangeCommitted) {
                onChangeCommitted([value[0], value[1]])
              }
            }}
            onKeyDown={(e) => {
              if (!readOnly && e.key === 'Enter' && onChangeCommitted) {
                onChangeCommitted([value[0], value[1]])
              }
            }}
            state={targetState}
            readOnly={readOnly}
            layer="layer-0"
            disableTopBottomMargin={true}
            className="recursica-slider-number-input"
            style={{
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
        </>
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
      <div
        className="recursica-carbon-slider-wrapper"

        title={computedTooltipText}
        style={{
          flex: 1,
          ['--recursica_ui-kit_components_slider_track_color' as string]: trackColor,
          ['--recursica_ui-kit_components_slider_track_active_color' as string]: trackActiveColor,
          ['--recursica_ui-kit_components_slider_thumb_color' as string]: thumbColor,
          ['--recursica_ui-kit_components_slider_track_height' as string]: `var(${trackHeightVar}, 4px)`,
          ['--recursica_ui-kit_components_slider_thumb_size' as string]: disabled ? '0px' : `var(${thumbSizeVar}, 20px)`,
          ['--recursica_ui-kit_components_slider_track_border-radius' as string]: `var(${trackBorderRadiusVar})`,
          ['--recursica_ui-kit_components_slider_thumb_border-radius' as string]: `var(${thumbBorderRadiusVar})`,
          ['--recursica_ui-kit_components_slider_thumb_elevation' as string]: thumbElevationBoxShadow || '0 1px 2px rgba(0, 0, 0, 0.15)',
        } as React.CSSProperties}
      >
        <CarbonSlider
          value={singleValue}
          onChange={handleChange}
          onRelease={handleRelease}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          labelText={typeof label === 'string' ? label : (computedTooltipText || '')}
          aria-label={computedTooltipText}
          className={className}
          style={style}
          {...carbon}
          {...props}
        />
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
              textDecoration: minMaxLabelTextDecorationVar ? (readCssVar(minMaxLabelTextDecorationVar) || 'none') : 'none',
              textTransform: minMaxLabelTextTransformVar ? (readCssVar(minMaxLabelTextTransformVar) || 'none') : 'none',
              fontStyle: minMaxLabelFontStyleVar ? (readCssVar(minMaxLabelFontStyleVar) || 'normal') : 'normal',
              color: `var(${layerTextColorVar})`,
              opacity: `var(${layerTextEmphasisVar})`,
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
        <>
          <style>{`
            .recursica-slider-number-input > div > .recursica-number-input-wrapper {
              min-width: var(${inputWidthVar}, 60px) !important;
              max-width: var(${inputWidthVar}, 60px) !important;
            }
          `}</style>
          <NumberInput
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
            className="recursica-slider-number-input"
            style={{
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
        </>
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
            opacity: disabled ? 0.5 : `var(${layerTextEmphasisVar})`,
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
    // Get min-width CSS variable for slider if it exists
    const sliderMinWidthVar = getComponentLevelCssVar('Slider', 'min-width')
    // For side-by-side, use Label's gutter property
    const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: gapValue, width: '100%', ...style }}>
        <div style={{ flexShrink: 0 }}>
          {label}
        </div>
        <div style={{
          flex: 1,
          minWidth: sliderMinWidthVar ? `var(${sliderMinWidthVar})` : 0,
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
