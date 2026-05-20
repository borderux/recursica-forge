/**
 * Material RadioButton Implementation
 * 
 * Material UI-specific RadioButton component that uses CSS variables for theming.
 */

import { Radio as MaterialRadio, FormControlLabel } from '@mui/material'
import type { RadioButtonProps as AdapterRadioButtonProps } from '../../RadioButton'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useCssVar } from '../../../hooks/useCssVar'
import './RadioButton.css'

export default function RadioButton({
    selected,
    onChange,
    disabled = false,
    label,
    value,
    layer = 'layer-0',
    className,
    style,
    material,
    ...props
}: AdapterRadioButtonProps) {
    // RadioButton Colors - use the layer prop to get layer-specific colors
    const bgSelectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-selected')
    const bgUnselectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-unselected')
    const borderSelectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-selected')
    const borderUnselectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-unselected')
    const iconColorVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'icon-color')
    const disabledBgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-background')
    const disabledBorderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-border')
    const disabledIconVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-icon')
    const disabledOpacityVar = buildComponentCssVarPath('RadioButton', 'properties', 'disabled-opacity')

    // Size and spacing
    const sizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-size')
    const iconSizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'icon-size')

    // CSS Variables
    const cssVars = {
        '--radio-bg-selected': `var(${bgSelectedVar})`,
        '--radio-bg-unselected': `var(${bgUnselectedVar})`,
        '--radio-border-selected': `var(${borderSelectedVar})`,
        '--radio-border-unselected': `var(${borderUnselectedVar})`,
        '--radio-icon-color': `var(${iconColorVar})`,
        '--radio-disabled-bg': `var(${disabledBgVar})`,
        '--radio-disabled-border': `var(${disabledBorderVar})`,
        '--radio-disabled-icon': `var(${disabledIconVar})`,
        '--radio-disabled-opacity': `var(${disabledOpacityVar})`,
        '--radio-size': `var(${sizeVar})`,
        '--radio-radius': `var(${borderRadiusVar})`,
        '--radio-border-width': `var(${borderWidthVar})`,
        '--radio-icon-size': `var(${iconSizeVar})`,
    }

    useCssVar(sizeVar)

    const radio = (
        <MaterialRadio
            checked={selected}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            value={value}
            className={`${className || ''} recursica-mui-radio-root`}
            style={{ ...cssVars, ...style }}
            {...material}
            {...props}
        />
    )

    if (label) {
        return (
            <FormControlLabel
                control={radio}
                label={label}
                disabled={disabled}
                className={`${className || ''} recursica-mui-radio-label`}
                style={{ ...cssVars, ...style }}
            />
        )
    }

    return radio
}
