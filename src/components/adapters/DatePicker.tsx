/**
 * DatePicker Component Adapter
 * 
 * Unified DatePicker component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label, AssistiveElement, and a calendar popover internally.
 * The input portion is cloned from the TextField adapter.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getFormCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { DatePickerProps } from './common/DatePicker'

// Re-exported so existing `import type { DatePickerProps } from '.../adapters/DatePicker'`
// call sites keep working — the types now live in common/DatePicker.ts.
export type { DatePickerProps } from './common/DatePicker'

export function DatePicker({
    value,
    defaultValue,
    onChange,
    placeholder = 'MM / DD / YY',
    label,
    helpText,
    errorText,
    state = 'default',
    layout = 'stacked',
    layer = 'layer-0',
    required = false,
    optional = false,
    labelAlign = 'left',
    labelSize,
    id,
    name,
    className,
    style,
    readOnly,
    disableTopBottomMargin = false,
    dateFormat,
    mantine,
    material,
    carbon,
}: DatePickerProps) {
    const Component = useComponent('DatePicker')
    const { mode } = useThemeMode()

    // Generate unique ID if not provided
    const [inputId] = useState(() => id || `date-picker-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${inputId}-label`
    const helpId = helpText ? `${inputId}-help` : undefined
    const errorId = errorText ? `${inputId}-error` : undefined

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('DatePicker', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
                    placeholder={placeholder}
                    label={label}
                    helpText={helpText}
                    errorText={errorText}
                    state={state}
                    layout={layout}
                    layer={layer}
                    required={required}
                    optional={optional}
                    labelAlign={labelAlign}
                    labelSize={labelSize}
                    id={inputId}
                    labelId={labelId}
                    helpId={helpId}
                    errorId={errorId}
                    name={name}
                    readOnly={readOnly}
                    dateFormat={dateFormat}
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
