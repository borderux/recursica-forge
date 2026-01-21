/**
 * Carbon Checkbox Implementation
 * 
 * Carbon Design System-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as CarbonCheckbox } from '@carbon/react'
import type { CheckboxProps as AdapterCheckboxProps } from '../../Checkbox'

export default function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  className,
  style,
  carbon,
  ...props
}: AdapterCheckboxProps) {
  // Carbon Checkbox supports indeterminate via the indeterminate prop
  return (
    <CarbonCheckbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      labelText={typeof label === 'string' ? label : undefined}
      className={className}
      style={style}
      {...carbon}
      {...props}
    >
      {typeof label !== 'string' ? label : undefined}
    </CarbonCheckbox>
  )
}
