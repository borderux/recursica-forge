/**
 * Slider Component Adapter
 * 
 * Unified Slider component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { layerText } from '../../core/css/cssVarBuilder'
import { Label } from './Label'
import { TextField } from './TextField'
import { NumberInput } from './NumberInput'
import { getTypographyCssVar, extractTypographyStyleName } from '../utils/typographyUtils'
import type { SliderProps } from './common/Slider'

// Re-exported so existing `import type { SliderProps } from '.../adapters/Slider'`
// call sites keep working — the types now live in common/Slider.ts.
export type { SliderProps } from './common/Slider'

export function Slider({
  value,
  onChange,
  onChangeCommitted,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  state = 'default',
  errorText,
  type = 'continuous',
  layout = 'stacked',
  layer = 'layer-0',
  label,
  showInput,
  showMinMaxInput = false,
  showValueLabel = false,
  valueLabel,
  tooltipText,
  minLabel,
  maxLabel,
  showMinMaxLabels,
  minIcon,
  maxIcon,
  iconSize,
  readOnly = false,
  className,
  style,
  mantine,
  material,
  carbon,
}: SliderProps) {
  // Use showMinMaxInput as a master toggle if showInput/showMinMaxLabels/showValueLabel aren't explicitly provided
  let finalShowInput = showInput ?? (showMinMaxInput ? true : false)
  const finalShowMinMaxLabels = showMinMaxLabels ?? true
  let finalShowValueLabel = showValueLabel || (showMinMaxInput && !finalShowInput)

  const Component = useComponent('Slider')
  const { mode } = useThemeMode()

  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value

  // Calculate tooltip text - call function if provided, otherwise use string directly
  let computedTooltipText: string | undefined
  try {
    if (tooltipText) {
      if (typeof tooltipText === 'function') {
        computedTooltipText = tooltipText(singleValue)
      } else {
        computedTooltipText = tooltipText
      }
    }
  } catch (_e) {
    computedTooltipText = undefined
  }

  // Get read-only value text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const readOnlyValueFontFamilyVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-family')
  const readOnlyValueFontSizeVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-size')
  const readOnlyValueFontWeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-weight')
  const readOnlyValueLetterSpacingVar = getComponentTextCssVar('Slider', 'read-only-value', 'letter-spacing')
  const readOnlyValueLineHeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'line-height')
  const readOnlyValueTextDecorationVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-decoration')
  const readOnlyValueTextTransformVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-transform')
  const readOnlyValueFontStyleVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-style')

  // State to force re-render when text CSS variables change
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
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
    readOnlyValueFontFamilyVar, readOnlyValueFontSizeVar, readOnlyValueFontWeightVar, readOnlyValueLetterSpacingVar,
    readOnlyValueLineHeightVar, readOnlyValueTextDecorationVar, readOnlyValueTextTransformVar, readOnlyValueFontStyleVar
  ])

  // Calculate display value - call function if provided, otherwise use value directly
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
  } catch (_e) {
    displayValue = singleValue
  }
  // Ensure displayValue is always a non-empty string for rendering
  const displayValueStr = (displayValue !== undefined && displayValue !== null && String(displayValue).trim() !== '')
    ? String(displayValue).trim()
    : (singleValue !== undefined && singleValue !== null ? String(singleValue) : '—')

  // Calculate the width of the max value display to align value label above it
  const maxValueWidth = 30 // Approximate width for max value display

  // When showValueLabel is true, we handle the label row ourselves to avoid duplicates
  // and to position the value label correctly
  const shouldHandleLabelRow = finalShowValueLabel && label && !finalShowInput

  const sliderComponent = (
    <Suspense fallback={<span />}>
      <Component
        value={value}
        onChange={onChange}
        onChangeCommitted={onChangeCommitted}
        min={min}
        max={max}
        step={step}
        disabled={disabled || state === 'disabled'}
        state={state}
        errorText={errorText}
        type={type}
        layout={layout}
        layer={layer}
        label={shouldHandleLabelRow ? undefined : label}
        showInput={finalShowInput}
        showValueLabel={finalShowValueLabel}
        valueLabel={valueLabel}
        tooltipText={computedTooltipText}
        minLabel={minLabel}
        maxLabel={maxLabel}
        showMinMaxLabels={finalShowMinMaxLabels}
        minIcon={minIcon}
        maxIcon={maxIcon}
        iconSize={iconSize}
        readOnly={readOnly}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )

  // Force re-render when top-bottom-margin CSS variable changes
  // Note: topBottomMarginVar is declared earlier in the fallback function scope
  const topBottomMarginVar = buildComponentCssVarPath('Slider', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')
  const [, forceMarginUpdate] = useState(0)

  useEffect(() => {
    const handleMarginUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      if (updatedVars.length === 0 || updatedVars.some((v: string) => v === topBottomMarginVar || v.includes('top-bottom-margin'))) {
        forceMarginUpdate(prev => prev + 1)
      }
    }

    window.addEventListener('cssVarsUpdated', handleMarginUpdate)
    const observer = new MutationObserver(() => {
      forceMarginUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handleMarginUpdate)
      observer.disconnect()
    }
  }, [topBottomMarginVar, layout])

  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVarForLibrary = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : null

  // Get Label's bottom-padding for stacked layout to match spacing
  const labelBottomPaddingVar = layout === 'stacked'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    : null

  // Render value label using Label component to match label styling
  // Always show the value label when showValueLabel is true
  // Ensure we always have a non-empty value to display
  const finalDisplayValue = (displayValueStr && displayValueStr.trim() !== '')
    ? displayValueStr
    : (singleValue !== undefined && singleValue !== null ? String(singleValue) : '0')

  // Use layer text color directly for value labels
  const layerNum = parseInt(layer.replace('layer-', ''))
  const layerTextColorVar = layerText(mode, layerNum, 'color')
  const layerTextEmphasisVar = layerText(mode, layerNum, 'high-emphasis')

  const valueLabelElement = finalShowValueLabel ? (
    <span
      style={{
        flexShrink: 1,
        whiteSpace: 'nowrap',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
        textAlign: 'right',
        paddingBottom: labelBottomPaddingVar ? `var(${labelBottomPaddingVar})` : undefined,
      } as React.CSSProperties}
    >
      {finalDisplayValue}
    </span>
  ) : null

  // When using library components, they handle their own label rendering
  // We only override this when showValueLabel is true to position the value label correctly
  // So we should NOT wrap with additional label rendering when shouldHandleLabelRow is false
  if (!shouldHandleLabelRow) {
    // Let the library component handle label rendering
    // Apply top-bottom-margin wrapper (forceMarginUpdate hook above ensures re-render on CSS var change)
    return (
      <div style={{
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
        flexGrow: 1,
        minWidth: 0,
        ...style,
      }}>
        {sliderComponent}
      </div>
    )
  }

  // When layout is side-by-side, always let the Component handle it
  // This ensures proper side-by-side rendering regardless of showValueLabel
  if (layout === 'side-by-side' && label && Component) {
    return (
      <div style={{
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
        flexGrow: 1,
        minWidth: 0,
        ...style,
      }}>
        <Suspense fallback={<span />}>
          <Component
            value={value}
            onChange={onChange}
            onChangeCommitted={onChangeCommitted}
            min={min}
            max={max}
            step={step}
            type={type}
            disabled={disabled || state === 'disabled'}
            state={state}
            errorText={errorText}
            layout={layout}
            layer={layer}
            label={label}
            showInput={finalShowInput}
            showValueLabel={finalShowValueLabel}
            valueLabel={valueLabel}
            tooltipText={tooltipText}
            minLabel={minLabel}
            maxLabel={maxLabel}
            showMinMaxLabels={finalShowMinMaxLabels}
            minIcon={minIcon}
            maxIcon={maxIcon}
            iconSize={iconSize}
            readOnly={readOnly}
            className={className}
            style={style}
            mantine={mantine}
            material={material}
            carbon={carbon}
          />
        </Suspense>
      </div>
    )
  }

  // For stacked layout, Label's bottom-padding handles the spacing, so no gap needed
  const gapValueForLibrary = labelGutterVarForLibrary ? `var(${labelGutterVarForLibrary})` : '0px'

  // When Component is not null, sliderComponent wraps it but has showValueLabel={false}
  // So we need to render the value label ourselves in the label row
  // When Component is null, we return early in the fallback block, so sliderElement is used
  // Extract marginTop/marginBottom from style prop to prevent them from overriding component margins
  const { marginTop: styleMarginTop, marginBottom: styleMarginBottom, ...restStyle } = style || {};
  const marginTopValue = `var(${topBottomMarginVar})`;
  const marginBottomValue = `var(${topBottomMarginVar})`;
  const finalMarginTop = styleMarginTop ?? marginTopValue;
  const finalMarginBottom = styleMarginBottom ?? marginBottomValue;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: gapValueForLibrary,
      width: '100%',
      minWidth: 0,
      marginTop: finalMarginTop,
      marginBottom: finalMarginBottom,
      ...restStyle,
      flexGrow: 1, // Always override any flexGrow from style prop
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{label}</div>
        {valueLabelElement}
      </div>
      {sliderComponent}
    </div>
  )
}
