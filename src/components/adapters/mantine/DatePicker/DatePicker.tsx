/**
 * Mantine DatePicker Implementation
 * 
 * Mantine-specific DatePicker component that uses CSS variables for theming.
 * Uses native HTML elements for the input (like TextField), and renders
 * a custom calendar popover with:
 *   - Dropdown component for month/year selection
 *   - Button component for prev/next month navigation
 *   - Button component for Cancel/Select actions
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { DatePickerProps as AdapterDatePickerProps } from '../../DatePicker'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import { Button } from '../../Button'
import { Dropdown } from '../../Dropdown'
import type { DropdownItem } from '../../Dropdown'
import { Popover } from '../../Popover'
import './DatePicker.css'

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * Format a Date to "MM / DD / YY"
 */
function formatDate(date: Date | null | undefined): string {
    if (!date) return ''
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${mm} / ${dd} / ${yy}`
}

/**
 * Get the days to display in a calendar month grid.
 * Returns a 2D array of Date objects (6 rows × 7 columns).
 */
function getCalendarDays(year: number, month: number): (Date | null)[][] {
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const rows: (Date | null)[][] = []
    let currentDay = 1 - startDayOfWeek

    for (let row = 0; row < 6; row++) {
        const week: (Date | null)[] = []
        for (let col = 0; col < 7; col++) {
            const date = new Date(year, month, currentDay)
            week.push(date)
            currentDay++
        }
        rows.push(week)
        // Stop if we've passed the end of the month and filled a complete week
        if (currentDay > daysInMonth) break
    }

    return rows
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}

// Generate month dropdown items
const monthDropdownItems: DropdownItem[] = MONTH_NAMES.map((name, i) => ({
    value: String(i),
    label: name,
}))

// Generate year dropdown items (range: current year -10 to +10)
function getYearDropdownItems(currentYear: number): DropdownItem[] {
    const items: DropdownItem[] = []
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
        items.push({ value: String(y), label: String(y) })
    }
    return items
}

export default function DatePicker({
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
    id,
    labelId,
    helpId,
    errorId,
    name,
    className,
    style,
    mantine,
    ...restProps
}: AdapterDatePickerProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()

    // Extract props that shouldn't be passed to DOM elements
    const { optional, labelAlign, labelSize, dateFormat, readOnly, ...domProps } = restProps

    // Generate unique ID if not provided
    const uniqueId = id || `date-picker-${Math.random().toString(36).substr(2, 9)}`

    // State for the calendar popover
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? defaultValue ?? null)
    const [pendingDate, setPendingDate] = useState<Date | null>(null)
    const [viewMonth, setViewMonth] = useState(() => {
        const d = value ?? defaultValue ?? new Date()
        return d ? d.getMonth() : new Date().getMonth()
    })
    const [viewYear, setViewYear] = useState(() => {
        const d = value ?? defaultValue ?? new Date()
        return d ? d.getFullYear() : new Date().getFullYear()
    })
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Sync selectedDate with controlled value
    useEffect(() => {
        if (value !== undefined) {
            setSelectedDate(value)
        }
    }, [value])

    // Determine effective state
    const effectiveState = isOpen ? 'focus' : state

    // Get CSS variables for colors based on state variant
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

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    // Get text style CSS variables
    const valueFontSizeVar = getComponentTextCssVar('DatePicker', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('DatePicker', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('DatePicker', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('DatePicker', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('DatePicker', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('DatePicker', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('DatePicker', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('DatePicker', 'text', 'font-style')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const textCssVars = [
            valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar,
            valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar
        ]

        const dimensionCssVars = [
            borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar,
            iconSizeVar, iconTextGapVar, widthVar, placeholderOpacityVar
        ]

        const handleUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const updatedVars = detail?.cssVars || []
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

        const observer = new MutationObserver(() => {
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
    }, [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar, iconSizeVar, iconTextGapVar, widthVar, placeholderOpacityVar, textVar])


    // Calendar icon
    const CalendarIcon = useMemo(() => iconNameToReactComponent('calendar'), [])

    // Prev/Next icon components
    const ChevronLeftIcon = useMemo(() => iconNameToReactComponent('chevron-left'), [])
    const ChevronRightIcon = useMemo(() => iconNameToReactComponent('chevron-right'), [])

    // Format display value
    const displayValue = formatDate(selectedDate)

    // Calendar navigation
    const handlePrevMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 0) {
                setViewYear(y => y - 1)
                return 11
            }
            return prev - 1
        })
    }, [])

    const handleNextMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 11) {
                setViewYear(y => y + 1)
                return 0
            }
            return prev + 1
        })
    }, [])

    const handleMonthChange = useCallback((monthValue: string) => {
        setViewMonth(parseInt(monthValue, 10))
    }, [])

    const handleYearChange = useCallback((yearValue: string) => {
        setViewYear(parseInt(yearValue, 10))
    }, [])

    const handleDayClick = useCallback((date: Date) => {
        setPendingDate(date)
    }, [])

    const handleSelect = useCallback(() => {
        const dateToSelect = pendingDate ?? selectedDate
        if (dateToSelect) {
            setSelectedDate(dateToSelect)
            onChange?.(dateToSelect)
        }
        setIsOpen(false)
        setPendingDate(null)
    }, [pendingDate, selectedDate, onChange])

    const handleCancel = useCallback(() => {
        setIsOpen(false)
        setPendingDate(null)
    }, [])

    const handleInputClick = useCallback(() => {
        if (state !== 'disabled' && !readOnly) {
            setIsOpen(true)
            // Set view to selected date's month/year if available
            const d = selectedDate ?? new Date()
            setViewMonth(d.getMonth())
            setViewYear(d.getFullYear())
        }
    }, [state, readOnly, selectedDate])

    // Render Label
    const labelElement = label ? (
        <Label
            htmlFor={uniqueId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign || 'left'}
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

    // Render AssistiveElement
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

    // Get the calendar days grid
    const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth])
    const today = useMemo(() => new Date(), [])
    const activePendingDate = pendingDate ?? selectedDate

    // Year dropdown items (memoized based on current view year)
    const yearDropdownItems = useMemo(() => getYearDropdownItems(new Date().getFullYear()), [])

    const accentColorVar = `--recursica_brand_palettes_core_interactive_default_color_tone`
    const textLowEmphasisVar = `--recursica_brand_layer_1_elements_text-low-emphasis`

    // Calendar popover content
    const calendarContent = (
        <div
            className="recursica-date-picker-calendar"
            style={{
                minWidth: 380,
                overflow: 'visible',
            }}
        >
            {/* Calendar header with Dropdown for month/year and Button for prev/next */}
            <div className="recursica-date-picker-calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '0 1 auto', minWidth: 0 }}>
                    <div style={{ width: 150, overflow: 'hidden', flexShrink: 0 }}>
                        <Dropdown
                            items={monthDropdownItems}
                            value={String(viewMonth)}
                            onChange={handleMonthChange}
                            disableTopBottomMargin
                            layer="layer-1"
                            minWidth={110}
                            zIndex={1010}
                        />
                    </div>
                    <div style={{ width: 110, overflow: 'hidden', flexShrink: 0 }}>
                        <Dropdown
                            items={yearDropdownItems}
                            value={String(viewYear)}
                            onChange={handleYearChange}
                            disableTopBottomMargin
                            layer="layer-1"
                            minWidth={75}
                            zIndex={1010}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 0, flexShrink: 0, alignItems: 'center' }}>
                    <Button
                        variant="text"
                        size="small"
                        onClick={handlePrevMonth}
                        layer="layer-1"
                        aria-label="Previous month"
                        icon={ChevronLeftIcon ? <ChevronLeftIcon /> : undefined}
                    >
                        {!ChevronLeftIcon && '‹'}
                    </Button>
                    <Button
                        variant="text"
                        size="small"
                        onClick={handleNextMonth}
                        layer="layer-1"
                        aria-label="Next month"
                        icon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
                    >
                        {!ChevronRightIcon && '›'}
                    </Button>
                </div>
            </div>

            {/* Calendar grid */}
            <table className="recursica-date-picker-calendar-grid" style={{ marginTop: 'var(--recursica_brand_dimensions_general_default)' }}>
                <thead>
                    <tr>
                        {DAYS_OF_WEEK.map((day, i) => (
                            <th key={i} style={{ textAlign: 'center', opacity: `var(${textLowEmphasisVar}, 0.6)` }}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {calendarDays.map((week, rowIdx) => (
                        <tr key={rowIdx}>
                            {week.map((date, colIdx) => {
                                if (!date) return <td key={colIdx} />
                                const isCurrentMonth = date.getMonth() === viewMonth
                                const isToday = isSameDay(date, today)
                                const isSelected = isSameDay(date, activePendingDate)

                                return (
                                    <td key={colIdx}>
                                        <Button
                                            variant={isSelected ? 'solid' : 'text'}
                                            size="small"
                                            onClick={() => handleDayClick(date)}
                                            disabled={!isCurrentMonth}
                                            layer="layer-1"
                                            className={`recursica-date-picker-day ${isToday && !isSelected ? 'today' : ''} ${!isCurrentMonth ? 'outside-month' : ''}`}
                                            style={{
                                                ...(isSelected ? {
                                                    backgroundColor: `var(${accentColorVar}, #e91e63)`,
                                                    color: '#fff',
                                                    borderColor: `var(${accentColorVar}, #e91e63)`,
                                                } : {}),
                                            }}
                                        >
                                            {date.getDate()}
                                        </Button>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer with Cancel / Select buttons */}
            <div className="recursica-date-picker-calendar-footer">
                <Button
                    variant="text"
                    size="small"
                    onClick={handleCancel}
                    layer={layer}
                >
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    size="small"
                    onClick={handleSelect}
                    layer={layer}
                >
                    Select
                </Button>
            </div>
        </div>
    )

    // Input trigger element
    const inputTrigger = (
        <div
            className={`recursica-date-picker-wrapper ${isOpen ? 'focus' : ''}`}
            onClick={handleInputClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: `var(${iconTextGapVar}, 8px)`,
                width: '100%',
                flexShrink: 0,
                paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
                paddingRight: `var(${horizontalPaddingVar}, 12px)`,
                border: 'none',
                borderRadius: `var(${borderRadiusVar})`,
                backgroundColor: `var(${backgroundVar})`,
                boxShadow: isOpen
                    ? `inset 0 0 0 var(${focusBorderSizeVar}) var(${focusBorderVar})`
                    : `inset 0 0 0 var(${borderSizeVar}) var(${borderVar})`,
                transition: 'box-shadow 0.2s',
                cursor: state === 'disabled' ? 'default' : 'pointer',
                justifyContent: labelAlign === 'right' && layout === 'stacked' ? 'flex-end' : 'flex-start',
            }}
        >
            {CalendarIcon && (
                <div
                    className="recursica-date-picker-leading-icon"
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
                    <CalendarIcon />
                </div>
            )}
            <input
                id={uniqueId}
                name={name}
                type="text"
                value={displayValue}
                readOnly
                placeholder={placeholder}
                disabled={state === 'disabled'}
                className={`recursica-date-picker-input ${className || ''}`}
                style={{
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '100%',
                    minHeight: `var(${minHeightVar})`,
                    paddingTop: `var(${verticalPaddingVar})`,
                    paddingBottom: `var(${verticalPaddingVar})`,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: displayValue ? `var(${textVar})` : `var(${textVar})`,
                    outline: 'none',
                    cursor: state === 'disabled' ? 'default' : 'pointer',
                    textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
                } as React.CSSProperties}
            />
            <style>{`
          /* Value text styles - scoped to this instance */
          #${uniqueId}.recursica-date-picker-input {
            font-family: var(${valueFontFamilyVar}) !important;
            font-size: var(${valueFontSizeVar}) !important;
            font-weight: var(${valueFontWeightVar}) !important;
            letter-spacing: var(${valueLetterSpacingVar}) !important;
            line-height: var(${valueLineHeightVar}) !important;
            text-decoration: var(${valueTextDecorationVar}) !important;
            text-transform: var(${valueTextTransformVar}) !important;
            font-style: var(${valueFontStyleVar}) !important;
          }
          /* Placeholder styles */
          #${uniqueId}.recursica-date-picker-input::placeholder,
          #${uniqueId}.recursica-date-picker-input::-webkit-input-placeholder,
          #${uniqueId}.recursica-date-picker-input::-moz-placeholder,
          #${uniqueId}.recursica-date-picker-input:-ms-input-placeholder {
            color: var(${textVar}) !important;
            opacity: var(${placeholderOpacityVar}) !important;
          }
        `}</style>
        </div>
    )

    // Input wrapper with Popover
    const inputWrapper = (
        <div
            ref={wrapperRef}
            style={{ display: 'inline-block', width: `var(${widthVar}, 200px)` }}
        >
            <Popover
                isOpen={isOpen}
                onClose={handleCancel}
                content={calendarContent}
                layer="layer-1"
                position="bottom"
                zIndex={1000}
                className="recursica-date-picker-popover-target"
                mantine={{ closeOnClickOutside: false }}
                style={{
                    '--hcp-min-width': 'auto',
                    '--hcp-max-width': 'none',
                } as React.CSSProperties}
            >
                {inputTrigger}
            </Popover>
        </div>
    )

    // Render based on layout
    if (layout === 'side-by-side' && labelElement) {
        const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
        return (
            <div className={`recursica-date-picker recursica-date-picker-side-by-side ${className || ''}`} style={style}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue }}>
                    <div style={{ flexShrink: 0 }}>
                        {labelElement}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {inputWrapper}
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    // Stacked layout (default)
    return (
        <div className={`recursica-date-picker recursica-date-picker-stacked ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: labelAlign === 'right' && layout === 'stacked' ? 'flex-end' : 'stretch' }}>
                {labelElement}
                {inputWrapper}
                {assistiveElement}
            </div>
        </div>
    )
}
