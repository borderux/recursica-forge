/**
 * Pagination Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Pagination, or the real adapter's via
 * useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { PaginationProps } from './common/Pagination'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Pagination as LocalPagination } from './local/dispatch/Pagination'

// Re-exported so existing `import type { PaginationProps } from '.../adapters/Pagination'`
// call sites keep working — the types now live in common/Pagination.ts.
export type { PaginationProps } from './common/Pagination'

function SharedPagination(props: PaginationProps) {
  const Component = useComponent('Pagination')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Pagination = (isLocalAdapter ? LocalPagination : SharedPagination) as typeof SharedPagination
