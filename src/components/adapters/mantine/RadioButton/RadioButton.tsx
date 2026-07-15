/**
 * Mantine RadioButton Implementation
 * 
 * Mantine-specific RadioButton component that uses CSS variables for theming.
 */

import { Radio as MantineRadio } from '@mantine/core'
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
    mantine,
    ...props
}: AdapterRadioButtonProps) {
    // RadioButton Colors — now nested under variants.selections.<sel>[.variants.states.disabled]
    const selBase = (sel: string, prop: string) => buildComponentCssVarPath('RadioButton', 'variants', 'selection-states', sel, 'properties', 'colors', layer, prop)
    const selDisabled = (sel: string, prop: string) => buildComponentCssVarPath('RadioButton', 'variants', 'selection-states', sel, 'variants', 'states', 'disabled', 'properties', 'colors', layer, prop)
    const bgSelectedVar = selBase('selected', 'background-color')
    const bgUnselectedVar = selBase('unselected', 'background-color')
    const borderSelectedVar = selBase('selected', 'border-color')
    const borderUnselectedVar = selBase('unselected', 'border-color')
    const iconColorVar = selBase('selected', 'icon-color')
    const disabledBgVar = selDisabled('selected', 'background-color')
    const disabledBorderVar = selDisabled('selected', 'border-color')
    const disabledIconVar = selDisabled('selected', 'icon-color')
    const disabledOpacityVar = buildComponentCssVarPath('RadioButton', 'variants', 'selection-states', 'selected', 'variants', 'states', 'disabled', 'properties', 'opacity')

    // Size and spacing
    const sizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-size')
    const iconSizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'icon-size')

    // CSS Variables object for inline styles
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

    // Reactively consume variables
    useCssVar(sizeVar)

    return (
        <MantineRadio
            checked={selected}
            onChange={(e) => onChange(e.currentTarget.checked)}
            disabled={disabled}
            label={label}
            value={value}
            className={`${className || ''} recursica-radio-root`}
            style={{ ...cssVars, ...style }}
            {...mantine}
            {...props}
        />
    )
}
