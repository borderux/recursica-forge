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

    const getPropVar = (prop: string) => `var(${buildComponentCssVarPath('RadioButtonItem', 'properties', prop)}, var(${buildComponentCssVarPath('RadioButton', 'properties', prop)}))`
    const getColorVar = (prop: string) => `var(${buildComponentCssVarPath('RadioButtonItem', 'properties', 'colors', layer, prop)}, var(${buildComponentCssVarPath('RadioButton', 'properties', 'colors', layer, prop)}))`

    const cssVars = {
        '--radio-size': getPropVar('size'),
        '--radio-radius': getPropVar('border-radius'),
        '--radio-border-width': getPropVar('border-size'),
        '--radio-icon-size': getPropVar('icon-size'),
        '--radio-bg-selected': getColorVar('background-selected'),
        '--radio-border-selected': getColorVar('border-selected'),
        '--radio-bg-unselected': getColorVar('background-unselected'),
        '--radio-border-unselected': getColorVar('border-unselected'),
        '--radio-icon-color': getColorVar('icon-color'),
        '--radio-disabled-bg': getColorVar('disabled-background'),
        '--radio-disabled-border': getColorVar('disabled-border'),
        '--radio-disabled-icon': getColorVar('disabled-icon'),
        '--radio-disabled-opacity': getPropVar('disabled-opacity'),
        '--radio-item-gap': `var(${labelGapVar})`,
        '--radio-item-font-family': `var(${fontFamilyVar})`,
        '--radio-item-font-size': `var(${fontSizeVar})`,
        '--radio-item-font-weight': `var(${fontWeightVar})`,
        '--radio-item-line-height': `var(${lineHeightVar})`,
        '--radio-item-letter-spacing': `var(${letterSpacingVar})`,
        '--radio-item-font-style': `var(${fontStyleVar})`,
        '--radio-item-text-decoration': `var(${textDecorationVar})`,
        '--radio-item-text-transform': `var(${textTransformVar})`,
        '--radio-item-color': getColorVar('text'),
        '--radio-item-disabled-color': getColorVar('disabled-text'),
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
