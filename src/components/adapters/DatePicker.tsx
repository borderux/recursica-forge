/**
 * DatePicker Component Adapter
 * 
 * Unified DatePicker component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label, AssistiveElement, and a calendar popover internally.
 * The input portion is cloned from the TextField adapter.
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

export type DatePickerProps = {
    value?: Date | null
    defaultValue?: Date | null
    onChange?: (date: Date | null) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
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
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    dateFormat?: string // e.g., 'MM / DD / YY'
} & LibrarySpecificProps

/**
 * Format a Date to "MM / DD / YY"
 */
function formatDate(date: Date | null | undefined, format?: string): string {
    if (!date) return ''
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${mm} / ${dd} / ${yy}`
}

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

    // Determine effective state
    const effectiveState = state

    // Get CSS variables for colors based on state variant (uses 'date-picker' component in UIKit)
    const backgroundVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')

    // Get CSS variables for focus state border
    const focusBorderVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get variant-specific border size
    const borderSizeVar = buildComponentCssVarPath('DatePicker', 'variants', 'states', effectiveState, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('DatePicker', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('DatePicker', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('DatePicker', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('DatePicker', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('DatePicker', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('DatePicker', 'icon-text-gap')
    const widthVar = getComponentLevelCssVar('DatePicker', 'width')
    const placeholderOpacityVar = getComponentLevelCssVar('DatePicker', 'placeholder-opacity')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('DatePicker', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    // Calendar icon
    const CalendarIcon = useMemo(() => iconNameToReactComponent('calendar'), [])

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

    // Render AssistiveElement for help or error
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

    // Format the display value
    const displayValue = value !== undefined
        ? formatDate(value, dateFormat)
        : defaultValue !== undefined
            ? formatDate(defaultValue, dateFormat)
            : ''

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
                                cursor: state === 'disabled' ? 'default' : 'pointer',
                                width: `var(${widthVar}, 200px)`,
                            }}
                        >
                            {CalendarIcon && (
                                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, flexShrink: 0, color: `var(${leadingIconVar})` }}>
                                    <CalendarIcon />
                                </div>
                            )}
                            <input
                                id={inputId}
                                name={name}
                                type="text"
                                value={displayValue}
                                readOnly
                                placeholder={placeholder}
                                disabled={state === 'disabled'}
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    minHeight: `var(${minHeightVar})`,
                                    paddingLeft: `var(${horizontalPaddingVar})`,
                                    paddingRight: `var(${horizontalPaddingVar})`,
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
                                    cursor: state === 'disabled' ? 'default' : 'pointer',
                                }}
                            />
                        </div>
                        {assistiveElement}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
                        {labelElement}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <input
                                id={inputId}
                                name={name}
                                type="text"
                                value={displayValue}
                                readOnly
                                placeholder={placeholder}
                                disabled={state === 'disabled'}
                                style={{
                                    width: `var(${widthVar}, 200px)`,
                                    minHeight: `var(${minHeightVar})`,
                                    paddingLeft: `var(${horizontalPaddingVar})`,
                                    paddingRight: `var(${horizontalPaddingVar})`,
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
                                    cursor: state === 'disabled' ? 'default' : 'pointer',
                                }}
                            />
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
