/**
 * FileUpload Component Adapter
 * 
 * Unified FileUpload component that manages a list of uploaded files.
 * Based on ReadOnlyField for the container look, but includes upload actions.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { Button } from './Button'
import { iconNameToReactComponent, iconNameToReactComponent as getIcon } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type FileUploadItem = {
    id: string
    name: string
    size?: number
    type?: string
    status?: 'success' | 'error' | 'uploading'
}

export type FileUploadProps = {
    files?: FileUploadItem[]
    onUpload?: (files: File[]) => void
    onRemove?: (fileId: string) => void
    label?: string
    helpText?: string
    errorText?: string
    layout?: 'stacked' | 'side-by-side'
    state?: 'default' | 'error' | 'disabled' | 'focus'
    layer?: ComponentLayer
    multiple?: boolean
    accept?: string
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    className?: string
    style?: React.CSSProperties
    disableTopBottomMargin?: boolean
} & LibrarySpecificProps

export function FileUpload({
    files = [],
    onUpload,
    onRemove,
    label,
    helpText,
    errorText,
    layout = 'stacked',
    state = 'default',
    layer = 'layer-0',
    multiple = true,
    accept,
    required = false,
    optional = false,
    labelAlign = 'left',
    labelSize,
    id,
    className,
    style,
    disableTopBottomMargin = false,
    mantine,
    material,
    carbon,
}: FileUploadProps) {
    const Component = useComponent('FileUpload')

    // Generate unique ID if not provided
    const fieldId = id || `file-upload-${Math.random().toString(36).substr(2, 9)}`
    const labelId = `${fieldId}-label`
    const helpId = helpText ? `${fieldId}-help` : undefined
    const errorId = errorText ? `${fieldId}-error` : undefined

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

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('FileUpload', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get Label's gutter for side-by-side layout
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    const labelElement = label ? (
        <Label
            htmlFor={fieldId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign}
            layer={layer}
            id={labelId}
        // style handled via margin or flex
        >
            {label}
        </Label>
    ) : null

    // Get icon components
    const UploadIcon = useMemo(() => iconNameToReactComponent('arrow-up-tray'), [])
    const XIcon = useMemo(() => iconNameToReactComponent('x'), [])
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])

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

    if (!Component) {
        // Simple fallback
        return (
            <div className={className} style={{
                marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                ...style
            }}>
                <div style={{ display: 'flex', flexDirection: layout === 'side-by-side' ? 'row' : 'column', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
                    {labelElement}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `var(${itemGapVar})` }}>
                        <div style={{
                            boxShadow: `inset 0 0 0 var(${borderSizeVar}, 1px) var(${borderColorVar})`,
                            borderRadius: `var(${borderRadiusVar})`,
                            padding: `var(${paddingVar})`,
                            backgroundColor: `var(${backgroundVar})`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {UploadIcon && <UploadIcon size={32} style={{ color: `var(${uploadIconColorVar})` }} />}
                            <Button
                                variant="outline"
                                layer={layer}
                                disabled={state === 'disabled'}
                                onClick={() => {
                                    if (state === 'disabled') return
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.multiple = multiple;
                                    input.accept = accept || '';
                                    input.onchange = (e) => {
                                        const target = e.target as HTMLInputElement;
                                        if (target.files) {
                                            onUpload?.(Array.from(target.files));
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                Browse files
                            </Button>
                        </div>

                        {files.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {files.map(file => (
                                    <div key={file.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '8px 12px',
                                        backgroundColor: `var(${itemBackgroundVar})`,
                                        borderRadius: '4px',
                                        fontSize: '0.9em'
                                    }}>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                        <button
                                            onClick={() => onRemove?.(file.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                        >
                                            {XIcon && <XIcon size={16} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {assistiveElement}
                    </div>
                </div>
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
                    files={files}
                    onUpload={onUpload}
                    onRemove={onRemove}
                    label={label}
                    helpText={helpText}
                    errorText={errorText}
                    layout={layout}
                    state={state}
                    layer={layer}
                    multiple={multiple}
                    accept={accept}
                    required={required}
                    optional={optional}
                    labelAlign={labelAlign}
                    labelSize={labelSize}
                    id={fieldId}
                    labelId={labelId}
                    helpId={helpId}
                    errorId={errorId}
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
