/**
 * TextField Component Adapter
 * 
 * Unified TextField component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar, getFormCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TextFieldProps = {
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => void
  placeholder?: string
  label?: string
  helpText?: string
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  state?: 'default' | 'error' | 'disabled' | 'focus'
  layout?: 'stacked' | 'side-by-side'
  layer?: ComponentLayer
  minWidth?: number
  required?: boolean
  optional?: boolean
  labelAlign?: 'left' | 'right'
  labelSize?: 'default' | 'small'
  id?: string
  name?: string
  type?: string
  min?: number | string
  max?: number | string
  step?: number | string
  className?: string
  style?: React.CSSProperties
  autoFocus?: boolean
  readOnly?: boolean
  disableTopBottomMargin?: boolean
} & LibrarySpecificProps

export function TextField({
  value,
  defaultValue,
  onChange,
  onKeyDown,
  onBlur,
  onClick,
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
  optional = false,
  labelAlign = 'left',
  labelSize,
  id,
  name,
  type = 'text',
  min,
  max,
  step,
  className,
  style,
  autoFocus,
  readOnly,
  disableTopBottomMargin = false,
  mantine,
  material,
  carbon,
}: TextFieldProps) {
  const Component = useComponent('TextField')
  const { mode } = useThemeMode()

  // Generate unique ID if not provided
  const [inputId] = useState(() => id || `text-field-${Math.random().toString(36).substr(2, 9)}`)
  const labelId = `${inputId}-label`
  const helpId = helpText ? `${inputId}-help` : undefined
  const errorId = errorText ? `${inputId}-error` : undefined

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

  // Get top-bottom-margin from layout variant
  const topBottomMarginVar = buildComponentCssVarPath('TextField', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : undefined

  // Use provided minWidth or fall back to CSS variable
  const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

  // Render Label component if provided
  const labelElement = label ? (
    <Label
      htmlFor={inputId}
      variant={required ? 'required' : (optional ? 'optional' : 'default')}
      size={labelSize}
      layout={layout}
      align={labelAlign}
      layer={layer}
      id={labelId}
      style={layout === 'side-by-side' ? { minHeight: `var(${minHeightVar})` } : undefined}
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

  // If no library component is available, render fallback
  if (!Component) {
    return (
      <div className={className} style={{
        marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
        marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
        ...style
      }}>
        {layout === 'stacked' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
            {labelElement}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `var(${iconTextGapVar}, 8px)`,
                cursor: onClick ? 'pointer' : undefined,
                justifyContent: labelAlign === 'right' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
              onClick={onClick}
            >
              {leadingIcon && (
                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, flexShrink: 0, color: `var(${leadingIconVar})` }}>
                  {leadingIcon}
                </div>
              )}
              <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                onClick={onClick}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                disabled={state === 'disabled'}
                readOnly={readOnly}
                autoFocus={autoFocus}
                style={{
                  flex: 1,
                  minWidth: effectiveMinWidth,
                  maxWidth: `var(${maxWidthVar}, 100%)`,
                  width: layout === 'stacked' ? '100%' : undefined,
                  minHeight: `var(${minHeightVar})`,
                  paddingLeft: leadingIcon ? `var(${horizontalPaddingVar})` : `var(${horizontalPaddingVar})`,
                  paddingRight: trailingIcon ? `var(${horizontalPaddingVar})` : `var(${horizontalPaddingVar})`,
                  paddingTop: `var(${verticalPaddingVar})`,
                  paddingBottom: `var(${verticalPaddingVar})`,
                  borderRadius: `var(${borderRadiusVar})`,
                  borderWidth: `var(${borderSizeVar})`,
                  borderStyle: 'solid',
                  borderColor: `var(${borderVar})`,
                  backgroundColor: `var(${backgroundVar})`,
                  color: `var(${textVar})`,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  outline: 'none',
                  cursor: onClick ? 'pointer' : undefined,
                  textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
                }}
              />
              {trailingIcon && (
                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, flexShrink: 0, color: `var(${trailingIconVar})` }}>
                  {trailingIcon}
                </div>
              )}
            </div>
            {assistiveElement}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
            {labelElement}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: `var(${iconTextGapVar}, 8px)`, cursor: onClick ? 'pointer' : undefined }}
                onClick={onClick}
              >
                {leadingIcon && (
                  <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, flexShrink: 0, color: `var(${leadingIconVar})` }}>
                    {leadingIcon}
                  </div>
                )}
                <input
                  id={inputId}
                  name={name}
                  type={type}
                  value={value}
                  defaultValue={defaultValue}
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                  onBlur={onBlur}
                  onClick={onClick}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  step={step}
                  disabled={state === 'disabled'}
                  readOnly={readOnly}
                  autoFocus={autoFocus}
                  style={{
                    flex: 1,
                    minWidth: effectiveMinWidth,
                    maxWidth: `var(${maxWidthVar}, 100%)`,
                    width: layout !== 'side-by-side' ? '100%' : undefined,
                    minHeight: `var(${minHeightVar})`,
                    paddingLeft: leadingIcon ? `var(${horizontalPaddingVar})` : `var(${horizontalPaddingVar})`,
                    paddingRight: trailingIcon ? `var(${horizontalPaddingVar})` : `var(${horizontalPaddingVar})`,
                    paddingTop: `var(${verticalPaddingVar})`,
                    paddingBottom: `var(${verticalPaddingVar})`,
                    borderRadius: `var(${borderRadiusVar})`,
                    borderWidth: `var(${borderSizeVar})`,
                    borderStyle: 'solid',
                    borderColor: `var(${borderVar})`,
                    backgroundColor: `var(${backgroundVar})`,
                    color: `var(${textVar})`,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    outline: 'none',
                    cursor: onClick ? 'pointer' : undefined,
                  }}
                />
                {trailingIcon && (
                  <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, flexShrink: 0, color: `var(${trailingIconVar})` }}>
                    {trailingIcon}
                  </div>
                )}
              </div>
              {assistiveElement}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render library-specific component
  return (
    <div style={{
      marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
      marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
    }}>
      <Suspense fallback={<span />}>
        <Component
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onClick={onClick}
          placeholder={placeholder}
          label={label}
          helpText={helpText}
          errorText={errorText}
          leadingIcon={leadingIcon}
          trailingIcon={trailingIcon}
          state={state}
          layout={layout}
          layer={layer}
          minWidth={minWidth}
          required={required}
          optional={optional}
          labelAlign={labelAlign}
          labelSize={labelSize}
          id={inputId}
          labelId={labelId}
          helpId={helpId}
          errorId={errorId}
          name={name}
          type={type}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
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
