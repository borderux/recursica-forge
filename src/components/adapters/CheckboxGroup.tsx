/**
 * CheckboxGroup Component Adapter
 * 
 * Groups multiple CheckboxItems together, handling layout and common properties.
 * Composes Label and AssistiveElement internally, following the TextField pattern.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { CheckboxGroupProps } from './common/CheckboxGroup'

// Re-exported so existing `import type { CheckboxGroupProps } from '.../adapters/CheckboxGroup'`
// call sites keep working — the types now live in common/CheckboxGroup.ts.
export type { CheckboxGroupProps } from './common/CheckboxGroup'

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
