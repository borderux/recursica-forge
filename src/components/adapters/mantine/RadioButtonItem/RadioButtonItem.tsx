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
    const letterSpacingVar = getComponentTextCssVar('RadioButtonItem', 'text', 'letter-spacing')
    const fontStyleVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-style')
    const textDecorationVar = getComponentTextCssVar('RadioButtonItem', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('RadioButtonItem', 'text', 'text-transform')

    const getRadioPropVar = (prop: string) => `var(${buildComponentCssVarPath('RadioButton', 'properties', prop)})`
    const getRadioColorVar = (prop: string) => `var(${buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, prop)})`
    const getRadioItemColorVar = (prop: string) => `var(${buildComponentCssVarPath('RadioButtonItem', 'properties', 'colors', layer, prop)})`

    const cssVars = {
        '--radio-size': getRadioPropVar('size'),
        '--radio-radius': getRadioPropVar('border-radius'),
        '--radio-border-width': getRadioPropVar('border-size'),
        '--radio-icon-size': getRadioPropVar('icon-size'),
        '--radio-bg-selected': getRadioColorVar('background-selected'),
        '--radio-border-selected': getRadioColorVar('border-selected'),
        '--radio-bg-unselected': getRadioColorVar('background-unselected'),
        '--radio-border-unselected': getRadioColorVar('border-unselected'),
        '--radio-icon-color': getRadioColorVar('icon-color'),
        '--radio-disabled-bg': getRadioColorVar('disabled-background'),
        '--radio-disabled-border': getRadioColorVar('disabled-border'),
        '--radio-disabled-icon': getRadioColorVar('disabled-icon'),
        '--radio-disabled-opacity': getRadioPropVar('disabled-opacity'),
        '--radio-item-gap': `var(${labelGapVar})`,
        '--radio-item-font-family': `var(${fontFamilyVar})`,
        '--radio-item-font-size': `var(${fontSizeVar})`,
        '--radio-item-font-weight': `var(${fontWeightVar})`,
        '--radio-item-line-height': `var(${lineHeightVar})`,
        '--radio-item-letter-spacing': `var(${letterSpacingVar})`,
        '--radio-item-font-style': `var(${fontStyleVar})`,
        '--radio-item-text-decoration': `var(${textDecorationVar})`,
        '--radio-item-text-transform': `var(${textTransformVar})`,
        '--radio-item-color': getRadioItemColorVar('text'),
        '--radio-item-disabled-color': getRadioItemColorVar('disabled-text'),
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
