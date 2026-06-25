/**
 * Carbon CheckboxItem Implementation
 */

import Checkbox from '../Checkbox/Checkbox'
import type { CheckboxItemProps as AdapterCheckboxItemProps } from '../../CheckboxItem'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import './CheckboxItem.css'

export default function CheckboxItem({
    label,
    className,
    style,
    layer = 'layer-0',
    ...props
}: AdapterCheckboxItemProps) {
    // Label gap
    const labelGapVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'label-gap')

    // Text Styles
    const fontFamilyVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-weight')
    const lineHeightVar = getComponentTextCssVar('CheckboxItem', 'text', 'line-height')
    const letterSpacingVar = getComponentTextCssVar('CheckboxItem', 'text', 'letter-spacing')
    const fontStyleVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-style')
    const textDecorationVar = getComponentTextCssVar('CheckboxItem', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('CheckboxItem', 'text', 'text-transform')
    const colorVar = getComponentTextCssVar('CheckboxItem', 'text', 'color')

    const getPropVar = (prop: string) => `var(${buildComponentCssVarPath('CheckboxItem', 'properties', prop)}, var(${buildComponentCssVarPath('Checkbox', 'properties', prop)}))`
    const getColorVar = (prop: string) => `var(${buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, prop)}, var(${buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, prop)}))`

    const cssVars = {
        '--checkbox-size': getPropVar('size'),
        '--checkbox-radius': getPropVar('border-radius'),
        '--checkbox-border-width': getPropVar('border-size'),
        '--checkbox-icon-size': getPropVar('icon-size'),
        '--checkbox-bg-checked': getColorVar('background-checked'),
        '--checkbox-border-checked': getColorVar('border-checked'),
        '--checkbox-bg-unchecked': getColorVar('background-unchecked'),
        '--checkbox-border-unchecked': getColorVar('border-unchecked'),
        '--checkbox-bg-indeterminate': getColorVar('background-indeterminate'),
        '--checkbox-border-indeterminate': getColorVar('border-indeterminate'),
        '--checkbox-icon-color': getColorVar('icon-color'),
        '--checkbox-icon-color-indeterminate': getColorVar('icon-color-indeterminate'),
        '--checkbox-disabled-bg-checked': getColorVar('disabled-background-checked'),
        '--checkbox-disabled-bg-unchecked': getColorVar('disabled-background-unchecked'),
        '--checkbox-disabled-bg-indeterminate': getColorVar('disabled-background-indeterminate'),
        '--checkbox-disabled-border-checked': getColorVar('disabled-border-checked'),
        '--checkbox-disabled-border-unchecked': getColorVar('disabled-border-unchecked'),
        '--checkbox-disabled-border-indeterminate': getColorVar('disabled-border-indeterminate'),
        '--checkbox-disabled-icon-checked': getColorVar('disabled-icon-checked'),
        '--checkbox-disabled-icon-indeterminate': getColorVar('disabled-icon-indeterminate'),
        '--checkbox-disabled-opacity': getPropVar('disabled-opacity'),
        '--checkbox-item-gap': `var(${labelGapVar})`,
        '--checkbox-item-font-family': `var(${fontFamilyVar})`,
        '--checkbox-item-font-size': `var(${fontSizeVar})`,
        '--checkbox-item-font-weight': `var(${fontWeightVar})`,
        '--checkbox-item-line-height': `var(${lineHeightVar})`,
        '--checkbox-item-letter-spacing': `var(${letterSpacingVar})`,
        '--checkbox-item-font-style': `var(${fontStyleVar})`,
        '--checkbox-item-text-decoration': `var(${textDecorationVar})`,
        '--checkbox-item-text-transform': `var(${textTransformVar})`,
        '--checkbox-item-color': `var(${colorVar})`,
    }

    return (
        <Checkbox
            label={label}
            layer={layer}
            className={`${className || ''} recursica-carbon-checkbox-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
