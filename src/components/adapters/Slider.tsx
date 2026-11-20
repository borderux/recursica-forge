/**
 * Slider Component Adapter
 *
 * Unified Slider component that renders the appropriate library implementation
 * based on the current UI kit selection.
 *
 * Label/value-label/tooltip rendering is the sole responsibility of each per-kit wrapper. This
 * dispatcher only translates Forge's own `showMinMaxInput` convenience into `showInput` and
 * folds `state="disabled"` into `disabled`, forwarding everything else.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { SliderProps } from './common/Slider'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Slider as LocalSlider } from './local/dispatch/Slider'

// Re-exported so existing `import type { SliderProps } from '.../adapters/Slider'`
// call sites keep working — the types now live in common/Slider.ts.
export type { SliderProps } from './common/Slider'

function SharedSlider({ showInput, showMinMaxInput = false, disabled = false, ...props }: SliderProps) {
  const Component = useComponent('Slider')

  // showMinMaxInput is a master toggle when showInput isn't given explicitly.
  return (
    <Suspense fallback={<span />}>
      <Component
        {...props}
        disabled={disabled || props.state === 'disabled'}
        showInput={showInput ?? showMinMaxInput}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Slider = (isLocalAdapter ? LocalSlider : SharedSlider) as typeof SharedSlider
