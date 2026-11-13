/**
 * Switch Component Adapter
 * 
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SwitchProps } from './common/Switch'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Switch as LocalSwitch } from './local/dispatch/Switch'

// Re-exported so existing `import type { SwitchProps } from '.../adapters/Switch'`
// call sites keep working — the types now live in common/Switch.ts.
export type { SwitchProps } from './common/Switch'

function SharedSwitch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
}: SwitchProps) {
  const Component = useComponent('Switch')

  return (
    <Suspense fallback={<span />}>
      <Component
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        layer={layer}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Switch = (isLocalAdapter ? LocalSwitch : SharedSwitch) as typeof SharedSwitch
