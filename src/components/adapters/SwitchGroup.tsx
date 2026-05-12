/**
 * SwitchGroup Component Adapter
 * 
 * Groups multiple SwitchItems together, handling layout and common properties.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import { Label } from './Label'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type SwitchGroupProps = {
    children?: React.ReactNode
    label?: string
    errorText?: string
    required?: boolean
    optional?: boolean
    padding?: string // CSS var or token
    itemGap?: string // CSS var or token
    orientation?: 'horizontal' | 'vertical'
    layout?: string  // accepts custom layout variant names
    layer?: ComponentLayer
    labelAlign?: 'left' | 'right'
    labelSize?: 'default' | 'small'
    className?: string
    style?: React.CSSProperties
} & LibrarySpecificProps

export function SwitchGroup(props: SwitchGroupProps) {
    const Component = useComponent('SwitchGroup')

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
    const [groupId] = useState(() => `switch-group-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${groupId}-label`
    const helpId = helpText ? `${groupId}-help` : undefined
    const errorId = errorText ? `${groupId}-error` : undefined

    // CSS variables for layout-specific spacing
    const labelFieldGapVar = buildComponentCssVarPath('SwitchGroup', 'variants', 'layouts', layout, 'properties', 'label-field-gap')
    const labelGutterVar = layout === 'side-by-side'
        ? buildComponentCssVarPath('SwitchGroup', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
        : undefined
    const topBottomMarginVar = buildComponentCssVarPath('SwitchGroup', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')

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


    if (!Component) {
        // Fallback rendering
        const itemGapVar = buildComponentCssVarPath('SwitchGroup', 'properties', 'item-gap')
        const paddingVar = buildComponentCssVarPath('SwitchGroup', 'properties', 'padding')

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
                    style={{
                        marginTop: `var(${topBottomMarginVar}, 0)`,
                        marginBottom: `var(${topBottomMarginVar}, 0)`,
                        ...style
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: gapValue }}>
                        <div style={{ flexShrink: 0 }}>
                            {labelElement}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {itemsContent}
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
                style={{
                    marginTop: `var(${topBottomMarginVar}, 0)`,
                    marginBottom: `var(${topBottomMarginVar}, 0)`,
                    ...style
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelFieldGapVar}, 8px)` }}>
                    {labelElement}
                    {itemsContent}
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
