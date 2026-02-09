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
    const colorVar = getComponentTextCssVar('CheckboxItem', 'text', 'color')

    // Checkbox Overrides from CheckboxItem
    const sizeVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'size')
    const borderRadiusVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'border-radius')
    const borderWidthVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'border-width')
    const iconSizeVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'icon-size')

    // Color Overrides from CheckboxItem - use layer prop
    const bgCheckedVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'background-checked')
    const borderUncheckedVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'border-unchecked')
    const iconColorVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, 'icon-color')
    const disabledOpacityVar = buildComponentCssVarPath('CheckboxItem', 'properties', 'disabled-opacity')

    const cssVars = {
        '--checkbox-size': `var(${sizeVar})`,
        '--checkbox-radius': `var(${borderRadiusVar})`,
        '--checkbox-border-width': `var(${borderWidthVar})`,
        '--checkbox-icon-size': `var(${iconSizeVar})`,
        '--checkbox-bg-checked': `var(${bgCheckedVar})`,
        '--checkbox-border-unchecked': `var(${borderUncheckedVar})`,
        '--checkbox-border-checked': `var(${bgCheckedVar})`,
        '--checkbox-icon-color': `var(${iconColorVar})`,
        '--checkbox-disabled-opacity': `var(${disabledOpacityVar})`,
        '--checkbox-item-gap': `var(${labelGapVar})`,
        '--checkbox-item-font-family': `var(${fontFamilyVar})`,
        '--checkbox-item-font-size': `var(${fontSizeVar})`,
        '--checkbox-item-font-weight': `var(${fontWeightVar})`,
        '--checkbox-item-line-height': `var(${lineHeightVar})`,
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
