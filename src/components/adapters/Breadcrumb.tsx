/**
 * Breadcrumb Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Breadcrumb, or forwards props to the real
 * adapter's via useComponent. The 5-item cap and separator/home-icon translation live in
 * mantine/Breadcrumb/Breadcrumb.tsx.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BreadcrumbProps } from './common/Breadcrumb'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Breadcrumb as LocalBreadcrumb } from './local/dispatch/Breadcrumb'

// Re-exported so existing `import type { BreadcrumbItem } from '.../adapters/Breadcrumb'`
// call sites keep working — the types now live in common/Breadcrumb.ts.
export type { BreadcrumbItem, BreadcrumbProps } from './common/Breadcrumb'

function SharedBreadcrumb(props: BreadcrumbProps) {
  const Component = useComponent('Breadcrumb')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Breadcrumb = (isLocalAdapter ? LocalBreadcrumb : SharedBreadcrumb) as typeof SharedBreadcrumb
