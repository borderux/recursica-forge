/**
 * Mantine FileUpload Implementation
 * 
 * Mantine-specific FileUpload component that uses CSS variables for theming.
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { FileUploadProps as AdapterFileUploadProps } from '../../FileUpload'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './FileUpload.css'

export default function FileUpload({
    files = [],
    onUpload,
    onRemove,
    label,
    helpText,
    errorText,
    state = 'default',
    layout = 'stacked',
    layer = 'layer-0',
    multiple = true,
    accept,
    required = false,
    id,
    labelId,
    helpId,
    errorId,
    className,
    style,
    mantine,
    ...restProps
}: AdapterFileUploadProps & { labelId?: string; helpId?: string; errorId?: string }) {
    const { mode } = useThemeMode()

    // Extract props that shouldn't be passed to DOM elements
    const { optional, labelAlign, labelSize, disableTopBottomMargin, ...domProps } = restProps

    const uniqueId = id || `file-upload-${Math.random().toString(36).substr(2, 9)}`

    // Get CSS variables for colors based on state variant
    const backgroundVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'colors', layer, 'background')
    const borderColorVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'colors', layer, 'border-color')
    const textColorVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'colors', layer, 'text')
    const uploadIconColorVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'colors', layer, 'upload-icon')
    const itemBackgroundVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'colors', layer, 'item-background')
    const borderSizeVar = buildComponentCssVarPath('FileUpload', 'variants', 'states', state, 'properties', 'border-size')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('FileUpload', 'border-radius')
    const itemGapVar = getComponentLevelCssVar('FileUpload', 'item-gap')
    const paddingVar = getComponentLevelCssVar('FileUpload', 'padding')

    // Get text style CSS variables
    const fontSizeVar = getComponentTextCssVar('FileUpload', 'text', 'font-size')
    const fontFamilyVar = getComponentTextCssVar('FileUpload', 'text', 'font-family')
    const fontWeightVar = getComponentTextCssVar('FileUpload', 'text', 'font-weight')

    // Listen for CSS variable updates
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
            style={layout === 'side-by-side' ? { minHeight: '48px' } : undefined} // Fallback minHeight
        >
            {label}
        </Label>
    ) : null

    // Get icons
    const UploadIcon = useMemo(() => iconNameToReactComponent('upload'), [])
    const XIcon = useMemo(() => iconNameToReactComponent('x'), [])
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])

    // Render AssistiveElement
    const assistiveElement = errorText ? (
        <AssistiveElement
            text={errorText}
            variant="error"
            layer={layer}
            id={errorId}
            icon={ErrorIcon ? <ErrorIcon /> : null}
        />
    ) : helpText ? (
        <AssistiveElement
            text={helpText}
            variant="help"
            layer={layer}
            id={helpId}
            icon={HelpIcon ? <HelpIcon /> : null}
        />
    ) : null

    const uploadArea = (
        <div
            className="recursica-file-upload-area"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: `var(${paddingVar}, 24px)`,
                backgroundColor: `var(${backgroundVar})`,
                boxShadow: `inset 0 0 0 var(${borderSizeVar}, 1px) var(${borderColorVar})`,
                borderRadius: `var(${borderRadiusVar})`,
                transition: 'all 0.2s',
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {UploadIcon && <UploadIcon size={32} style={{ color: `var(${uploadIconColorVar})` }} />}
            <Button
                variant="outline"
                layer={layer}
                disabled={state === 'disabled'}
                onClick={() => {
                    if (state === 'disabled') return
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = multiple
                    input.accept = accept || ''
                    input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files) {
                            onUpload?.(Array.from(target.files))
                        }
                    }
                    input.click()
                }}
            >
                Browse files
            </Button>
        </div>
    )

    const fileList = files.length > 0 && (
        <div
            className="recursica-file-upload-list"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: `var(${itemGapVar}, 8px)`,
                marginTop: '12px',
                width: '100%'
            }}
        >
            {files.map(file => (
                <div
                    key={file.id}
                    className="recursica-file-upload-item"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        backgroundColor: `var(${itemBackgroundVar})`,
                        borderRadius: '4px',
                        fontSize: `var(${fontSizeVar})`,
                        fontFamily: `var(${fontFamilyVar})`,
                        fontWeight: `var(${fontWeightVar})`,
                        color: `var(${textColorVar})`
                    }}
                >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                    </span>
                    <button
                        onClick={() => state !== 'disabled' && onRemove?.(file.id)}
                        className="recursica-file-upload-item-remove"
                        style={{ background: 'none', border: 'none', cursor: state === 'disabled' ? 'default' : 'pointer', padding: 4, display: 'flex', color: 'inherit', opacity: state === 'disabled' ? 0.5 : 1 }}
                    >
                        {XIcon && <XIcon size={16} />}
                    </button>
                </div>
            ))}
        </div>
    )

    if (layout === 'side-by-side' && labelElement) {
        const gapValue = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        return (
            <div className={`recursica-file-upload recursica-file-upload-side-by-side ${className || ''}`} style={style}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: `var(${gapValue}, 16px)`, width: '100%' }}>
                    <div style={{ flexShrink: 0 }}>
                        {labelElement}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {uploadArea}
                        {fileList}
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`recursica-file-upload recursica-file-upload-stacked ${className || ''}`} style={style}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                {labelElement}
                {uploadArea}
                {fileList}
                {assistiveElement}
            </div>
        </div>
    )
}
