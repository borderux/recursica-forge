/**
 * TimePicker Component Adapter
 * 
 * Unified TimePicker component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 * Features a time input with a leading clock icon and an AM/PM period selector dropdown.
 */

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar, getFormCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { TimePickerProps } from './common/TimePicker'

// Re-exported so existing `import type { TimePickerProps } from '.../adapters/TimePicker'`
// call sites keep working — the types now live in common/TimePicker.ts.
export type { TimePickerProps } from './common/TimePicker'

export function TimePicker({
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
    autoFocus,
    readOnly,
    disableTopBottomMargin = false,
    editIcon,
    editIconGap,
    period = 'AM',
    onPeriodChange,
    mantine,
    material,
    carbon,
}: TimePickerProps) {
    const Component = useComponent('TimePicker')
    const { mode } = useThemeMode()

    // Generate unique ID if not provided
    const [inputId] = useState(() => id || `time-picker-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${inputId}-label`
    const helpId = helpText ? `${inputId}-help` : undefined
    const errorId = errorText ? `${inputId}-error` : undefined

    // Determine effective state
    const effectiveState = state === 'disabled' ? 'disabled' : (errorText ? 'error' : state)

    // Get component-level properties
    const widthVar = getComponentLevelCssVar('TimePicker', 'width')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('TimePicker', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
                    state={effectiveState}
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
                    autoFocus={autoFocus}
                    readOnly={readOnly}
                    editIcon={editIcon}
                    period={period}
                    onPeriodChange={onPeriodChange}
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
