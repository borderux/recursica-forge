/**
 * Breadcrumb Component Adapter
 * 
 * Unified Breadcrumb component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { BreadcrumbProps } from './common/Breadcrumb'

// Re-exported so existing `import type { BreadcrumbItem } from '.../adapters/Breadcrumb'`
// call sites keep working — the types now live in common/Breadcrumb.ts.
export type { BreadcrumbItem, BreadcrumbProps } from './common/Breadcrumb'

export function Breadcrumb({
  items,
  separator = 'slash',
  showHomeIcon = false,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: BreadcrumbProps) {
  const Component = useComponent('Breadcrumb')

  // Limit to 5 items maximum
  const limitedItems = items.slice(0, 5)

  // Map unified props to library-specific props
  const libraryProps = {
    items: limitedItems,
    separator,
    showHomeIcon,
    layer,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps} />
    </Suspense>
  )
}

