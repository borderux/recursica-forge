/**
 * Dropdown Component Adapter
 * 
 * Unified Dropdown component that renders the appropriate library implementation
 * based on the current UI kit selection.
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

export type DropdownItem = {
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

export type DropdownProps = {
    items: DropdownItem[]
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    state?: 'default' | 'error' | 'disabled' | 'focus'
    layout?: 'stacked' | 'side-by-side'
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

export function Dropdown({
    items,
    value: controlledValue,
    defaultValue,
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
    id,
    className,
    style,
    disableTopBottomMargin = false,
    zIndex,
    mantine,
    material,
    carbon,
}: DropdownProps) {
    const Component = useComponent('Dropdown')

    // Generate unique ID if not provided
    const [dropdownId] = useState(() => id || `dropdown-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${dropdownId}-label`
    const helpId = helpText ? `${dropdownId}-help` : undefined
    const errorId = errorText ? `${dropdownId}-error` : undefined

    // Internal state for uncontrolled usage
    const [internalValue, setInternalValue] = useState(defaultValue || '')
    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    const handleSelect = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue)
        }
        onChange?.(newValue)
    }

    // Determine effective state
    const effectiveState = state

    // Get CSS variables (using TextField as template for now until Dropdown tokens are stable)
    // We use Dropdown as the component name for CSS vars
    const backgroundVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('Dropdown', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'trailing-icon')

    const borderRadiusVar = getComponentLevelCssVar('Dropdown', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('Dropdown', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('Dropdown', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Dropdown', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('Dropdown', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('Dropdown', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('Dropdown', 'max-width')
    const minWidthVar = getComponentLevelCssVar('Dropdown', 'min-width')


    const topBottomMarginVar = buildComponentCssVarPath('Dropdown', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`

    // Find selected label
    const selectedItem = items.find(item => item.value === currentValue)
    const displayLabel = selectedItem ? selectedItem.label : placeholder
    const itemLeadingIcon = selectedItem ? (selectedItem.leadingIcon || selectedItem.icon) : null
    const effectiveLeadingIcon = leadingIcon || itemLeadingIcon

    const labelElement = label ? (
        <Label
            htmlFor={dropdownId}
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
                            id={dropdownId}
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
                                cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                                opacity: state === 'disabled' ? 0.6 : 1,
                            }}
                        >
                            {effectiveLeadingIcon && (
                                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${leadingIconVar})` }}>{effectiveLeadingIcon}</div>
                            )}
                            <span style={{ flex: 1 }}>{displayLabel}</span>
                            {trailingIcon || (
                                <div style={{ width: `var(${iconSizeVar})`, height: `var(${iconSizeVar})`, color: `var(${trailingIconVar})` }}>▼</div>
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
                    onChange={handleSelect}
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
                    id={dropdownId}
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
