/**
 * Breadcrumb Component Adapter
 * 
 * Unified Breadcrumb component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BreadcrumbProps } from './common/Breadcrumb'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Breadcrumb as LocalBreadcrumb } from './local/dispatch/Breadcrumb'

// Re-exported so existing `import type { BreadcrumbItem } from '.../adapters/Breadcrumb'`
// call sites keep working — the types now live in common/Breadcrumb.ts.
export type { BreadcrumbItem, BreadcrumbProps } from './common/Breadcrumb'

function SharedBreadcrumb({
  items,
  separator = 'slash',
  separatorNode,
  showHomeIcon = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
}: BreadcrumbProps) {
  const Component = useComponent('Breadcrumb')

  // Limit to 5 items maximum
  const limitedItems = items.slice(0, 5)

  // Map unified props to library-specific props
  const libraryProps = {
    items: limitedItems,
    separator,
    separatorNode,
    showHomeIcon,
    layer,
    className,
    style,
    mantine,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Breadcrumb = (isLocalAdapter ? LocalBreadcrumb : SharedBreadcrumb) as typeof SharedBreadcrumb
