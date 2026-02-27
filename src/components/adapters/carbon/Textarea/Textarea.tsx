/**
 * Carbon Textarea Implementation
 * 
 * Carbon-specific Textarea component that uses CSS variables for theming.
 * Uses native HTML elements since we're composing Label and AssistiveElement.
 * Cloned from TextField, adapted for multi-line text input (no icons).
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { TextareaProps as AdapterTextareaProps } from '../../Textarea'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Textarea.css'

export default function Textarea({
    value,
    defaultValue,
    onChange,
    placeholder,
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
    carbon,
    ...restProps
}: AdapterTextareaProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()

    // Extract props that shouldn't be passed to DOM elements
    const { optional, labelAlign, labelSize, ...domProps } = restProps

    // Generate unique ID if not provided (needed for scoped styles)
    const uniqueId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

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

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    // Get text style CSS variables
    const valueFontSizeVar = getComponentTextCssVar('Textarea', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('Textarea', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('Textarea', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('Textarea', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('Textarea', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('Textarea', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('Textarea', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('Textarea', 'text', 'font-style')

    // State to force re-renders when text CSS variables change
    const [, setTextVarsUpdate] = useState(0)

    // Read rows from CSS variable
    const [rows, setRows] = useState<number>(() => {
        const val = readCssVar(rowsVar)
        return val ? parseInt(val, 10) || 4 : 4
    })

    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
        const textCssVars = [
            valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar,
            valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar
        ]

        const dimensionCssVars = [
            borderSizeVar, borderRadiusVar, horizontalPaddingVar, verticalPaddingVar,
            maxWidthVar, minWidthVar, placeholderOpacityVar, rowsVar
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
                const val = readCssVar(rowsVar)
                if (val) {
                    const parsed = parseInt(val, 10)
                    if (!isNaN(parsed)) setRows(parsed)
                }
            }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)

        const observer = new MutationObserver(() => {
            setTextVarsUpdate(prev => prev + 1)
            const val = readCssVar(rowsVar)
            if (val) {
                const parsed = parseInt(val, 10)
                if (!isNaN(parsed)) setRows(parsed)
            }
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleUpdate)
            observer.disconnect()
        }
    }, [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, borderSizeVar, borderRadiusVar, horizontalPaddingVar, verticalPaddingVar, maxWidthVar, minWidthVar, placeholderOpacityVar, rowsVar, textVar])

    // Render Label component if provided
    const labelElement = label ? (
        <Label
            htmlFor={uniqueId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign || 'left'}
            layer={layer}
            id={labelId}
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

    // Textarea element
    const textareaWrapper = (
        <div
            className="recursica-textarea-wrapper"
            onClick={domProps.onClick}
            style={{
                display: 'flex',
                width: '100%',
                maxWidth: layout === 'stacked' ? '100%' : `var(${maxWidthVar})`,
                flexShrink: 0,
                border: 'none',
                borderRadius: `var(${borderRadiusVar})`,
                backgroundColor: `var(${backgroundVar})`,
                boxShadow: `inset 0 0 0 var(${borderSizeVar}) var(${borderVar})`,
                transition: 'box-shadow 0.2s',
                cursor: domProps.onClick ? 'pointer' : undefined,
            }}
        >
            <textarea
                id={uniqueId}
                name={name}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                onKeyDown={domProps.onKeyDown}
                onBlur={domProps.onBlur}
                placeholder={placeholder}
                disabled={state === 'disabled'}
                readOnly={domProps.readOnly}
                autoFocus={domProps.autoFocus}
                rows={rows}
                className={`recursica-textarea-input ${className || ''}`}
                style={{
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '100%',
                    paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
                    paddingRight: `var(${horizontalPaddingVar}, 12px)`,
                    paddingTop: `var(${verticalPaddingVar})`,
                    paddingBottom: `var(${verticalPaddingVar})`,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: `var(${textVar})`,
                    outline: 'none',
                    resize: 'vertical',
                    textAlign: labelAlign === 'right' && layout === 'stacked' ? 'right' : 'left',
                } as React.CSSProperties}
                {...carbon}
                {...domProps}
            />
            <style>{`
        #${uniqueId}.recursica-textarea-input {
          font-family: var(${valueFontFamilyVar}) !important;
          font-size: var(${valueFontSizeVar}) !important;
          font-weight: var(${valueFontWeightVar}) !important;
          letter-spacing: var(${valueLetterSpacingVar}) !important;
          line-height: var(${valueLineHeightVar}) !important;
          text-decoration: var(${valueTextDecorationVar}) !important;
          text-transform: var(${valueTextTransformVar}) !important;
          font-style: var(${valueFontStyleVar}) !important;
        }
        #${uniqueId}.recursica-textarea-input::placeholder,
        #${uniqueId}.recursica-textarea-input::-webkit-input-placeholder,
        #${uniqueId}.recursica-textarea-input::-moz-placeholder,
        #${uniqueId}.recursica-textarea-input:-ms-input-placeholder {
          color: var(${textVar}) !important;
          opacity: var(${placeholderOpacityVar}) !important;
        }
        #${uniqueId}.recursica-textarea-input:focus {
          /* Focus styles are handled by wrapper */
        }
        .recursica-textarea-wrapper:has(#${uniqueId}:focus) {
          box-shadow: inset 0 0 0 var(${focusBorderSizeVar}) var(${focusBorderVar}) !important;
        }
      `}</style>
        </div>
    )

    // Render based on layout
    if (layout === 'side-by-side' && labelElement) {
        const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
        return (
            <div className={`recursica-textarea recursica-textarea-side-by-side ${className || ''}`} style={style}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue, width: '100%' }}>
                    <div style={{ flexShrink: 0 }}>
                        {labelElement}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {textareaWrapper}
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    // Stacked layout (default)
    return (
        <div className={`recursica-textarea recursica-textarea-stacked ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: labelAlign === 'right' && layout === 'stacked' ? 'flex-end' : 'stretch' }}>
                {labelElement}
                {textareaWrapper}
                {assistiveElement}
            </div>
        </div>
    )
}
