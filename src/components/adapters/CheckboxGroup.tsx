/**
 * CheckboxGroup Component Adapter
 * 
 * Groups multiple CheckboxItems together, handling layout and common properties.
 * Composes Label and AssistiveElement internally, following the TextField pattern.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type CheckboxGroupProps = {
    children?: React.ReactNode
    label?: string
    description?: React.ReactNode
    helpText?: string
    errorText?: string
    required?: boolean
    optional?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
    orientation?: 'horizontal' | 'vertical'
    layout?: 'stacked' | 'side-by-side'
    layer?: ComponentLayer
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function CheckboxGroup(props: CheckboxGroupProps) {
    const Component = useComponent('CheckboxGroup')

    const {
        label,
        helpText,
        errorText,
        required = false,
        optional = false,
        layout = 'stacked',
        layer = 'layer-0',
        labelAlign = 'left',
        labelSize,
        className,
        style,
        children,
        ...restProps
    } = props

    // Generate unique ID for accessibility
    const [groupId] = useState(() => `checkbox-group-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${groupId}-label`
    const helpId = helpText ? `${groupId}-help` : undefined
    const errorId = errorText ? `${groupId}-error` : undefined

    // CSS variables for layout-specific spacing
    const labelFieldGapVar = buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', layout, 'properties', 'label-field-gap')
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('CheckboxGroup', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined

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

    if (!Component) {
        // Fallback rendering
        const itemGapVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'item-gap')
        const paddingVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'padding')

        const itemsContent = (
            <div
                style={{
                    display: 'flex',
                    flexDirection: props.orientation === 'horizontal' ? 'row' : 'column',
                    gap: `var(${itemGapVar}, 8px)`,
                    padding: `var(${paddingVar}, 0)`,
                }}
            >
                {children}
            </div>
        )

        if (layout === 'side-by-side' && labelElement) {
            const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
            return (
                <div
                    role="group"
                    aria-labelledby={label ? labelId : undefined}
                    className={className}
                    style={style}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue }}>
                        <div style={{ flexShrink: 0 }}>
                            {labelElement}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                className={className}
                style={style}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {labelElement}
                    {itemsContent}
                    {assistiveElement}
                </div>
            </div>
        )
    }

    return (
        <Suspense fallback={null}>
            <Component
                {...restProps}
                label={label}
                helpText={helpText}
                errorText={errorText}
                required={required}
                optional={optional}
                layout={layout}
                layer={layer}
                labelAlign={labelAlign}
                labelSize={labelSize}
                groupId={groupId}
                labelId={labelId}
                helpId={helpId}
                errorId={errorId}
                className={className}
                style={style}
            >
                {children}
            </Component>
        </Suspense>
    )
}
