/**
 * FileInput Component Adapter
 * 
 * Unified FileInput component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Composes Label and AssistiveElement internally.
 * Similar to TextField but specialized for file selection.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../utils/cssVarNames'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { Chip } from './Chip'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type FileInputProps = {
    value?: File | File[] | null
    defaultValue?: File | File[] | null
    onChange?: (files: File | File[] | null) => void
    placeholder?: string
    label?: string
    helpText?: string
    errorText?: string
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
    state?: 'default' | 'error' | 'disabled' | 'focus'
    layout?: 'stacked' | 'side-by-side'
    layer?: ComponentLayer
    multiple?: boolean
    accept?: string
    required?: boolean
    optional?: boolean
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    id?: string
    name?: string
    className?: string
    style?: React.CSSProperties
    readOnly?: boolean
    disableTopBottomMargin?: boolean
    verticalPadding?: string | number
    iconSize?: string | number
} & LibrarySpecificProps

export function FileInput({
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
    material,
    carbon,
}: FileInputProps) {
    const Component = useComponent('FileInput')

    // Generate unique ID if not provided
    const [inputId] = useState(() => id || `file-input-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${inputId}-label`
    const helpId = helpText ? `${inputId}-help` : undefined
    const errorId = errorText ? `${inputId}-error` : undefined

    // Determine effective state
    const effectiveState = state

    // Get CSS variables for colors based on state variant
    const backgroundVar = buildComponentCssVarPath('FileInput', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
    const borderVar = buildComponentCssVarPath('FileInput', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
    const textVar = buildComponentCssVarPath('FileInput', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
    const leadingIconVar = buildComponentCssVarPath('FileInput', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
    const trailingIconVar = buildComponentCssVarPath('FileInput', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'trailing-icon')

    // Get component-level properties
    const borderRadiusVar = getComponentLevelCssVar('FileInput', 'border-radius')
    const minHeightVar = getComponentLevelCssVar('FileInput', 'min-height')
    const horizontalPaddingVar = getComponentLevelCssVar('FileInput', 'horizontal-padding')
    const verticalPaddingVar = getComponentLevelCssVar('FileInput', 'vertical-padding')
    const iconSizeVar = getComponentLevelCssVar('FileInput', 'icon-size')
    const iconTextGapVar = getComponentLevelCssVar('FileInput', 'icon-text-gap')
    const maxWidthVar = getComponentLevelCssVar('FileInput', 'max-width')
    const minWidthVar = getComponentLevelCssVar('FileInput', 'min-width')

    // Get top-bottom-margin from layout variant
    const topBottomMarginVar = buildComponentCssVarPath('FileInput', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

    // Get Label's gutter for side-by-side layout
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
            style={layout === 'side-by-side' ? { minHeight: `var(${minHeightVar})` } : undefined}
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

    // Clear icon logic
    const ClearIcon = useMemo(() => iconNameToReactComponent('x'), [])
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : true)
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(multiple ? [] : null)
    }

    const finalVerticalPadding = verticalPadding !== undefined
        ? (typeof verticalPadding === 'number' ? `${verticalPadding}px` : verticalPadding)
        : `var(${verticalPaddingVar})`

    const finalIconSize = iconSize !== undefined
        ? (typeof iconSize === 'number' ? `${iconSize}px` : iconSize)
        : `var(${iconSizeVar})`

    if (!Component) {
        // Fallback: simple styled wrapper around native file input
        const displayValue = value
            ? (Array.isArray(value) ? `${value.length} files selected` : (value as File).name)
            : placeholder

        return (
            <div className={className} style={{
                marginTop: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                marginBottom: disableTopBottomMargin ? 0 : `var(${topBottomMarginVar})`,
                ...style
            }}>
                {layout === 'stacked' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                        {labelElement}
                        <div style={{ position: 'relative', width: '100%', maxWidth: `var(${maxWidthVar}, 100%)` }}>
                            <input
                                id={inputId}
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
                                    cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                                    zIndex: 1
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: `var(${iconTextGapVar}, 8px)`,
                                    minWidth: `var(${minWidthVar})`,
                                    minHeight: `var(${minHeightVar})`,
                                    paddingLeft: `var(${horizontalPaddingVar})`,
                                    paddingRight: `var(${horizontalPaddingVar})`,
                                    paddingTop: finalVerticalPadding,
                                    paddingBottom: finalVerticalPadding,
                                    borderRadius: `var(${borderRadiusVar})`,
                                    border: `1px solid var(${borderVar})`,
                                    backgroundColor: `var(${backgroundVar})`,
                                    color: value ? `var(${textVar})` : `var(${textVar}, rgba(0,0,0,0.5))`,
                                    transition: 'all 0.2s',
                                    pointerEvents: 'none',
                                    overflow: 'hidden'
                                }}
                            >
                                {(leadingIcon || true) && (
                                    <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${leadingIconVar})` }}>
                                        {leadingIcon || <span style={{ fontSize: '1.2em' }}>↑</span>}
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
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                                            opacity: 0.6
                                        }}
                                    >
                                        {ClearIcon ? <ClearIcon width="100%" height="100%" /> : '×'}
                                    </div>
                                )}
                                {trailingIcon && (
                                    <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${trailingIconVar})` }}>
                                        {trailingIcon}
                                    </div>
                                )}
                                <style>{`
                                    .recursica-file-input-chips-scroll::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                            </div>
                        </div>
                        {assistiveElement}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: labelGutterVar ? `var(${labelGutterVar})` : '8px' }}>
                        {labelElement}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: `var(${maxWidthVar}, 100%)` }}>
                                <input
                                    id={inputId}
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
                                        cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                                        zIndex: 1
                                    }}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: `var(${iconTextGapVar}, 8px)`,
                                        minWidth: `var(${minWidthVar})`,
                                        minHeight: `var(${minHeightVar})`,
                                        paddingLeft: `var(${horizontalPaddingVar})`,
                                        paddingRight: `var(${horizontalPaddingVar})`,
                                        paddingTop: finalVerticalPadding,
                                        paddingBottom: finalVerticalPadding,
                                        borderRadius: `var(${borderRadiusVar})`,
                                        border: `1px solid var(${borderVar})`,
                                        backgroundColor: `var(${backgroundVar})`,
                                        color: value ? `var(${textVar})` : `var(${textVar}, rgba(0,0,0,0.5))`,
                                        transition: 'all 0.2s',
                                        pointerEvents: 'none',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {(leadingIcon || true) && (
                                        <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${leadingIconVar})` }}>
                                            {leadingIcon || <span style={{ fontSize: '1.2em' }}>↑</span>}
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
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                                                opacity: 0.6
                                            }}
                                        >
                                            {ClearIcon ? <ClearIcon width="100%" height="100%" /> : '×'}
                                        </div>
                                    )}
                                    {trailingIcon && (
                                        <div style={{ width: finalIconSize, height: finalIconSize, flexShrink: 0, color: `var(${trailingIconVar})` }}>
                                            {trailingIcon}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {assistiveElement}
                        </div>
                    </div>
                )}
            </div>
        )
    }

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
                    material={material}
                    carbon={carbon}
                />
            </Suspense>
        </div>
    )
}
