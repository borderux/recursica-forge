/**
 * Material UI Slider Implementation
 *
 * Material UI-specific Slider component that uses CSS variables for theming. Unlike Mantine,
 * MUI's real `Slider` has no dedicated real-adapter package to delegate layout to, so this
 * wrapper still hand-renders min/max labels, the optional numeric input(s), and forwards the
 * formatted value display to MUI's own native mechanism (see below) — same pattern as every
 * other Material field wrapper.
 *
 * `valueLabel`/`showValueLabel` (2026-08, corrected): raw `@mui/material`'s Slider already has
 * this exact "format the value for display" concept natively — `valueLabelFormat?: string |
 * ((value, index) => ReactNode)` plus `valueLabelDisplay?: 'on' | 'auto' | 'off'`. Previously
 * this wrapper hand-rolled its own duplicate value-label `<span>` (rendered under the same
 * `showValueLabel && !showInput && label` condition MUI's own floating label used), causing the
 * formatted value to render twice on screen. Now there's exactly one renderer: MUI's own,
 * driven by `valueLabelFormat={valueLabel}` and `valueLabelDisplay` computed from
 * `showValueLabel` (permanently visible) vs. just `valueLabel` being set (shows during
 * drag/hover only) vs. neither (off).
 */

import React from 'react'
import { Slider as MaterialSlider } from '@mui/material'
import type { SliderProps as AdapterSliderProps } from '../../common/Slider'
import { getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { useCssVar } from '../../../hooks/useCssVar'
import { getTypographyCssVar, extractTypographyStyleName } from '../../../utils/typographyUtils'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../../../utils/brandCssVars'
import { genericLayerText } from '../../../../core/css/cssVarBuilder'
import { NumberInput } from '../../NumberInput'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Slider.css'

export default React.forwardRef<any, AdapterSliderProps>(function Slider({
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
  material,
  ...props
}: AdapterSliderProps, ref) {
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
  const inputBackgroundVar = buildComponentCssVarPath('Slider', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'input-background-color')
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
  const inputGapVar = getComponentLevelCssVar('Slider', 'input-gap')

  // Get disabled opacity CSS variable
  const disabledOpacityVar = getBrandStateCssVar(mode, 'disabled')

  // Reactively read thumb elevation from CSS variable (useCssVar already handles the
  // MutationObserver + cssVarsUpdated reactivity generically — no need to hand-roll it here).
  const thumbElevationRaw = useCssVar(thumbElevationVar)
  const thumbElevationFromVar = thumbElevationRaw ? parseElevationValue(thumbElevationRaw) : undefined

  // Determine thumb elevation from recursica_ui-kit.json
  const thumbElevationBoxShadow = getElevationBoxShadow(mode, thumbElevationFromVar)

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

  // Get min-max label text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const minMaxLabelFontFamilyVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-family')
  const minMaxLabelFontSizeVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-size')
  const minMaxLabelFontWeightVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-weight')
  const minMaxLabelLetterSpacingVar = getComponentTextCssVar('Slider', 'min-max-label', 'letter-spacing')
  const minMaxLabelLineHeightVar = getComponentTextCssVar('Slider', 'min-max-label', 'line-height')
  const minMaxLabelTextDecorationVar = getComponentTextCssVar('Slider', 'min-max-label', 'text-decoration')
  const minMaxLabelTextTransformVar = getComponentTextCssVar('Slider', 'min-max-label', 'text-transform')
  const minMaxLabelFontStyleVar = getComponentTextCssVar('Slider', 'min-max-label', 'font-style')

  // Use layer text color directly for labels and values
  const layerNum = parseInt(layer.replace('layer-', ''), 10) || 0
  const layerTextColorVar = genericLayerText(layerNum, 'color')
  const layerTextEmphasisVar = genericLayerText(layerNum, 'high-emphasis')

  // Note: the min-max label spans below reference these CSS vars via live `var(...)` inline
  // styles, which the browser's own cascade keeps in sync automatically — no MutationObserver/
  // event-listener re-render plumbing needed (that hand-rolled reactivity used to live here,
  // duplicated across every field wrapper; see useCssVar for the one place it's still needed —
  // reading a var's *computed value* into JS, e.g. thumbElevationFromVar above).

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
      {!labelsBelow && (showMinMaxLabels || minIcon) && (
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
            onChange={(val) => {
              if (!readOnly) {
                const newValue = Number(val)
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
              [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background-color')]: `var(${inputBackgroundVar})`,
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
              [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background-color')]: `var(${inputBackgroundVar})`,
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <MaterialSlider
          value={isRange ? (value as number[]) : singleValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={min}
          max={max}
          step={step}
          marks={type === 'discrete'}
          disabled={disabled}
          valueLabelDisplay={showValueLabel ? 'on' : (valueLabel ? 'auto' : 'off')}
          valueLabelFormat={valueLabel}
          className={className}
          sx={{
            color: trackActiveColor,
            height: `var(${trackHeightVar}, 4px)`,
            '& .MuiSlider-track': {
              backgroundColor: trackActiveColor,
              height: `var(${trackHeightVar}, 4px)`,
              borderRadius: `var(${trackBorderRadiusVar})`,
              opacity: disabled ? `var(${disabledOpacityVar})` : 1,
            },
            '&.Mui-disabled .MuiSlider-track': {
              opacity: `var(${disabledOpacityVar})`,
            },
            '& .MuiSlider-rail': {
              backgroundColor: trackColor,
              height: `var(${trackHeightVar}, 4px)`,
              borderRadius: `var(${trackBorderRadiusVar})`,
              opacity: disabled ? `var(${disabledOpacityVar})` : 1,
            },
            '&.Mui-disabled .MuiSlider-rail': {
              opacity: `var(${disabledOpacityVar})`,
            },
            '& .MuiSlider-thumb': {
              backgroundColor: thumbColor,
              width: disabled ? '0px' : `var(${thumbSizeVar}, 20px)`,
              height: disabled ? '0px' : `var(${thumbSizeVar}, 20px)`,
              border: 'none',
              borderRadius: `var(${thumbBorderRadiusVar})`,
              ...(thumbElevationBoxShadow ? { boxShadow: thumbElevationBoxShadow } : { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)' }),
              opacity: disabled ? `var(${disabledOpacityVar})` : 1,
              '&:hover': {
                ...(thumbElevationBoxShadow ? { boxShadow: thumbElevationBoxShadow } : { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }),
              },
              '&.Mui-focusVisible': {
                ...(thumbElevationBoxShadow ? { boxShadow: thumbElevationBoxShadow } : { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }),
              },
            },
            '&.Mui-disabled .MuiSlider-thumb': {
              opacity: `var(${disabledOpacityVar})`,
            },

            '& .MuiSlider-mark': {
              width: `var(${buildComponentCssVarPath('Slider', 'properties', 'step-indicator-width')}, 2px)`,
              height: `var(${buildComponentCssVarPath('Slider', 'properties', 'step-indicator-width')}, 2px)`,
              borderRadius: `var(${buildComponentCssVarPath('Slider', 'properties', 'step-indicator-border-radius')}, 2px)`,
              backgroundColor: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', targetState, 'properties', 'colors', layer, 'step-indicator-color')}, transparent)`,
            },
            '& .MuiSlider-markActive': {
              backgroundColor: `var(${buildComponentCssVarPath('Slider', 'variants', 'states', targetState, 'properties', 'colors', layer, 'step-indicator-color-active')}, transparent)`,
            },

            ...style,
          }}
          {...material}
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
            onChange={(val) => {
            if (!readOnly) {
              const newValue = Number(val)
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
              [buildComponentCssVarPath('TextField', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background-color')]: `var(${inputBackgroundVar})`,
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
              [buildComponentCssVarPath('NumberInput', 'variants', 'states', targetState, 'properties', 'colors', 'layer-0', 'background-color')]: `var(${inputBackgroundVar})`,
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
    </div>
  )

  if (layout === 'side-by-side' && label) {
    // For side-by-side, use Label's gutter property
    const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
    return (
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: gapValue, width: '100%', ...style }}>
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
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', width: '100%', ...style }}>
      {label && <div>{label}</div>}
      {sliderElement}
      {errorText && state === 'error' && (() => {
        const ErrorIcon = iconNameToReactComponent('warning')
        return <AssistiveElement text={typeof errorText === 'string' ? errorText : ''} icon={typeof errorText !== 'string' ? errorText : (ErrorIcon ? <ErrorIcon /> : undefined)} variant="error" layer={layer} />
      })()}
    </div>
  )
})
