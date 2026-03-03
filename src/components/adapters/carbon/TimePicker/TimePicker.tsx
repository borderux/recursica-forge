/**
 * Carbon TimePicker Implementation
 * 
 * Features: trailing clock icon opens a Popover with Button-based time selection.
 * AM/PM uses a custom styled select sharing TimePicker CSS variables.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { TimePickerProps as AdapterTimePickerProps } from '../../TimePicker'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarNumber } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { Popover } from '../../Popover'
import { Dropdown } from '../../Dropdown'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './TimePicker.css'

function parseTimeValue(val?: string): { hours: number; minutes: number } {
    if (!val) return { hours: 9, minutes: 0 }
    const [h, m] = val.split(':').map(Number)
    return { hours: isNaN(h) ? 9 : h, minutes: isNaN(m) ? 0 : m }
}

function formatTime(hours: number, minutes: number): string {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export default function TimePicker({
    value, defaultValue, onChange, placeholder, label, helpText, errorText, leadingIcon,
    state = 'default', layout = 'stacked', layer = 'layer-0', required = false,
    id, labelId, helpId, errorId, name, className, style,
    period = 'AM', onPeriodChange, carbon, ...restProps
}: AdapterTimePickerProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()
    const { optional, labelAlign, labelSize, ...domProps } = restProps
    const uniqueId = id || `time-picker-${Math.random().toString(36).substr(2, 9)}`
    const inputRef = useRef<HTMLInputElement>(null)
    const [pickerOpen, setPickerOpen] = useState(false)

    const [internalTime, setInternalTime] = useState<string>(value || defaultValue || '')
    useEffect(() => { if (value !== undefined) setInternalTime(value) }, [value])

    const [internalPeriod, setInternalPeriod] = useState<'AM' | 'PM'>(period)
    const effectivePeriod = onPeriodChange ? period : internalPeriod
    const handlePeriodChange = (p: string) => { if (onPeriodChange) onPeriodChange(p as 'AM' | 'PM'); else setInternalPeriod(p as 'AM' | 'PM') }

    const updateTimeValue = useCallback((newTime: string) => {
        setInternalTime(newTime)
        if (inputRef.current) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
            setter?.call(inputRef.current, newTime)
            inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }, [])

    const handleHourSelect = useCallback((hour: number) => {
        const current = parseTimeValue(internalTime)
        const newTime = formatTime(hour, current.minutes)
        updateTimeValue(newTime)
    }, [internalTime, updateTimeValue])

    const handleMinuteSelect = useCallback((minute: number) => {
        const current = parseTimeValue(internalTime)
        const newTime = formatTime(current.hours, minute)
        updateTimeValue(newTime)
    }, [internalTime, updateTimeValue])

    const handleClockClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (state !== 'disabled') setPickerOpen(prev => !prev)
    }, [state])

    const effectiveState = state
    const backgroundVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
    const iconColorVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
    const focusBorderVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', 'focus', 'properties', 'border-size')
    const borderSizeVar = buildComponentCssVarPath('TimePicker', 'variants', 'states', effectiveState, 'properties', 'border-size')
    const borderRadiusVar = getComponentLevelCssVar('TimePicker', 'border-radius')
    const horizontalPaddingVar = getComponentLevelCssVar('TimePicker', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('TimePicker', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('TimePicker', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('TimePicker', 'icon-text-gap')
    const widthVar = getComponentLevelCssVar('TimePicker', 'width')
    const placeholderOpacityVar = getComponentLevelCssVar('TimePicker', 'placeholder-opacity')
    const labelGutterVar = layout === 'side-by-side' ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter') : undefined
    const valueFontSizeVar = getComponentTextCssVar('TimePicker', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('TimePicker', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('TimePicker', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('TimePicker', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('TimePicker', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('TimePicker', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('TimePicker', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('TimePicker', 'text', 'font-style')

    const [iconSizePixels, setIconSizePixels] = useState(() => readCssVarNumber(iconSizeVar, 20))
    const [, setTextVarsUpdate] = useState(0)
    useEffect(() => {
        const allCssVars = [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, borderSizeVar, borderRadiusVar, horizontalPaddingVar, verticalPaddingVar, iconSizeVar, iconTextGapVar, widthVar, placeholderOpacityVar]
        const handleUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail; const updatedVars = detail?.cssVars || []
            if (updatedVars.length === 0 || updatedVars.some((v: string) => allCssVars.some(tv => { const t = tv.replace('--', ''); return v === tv || v.includes(t) || t.includes(v.replace('--', '')) }))) { setTextVarsUpdate(prev => prev + 1); setIconSizePixels(readCssVarNumber(iconSizeVar, 20)) }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        const observer = new MutationObserver(() => { setTextVarsUpdate(prev => prev + 1); setIconSizePixels(readCssVarNumber(iconSizeVar, 20)) })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
        return () => { window.removeEventListener('cssVarsUpdated', handleUpdate); observer.disconnect() }
    }, [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, borderSizeVar, borderRadiusVar, horizontalPaddingVar, verticalPaddingVar, iconSizeVar, iconTextGapVar, widthVar, placeholderOpacityVar, textVar])

    const ClockIcon = useMemo(() => iconNameToReactComponent('clock'), [])
    const labelElement = label ? (<Label htmlFor={uniqueId} variant={required ? 'required' : (optional ? 'optional' : 'default')} size={labelSize} layout={layout} align={labelAlign || 'left'} layer={layer} id={labelId}>{label}</Label>) : null
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])
    const assistiveElement = errorText ? (<AssistiveElement text={errorText} variant="error" layer={layer} id={errorId} icon={ErrorIcon ? <ErrorIcon /> : <span>⚠</span>} />) : helpText ? (<AssistiveElement text={helpText} variant="help" layer={layer} id={helpId} icon={HelpIcon ? <HelpIcon /> : <span>ℹ</span>} />) : null
    const currentTime = parseTimeValue(internalTime)

    const timePickerPopoverContent = (
        <div style={{ padding: 8, minWidth: 260 }}>
            <div style={{ marginBottom: 8 }}>
                <Label size="small" layer={layer} style={{ marginBottom: 4 }}>Hour</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                        <Button key={hour} variant={currentTime.hours === hour || currentTime.hours === hour + 12 || (hour === 12 && currentTime.hours === 0) ? 'solid' : 'text'} size="small" layer={layer} onClick={() => handleHourSelect(hour)} style={{ minWidth: 0, paddingLeft: 4, paddingRight: 4, justifyContent: 'center' }}>{hour}</Button>
                    ))}
                </div>
            </div>
            <div>
                <Label size="small" layer={layer} style={{ marginBottom: 4 }}>Minute</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => (
                        <Button key={minute} variant={currentTime.minutes === minute ? 'solid' : 'text'} size="small" layer={layer} onClick={() => handleMinuteSelect(minute)} style={{ minWidth: 0, paddingLeft: 4, paddingRight: 4, justifyContent: 'center' }}>{String(minute).padStart(2, '0')}</Button>
                    ))}
                </div>
            </div>
        </div>
    )

    const inputWrapper = (
        <Popover isOpen={pickerOpen} onClose={() => setPickerOpen(false)} content={timePickerPopoverContent} position="bottom" layer={layer} zIndex={9999}>
            <div className="recursica-time-picker-wrapper" style={{
                display: 'flex', alignItems: 'center', gap: `var(${iconTextGapVar}, 8px)`, width: `var(${widthVar}, 130px)`,
                paddingLeft: `var(${horizontalPaddingVar}, 12px)`, paddingRight: `var(${horizontalPaddingVar}, 12px)`,
                paddingTop: `var(${verticalPaddingVar}, 8px)`, paddingBottom: `var(${verticalPaddingVar}, 8px)`,
                border: 'none', borderRadius: `var(${borderRadiusVar})`, backgroundColor: `var(${backgroundVar})`,
                boxShadow: `inset 0 0 0 var(${borderSizeVar}) var(${borderVar})`, transition: 'box-shadow 0.2s', boxSizing: 'border-box',
            }}>
                {ClockIcon && (<div className="recursica-time-picker-leading-icon" onClick={handleClockClick} style={{ width: `var(${iconSizeVar}, 20px)`, height: `var(${iconSizeVar}, 20px)`, flexShrink: 0, color: `var(${iconColorVar})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: state !== 'disabled' ? 'pointer' : 'default', overflow: 'visible' }}><ClockIcon size={iconSizePixels} /></div>)}
                <input ref={inputRef} id={uniqueId} name={name} type="time" value={value} defaultValue={defaultValue} onChange={onChange} onKeyDown={domProps.onKeyDown} onBlur={domProps.onBlur} placeholder={placeholder} disabled={state === 'disabled'} readOnly={domProps.readOnly} autoFocus={domProps.autoFocus} className={`recursica-time-picker-input ${className || ''}`}
                    style={{ flex: 1, minWidth: 0, maxWidth: '100%', padding: 0, border: 'none', backgroundColor: 'transparent', color: `var(${textVar})`, outline: 'none', textAlign: 'left', lineHeight: `var(${valueLineHeightVar}, 1.5)`, fontSize: `var(${valueFontSizeVar}, 14px)` } as React.CSSProperties} {...carbon} />
                <style>{`
          #${uniqueId}.recursica-time-picker-input { font-family: var(${valueFontFamilyVar}) !important; font-size: var(${valueFontSizeVar}) !important; font-weight: var(${valueFontWeightVar}) !important; letter-spacing: var(${valueLetterSpacingVar}) !important; line-height: var(${valueLineHeightVar}) !important; text-decoration: var(${valueTextDecorationVar}) !important; text-transform: var(${valueTextTransformVar}) !important; font-style: var(${valueFontStyleVar}) !important; }
          #${uniqueId}.recursica-time-picker-input::placeholder { color: var(${textVar}) !important; opacity: var(${placeholderOpacityVar}) !important; }
          .recursica-time-picker-wrapper:has(#${uniqueId}:focus) { box-shadow: inset 0 0 0 var(${focusBorderSizeVar}) var(${focusBorderVar}) !important; }
        `}</style>
            </div>
        </Popover>
    )

    const periodContainerId = `${uniqueId}-period-container`
    const periodItems = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]
    const ddBorderRadiusVar = getComponentLevelCssVar('Dropdown', 'border-radius')
    const ddVerticalPaddingVar = getComponentLevelCssVar('Dropdown', 'vertical-padding')
    const ddFontSizeVar = getComponentTextCssVar('Dropdown', 'text', 'font-size')
    const ddFontFamilyVar = getComponentTextCssVar('Dropdown', 'text', 'font-family')
    const ddFontWeightVar = getComponentTextCssVar('Dropdown', 'text', 'font-weight')
    const ddLetterSpacingVar = getComponentTextCssVar('Dropdown', 'text', 'letter-spacing')
    const ddLineHeightVar = getComponentTextCssVar('Dropdown', 'text', 'line-height')
    const ddTextDecorationVar = getComponentTextCssVar('Dropdown', 'text', 'text-decoration')
    const ddTextTransformVar = getComponentTextCssVar('Dropdown', 'text', 'text-transform')
    const ddFontStyleVar = getComponentTextCssVar('Dropdown', 'text', 'font-style')
    const ddBorderSizeDefault = buildComponentCssVarPath('Dropdown', 'variants', 'states', 'default', 'properties', 'border-size')
    const ddBorderSizeFocus = buildComponentCssVarPath('Dropdown', 'variants', 'states', 'focus', 'properties', 'border-size')
    const ddStateColorOverrides = ['default', 'focus', 'error', 'disabled'].map(s => {
        const ddBg = buildComponentCssVarPath('Dropdown', 'variants', 'states', s, 'properties', 'colors', layer, 'background')
        const ddBorder = buildComponentCssVarPath('Dropdown', 'variants', 'states', s, 'properties', 'colors', layer, 'border-color')
        const ddText = buildComponentCssVarPath('Dropdown', 'variants', 'states', s, 'properties', 'colors', layer, 'text')
        const tpBg = buildComponentCssVarPath('TimePicker', 'variants', 'states', s, 'properties', 'colors', layer, 'background')
        const tpBorder = buildComponentCssVarPath('TimePicker', 'variants', 'states', s, 'properties', 'colors', layer, 'border-color')
        const tpText = buildComponentCssVarPath('TimePicker', 'variants', 'states', s, 'properties', 'colors', layer, 'text')
        return `${ddBg}: var(${tpBg}) !important; ${ddBorder}: var(${tpBorder}) !important; ${ddText}: var(${tpText}) !important;`
    }).join(' ')
    const periodDropdown = (
        <div id={periodContainerId} style={{ width: `var(${widthVar}, 130px)` }}>
            <style>{`
                #${periodContainerId} {
                    ${ddBorderRadiusVar}: var(${borderRadiusVar}) !important;
                    ${ddVerticalPaddingVar}: var(${verticalPaddingVar}) !important;
                    ${ddBorderSizeDefault}: var(${borderSizeVar}) !important;
                    ${ddBorderSizeFocus}: var(${focusBorderSizeVar}) !important;
                    ${ddFontSizeVar}: var(${valueFontSizeVar}) !important;
                    ${ddFontFamilyVar}: var(${valueFontFamilyVar}) !important;
                    ${ddFontWeightVar}: var(${valueFontWeightVar}) !important;
                    ${ddLetterSpacingVar}: var(${valueLetterSpacingVar}) !important;
                    ${ddLineHeightVar}: var(${valueLineHeightVar}) !important;
                    ${ddTextDecorationVar}: var(${valueTextDecorationVar}) !important;
                    ${ddTextTransformVar}: var(${valueTextTransformVar}) !important;
                    ${ddFontStyleVar}: var(${valueFontStyleVar}) !important;
                    ${ddStateColorOverrides}
                }
            `}</style>
            <Dropdown items={periodItems} value={effectivePeriod} onChange={handlePeriodChange} state={state} layer={layer} disableTopBottomMargin minWidth={0} zIndex={9999} />
        </div>
    )
    const fieldsRow = (<div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>{inputWrapper}{periodDropdown}</div>)

    if (layout === 'side-by-side' && labelElement) {
        const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
        return (<div className={`recursica-time-picker recursica-time-picker-side-by-side ${className || ''}`} style={style}><div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue, width: '100%' }}><div style={{ flexShrink: 0 }}>{labelElement}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{fieldsRow}{assistiveElement}</div></div></div>)
    }
    return (<div className={`recursica-time-picker recursica-time-picker-stacked ${className || ''}`} style={style}><div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{labelElement}{fieldsRow}{assistiveElement}</div></div>)
}
