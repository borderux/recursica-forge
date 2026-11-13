/**
 * Chip Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Chip, or forwards props to the real
 * adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ChipProps } from './common/Chip'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Chip as LocalChip } from './local/dispatch/Chip'

// Re-exported so existing `import type { ChipProps } from '.../adapters/Chip'`
// call sites keep working — the types now live in common/Chip.ts.
export type { ChipProps } from './common/Chip'

function SharedChip(props: ChipProps) {
  const Component = useComponent('Chip')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Chip = (isLocalAdapter ? LocalChip : SharedChip) as typeof SharedChip
