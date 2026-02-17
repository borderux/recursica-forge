/**
 * Mantine FileInput Implementation
 * 
 * Mantine-specific FileInput component that uses CSS variables for theming.
 * Uses native HTML elements for the field-like structure to match TextField consistency.
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { FileInputProps as AdapterFileInputProps } from '../../FileInput'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { Chip } from '../../Chip'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './FileInput.css'

export default function FileInput({
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
    id,
    labelId,
    helpId,
    errorId,
    readOnly,
    disableTopBottomMargin = false,
    verticalPadding,
    iconSize,
    name,
    className,
    style,
    mantine,
    ...restProps
}: AdapterFileInputProps & { labelId?: string; helpId?: string; errorId?: string; verticalPadding?: string | number; iconSize?: string | number }) {
    const { mode } = useThemeMode()

    // Extract props that shouldn't be passed to DOM elements
    const { optional, labelAlign, labelSize, ...domProps } = restProps

    // Generate unique ID if not provided
    const uniqueId = id || `file-input-${Math.random().toString(36).substr(2, 9)}`

    // Get CSS variables for colors based on state variant
    const backgroundVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'colors', layer, 'trailing-icon')

    // Get focus state variables
    const focusBorderVar = buildComponentCssVarPath('FileInput', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
    const focusBorderSizeVar = buildComponentCssVarPath('FileInput', 'variants', 'states', 'focus', 'properties', 'border-size')

    // Get variant-specific border size
    const borderSizeVar = buildComponentCssVarPath('FileInput', 'variants', 'states', state, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('FileInput', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('FileInput', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('FileInput', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('FileInput', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('FileInput', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('FileInput', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('FileInput', 'max-width')
    const minWidthVar = getComponentLevelCssVar('FileInput', 'min-width')
    const placeholderOpacityVar = getComponentLevelCssVar('FileInput', 'placeholder-opacity')

    // Get text style CSS variables
    const valueFontSizeVar = getComponentTextCssVar('FileInput', 'text', 'font-size')
    const valueFontFamilyVar = getComponentTextCssVar('FileInput', 'text', 'font-family')
    const valueFontWeightVar = getComponentTextCssVar('FileInput', 'text', 'font-weight')
    const valueLetterSpacingVar = getComponentTextCssVar('FileInput', 'text', 'letter-spacing')
    const valueLineHeightVar = getComponentTextCssVar('FileInput', 'text', 'line-height')
    const valueTextDecorationVar = getComponentTextCssVar('FileInput', 'text', 'text-decoration')
    const valueTextTransformVar = getComponentTextCssVar('FileInput', 'text', 'text-transform')
    const valueFontStyleVar = getComponentTextCssVar('FileInput', 'text', 'font-style')

    // Listen for CSS variable updates (trigger re-render)
    const [, setUpdate] = useState(0)
    useEffect(() => {
        const handleUpdate = () => setUpdate(prev => prev + 1)
        window.addEventListener('cssVarsUpdated', handleUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
    }, [])

    // Render Label
    const labelElement = label ? (
        <Label
            htmlFor={uniqueId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign || 'left'}
            layer={layer}
            id={labelId}
            style={layout === 'side-by-side' ? { minHeight: `var(${minHeightVar})` } : undefined}
        >
            {label}
        </Label>
    ) : null

    // Get icons
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])
    const DefaultUploadIcon = useMemo(() => iconNameToReactComponent('upload'), [])

    // Render AssistiveElement
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

    // Clear icon logic
    const ClearIcon = useMemo(() => iconNameToReactComponent('x'), [])
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : true)
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(multiple ? [] : null)
    }

    const finalVerticalPadding = verticalPadding !== undefined
        ? (typeof verticalPadding === 'number' ? `${verticalPadding}px` : verticalPadding)
        : `var(${verticalPaddingVar}, 4px)`

    const finalIconSize = iconSize !== undefined
        ? (typeof iconSize === 'number' ? `${iconSize}px` : iconSize)
        : `var(${iconSizeVar})`

    const displayValue = value
        ? (Array.isArray(value) ? `${value.length} files selected` : (value as File).name)
        : placeholder

    const innerInput = (
        <div
            className={`recursica-file-input-wrapper ${state === 'focus' ? 'focus' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: `var(${iconTextGapVar}, 8px)`,
                width: '100%',
                minWidth: `var(${minWidthVar})`,
                maxWidth: `var(${maxWidthVar}, 100%)`,
                paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
                paddingRight: `var(${horizontalPaddingVar}, 12px)`,
                paddingTop: finalVerticalPadding,
                paddingBottom: finalVerticalPadding,
                borderRadius: `var(${borderRadiusVar})`,
                backgroundColor: `var(${backgroundVar})`,
                boxShadow: `inset 0 0 0 var(${borderSizeVar}) var(${borderVar})`,
                minHeight: `var(${minHeightVar})`,
                transition: 'all 0.2s',
                position: 'relative',
                cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                overflow: 'hidden' // Ensure scrollable container doesn't overflow wrapper
            }}
        >
            <input
                id={uniqueId}
                name={name}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                        onChange?.(multiple ? Array.from(files) : files[0])
                    }
                }}
                disabled={state === 'disabled'}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'inherit',
                    zIndex: 1
                }}
                {...mantine}
            />
            {(leadingIcon || true) && (
                <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${leadingIconVar})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {leadingIcon || (DefaultUploadIcon ? <DefaultUploadIcon /> : '↑')}
                </div>
            )}
            {multiple && Array.isArray(value) && value.length > 0 ? (
                <div
                    className="recursica-file-input-chips-scroll"
                    style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        gap: '4px',
                        flex: 1,
                        overflowX: 'auto',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        zIndex: 2,
                        pointerEvents: 'none',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {value.map((file, index) => (
                        <Chip
                            key={`${file.name}-${index}`}
                            variant="unselected"
                            size="small"
                            layer={layer}
                            deletable={state !== 'disabled'}
                            onDelete={(e) => {
                                e.stopPropagation();
                                if (state === 'disabled') return;
                                const newValue = [...value];
                                newValue.splice(index, 1);
                                onChange?.(newValue);
                            }}
                            style={{ pointerEvents: 'auto', flexShrink: 0 }}
                        >
                            {file.name}
                        </Chip>
                    ))}
                </div>
            ) : (
                <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: `var(${valueFontFamilyVar})`,
                    fontSize: `var(${valueFontSizeVar})`,
                    fontWeight: `var(${valueFontWeightVar})`,
                    color: value ? `var(${textVar})` : `var(${textVar})`,
                    opacity: value ? 1 : `var(${placeholderOpacityVar})`,
                }}>
                    {displayValue}
                </span>
            )}
            {hasValue && state !== 'disabled' && (
                <div
                    onClick={handleClear}
                    style={{
                        width: finalIconSize,
                        height: finalIconSize,
                        flexShrink: 0,
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        zIndex: 2
                    }}
                >
                    {ClearIcon ? <ClearIcon width="100%" height="100%" /> : '×'}
                </div>
            )}
            {trailingIcon && (
                <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${trailingIconVar})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {trailingIcon}
                </div>
            )}
            <style>{`
            .recursica-file-input-wrapper:has(input:focus),
            .recursica-file-input-wrapper.focus {
                box-shadow: inset 0 0 0 var(${focusBorderSizeVar}) var(${focusBorderVar}) !important;
            }
            .recursica-file-input-chips-scroll::-webkit-scrollbar {
                display: none;
            }
        `}</style>
        </div>
    )

    if (layout === 'side-by-side' && labelElement) {
        const gapValue = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        return (
            <div className={`recursica-file-input recursica-file-input-side-by-side ${className || ''}`} style={style}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: `var(${gapValue}, 8px)`, width: '100%' }}>
                    <div style={{ flexShrink: 0 }}>
                        {labelElement}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {innerInput}
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`recursica-file-input recursica-file-input-stacked ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                {labelElement}
                {innerInput}
                {assistiveElement}
            </div>
        </div>
    )
}
