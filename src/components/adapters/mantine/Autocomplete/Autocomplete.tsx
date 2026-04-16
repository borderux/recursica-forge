/**
 * Mantine Autocomplete Implementation
 * 
 * Mantine-specific Autocomplete component that uses CSS variables for theming.
 * Like Dropdown but with a typeable input instead of a readonly trigger.
 * Uses Menu component from @mantine/core for the suggestions dropdown.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Menu } from '@mantine/core'
import type { AutocompleteProps as AdapterAutocompleteProps } from '../../Autocomplete'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { Menu as MenuAdapter } from '../../Menu'
import { MenuItem as MenuItemAdapter } from '../../MenuItem'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Autocomplete.css'

export default function Autocomplete({
    items,
    value,
    onChange,
    placeholder = 'Type to search...',
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
    labelId,
    helpId,
    errorId,
    className,
    style,
    zIndex,
    mantine,
    material,
    carbon,
}: AdapterAutocompleteProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()
    const [opened, setOpened] = useState(false)
    const [inputValue, setInputValue] = useState(value || '')
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync input value with controlled value
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value)
        }
    }, [value])

    // Close menu when clicking outside the entire autocomplete container
    useEffect(() => {
        if (!opened) return
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpened(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [opened])

    // Generate unique ID if not provided
    const uniqueId = id || `autocomplete-${Math.random().toString(36).substr(2, 9)}`

    // Determine effective state
    const effectiveState = state
    const isOpenedState = opened ? 'focus' : effectiveState

    // Get CSS variables for colors
    const backgroundVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', isOpenedState, 'properties', 'colors', layer, 'trailing-icon')

    // Get focus state colors
    const focusBorderVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get variant-specific border size
    const borderSizeVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('Autocomplete', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('Autocomplete', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('Autocomplete', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Autocomplete', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('Autocomplete', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('Autocomplete', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('Autocomplete', 'max-width')
    const minWidthVar = getComponentLevelCssVar('Autocomplete', 'min-width')
    const placeholderOpacityVar = getComponentLevelCssVar('Autocomplete', 'placeholder-opacity')

    // Get text style CSS variables
    const valueFontSizeVar = getComponentTextCssVar('Autocomplete', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('Autocomplete', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('Autocomplete', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('Autocomplete', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('Autocomplete', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('Autocomplete', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('Autocomplete', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('Autocomplete', 'text', 'font-style')

    // State to force re-render when CSS vars change
    const [, forceUpdate] = useState(0)

    useEffect(() => {
        const handleUpdate = () => forceUpdate(prev => prev + 1)
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
    }, [])

    const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

    // Filter items based on input
    const filteredItems = useMemo(() => {
        if (!inputValue) return items
        const search = inputValue.toLowerCase()
        return items.filter(item => {
            const itemLabel = typeof item.label === 'string' ? item.label : item.value
            return itemLabel.toLowerCase().includes(search)
        })
    }, [items, inputValue])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange?.(newValue)
        // Open if there's text and matching items
        if (newValue) {
            setOpened(true)
        } else {
            // Show all items when input is cleared
            setOpened(true)
        }
    }, [onChange])

    const handleItemSelect = useCallback((itemValue: string) => {
        const selectedItem = items.find(item => item.value === itemValue)
        const displayValue = selectedItem
            ? (typeof selectedItem.label === 'string' ? selectedItem.label : selectedItem.value)
            : itemValue
        setInputValue(displayValue)
        onChange?.(displayValue)
        setOpened(false)
    }, [items, onChange])

    const handleInputFocus = useCallback(() => {
        if (state !== 'disabled') {
            setOpened(true)
        }
    }, [state])

    const handleClear = useCallback(() => {
        setInputValue('')
        onChange?.('')
        setOpened(true)
    }, [onChange])

    const ClearIcon = useMemo(() => iconNameToReactComponent('x'), [])

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

    const autocompleteTrigger = (
        <div
            className={`recursica-autocomplete-trigger ${opened || state === 'focus' ? 'opened focus' : ''} ${state === 'disabled' ? 'disabled' : ''}`}
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
                cursor: state === 'disabled' ? 'not-allowed' : 'text',
                transition: 'box-shadow 0.2s, background-color 0.2s',
            }}
        >
            {leadingIcon && (
                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${leadingIconVar})`, display: 'flex', alignItems: 'center' }}>
                    {leadingIcon}
                </div>
            )}
            <input
                id={uniqueId}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                disabled={state === 'disabled'}
                autoComplete="off"
                className="recursica-autocomplete-input"
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    padding: 0,
                    margin: 0,
                    fontFamily: `var(${valueFontFamilyVar})`,
                    fontSize: `var(${valueFontSizeVar})`,
                    fontWeight: `var(${valueFontWeightVar})` as any,
                    letterSpacing: `var(${valueLetterSpacingVar})`,
                    lineHeight: `var(${valueLineHeightVar})`,
                    textDecoration: valueTextDecorationVar ? `var(${valueTextDecorationVar})` as any : 'none',
                    textTransform: valueTextTransformVar ? `var(${valueTextTransformVar})` as any : 'none',
                    fontStyle: valueFontStyleVar ? `var(${valueFontStyleVar})` as any : 'normal',
                    ['--placeholder-opacity' as any]: `var(${placeholderOpacityVar}, 0.5)`,
                }}
            />
            {inputValue && state !== 'disabled' && (
                <Button
                    variant="text"
                    size="small"
                    layer={layer}
                    icon={ClearIcon ? <ClearIcon /> : <span>✕</span>}
                    onClick={handleClear}
                    title="Clear"
                    style={{
                        padding: 0,
                        minWidth: 'auto',
                        width: `var(${iconSizeVar})`,
                        height: `var(${iconSizeVar})`,
                        flexShrink: 0,
                        color: `var(${trailingIconVar})`,
                    }}
                />
            )}
            {trailingIcon && !inputValue && (
                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${trailingIconVar})`, display: 'flex', alignItems: 'center' }}>
                    {trailingIcon}
                </div>
            )}
        </div>
    )

    return (
        <div ref={containerRef} className={`recursica-autocomplete-container ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: layout === 'side-by-side' ? 'row' : 'column', gap: layout === 'side-by-side' ? (buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter') ? `var(${buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')})` : '8px') : 0, width: '100%' }}>
                {labelElement}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <Menu
                        opened={opened && filteredItems.length > 0}
                        position="bottom-start"
                        width="target"
                        offset={4}
                        transitionProps={{ transition: 'pop', duration: 150 }}
                        zIndex={zIndex}
                        trapFocus={false}
                        returnFocus={false}
                        closeOnClickOutside={false}
                        closeOnItemClick={false}
                        closeOnEscape={true}
                        {...mantine}
                    >
                        <Menu.Target>
                            {autocompleteTrigger}
                        </Menu.Target>

                        <Menu.Dropdown
                            p={0}
                            style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                minWidth: 'auto',
                            }}
                        >
                            <MenuAdapter layer={layer}>
                                {filteredItems.map((item) => (
                                    <MenuItemAdapter
                                        key={item.value}
                                        onClick={() => handleItemSelect(item.value)}
                                        disabled={item.disabled}
                                        leadingIcon={item.leadingIcon || item.icon}
                                        leadingIconType={(item.leadingIconType || ((item.leadingIcon || item.icon) ? 'icon' : 'none')) as any}
                                        trailingIcon={item.trailingIcon}
                                        supportingText={item.supportingText as string}
                                        divider={item.divider}
                                        layer={layer}
                                        selected={inputValue === (typeof item.label === 'string' ? item.label : item.value)}
                                        style={{
                                            borderRadius: `calc(var(${borderRadiusVar}) - 2px)`,
                                        }}
                                    >
                                        {item.label}
                                    </MenuItemAdapter>
                                ))}
                            </MenuAdapter>
                        </Menu.Dropdown>
                    </Menu>
                    {assistiveElement}
                </div>
            </div>
        </div>
    )
}
