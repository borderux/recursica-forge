/**
 * Mantine RadioButtonItem Implementation
 * 
 * RadioButtonItem wraps RadioButton and applies label styling and gap.
 */

import RadioButton from '../RadioButton/RadioButton'
import type { RadioButtonItemProps as AdapterRadioButtonItemProps } from '../../RadioButtonItem'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './RadioButtonItem.css'

export default function RadioButtonItem({
    label,
    className,
    style,
    layer = 'layer-0',
    ...props
}: AdapterRadioButtonItemProps) {
    // Label gap
    const labelGapVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'label-gap')
    const maxWidthVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'max-width')

    // Text Styles
    const fontFamilyVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-weight')
    const lineHeightVar = getComponentTextCssVar('RadioButtonItem', 'text', 'line-height')

    const colorVar = getComponentTextCssVar('RadioButtonItem', 'text', 'color')

    // RadioButton props from base RadioButton component
    const sizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-size')
    const iconSizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'icon-size')

    // Color props from base RadioButton component
    const selectedBgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-selected')
    const selectedBorderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-selected')
    const unselectedBgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'background-unselected')
    const unselectedBorderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'border-unselected')
    const iconColorVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'icon-color')
    const disabledBgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-background')
    const disabledBorderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-border')
    const disabledIconVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, 'disabled-icon')
    const disabledOpacityVar = buildComponentCssVarPath('RadioButton', 'properties', 'disabled-opacity')

    const cssVars = {
        '--radio-size': `var(${sizeVar})`,
        '--radio-radius': `var(${borderRadiusVar})`,
        '--radio-border-width': `var(${borderWidthVar})`,
        '--radio-icon-size': `var(${iconSizeVar})`,
        '--radio-bg-selected': `var(${selectedBgVar})`,
        '--radio-border-selected': `var(${selectedBorderVar})`,
        '--radio-bg-unselected': `var(${unselectedBgVar})`,
        '--radio-border-unselected': `var(${unselectedBorderVar})`,
        '--radio-icon-color': `var(${iconColorVar})`,
        '--radio-disabled-bg': `var(${disabledBgVar})`,
        '--radio-disabled-border': `var(${disabledBorderVar})`,
        '--radio-disabled-icon': `var(${disabledIconVar})`,
        '--radio-disabled-opacity': `var(${disabledOpacityVar})`,
        '--radio-item-gap': `var(${labelGapVar})`,
        '--radio-item-font-family': `var(${fontFamilyVar})`,
        '--radio-item-font-size': `var(${fontSizeVar})`,
        '--radio-item-font-weight': `var(${fontWeightVar})`,
        '--radio-item-line-height': `var(${lineHeightVar})`,

        '--radio-item-color': `var(${colorVar})`,
        '--radio-item-max-width': `var(${maxWidthVar})`,
    }

    return (
        <RadioButton
            label={label}
            layer={layer}
            className={`${className || ''} recursica-radio-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
