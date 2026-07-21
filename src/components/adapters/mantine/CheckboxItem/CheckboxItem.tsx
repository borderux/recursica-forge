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

    const getCheckboxItemColorVar = (prop: string) => `var(${buildComponentCssVarPath('CheckboxItem', 'properties', 'colors', layer, prop)})`

    // NOTE: the checkbox box's own size/color vars are set by the base Checkbox
    // adapter (from the current variants.selection-states.* JSON structure). We must
    // NOT re-specify them here — the old flat paths no longer exist and would
    // override the correct values with empty vars. Only item-level vars belong here.
    const cssVars = {
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
