/**
 * Carbon CheckboxGroup Implementation
 */

import { CheckboxGroup as CarbonCheckboxGroup } from '@carbon/react'
import type { CheckboxGroupProps as AdapterCheckboxGroupProps } from '../../CheckboxGroup'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import './CheckboxGroup.css'

export default function CheckboxGroup({
    children,
    itemGap,
    padding,
    label,
    className,
    style,
    ...props
}: AdapterCheckboxGroupProps) {
    // Configurable Properties
    const itemGapVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'item-gap')
    const paddingVar = buildComponentCssVarPath('CheckboxGroup', 'properties', 'padding')

    const cssVars = {
        '--checkbox-group-gap': `var(${itemGapVar})`,
        '--checkbox-group-padding': `var(${paddingVar})`,
    }

    // Carbon CheckboxGroup requires legendText.
    // We wrap in a div because CheckboxGroup might not accept style/className transparently in all versions or types
    return (
        <div
            className={`${className || ''} recursica-carbon-checkbox-group`}
            style={{ ...style, ...cssVars }}
        >
            <CarbonCheckboxGroup
                legendText={label || ""}
                {...props}
            >
                {children}
            </CarbonCheckboxGroup>
        </div>
    )
}
