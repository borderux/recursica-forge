/**
 * Material UI CheckboxGroup Implementation
 */

import { FormGroup } from '@mui/material'
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
        <FormGroup
            className={`${className || ''} recursica-checkbox-group-mui`}
            style={{ ...style, ...cssVars }}
            {...props}
        >
            {children}
        </FormGroup>
    )
}
