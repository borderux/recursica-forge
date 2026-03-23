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
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TimePickerProps = {
    value?: string
    defaultValue?: string
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLInputElement>) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    name?: string
    className?: string
    style?: React.CSSProperties
    autoFocus?: boolean
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
    period?: 'AM' | 'PM'
    onPeriodChange?: (period: 'AM' | 'PM') => void
} & LibrarySpecificProps

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

    // Get component-level properties
    const widthVar = getComponentLevelCssVar('TimePicker', 'width')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('TimePicker', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // If no library component is available, render fallback
    if (!Component) {
        return (
            <div style={{
                marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                ...style
            }}>
                <span>TimePicker (no library loaded)</span>
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
