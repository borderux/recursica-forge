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
        '--checkbox-disabled-bg': getColorVar('disabled-background'),
        '--checkbox-disabled-border': getColorVar('disabled-border'),
        '--checkbox-disabled-icon': getColorVar('disabled-icon'),
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
        '--checkbox-item-color': getColorVar('text'),
        '--checkbox-item-disabled-color': getColorVar('disabled-text'),
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
