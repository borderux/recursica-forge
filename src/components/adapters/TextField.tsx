/**
 * TextField Component Adapter
 *
 * Unified TextField component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getFormCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { TextFieldProps } from './common/TextField'

// Re-exported so existing `import type { TextFieldProps } from '.../adapters/TextField'`
// call sites keep working — the types now live in common/TextField.ts.
export type { TextFieldProps } from './common/TextField'

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
  editIcon,
  onEditIconClick,
  editIconTitle,
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

  // Get CSS variables for focus state border (when focused)
  const focusBorderVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
  const focusBorderSizeVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'border-size')

  // Get top-bottom-margin from layout variant
  const topBottomMarginVar = buildComponentCssVarPath('TextField', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
          editIcon={editIcon}
          editIconTitle={editIconTitle}
          onEditIconClick={onEditIconClick}
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
