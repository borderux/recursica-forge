/**
 * Mantine CheckboxGroup Implementation
 */

import { Checkbox } from '@mantine/core'
import type { CheckboxGroupProps as AdapterCheckboxGroupProps } from '../../CheckboxGroup'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import './CheckboxGroup.css'

export default function CheckboxGroup({
    children,
    itemGap,
    padding,
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

    return (
        <div
            className={`${className || ''} recursica-checkbox-group`}
            style={{ ...style, ...cssVars }}
        >
            {/* We use a simple div wrapper to handle layout control via our vars 
            Mantine Checkbox.Group is useful for value management, but adapter props 
            might not align perfectly with context if we want generic grouping.
            Assuming CheckboxGroup adapter manages layout primarily.
            If value management is needed, we'd wrap with Checkbox.Group, but 
            the 'children' passed are CheckboxItems which manage their own state 
            or are controlled.
        */}
            {children}
        </div>
    )
}
