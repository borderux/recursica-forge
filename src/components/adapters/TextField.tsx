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
  value?: string
  defaultValue?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
  helpText?: string
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  state?: 'default' | 'error' | 'disabled' | 'read-only' | 'focus'
  layout?: 'stacked' | 'side-by-side'
  layer?: ComponentLayer
  minWidth?: number
  required?: boolean
  id?: string
  name?: string
  type?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function TextField({
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
  name,
  type = 'text',
  className,
  style,
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
  
  // Determine effective state (focus is handled via CSS :focus, but we need it for variant selection)
  const effectiveState = state === 'focus' ? 'default' : state
  
  // Get CSS variables for colors based on state variant
  const backgroundVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
  const textVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
  const placeholderVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'placeholder')
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
  
  // Get layout variant gap
  const labelFieldGapVar = buildComponentCssVarPath('TextField', 'variants', 'layouts', layout, 'properties', 'label-field-gap')
  
  // Use provided minWidth or fall back to CSS variable
  const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`
  
  // Render Label component if provided
  const labelElement = label ? (
    <Label
      htmlFor={inputId}
      variant={required ? 'required' : 'default'}
      layout={layout}
      layer={layer}
      id={labelId}
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
      <div className={className} style={style}>
        {layout === 'stacked' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelFieldGapVar}, 8px)` }}>
            {labelElement}
            <div style={{ display: 'flex', alignItems: 'center', gap: `var(${iconTextGapVar}, 8px)` }}>
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
                placeholder={placeholder}
                disabled={state === 'disabled'}
                readOnly={state === 'read-only'}
                style={{
                  flex: 1,
                  minWidth: effectiveMinWidth,
                  maxWidth: `var(${maxWidthVar})`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: `var(${labelFieldGapVar}, 8px)` }}>
            {labelElement}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `var(${labelFieldGapVar}, 8px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `var(${iconTextGapVar}, 8px)` }}>
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
                  placeholder={placeholder}
                  disabled={state === 'disabled'}
                  readOnly={state === 'read-only'}
                  style={{
                    flex: 1,
                    minWidth: effectiveMinWidth,
                    maxWidth: `var(${maxWidthVar})`,
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
    <Suspense fallback={<div style={{ width: '100%', height: 48 }} />}>
      <Component
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
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
        id={inputId}
        labelId={labelId}
        helpId={helpId}
        errorId={errorId}
        name={name}
        type={type}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
