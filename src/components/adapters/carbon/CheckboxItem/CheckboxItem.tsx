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

    const cssVars = {
        '--checkbox-size': `var(${sizeVar})`,
        '--checkbox-radius': `var(${borderRadiusVar})`,
        '--checkbox-border-width': `var(${borderWidthVar})`,
        '--checkbox-icon-size': `var(${iconSizeVar})`,
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
            className={`${className || ''} recursica-carbon-checkbox-item`}
            style={{ ...style, ...cssVars }}
            {...props}
        />
    )
}
