/**
 * Carbon RadioButtonItem Implementation
 */

import RadioButton from '../RadioButton/RadioButton'
import type { RadioButtonItemProps as AdapterRadioButtonItemProps } from '../../RadioButtonItem'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './RadioButtonItem.css'

export default function RadioButtonItem({
    label,
    className,
    style,
    ...props
}: AdapterRadioButtonItemProps) {
    // Label gap
    const labelGapVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'label-gap')

    // Text Styles
    const fontFamilyVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-weight')
    const lineHeightVar = getComponentTextCssVar('RadioButtonItem', 'text', 'line-height')
    const colorVar = getComponentTextCssVar('RadioButtonItem', 'text', 'color')

    // RadioButton Overrides from RadioButtonItem
    const sizeVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'border-width')
    const iconSizeVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'icon-size')

    const cssVars = {
        '--radio-size': `var(${sizeVar})`,
        '--radio-radius': `var(${borderRadiusVar})`,
        '--radio-border-width': `var(${borderWidthVar})`,
        '--radio-icon-size': `var(${iconSizeVar})`,
        '--radio-item-gap': `var(${labelGapVar})`,
        '--radio-item-font-family': `var(${fontFamilyVar})`,
        '--radio-item-font-size': `var(${fontSizeVar})`,
        '--radio-item-font-weight': `var(${fontWeightVar})`,
        '--radio-item-line-height': `var(${lineHeightVar})`,
        '--radio-item-color': `var(${colorVar})`,
    }

    return (
        <RadioButton
            label={label}
            className={`${className || ''} recursica-carbon-radio-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
