/**
 * Material Checkbox Implementation
 * 
 * Material UI-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MaterialCheckbox, FormControlLabel } from '@mui/material'
import type { CheckboxProps as AdapterCheckboxProps } from '../../Checkbox'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
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
  // Checkbox Colors - use the layer prop to get layer-specific colors
  const bgCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-checked')
  const bgUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-unchecked')
  const bgIndeterminateVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-indeterminate')
  const borderCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-checked')
  const borderUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-unchecked')
  const borderIndeterminateVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-indeterminate')
  const iconColorVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'icon-color')
  const disabledBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-background')
  const disabledBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-border')
  const disabledIconVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-icon')
  const disabledOpacityVar = buildComponentCssVarPath('Checkbox', 'properties', 'disabled-opacity')

  // Checkbox Dimensions
  const sizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'size')
  const borderRadiusVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-radius')
  const borderWidthVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-size')
  const iconSizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'icon-size')

  // CSS Variables
  const cssVars = {
    '--checkbox-bg-checked': `var(${bgCheckedVar})`,
    '--checkbox-bg-unchecked': `var(${bgUncheckedVar})`,
    '--checkbox-bg-indeterminate': `var(${bgIndeterminateVar})`,
    '--checkbox-border-checked': `var(${borderCheckedVar})`,
    '--checkbox-border-unchecked': `var(${borderUncheckedVar})`,
    '--checkbox-border-indeterminate': `var(${borderIndeterminateVar})`,
    '--checkbox-icon-color': `var(${iconColorVar})`,
    '--checkbox-disabled-bg': `var(${disabledBgVar})`,
    '--checkbox-disabled-border': `var(${disabledBorderVar})`,
    '--checkbox-disabled-icon': `var(${disabledIconVar})`,
    '--checkbox-disabled-opacity': `var(${disabledOpacityVar})`,
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
      style={{ ...cssVars, ...style }}
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
        style={{ ...cssVars, ...style }}
      />
    )
  }

  return checkbox
}
