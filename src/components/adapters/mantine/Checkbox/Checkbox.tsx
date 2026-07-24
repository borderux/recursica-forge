/**
 * Mantine Checkbox Implementation
 * 
 * Mantine-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MantineCheckbox } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterCheckboxProps) {
  // Checkbox Colors — now nested under variants.selection-states.<val>[.variants.states.disabled]
  const base = (val: string, prop: string) => buildComponentCssVarPath('Checkbox', 'variants', 'selection-states', val, 'properties', 'colors', layer, prop)
  const dis = (val: string, prop: string) => buildComponentCssVarPath('Checkbox', 'variants', 'selection-states', val, 'variants', 'states', 'disabled', 'properties', 'colors', layer, prop)
  const bgCheckedVar = base('checked', 'background-color')
  const bgUncheckedVar = base('unchecked', 'background-color')
  const bgIndeterminateVar = base('indeterminate', 'background-color')
  const borderCheckedVar = base('checked', 'border-color')
  const borderUncheckedVar = base('unchecked', 'border-color')
  const borderIndeterminateVar = base('indeterminate', 'border-color')
  const iconColorVar = base('checked', 'icon-color')
  const iconColorIndeterminateVar = base('indeterminate', 'icon-color')

  const disabledBgCheckedVar = dis('checked', 'background-color')
  const disabledBgUncheckedVar = dis('unchecked', 'background-color')
  const disabledBgIndeterminateVar = dis('indeterminate', 'background-color')

  const disabledBorderCheckedVar = dis('checked', 'border-color')
  const disabledBorderUncheckedVar = dis('unchecked', 'border-color')
  const disabledBorderIndeterminateVar = dis('indeterminate', 'border-color')

  const disabledIconCheckedVar = dis('checked', 'icon-color')
  const disabledIconIndeterminateVar = dis('indeterminate', 'icon-color')

  const disabledOpacityVar = buildComponentCssVarPath('Checkbox', 'variants', 'selection-states', 'checked', 'variants', 'states', 'disabled', 'properties', 'opacity')

  // Size and spacing
  const sizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'size')
  const borderRadiusVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-radius')
  const borderWidthVar = buildComponentCssVarPath('Checkbox', 'properties', 'border-size')
  const iconSizeVar = buildComponentCssVarPath('Checkbox', 'properties', 'icon-size')

  // CSS Variables object for inline styles
  const cssVars = {
    '--checkbox-bg-checked': `var(${bgCheckedVar})`,
    '--checkbox-bg-unchecked': `var(${bgUncheckedVar})`,
    '--checkbox-bg-indeterminate': `var(${bgIndeterminateVar})`,
    '--checkbox-border-checked': `var(${borderCheckedVar})`,
    '--checkbox-border-unchecked': `var(${borderUncheckedVar})`,
    '--checkbox-border-indeterminate': `var(${borderIndeterminateVar})`,
    '--checkbox-icon-color': `var(${iconColorVar})`,
    '--checkbox-icon-color-indeterminate': `var(${iconColorIndeterminateVar})`,
    '--checkbox-disabled-bg-checked': `var(${disabledBgCheckedVar})`,
    '--checkbox-disabled-bg-unchecked': `var(${disabledBgUncheckedVar})`,
    '--checkbox-disabled-bg-indeterminate': `var(${disabledBgIndeterminateVar})`,
    '--checkbox-disabled-border-checked': `var(${disabledBorderCheckedVar})`,
    '--checkbox-disabled-border-unchecked': `var(${disabledBorderUncheckedVar})`,
    '--checkbox-disabled-border-indeterminate': `var(${disabledBorderIndeterminateVar})`,
    '--checkbox-disabled-icon-checked': `var(${disabledIconCheckedVar})`,
    '--checkbox-disabled-icon-indeterminate': `var(${disabledIconIndeterminateVar})`,
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
