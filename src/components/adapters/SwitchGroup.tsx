/**
 * SwitchGroup Component Adapter
 * 
 * Groups multiple SwitchItems together, handling layout and common properties.
 * Composes Label and AssistiveElement internally.
 */

import { Suspense, useState, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SwitchGroupProps } from './common/SwitchGroup'

// Re-exported so existing `import type { SwitchGroupProps } from '.../adapters/SwitchGroup'`
// call sites keep working — the types now live in common/SwitchGroup.ts.
export type { SwitchGroupProps } from './common/SwitchGroup'

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
