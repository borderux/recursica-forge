/**
 * Carbon RadioButton Implementation
 * 
 * Carbon Design System-specific RadioButton component that uses CSS variables for theming.
 */

import { RadioButton as CarbonRadioButton } from '@carbon/react'
import { useId } from 'react'
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
    carbon,
    ...props
}: AdapterRadioButtonProps) {
    const radioId = useId()

    // RadioButton Colors
    const bgSelectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-selected')
    const bgUnselectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-unselected')
    const borderSelectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-selected')
    const borderUnselectedVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-unselected')
    const iconColorVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'icon-color')

    const disabledBgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-background')
    const disabledBorderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-border')
    const disabledIconVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-icon')

    // RadioButton Dimensions
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
        '--radio-size': `var(${sizeVar})`,
        '--radio-radius': `var(${borderRadiusVar})`,
        '--radio-border-width': `var(${borderWidthVar})`,
        '--radio-icon-size': `var(${iconSizeVar})`,
    }

    useCssVar(sizeVar)

    const radioProps: any = {
        id: radioId,
        checked: selected,
        onChange: (e: any) => onChange(e.target?.checked ?? true),
        disabled,
        value: value || radioId,
        className: `${className || ''} recursica-carbon-radio`,
        style: { ...style, ...cssVars },
        ...carbon,
        ...props,
    }

    if (typeof label === 'string') {
        radioProps.labelText = label
    } else if (!label) {
        radioProps.labelText = ""
        radioProps.hideLabel = true
    }

    return <CarbonRadioButton {...radioProps} />
}
