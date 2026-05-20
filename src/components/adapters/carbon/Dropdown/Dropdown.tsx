/**
 * Carbon Dropdown Implementation
 * 
 * Carbon-specific Dropdown component that uses CSS variables for theming.
 * Uses a lightweight portal overlay to render the menu component.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { DropdownProps as AdapterDropdownProps } from '../../Dropdown'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { Menu as MenuAdapter } from '../../Menu'
import { MenuItem as MenuItemAdapter } from '../../MenuItem'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Dropdown.css'

export default function Dropdown({
    items,
    value,
    onChange,
    placeholder = 'Select option...',
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
    maxHeight,
    id,
    labelId,
    helpId,
    errorId,
    className,
    style,
    zIndex,

    carbon,
}: AdapterDropdownProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()
    const [opened, setOpened] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

    const handleTriggerClick = () => {
        if (state === 'disabled') return
        setOpened(prev => !prev)
    }

    const updatePosition = () => {
        if (triggerRef.current) {
            setTriggerRect(triggerRef.current.getBoundingClientRect())
        }
    }

    // Generate unique ID if not provided
    const uniqueId = id || `dropdown-${Math.random().toString(36).substr(2, 9)}`

    // Position sync and click outside handling
    useEffect(() => {
        if (!opened) return

        updatePosition()
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)

        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (
                triggerRef.current?.contains(target) ||
                document.getElementById(`portal-${uniqueId}`)?.contains(target)
            ) {
                return
            }
            setOpened(false)
        }

        document.addEventListener('mousedown', handleOutsideClick)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [opened, uniqueId])

    // Determine effective state
    const effectiveState = state
    const isOpenedState = opened ? 'focus' : effectiveState

    // Get CSS variables for colors
    const backgroundVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'trailing-icon')

    // Get focus state colors
    const focusBorderVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get variant-specific border size
    const borderSizeVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('Dropdown', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('Dropdown', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('Dropdown', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Dropdown', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('Dropdown', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('Dropdown', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('Dropdown', 'max-width')
    const minWidthVar = getComponentLevelCssVar('Dropdown', 'min-width')

    // Get text style CSS variables
    const valueFontSizeVar = getComponentTextCssVar('Dropdown', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('Dropdown', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('Dropdown', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('Dropdown', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('Dropdown', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('Dropdown', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('Dropdown', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('Dropdown', 'text', 'font-style')

    // State to force re-render when CSS vars change
    const [, forceUpdate] = useState(0)

    useEffect(() => {
        const handleUpdate = () => forceUpdate(prev => prev + 1)
        window.addEventListener('cssVarsUpdated', handleUpdate)

        const observer = new MutationObserver(() => {
            forceUpdate(prev => prev + 1)
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleUpdate)
            observer.disconnect()
        }
    }, [])

    const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

    // Selected item
    const selectedItem = items.find(item => item.value === value)
    const displayLabel = selectedItem ? selectedItem.label : placeholder
    const itemLeadingIcon = selectedItem ? (selectedItem.leadingIcon || selectedItem.icon) : null
    const effectiveLeadingIcon = leadingIcon || itemLeadingIcon

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

    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])
    const ChevronDown = useMemo(() => iconNameToReactComponent('chevron-down'), [])

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

    const dropdownTrigger = (
        <button
            ref={triggerRef}
            id={uniqueId}
            disabled={state === 'disabled'}
            className={`recursica-dropdown-trigger ${opened || state === 'focus' ? 'opened focus' : ''} ${state === 'disabled' ? 'disabled' : ''}`}
            onClick={handleTriggerClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: `var(${iconTextGapVar}, 8px)`,
                width: '100%',
                minWidth: effectiveMinWidth,
                maxWidth: `var(${maxWidthVar}, 100%)`,
                paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
                paddingRight: `var(${horizontalPaddingVar}, 12px)`,
                paddingTop: `var(${verticalPaddingVar}, 8px)`,
                paddingBottom: `var(${verticalPaddingVar}, 8px)`,
                minHeight: `var(${minHeightVar})`,
                height: 'auto',
                borderRadius: `var(${borderRadiusVar})`,
                backgroundColor: `var(${backgroundVar})`,
                boxShadow: `inset 0 0 0 var(${opened || state === 'focus' ? focusBorderSizeVar : borderSizeVar}) var(${opened || state === 'focus' ? focusBorderVar : borderVar})`,
                color: `var(${textVar})`,
                cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                transition: 'box-shadow 0.2s, background-color 0.2s',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                boxSizing: 'border-box',
                textAlign: 'left',
            }}
            {...carbon}
        >
            {effectiveLeadingIcon && (
                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${leadingIconVar})`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {effectiveLeadingIcon}
                </div>
            )}
            <span
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: `var(${valueFontFamilyVar})`,
                    fontSize: `var(${valueFontSizeVar})`,
                    fontWeight: `var(${valueFontWeightVar})`,
                    letterSpacing: `var(${valueLetterSpacingVar})`,
                    lineHeight: `var(${valueLineHeightVar})`,
                    textDecoration: valueTextDecorationVar ? `var(${valueTextDecorationVar})` as any : 'none',
                    textTransform: valueTextTransformVar ? `var(${valueTextTransformVar})` as any : 'none',
                    fontStyle: valueFontStyleVar ? `var(${valueFontStyleVar})` as any : 'normal',
                    padding: '0.1em 0', // Tiny padding to prevent descender clipping
                }}
            >
                {displayLabel}
            </span>
            <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${trailingIconVar})`, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: opened ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                {trailingIcon || (ChevronDown ? <ChevronDown /> : '▼')}
            </div>
        </button>
    )

    return (
        <div className={`recursica-dropdown-container ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: layout === 'side-by-side' ? 'row' : 'column', gap: layout === 'side-by-side' ? (buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter') ? `var(${buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')})` : '8px') : 0, width: '100%' }}>
                {labelElement}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {dropdownTrigger}
                    
                    {opened && triggerRect && createPortal(
                        <div
                            id={`portal-${uniqueId}`}
                            style={{
                                position: 'absolute',
                                top: `${triggerRect.bottom + window.scrollY}px`,
                                left: `${triggerRect.left + window.scrollX}px`,
                                width: `${triggerRect.width}px`,
                                zIndex: zIndex ?? 9999,
                                pointerEvents: 'auto',
                            }}
                        >
                            <MenuAdapter layer={layer} maxHeight={maxHeight}>
                                {items.map((item) => (
                                    <MenuItemAdapter
                                        key={item.value}
                                        onClick={() => {
                                            onChange?.(item.value)
                                            setOpened(false)
                                        }}
                                        disabled={item.disabled}
                                        leadingIcon={item.leadingIcon || item.icon}
                                        leadingIconType={(item.leadingIconType || ((item.leadingIcon || item.icon) ? 'icon' : 'none')) as any}
                                        trailingIcon={item.trailingIcon}
                                        supportingText={item.supportingText as string}
                                        divider={item.divider}
                                        layer={layer}
                                        selected={value === item.value}
                                        style={{
                                            borderRadius: `calc(var(${borderRadiusVar}) - 2px)`,
                                        }}
                                    >
                                        {item.label}
                                    </MenuItemAdapter>
                                ))}
                            </MenuAdapter>
                        </div>,
                        document.body
                    )}

                    {assistiveElement}
                </div>
            </div>
        </div>
    )
}
