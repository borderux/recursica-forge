/**
 * TableHeader Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableHeader, or forwards props to the real adapter
 * via useComponent('TableHeader').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableHeaderProps } from './common/TableHeader'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableHeader as LocalTableHeader } from './local/dispatch/TableHeader'

// Re-exported so existing `import type { TableHeaderProps } from '.../adapters/TableHeader'`
// call sites keep working — the types now live in common/TableHeader.ts.
export type { TableHeaderProps } from './common/TableHeader'

function SharedTableHeader(props: TableHeaderProps) {
  const Component = useComponent('TableHeader')
  return (
    <Suspense fallback={<th />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableHeader = (isLocalAdapter ? LocalTableHeader : SharedTableHeader) as typeof SharedTableHeader
