/**
 * RadioButtonGroup Component Adapter
 * 
 * Groups multiple RadioButtonItems together, handling layout and common properties.
 * Composes Label and AssistiveElement internally, following the CheckboxGroup pattern.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import type { RadioButtonGroupProps } from './common/RadioButtonGroup'
import { isLocalAdapter } from '../registry/activeAdapter'
import { RadioButtonGroup as LocalRadioButtonGroup } from './local/dispatch/RadioButtonGroup'

// Re-exported so existing `import type { RadioButtonGroupProps } from '.../adapters/RadioButtonGroup'`
// call sites keep working — the types now live in common/RadioButtonGroup.ts.
export type { RadioButtonGroupProps } from './common/RadioButtonGroup'

function SharedRadioButtonGroup(props: RadioButtonGroupProps) {
    const Component = useComponent('RadioButtonGroup')

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
    const [groupId] = useState(() => `radio-button-group-${Math.random().toString(36).substr(2, 9)}`)
    const labelId = `${groupId}-label`
    const helpId = helpText ? `${groupId}-help` : undefined
    const errorId = errorText ? `${groupId}-error` : undefined

    // CSS variables for layout-specific spacing
    const labelFieldGapVar = buildComponentCssVarPath('RadioButtonGroup', 'variants', 'layouts', layout, 'properties', 'label-field-gap')

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

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const RadioButtonGroup = (isLocalAdapter ? LocalRadioButtonGroup : SharedRadioButtonGroup) as typeof SharedRadioButtonGroup
