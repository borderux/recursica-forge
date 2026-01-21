/**
 * Carbon Checkbox Implementation
 * 
 * Carbon Design System-specific Checkbox component that uses CSS variables for theming.
 */

import { Checkbox as CarbonCheckbox } from '@carbon/react'
import { useId } from 'react'
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
  const checkboxId = useId()
  // Carbon Checkbox supports indeterminate via the indeterminate prop
  const nonStringLabel = typeof label !== 'string' && label !== undefined && label !== null ? label : null
  
  if (nonStringLabel) {
    return (
      <CarbonCheckbox
        id={checkboxId}
        checked={checked}
        indeterminate={indeterminate}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={className}
        style={style}
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
    className,
    style,
    ...carbon,
    ...props,
  }
  
  if (typeof label === 'string') {
    checkboxProps.labelText = label
  }
  
  return <CarbonCheckbox {...checkboxProps} />
}
