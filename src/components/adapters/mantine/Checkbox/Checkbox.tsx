/**
 * Mantine Checkbox Implementation
 * 
 * Mantine-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as MantineCheckbox } from '@mantine/core'
import type { CheckboxProps as AdapterCheckboxProps } from '../../Checkbox'

export default function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  className,
  style,
  mantine,
  ...props
}: AdapterCheckboxProps) {
  // Mantine Checkbox supports indeterminate via the indeterminate prop
  return (
    <MantineCheckbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.currentTarget.checked)}
      disabled={disabled}
      label={label}
      className={className}
      style={style}
      {...mantine}
      {...props}
    />
  )
}
