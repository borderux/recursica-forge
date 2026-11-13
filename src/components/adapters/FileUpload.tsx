/**
 * FileUpload Component Adapter
 * 
 * Unified FileUpload component that manages a list of uploaded files.
 * Based on ReadOnlyField for the container look, but includes upload actions.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { iconNameToReactComponent, iconNameToReactComponent as getIcon } from '../../modules/components/iconUtils'
import type { FileUploadItem, FileUploadProps } from './common/FileUpload'
import { isLocalAdapter } from '../registry/activeAdapter'
import { FileUpload as LocalFileUpload } from './local/dispatch/FileUpload'

// Re-exported so existing `import type { FileUploadItem, FileUploadProps } from '.../adapters/FileUpload'`
// call sites keep working — the types now live in common/FileUpload.ts.
export type { FileUploadItem, FileUploadProps } from './common/FileUpload'

function SharedFileUpload({
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
    labelSize = 'default',
    id,
    className,
    style,
    disableTopBottomMargin = false,
    mantine,
}: FileUploadProps) {
    const Component = useComponent('FileUpload')

    // Generate unique ID if not provided
    const fieldId = id || `file-upload-${Math.random().toString(36).substr(2, 9)}`
    const labelId = `${fieldId}-label`
    const helpId = helpText ? `${fieldId}-help` : undefined
    const errorId = errorText ? `${fieldId}-error` : undefined

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('FileUpload', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get icon components
    const XIcon = useMemo(() => iconNameToReactComponent('x'), [])

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
                />
            </Suspense>
        </div>
    )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const FileUpload = (isLocalAdapter ? LocalFileUpload : SharedFileUpload) as typeof SharedFileUpload
