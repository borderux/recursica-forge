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

    // Checkbox Overrides from CheckboxItem
    const sizeVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'border-width')
    const iconSizeVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'icon-size')

    // Color Overrides - selected, unselected, indeterminate
    const selectedBgVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'selected-background')
    const selectedBorderVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'selected-border')
    const unselectedBgVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'unselected-background')
    const unselectedBorderVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'unselected-border')
    const indeterminateBgVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'indeterminate-background')
    const indeterminateBorderVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'indeterminate-border')
    const iconColorVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'icon-color')
    const disabledOpacityVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'disabled-opacity')

    const cssVars = {
        '--checkbox-size': `var(${sizeVar})`,
        '--checkbox-radius': `var(${borderRadiusVar})`,
        '--checkbox-border-width': `var(${borderWidthVar})`,
        '--checkbox-icon-size': `var(${iconSizeVar})`,
        '--checkbox-bg-checked': `var(${selectedBgVar})`,
        '--checkbox-border-checked': `var(${selectedBorderVar})`,
        '--checkbox-bg-unchecked': `var(${unselectedBgVar})`,
        '--checkbox-border-unchecked': `var(${unselectedBorderVar})`,
        '--checkbox-bg-indeterminate': `var(${indeterminateBgVar})`,
        '--checkbox-border-indeterminate': `var(${indeterminateBorderVar})`,
        '--checkbox-icon-color': `var(${iconColorVar})`,
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
