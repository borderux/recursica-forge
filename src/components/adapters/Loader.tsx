/**
 * Loader Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Loader, or the real adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LoaderProps } from './common/Loader'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Loader as LocalLoader } from './local/dispatch/Loader'

// Re-exported so existing `import type { LoaderProps } from '.../adapters/Loader'`
// call sites keep working — the types now live in common/Loader.ts.
export type { LoaderProps } from './common/Loader'

function SharedLoader(props: LoaderProps) {
  const Component = useComponent('Loader')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Loader = (isLocalAdapter ? LocalLoader : SharedLoader) as typeof SharedLoader
