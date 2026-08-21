/**
 * Switch Component Adapter
 * 
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SwitchProps } from './common/Switch'

// Re-exported so existing `import type { SwitchProps } from '.../adapters/Switch'`
// call sites keep working — the types now live in common/Switch.ts.
export type { SwitchProps } from './common/Switch'

export function Switch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
  elevation,
  className,
  style,
  mantine,
  material,
  carbon,
}: SwitchProps) {
  const Component = useComponent('Switch')

  return (
    <Suspense fallback={<span />}>
      <Component
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        layer={layer}
        colorVariant={colorVariant}
        sizeVariant={sizeVariant}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

