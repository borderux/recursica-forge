/**
 * Textarea Component Adapter
 *
 * Unified Textarea component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 * Cloned from TextField, adapted for multi-line text input (no icons).
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { TextareaProps } from './common/Textarea'

// Re-exported so existing `import type { TextareaProps } from '.../adapters/Textarea'`
// call sites keep working — the types now live in common/Textarea.ts.
export type { TextareaProps } from './common/Textarea'

export function Textarea({
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
    leadingIcon,
    trailingIcon,
    mantine,
    material,
    carbon,
}: TextareaProps) {
    const Component = useComponent('Textarea')
    const { mode } = useThemeMode()

    // Generate unique ID if not provided
    const [inputId] = useState(() => id || `textarea-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${inputId}-label`
    const helpId = helpText ? `${inputId}-help` : undefined
    const errorId = errorText ? `${inputId}-error` : undefined

    // Get CSS variables for focus state border (when focused)
    const focusBorderVar = buildComponentCssVarPath('Textarea', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('Textarea', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get component-level properties
    const minWidthVar = getComponentLevelCssVar('Textarea', 'min-width')
    const rowsVar = getComponentLevelCssVar('Textarea', 'rows')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('Textarea', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
                    leadingIcon={leadingIcon}
                    trailingIcon={trailingIcon}
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
