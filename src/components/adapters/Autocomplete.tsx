/**
 * Autocomplete Component Adapter
 * 
 * Unified Autocomplete component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Like Dropdown but with a typeable input instead of a readonly value.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type AutocompleteItem = {
    value: string
    label?: React.ReactNode
    disabled?: boolean
    icon?: React.ReactNode
    leadingIcon?: React.ReactNode
    leadingIconType?: 'none' | 'icon' | 'radio' | 'checkbox'
    trailingIcon?: React.ReactNode
    supportingText?: string
    divider?: 'none' | 'bottom'
}

export type AutocompleteProps = {
    items: AutocompleteItem[]
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    state?: string  // accepts custom state variant names
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    minWidth?: number
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
    zIndex?: number
} & LibrarySpecificProps

export function Autocomplete({
    items,
    value: controlledValue,
    defaultValue,
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
    className,
    style,
    disableTopBottomMargin = false,
    zIndex,
    mantine,
    material,
    carbon,
}: AutocompleteProps) {
    const Component = useComponent('Autocomplete')

    // Generate unique ID if not provided
    const [autocompleteId] = useState(() => id || `autocomplete-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${autocompleteId}-label`
    const helpId = helpText ? `${autocompleteId}-help` : undefined
    const errorId = errorText ? `${autocompleteId}-error` : undefined

    // Internal state for uncontrolled usage
    const [internalValue, setInternalValue] = useState(defaultValue || '')
    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    const handleChange = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue)
        }
        onChange?.(newValue)
    }

    // Determine effective state
    const effectiveState = state

    // Get CSS variables
    const backgroundVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('Autocomplete', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'trailing-icon')

    const borderRadiusVar = getComponentLevelCssVar('Autocomplete', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('Autocomplete', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('Autocomplete', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Autocomplete', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('Autocomplete', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('Autocomplete', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('Autocomplete', 'max-width')
    const minWidthVar = getComponentLevelCssVar('Autocomplete', 'min-width')

    const topBottomMarginVar = buildComponentCssVarPath('Autocomplete', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

    const labelElement = label ? (
        <Label
            htmlFor={autocompleteId}
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

    if (!Component) {
        // Fallback UI
        return (
            <div className={className} style={{
                marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                ...style
            }}>
                <div style={{ display: 'flex', flexDirection: layout === 'side-by-side' ? 'row' : 'column', gap: layout === 'side-by-side' ? `var(${labelGutterVar}, 8px)` : 0 }}>
                    {labelElement}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: `var(${iconTextGapVar}, 8px)`,
                                minWidth: effectiveMinWidth,
                                maxWidth: `var(${maxWidthVar}, 100%)`,
                                minHeight: `var(${minHeightVar})`,
                                paddingLeft: `var(${horizontalPaddingVar})`,
                                paddingRight: `var(${horizontalPaddingVar})`,
                                paddingTop: `var(${verticalPaddingVar})`,
                                paddingBottom: `var(${verticalPaddingVar})`,
                                borderRadius: `var(${borderRadiusVar})`,
                                border: `1px solid var(${borderVar})`,
                                backgroundColor: `var(${backgroundVar})`,
                                color: `var(${textVar})`,
                                cursor: state === 'disabled' ? 'not-allowed' : 'text',
                                opacity: state === 'disabled' ? 0.6 : 1,
                            }}
                        >
                            {leadingIcon && (
                                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${leadingIconVar})` }}>{leadingIcon}</div>
                            )}
                            <input
                                id={autocompleteId}
                                value={currentValue}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder={placeholder}
                                disabled={state === 'disabled'}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: 'inherit',
                                    font: 'inherit',
                                }}
                            />
                            {trailingIcon && (
                                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${trailingIconVar})` }}>{trailingIcon}</div>
                            )}
                        </div>
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
            marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
        }}>
            <Suspense fallback={<span />}>
                <Component
                    items={items}
                    value={currentValue}
                    onChange={handleChange}
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
                    id={autocompleteId}
                    labelId={labelId}
                    helpId={helpId}
                    errorId={errorId}
                    className={className}
                    style={style}
                    zIndex={zIndex}
                    mantine={mantine}
                    material={material}
                    carbon={carbon}
                />
            </Suspense>
        </div>
    )
}
