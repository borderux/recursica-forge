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

    // Checkbox props from base Checkbox component
    const sizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-size')
    const iconSizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'icon-size')

    // Color props from base Checkbox component
    const checkedBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-checked')
    const checkedBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-checked')
    const uncheckedBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-unchecked')
    const uncheckedBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-unchecked')
    const indeterminateBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-indeterminate')
    const indeterminateBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-indeterminate')
    const iconColorVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'icon-color')
    const disabledBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-background')
    const disabledBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-border')
    const disabledIconVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-icon')
    const disabledOpacityVar = buildComponentCssVarPath('Checkbox', 'properties', 'disabled-opacity')

    const cssVars = {
        '--checkbox-size': `var(${sizeVar})`,
        '--checkbox-radius': `var(${borderRadiusVar})`,
        '--checkbox-border-width': `var(${borderWidthVar})`,
        '--checkbox-icon-size': `var(${iconSizeVar})`,
        '--checkbox-bg-checked': `var(${checkedBgVar})`,
        '--checkbox-border-checked': `var(${checkedBorderVar})`,
        '--checkbox-bg-unchecked': `var(${uncheckedBgVar})`,
        '--checkbox-border-unchecked': `var(${uncheckedBorderVar})`,
        '--checkbox-bg-indeterminate': `var(${indeterminateBgVar})`,
        '--checkbox-border-indeterminate': `var(${indeterminateBorderVar})`,
        '--checkbox-icon-color': `var(${iconColorVar})`,
        '--checkbox-disabled-bg': `var(${disabledBgVar})`,
        '--checkbox-disabled-border': `var(${disabledBorderVar})`,
        '--checkbox-disabled-icon': `var(${disabledIconVar})`,
        '--checkbox-disabled-opacity': `var(${disabledOpacityVar})`,
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
            className={`${className || ''} recursica-checkbox-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
