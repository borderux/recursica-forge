/**
 * Table Component Adapter
 *
 * Unified Table component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableProps } from './common/Table'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Table as LocalTable } from './local/dispatch/Table'

// Re-exported so existing `import type { TableProps } from '.../adapters/Table'`
// call sites keep working — the types now live in common/Table.ts.
export type { TableProps } from './common/Table'

function SharedTable(props: TableProps) {
  const Component = useComponent('Table')

  return (
    <Suspense fallback={<div />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Table = (isLocalAdapter ? LocalTable : SharedTable) as typeof SharedTable
