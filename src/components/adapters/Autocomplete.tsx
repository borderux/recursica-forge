/**
 * Autocomplete Component Adapter
 *
 * Unified Autocomplete component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Like Dropdown but with a typeable input instead of a readonly value.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { AutocompleteProps } from './common/Autocomplete'

// Re-exported so existing `import type { AutocompleteItem } from '.../adapters/Autocomplete'`
// call sites keep working — the types now live in common/Autocomplete.ts.
export type { AutocompleteItem, AutocompleteProps } from './common/Autocomplete'

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

    const topBottomMarginVar = buildComponentCssVarPath('Autocomplete', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
