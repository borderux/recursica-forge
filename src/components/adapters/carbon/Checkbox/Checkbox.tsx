/**
 * Carbon Checkbox Implementation
 * 
 * Carbon Design System-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as CarbonCheckbox } from '@carbon/react'
import { useId } from 'react'
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
  carbon,
  ...props
}: AdapterCheckboxProps) {
  const checkboxId = useId()

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
        style={{ ...style, ...cssVars }}
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
    style: { ...style, ...cssVars },
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
