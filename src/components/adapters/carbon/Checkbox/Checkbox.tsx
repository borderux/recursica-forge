/**
 * Carbon Checkbox Implementation
 * 
 * Carbon Design System-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as CarbonCheckbox } from '@carbon/react'
import { useId } from 'react'
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
  carbon,
  ...props
}: AdapterCheckboxProps) {
  const checkboxId = useId()

  // Checkbox Colors
  const bgCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-checked')
  const bgUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'background-unchecked')
  const borderCheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-checked')
  const borderUncheckedVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'border-unchecked')
  const iconColorVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'icon-color')

  const disabledBgVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-background')
  const disabledBorderVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-border')
  const disabledIconVar = buildComponentCssVarPath('Checkbox', 'properties', 'colors', layer, 'disabled-icon')

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

  // Carbon Checkbox supports indeterminate via the indeterminate prop
  const nonStringLabel = typeof label !== 'string' && label !== undefined && label !== null ? label : null

  if (nonStringLabel) {
    return (
      <CarbonCheckbox
        id={checkboxId}
        labelText=""
        checked={checked}
        indeterminate={indeterminate}
        onChange={(e: any) => onChange(e.target.checked)}
        disabled={disabled}
        className={`${className || ''} recursica-carbon-checkbox`}
        style={{ ...cssVars, ...style }}
        {...carbon}
        {...props}
      >
        {nonStringLabel}
      </CarbonCheckbox>
    )
  }

  const checkboxProps: any = {
    id: checkboxId,
    checked,
    indeterminate,
    onChange: (e: any) => onChange(e.target.checked),
    disabled,
    className: `${className || ''} recursica-carbon-checkbox`,
    style: { ...cssVars, ...style },
    ...carbon,
    ...props,
  }

  if (typeof label === 'string') {
    checkboxProps.labelText = label
  } else if (!label) {
    // Carbon requires labelText. If none provided, passing empty string to avoid warning/error
    // But layout might break if empty label takes space.
    checkboxProps.labelText = ""
    checkboxProps.hideLabel = true
  }

  return <CarbonCheckbox {...checkboxProps} />
}
