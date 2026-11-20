/**
 * Dropdown Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Dropdown, or the real adapter's via
 * useComponent. The mantine wrapper only reads a controlled `value`, so uncontrolled usage
 * (`defaultValue`) is resolved into `value` here.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { DropdownProps } from './common/Dropdown'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Dropdown as LocalDropdown } from './local/dispatch/Dropdown'

// Re-exported so existing `import type { DropdownItem } from '.../adapters/Dropdown'`
// call sites keep working — the types now live in common/Dropdown.ts.
export type { DropdownItem, DropdownProps } from './common/Dropdown'

function SharedDropdown({
  value,
  defaultValue,
  onChange,
  placeholder = 'Select option...',
  ...props
}: DropdownProps) {
  const Component = useComponent('Dropdown')
  const [internalValue, setInternalValue] = useState(defaultValue || '')

  const handleChange = (newValue: string) => {
    if (value === undefined) setInternalValue(newValue)
    onChange?.(newValue)
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        {...props}
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Dropdown = (isLocalAdapter ? LocalDropdown : SharedDropdown) as typeof SharedDropdown
