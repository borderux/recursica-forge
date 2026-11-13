/**
 * Autocomplete Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Autocomplete, or forwards props to the real
 * adapter's via useComponent. Like Dropdown but with a typeable input instead of a readonly
 * value.
 *
 * `defaultValue` is converted to a controlled `value` here because the mantine wrapper only
 * reads `value`/`onChange`.
 */

import { Suspense, useState } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { AutocompleteProps } from './common/Autocomplete'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Autocomplete as LocalAutocomplete } from './local/dispatch/Autocomplete'

// Re-exported so existing `import type { AutocompleteItem } from '.../adapters/Autocomplete'`
// call sites keep working — the types now live in common/Autocomplete.ts.
export type { AutocompleteItem, AutocompleteProps } from './common/Autocomplete'

function SharedAutocomplete({
  value,
  defaultValue,
  onChange,
  placeholder = 'Type to search...',
  ...rest
}: AutocompleteProps) {
  const Component = useComponent('Autocomplete')
  const [internalValue, setInternalValue] = useState(defaultValue || '')

  const handleChange = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        {...rest}
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Autocomplete = (isLocalAdapter ? LocalAutocomplete : SharedAutocomplete) as typeof SharedAutocomplete
