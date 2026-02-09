/**
 * Material Checkbox Implementation
 * 
 * Material UI-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MaterialCheckbox, FormControlLabel } from '@mui/material'
import type { CheckboxProps as AdapterCheckboxProps } from '../../Checkbox'
import { getComponentCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useCssVar } from '../../../hooks/useCssVar'
import './Checkbox.css'

export default function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  layer = 'layer-0',
  className,
  style,
  material,
  ...props
}: AdapterCheckboxProps) {
  // Checkbox Colors
  const bgCheckedVar = getComponentCssVar('Checkbox', 'colors', 'background-checked', layer)
  const bgUncheckedVar = getComponentCssVar('Checkbox', 'colors', 'background-unchecked', layer)
  const borderCheckedVar = getComponentCssVar('Checkbox', 'colors', 'border-checked', layer)
  const borderUncheckedVar = getComponentCssVar('Checkbox', 'colors', 'border-unchecked', layer)
  const iconColorVar = getComponentCssVar('Checkbox', 'colors', 'icon-color', layer)

  const disabledBgVar = getComponentCssVar('Checkbox', 'colors', 'disabled-background', layer)
  const disabledBorderVar = getComponentCssVar('Checkbox', 'colors', 'disabled-border', layer)
  const disabledIconVar = getComponentCssVar('Checkbox', 'colors', 'disabled-icon', layer)

  // Checkbox Dimensions
  const sizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'size')
  const borderRadiusVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-radius')
  const borderWidthVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-width')
  const iconSizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'icon-size')

  // CSS Variables
  const cssVars = {
    '--checkbox-bg-checked': `var(${bgCheckedVar})`,
    '--checkbox-bg-unchecked': `var(${bgUncheckedVar})`,
    '--checkbox-border-checked': `var(${borderCheckedVar})`,
    '--checkbox-border-unchecked': `var(${borderUncheckedVar})`,
    '--checkbox-icon-color': `var(${iconColorVar})`,
    '--checkbox-disabled-bg': `var(${disabledBgVar})`,
    '--checkbox-disabled-border': `var(${disabledBorderVar})`,
    '--checkbox-disabled-icon': `var(${disabledIconVar})`,
    '--checkbox-size': `var(${sizeVar})`,
    '--checkbox-radius': `var(${borderRadiusVar})`,
    '--checkbox-border-width': `var(${borderWidthVar})`,
    '--checkbox-icon-size': `var(${iconSizeVar})`,
  }

  useCssVar(sizeVar)

  const checkbox = (
    <MaterialCheckbox
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={`${className || ''} recursica-mui-checkbox-root`}
      style={{ ...style, ...cssVars }}
      {...material}
      {...props}
    />
  )

  if (label) {
    return (
      <FormControlLabel
        control={checkbox}
        label={label}
        disabled={disabled}
        className={`${className || ''} recursica-mui-checkbox-label`}
        style={{ ...style, ...cssVars }}
      />
    )
  }

  return checkbox
}
