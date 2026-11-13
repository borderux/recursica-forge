/**
 * FileInput Component Adapter
 * 
 * Unified FileInput component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 * Similar to TextField but specialized for file selection.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { FileInputProps } from './common/FileInput'
import { isLocalAdapter } from '../registry/activeAdapter'
import { FileInput as LocalFileInput } from './local/dispatch/FileInput'

// Re-exported so existing `import type { FileInputProps } from '.../adapters/FileInput'`
// call sites keep working — the types now live in common/FileInput.ts.
export type { FileInputProps } from './common/FileInput'

function SharedFileInput({
    value,
    defaultValue,
    onChange,
    placeholder = 'Choose file...',
    label,
    helpText,
    errorText,
    leadingIcon,
    trailingIcon,
    state = 'default',
    layout = 'stacked',
    layer = 'layer-0',
    multiple = false,
    accept,
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
    verticalPadding,
    iconSize,
    mantine,
}: FileInputProps) {
    const Component = useComponent('FileInput')

    // Generate unique ID if not provided
    const [inputId] = useState(() => id || `file-input-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${inputId}-label`
    const helpId = helpText ? `${inputId}-help` : undefined
    const errorId = errorText ? `${inputId}-error` : undefined

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('FileInput', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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
                    leadingIcon={leadingIcon}
                    trailingIcon={trailingIcon}
                    state={state}
                    layout={layout}
                    layer={layer}
                    multiple={multiple}
                    accept={accept}
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
                    verticalPadding={verticalPadding}
                    iconSize={iconSize}
                    className={className}
                    style={style}
                    mantine={mantine}
                />
            </Suspense>
        </div>
    )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const FileInput = (isLocalAdapter ? LocalFileInput : SharedFileInput) as typeof SharedFileInput
