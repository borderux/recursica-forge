/**
 * Dropdown Component Adapter
 *
 * Unified Dropdown component that renders the appropriate library implementation
 * based on the current UI kit selection.
 *
 * Controlled/uncontrolled value resolution and id generation happen here because every
 * library needs the same answer — duplicating that per library would just be three copies
 * of the same bookkeeping. Everything library-specific — translating `items` into whatever
 * shape Mantine/Material/Carbon actually render — lives in each library's own wrapper under
 * adapters/{mantine,material,carbon}/Dropdown.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { DropdownAdapterProps, DropdownProps } from './common/Dropdown'

// Re-exported so existing `import type { DropdownItem } from '.../adapters/Dropdown'`
// call sites keep working — the types now live in common/Dropdown.ts.
export type { DropdownItem, DropdownProps } from './common/Dropdown'

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
    maxHeight,
    id,
    className,
    style,
    disableTopBottomMargin = false,
    zIndex,
    disabled = false,
    editIcon,
    onEditIconClick,
    editIconTitle,
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

    const topBottomMarginVar = buildComponentCssVarPath('Dropdown', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    const adapterProps: DropdownAdapterProps = {
        items,
        value: currentValue,
        onChange: handleSelect,
        placeholder,
        label,
        helpText,
        errorText,
        leadingIcon,
        trailingIcon,
        state,
        layout,
        layer,
        minWidth,
        required,
        optional,
        labelAlign,
        labelSize,
        maxHeight,
        id: dropdownId,
        labelId,
        helpId,
        errorId,
        className,
        style,
        zIndex,
        disabled,
        editIcon,
        onEditIconClick,
        editIconTitle,
        mantine,
        material,
        carbon,
    }

    return (
        <div style={{
            marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
            marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
        }}>
            <Suspense fallback={<span />}>
                <Component {...adapterProps} />
            </Suspense>
        </div>
    )
}
