/**
 * Checkbox Component Adapter
 * 
 * Unified Checkbox component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { CheckboxProps } from './common/Checkbox'

// Re-exported so existing `import type { CheckboxProps } from '.../adapters/Checkbox'`
// call sites keep working — the types now live in common/Checkbox.ts.
export type { CheckboxProps } from './common/Checkbox'

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: CheckboxProps) {
  const Component = useComponent('Checkbox')

  return (
    <Suspense fallback={<span />}>
      <Component
        checked={checked}
        indeterminate={indeterminate}
        onChange={onChange}
        disabled={disabled}
        label={label}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
