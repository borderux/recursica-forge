/**
 * Material Checkbox Implementation
 * 
 * Material UI-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MaterialCheckbox, FormControlLabel } from '@mui/material'
import type { CheckboxProps as AdapterCheckboxProps } from '../../Checkbox'

export default function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  className,
  style,
  material,
  ...props
}: AdapterCheckboxProps) {
  // Material UI Checkbox supports indeterminate via the indeterminate prop
  // When indeterminate is true, checked should be false
  const checkbox = (
    <MaterialCheckbox
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={className}
      style={style}
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
        className={className}
        style={style}
      />
    )
  }
  
  return checkbox
}
