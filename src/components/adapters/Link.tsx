/**
 * Link Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Link, or the real adapter's via useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { LinkProps } from './common/Link'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Link as LocalLink } from './local/dispatch/Link'

// Re-exported so existing `import type { LinkProps } from '.../adapters/Link'`
// call sites keep working — the types now live in common/Link.ts.
export type { LinkProps } from './common/Link'

function SharedLink(props: LinkProps) {
  const Component = useComponent('Link')
  return (
    <Suspense fallback={<a href={props.href}>Loading...</a>}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Link = (isLocalAdapter ? LocalLink : SharedLink) as typeof SharedLink
