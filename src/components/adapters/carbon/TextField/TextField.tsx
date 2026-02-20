/**
 * Carbon TextField Implementation
 * 
 * Carbon-specific TextField component that uses CSS variables for theming.
 * Uses native HTML elements since we're composing Label and AssistiveElement.
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { TextFieldProps as AdapterTextFieldProps } from '../../TextField'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './TextField.css'

export default function TextField({
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  helpText,
  errorText,
  leadingIcon,
  trailingIcon,
  state = 'default',
  layout = 'stacked',
  layer = 'layer-0',
  minWidth,
  required = false,
  id,
  labelId,
  helpId,
  errorId,
  name,
  type = 'text',
  min,
  max,
  step,
  className,
  style,
  carbon,
  ...restProps
}: AdapterTextFieldProps & { labelId?: string; helpId?: string; errorId?: string }) {
  const { mode } = useThemeMode()

  // Extract props that shouldn't be passed to DOM elements
  const { optional, labelAlign, labelSize, ...domProps } = restProps

  // Generate unique ID if not provided (needed for scoped styles)
  const uniqueId = id || `text-field-${Math.random().toString(36).substr(2, 9)}`

  // Determine effective state
  const effectiveState = state

  // Get CSS variables for colors based on state variant
  const backgroundVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
  const textVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
  // Placeholder uses the same color as text (value color)
  const leadingIconVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
  const trailingIconVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'trailing-icon')

  // Get CSS variables for focus state border (when focused)
  const focusBorderVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
  const focusBorderSizeVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'border-size')

  // Get variant-specific border size
  const borderSizeVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'border-size')

  // Get component-level properties
  const borderRadiusVar = getComponentLevelCssVar('TextField', 'border-radius')
  const minHeightVar = getComponentLevelCssVar('TextField', 'min-height')
  const horizontalPaddingVar = getComponentLevelCssVar('TextField', 'horizontal-padding')
  const verticalPaddingVar = getComponentLevelCssVar('TextField', 'vertical-padding')
  const iconSizeVar = getComponentLevelCssVar('TextField', 'icon-size')
  const iconTextGapVar = getComponentLevelCssVar('TextField', 'icon-text-gap')
  const maxWidthVar = getComponentLevelCssVar('TextField', 'max-width')
  const minWidthVar = getComponentLevelCssVar('TextField', 'min-width')
  const placeholderOpacityVar = getComponentLevelCssVar('TextField', 'placeholder-opacity')

  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : undefined

  // Get text style CSS variables
  const valueFontSizeVar = getComponentTextCssVar('TextField', 'text', 'font-size')
  const valueFontFamilyVar = getComponentTextCssVar('TextField', 'text', 'font-family')
  const valueFontWeightVar = getComponentTextCssVar('TextField', 'text', 'font-weight')
  const valueLetterSpacingVar = getComponentTextCssVar('TextField', 'text', 'letter-spacing')
  const valueLineHeightVar = getComponentTextCssVar('TextField', 'text', 'line-height')
  const valueTextDecorationVar = getComponentTextCssVar('TextField', 'text', 'text-decoration')
  const valueTextTransformVar = getComponentTextCssVar('TextField', 'text', 'text-transform')
  const valueFontStyleVar = getComponentTextCssVar('TextField', 'text', 'font-style')

  // Placeholder uses the same text styles as value (no separate placeholder text props)

  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)

  // CRITICAL: Do NOT read CSS variable values here - use var() references directly in CSS.
  // The problem: When CSS variables aren't explicitly set, readCssVar() falls back to
  // computed styles which resolve through UIKit.json defaults. Since both 'value' and
  // 'placeholder' have the same defaults, they resolve to the same value initially.
  // Solution: Use CSS variable references (var(...)) directly in CSS. This ensures:
  // 1. Each CSS variable is independent
  // 2. When one is updated via toolbar, it doesn't affect the other
  // 3. CSS inheritance is prevented by using !important and high specificity selectors

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar,
      valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar
    ]

    const dimensionCssVars = [
      borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar,
      iconSizeVar, iconTextGapVar, maxWidthVar, minWidthVar, placeholderOpacityVar
    ]

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Re-render if text CSS vars or dimension vars were updated, or if no specific vars were mentioned (global update)
      // Check for exact matches or if the updated var contains the var name (without -- prefix)
      if (updatedVars.length === 0 || updatedVars.some((v: string) => {
        return [...textCssVars, ...dimensionCssVars].some(tv => {
          const tvWithoutPrefix = tv.replace('--', '')
          return v === tv || v.includes(tvWithoutPrefix) || tvWithoutPrefix.includes(v.replace('--', ''))
        })
      })) {
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)

    // Also watch for direct CSS variable changes using MutationObserver
    // This is needed because UIKit variables (like placeholder vars) are filtered out from cssVarsUpdated events
    const observer = new MutationObserver(() => {
      // Force re-render when CSS variables change
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      observer.disconnect()
    }
  }, [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar, iconSizeVar, iconTextGapVar, maxWidthVar, minWidthVar, placeholderOpacityVar, textVar])

  // Use provided minWidth or fall back to CSS variable
  const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

  // Get placeholder opacity - use CSS variable directly, no fallback

  // Render Label component if provided
  const labelElement = label ? (
    <Label
      htmlFor={uniqueId}
      variant={required ? 'required' : (optional ? 'optional' : 'default')}
      size={labelSize}
      layout={layout}
      align={labelAlign || 'left'}
      layer={layer}
      id={labelId}
      style={layout === 'side-by-side' ? { paddingTop: 0, minHeight: `var(${minHeightVar})` } : undefined}
    >
      {label}
    </Label>
  ) : null

  // Get icon components for AssistiveElement
  const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
  const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])

  // Render AssistiveElement for help or error with icons
  const assistiveElement = errorText ? (
    <AssistiveElement
      text={errorText}
      variant="error"
      layer={layer}
      id={errorId}
      icon={ErrorIcon ? <ErrorIcon /> : <span>⚠</span>}
    />
  ) : helpText ? (
    <AssistiveElement
      text={helpText}
      variant="help"
      layer={layer}
      id={helpId}
      icon={HelpIcon ? <HelpIcon /> : <span>ℹ</span>}
    />
  ) : null

  // Input wrapper with icons
  const inputWrapper = (
    <div
      className="recursica-text-field-wrapper"
      onClick={domProps.onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `var(${iconTextGapVar}, 8px)`,
        width: '100%',
        minWidth: effectiveMinWidth,
        maxWidth: layout === 'stacked' ? '100%' : `var(${maxWidthVar})`,
        flexShrink: 0,
        paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
        paddingRight: `var(${horizontalPaddingVar}, 12px)`,
        border: 'none',
        borderRadius: `var(${borderRadiusVar})`,
        backgroundColor: `var(${backgroundVar})`,
        boxShadow: `inset 0 0 0 var(${borderSizeVar}) var(${borderVar})`,
        transition: 'box-shadow 0.2s',
        cursor: domProps.onClick ? 'pointer' : undefined,
        justifyContent: labelAlign === 'right' && layout === 'stacked' ? 'flex-end' : 'flex-start',
      }}
    >
      {leadingIcon && (
        <div
          className="recursica-text-field-leading-icon"
          style={{
            width: `var(${iconSizeVar}, 20px)`,
            height: `var(${iconSizeVar}, 20px)`,
            flexShrink: 0,
            color: `var(${leadingIconVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {leadingIcon}
        </div>
      )}
      <input
        id={uniqueId}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onKeyDown={domProps.onKeyDown}
        onBlur={domProps.onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={state === 'disabled'}
        readOnly={domProps.readOnly}
        autoFocus={domProps.autoFocus}
        className={`recursica-text-field-input ${className || ''}`}
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: '100%',
          minHeight: `var(${minHeightVar})`,
          paddingTop: `var(${verticalPaddingVar})`,
          paddingBottom: `var(${verticalPaddingVar})`,
          border: 'none',
          backgroundColor: 'transparent',
          color: `var(${textVar})`,
          outline: 'none',
          textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
        } as React.CSSProperties}
        {...carbon}
        {...domProps}
      />
      {trailingIcon && (
        <div
          className="recursica-text-field-trailing-icon"
          style={{
            width: `var(${iconSizeVar}, 20px)`,
            height: `var(${iconSizeVar}, 20px)`,
            flexShrink: 0,
            color: `var(${trailingIconVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {trailingIcon}
        </div>
      )}
      <style>{`
        /* Value text styles - applied directly to input element - scoped to this instance */
        /* CRITICAL: These styles apply ONLY to the input value text, NOT the placeholder */
        /* Use CSS variable references directly - each variable is independent */
        #${uniqueId}.recursica-text-field-input {
          font-family: var(${valueFontFamilyVar}) !important;
          font-size: var(${valueFontSizeVar}) !important;
          font-weight: var(${valueFontWeightVar}) !important;
          letter-spacing: var(${valueLetterSpacingVar}) !important;
          line-height: var(${valueLineHeightVar}) !important;
          text-decoration: var(${valueTextDecorationVar}) !important;
          text-transform: var(${valueTextTransformVar}) !important;
          font-style: var(${valueFontStyleVar}) !important;
        }
        /* Placeholder styles - completely isolated from value styles - scoped to this instance */
        /* CRITICAL: These styles MUST override any inherited styles from the input element */
        /* Use multiple selectors to ensure maximum specificity and prevent inheritance */
        /* CRITICAL: Use CSS variable references directly - these are SEPARATE variables from value */
        /* Placeholder styles - uses same text styles as value, but with opacity */
        #${uniqueId}.recursica-text-field-input::placeholder,
        #${uniqueId}.recursica-text-field-input::-webkit-input-placeholder,
        #${uniqueId}.recursica-text-field-input::-moz-placeholder,
        #${uniqueId}.recursica-text-field-input:-ms-input-placeholder {
          color: var(${textVar}) !important;
          opacity: var(${placeholderOpacityVar}) !important;
        }
        #${uniqueId}.recursica-text-field-input:focus {
          /* Focus styles are handled by wrapper */
        }
        .recursica-text-field-wrapper:has(#${uniqueId}:focus) {
          box-shadow: inset 0 0 0 var(${focusBorderSizeVar}) var(${focusBorderVar}) !important;
        }
      `}</style>
    </div>
  )

  // Render based on layout
  if (layout === 'side-by-side' && labelElement) {
    // For side-by-side, use Label's gutter property
    const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
    return (
      <div className={`recursica-text-field recursica-text-field-side-by-side ${className || ''}`} style={style}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue, width: '100%' }}>
          <div style={{ flexShrink: 0 }}>
            {labelElement}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {inputWrapper}
            {assistiveElement}
          </div>
        </div>
      </div>
    )
  }

  // Stacked layout (default)
  return (
    <div className={`recursica-text-field recursica-text-field-stacked ${className || ''}`} style={style}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: labelAlign === 'right' && layout === 'stacked' ? 'flex-end' : 'stretch' }}>
        {labelElement}
        {inputWrapper}
        {assistiveElement}
      </div>
    </div>
  )
}
