/**
 * Mantine Checkbox Implementation
 * 
 * Mantine-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MantineCheckbox } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterCheckboxProps) {
  // Checkbox Colors - use the layer prop to get layer-specific colors
  const bgCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-checked')
  const bgUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-unchecked')
  const borderCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-checked')
  const borderUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-unchecked')
  const iconColorVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'icon-color')
  const disabledOpacityVar = buildComponentCssVarPath('Checkbox', 'properties', 'disabled-opacity')

  // Size and spacing
  const sizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'size')
  const borderRadiusVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-radius')
  const borderWidthVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-width')
  const iconSizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'icon-size')

  // CSS Variables object for inline styles
  const cssVars = {
    '--checkbox-bg-checked': `var(${bgCheckedVar})`,
    '--checkbox-bg-unchecked': `var(${bgUncheckedVar})`,
    '--checkbox-border-checked': `var(${borderCheckedVar})`,
    '--checkbox-border-unchecked': `var(${borderUncheckedVar})`,
    '--checkbox-icon-color': `var(${iconColorVar})`,
    '--checkbox-disabled-opacity': `var(${disabledOpacityVar})`,
    '--checkbox-size': `var(${sizeVar})`,
    '--checkbox-radius': `var(${borderRadiusVar})`,
    '--checkbox-border-width': `var(${borderWidthVar})`,
    '--checkbox-icon-size': `var(${iconSizeVar})`,
  }

  // Reactively consume variables (optional but good for dev experience)
  useCssVar(sizeVar)

  return (
    <MantineCheckbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      label={label}
      className={`${className || ''} recursica-checkbox-root`}
      style={{ ...cssVars, ...style }}
      {...mantine}
      {...props}
    />
  )
}
