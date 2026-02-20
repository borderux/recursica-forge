/**
 * Mantine CheckboxGroup Implementation
 * 
 * Supports Label integration and stacked/side-by-side layout variants.
 */

import { useMemo } from 'react'
import type { CheckboxGroupProps as AdapterCheckboxGroupProps } from '../../CheckboxGroup'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './CheckboxGroup.css'

export default function CheckboxGroup({
    children,
    label,
    helpText,
    errorText,
    required = false,
    optional = false,
    layout = 'stacked',
    layer = 'layer-0',
    labelAlign = 'left',
    labelSize,
    itemGap,
    padding,
    orientation,
    groupId,
    labelId,
    helpId,
    errorId,
    className,
    style,
    ...props
}: AdapterCheckboxGroupProps & { groupId?: string; labelId?: string; helpId?: string; errorId?: string }) {
    // Configurable Properties
    const itemGapVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'item-gap')
    const paddingVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'padding')

    // Layout-specific spacing
    const labelFieldGapVar = buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', layout, 'properties', 'label-field-gap')
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

    const cssVars = {
        '--checkbox-group-gap': `var(${itemGapVar})`,
        '--checkbox-group-padding': `var(${paddingVar})`,
    }

    // Render Label component if label text is provided
    const labelElement = label ? (
        <Label
            htmlFor={groupId}
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            size={labelSize}
            layout={layout}
            align={labelAlign}
            layer={layer}
            id={labelId}
        >
            {label}
        </Label>
    ) : null

    // Get icon components for AssistiveElement
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])

    // Render AssistiveElement for help or error
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

    // The checkbox items container
    const itemsContent = (
        <div
            className="recursica-checkbox-group-items"
            style={{
                ...cssVars,
                flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            } as React.CSSProperties}
        >
            {children}
        </div>
    )

    // Side-by-side layout
    if (layout === 'side-by-side' && labelElement) {
        const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
        return (
            <div
                role="group"
                aria-labelledby={label ? labelId : undefined}
                className={`${className || ''} recursica-checkbox-group recursica-checkbox-group-side-by-side`}
                style={style}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue, width: '100%' }}>
                    <div style={{ flexShrink: 0 }}>
                        {labelElement}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {itemsContent}
                        {assistiveElement}
                    </div>
                </div>
            </div>
        )
    }

    // Stacked layout (default)
    return (
        <div
            role="group"
            aria-labelledby={label ? labelId : undefined}
            className={`${className || ''} recursica-checkbox-group recursica-checkbox-group-stacked`}
            style={style}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', alignItems: labelAlign === 'right' ? 'flex-end' : 'stretch' }}>
                {labelElement}
                {itemsContent}
                {assistiveElement}
            </div>
        </div>
    )
}
