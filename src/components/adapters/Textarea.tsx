/**
 * Textarea Component Adapter
 * 
 * Unified Textarea component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 * Cloned from TextField, adapted for multi-line text input (no icons).
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TextareaProps = {
    value?: string
    defaultValue?: string
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLTextAreaElement>) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    state?: 'default' | 'error' | 'disabled' | 'focus'
    layout?: 'stacked' | 'side-by-side'
    layer?: ComponentLayer
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    name?: string
    className?: string
    style?: React.CSSProperties
    autoFocus?: boolean
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    editIcon?: React.ReactNode | boolean
    editIconGap?: string | number
} & LibrarySpecificProps

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
    editIconGap,
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

    // Determine effective state
    const effectiveState = state

    // Get CSS variables for colors based on state variant
    const backgroundVar = buildComponentCssVarPath('Textarea', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('Textarea', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('Textarea', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')

    // Get CSS variables for focus state border (when focused)
    const focusBorderVar = buildComponentCssVarPath('Textarea', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('Textarea', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get variant-specific border size
    const borderSizeVar = buildComponentCssVarPath('Textarea', 'variants', 'states', effectiveState, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('Textarea', 'border-radius')
    const horizontalPaddingVar = getComponentLevelCssVar('Textarea', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('Textarea', 'vertical-padding')
    const maxWidthVar = getComponentLevelCssVar('Textarea', 'max-width')
    const minWidthVar = getComponentLevelCssVar('Textarea', 'min-width')
    const placeholderOpacityVar = getComponentLevelCssVar('Textarea', 'placeholder-opacity')
    const rowsVar = getComponentLevelCssVar('Textarea', 'rows')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('Textarea', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get Label's gutter for side-by-side layout (Label component manages spacing)
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    // Render Label component if provided
    const labelElement = label ? (
        <Label
            htmlFor={inputId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign}
            layer={layer}
            id={labelId}
            editIcon={editIcon}
            editIconGap={editIconGap}
        >
            {label}
        </Label>
    ) : null

    // Get icon components for AssistiveElement
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])

    // Render AssistiveElement for help or error with icons
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

    // If no library component is available, render fallback
    if (!Component) {
        return (
            <div className={className} style={{
                marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                ...style
            }}>
                {layout === 'stacked' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                        {labelElement}
                        <textarea
                            id={inputId}
                            name={name}
                            value={value}
                            defaultValue={defaultValue}
                            onChange={onChange}
                            onKeyDown={onKeyDown}
                            onBlur={onBlur}
                            placeholder={placeholder}
                            disabled={state === 'disabled'}
                            readOnly={readOnly}
                            autoFocus={autoFocus}
                            style={{
                                width: '100%',
                                maxWidth: `var(${maxWidthVar}, 100%)`,
                                paddingLeft: `var(${horizontalPaddingVar})`,
                                paddingRight: `var(${horizontalPaddingVar})`,
                                paddingTop: `var(${verticalPaddingVar})`,
                                paddingBottom: `var(${verticalPaddingVar})`,
                                borderRadius: `var(${borderRadiusVar})`,
                                borderWidth: `var(${borderSizeVar})`,
                                borderStyle: 'solid',
                                borderColor: `var(${borderVar})`,
                                backgroundColor: `var(${backgroundVar})`,
                                color: `var(${textVar})`,
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                outline: 'none',
                                resize: 'vertical',
                                textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
                            }}
                        />
                        {assistiveElement}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
                        {labelElement}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <textarea
                                id={inputId}
                                name={name}
                                value={value}
                                defaultValue={defaultValue}
                                onChange={onChange}
                                onKeyDown={onKeyDown}
                                onBlur={onBlur}
                                placeholder={placeholder}
                                disabled={state === 'disabled'}
                                readOnly={readOnly}
                                autoFocus={autoFocus}
                                style={{
                                    width: '100%',
                                    maxWidth: `var(${maxWidthVar}, 100%)`,
                                    paddingLeft: `var(${horizontalPaddingVar})`,
                                    paddingRight: `var(${horizontalPaddingVar})`,
                                    paddingTop: `var(${verticalPaddingVar})`,
                                    paddingBottom: `var(${verticalPaddingVar})`,
                                    borderRadius: `var(${borderRadiusVar})`,
                                    borderWidth: `var(${borderSizeVar})`,
                                    borderStyle: 'solid',
                                    borderColor: `var(${borderVar})`,
                                    backgroundColor: `var(${backgroundVar})`,
                                    color: `var(${textVar})`,
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit',
                                    outline: 'none',
                                    resize: 'vertical',
                                }}
                            />
                            {assistiveElement}
                        </div>
                    </div>
                )}
            </div>
        )
    }

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
