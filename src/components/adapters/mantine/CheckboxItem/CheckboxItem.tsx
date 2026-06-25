/**
 * Mantine CheckboxItem Implementation
 * 
 * CheckboxItem wraps Checkbox and applies label styling and gap.
 */

import Checkbox from '../Checkbox/Checkbox'
import type { CheckboxItemProps as AdapterCheckboxItemProps } from '../../CheckboxItem'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useCssVar } from '../../../hooks/useCssVar'
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
    const maxWidthVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'max-width')

    // Text Styles
    const fontFamilyVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-weight')
    const lineHeightVar = getComponentTextCssVar('CheckboxItem', 'text', 'line-height')
    const letterSpacingVar = getComponentTextCssVar('CheckboxItem', 'text', 'letter-spacing')
    const fontStyleVar = getComponentTextCssVar('CheckboxItem', 'text', 'font-style')
    const textDecorationVar = getComponentTextCssVar('CheckboxItem', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('CheckboxItem', 'text', 'text-transform')

    const getCheckboxPropVar = (prop: string) => `var(${buildComponentCssVarPath('Checkbox', 'properties', prop)})`
    const getCheckboxColorVar = (prop: string) => `var(${buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, prop)})`
    const getCheckboxItemColorVar = (prop: string) => `var(${buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, prop)})`

    const cssVars = {
        '--checkbox-size': getCheckboxPropVar('size'),
        '--checkbox-radius': getCheckboxPropVar('border-radius'),
        '--checkbox-border-width': getCheckboxPropVar('border-size'),
        '--checkbox-icon-size': getCheckboxPropVar('icon-size'),
        '--checkbox-bg-checked': getCheckboxColorVar('background-checked'),
        '--checkbox-border-checked': getCheckboxColorVar('border-checked'),
        '--checkbox-bg-unchecked': getCheckboxColorVar('background-unchecked'),
        '--checkbox-border-unchecked': getCheckboxColorVar('border-unchecked'),
        '--checkbox-bg-indeterminate': getCheckboxColorVar('background-indeterminate'),
        '--checkbox-border-indeterminate': getCheckboxColorVar('border-indeterminate'),
        '--checkbox-icon-color': getCheckboxColorVar('icon-color'),
        '--checkbox-icon-color-indeterminate': getCheckboxColorVar('icon-color-indeterminate'),
        '--checkbox-disabled-bg-checked': getCheckboxColorVar('disabled-background-checked'),
        '--checkbox-disabled-bg-unchecked': getCheckboxColorVar('disabled-background-unchecked'),
        '--checkbox-disabled-bg-indeterminate': getCheckboxColorVar('disabled-background-indeterminate'),
        '--checkbox-disabled-border-checked': getCheckboxColorVar('disabled-border-checked'),
        '--checkbox-disabled-border-unchecked': getCheckboxColorVar('disabled-border-unchecked'),
        '--checkbox-disabled-border-indeterminate': getCheckboxColorVar('disabled-border-indeterminate'),
        '--checkbox-disabled-icon-checked': getCheckboxColorVar('disabled-icon-checked'),
        '--checkbox-disabled-icon-indeterminate': getCheckboxColorVar('disabled-icon-indeterminate'),
        '--checkbox-disabled-opacity': getCheckboxPropVar('disabled-opacity'),
        '--checkbox-item-gap': `var(${labelGapVar})`,
        '--checkbox-item-font-family': `var(${fontFamilyVar})`,
        '--checkbox-item-font-size': `var(${fontSizeVar})`,
        '--checkbox-item-font-weight': `var(${fontWeightVar})`,
        '--checkbox-item-line-height': `var(${lineHeightVar})`,
        '--checkbox-item-letter-spacing': `var(${letterSpacingVar})`,
        '--checkbox-item-font-style': `var(${fontStyleVar})`,
        '--checkbox-item-text-decoration': `var(${textDecorationVar})`,
        '--checkbox-item-text-transform': `var(${textTransformVar})`,
        '--checkbox-item-color': getCheckboxItemColorVar('text'),
        '--checkbox-item-disabled-color': getCheckboxItemColorVar('disabled-text'),
        '--checkbox-item-max-width': `var(${maxWidthVar})`,
    }

    return (
        <Checkbox
            label={label}
            layer={layer}
            className={`${className || ''} recursica-checkbox-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
