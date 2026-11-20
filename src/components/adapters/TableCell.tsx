/**
 * TableCell Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableCell, or forwards props to the real
 * adapter via useComponent('TableCell').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableCellProps } from './common/TableCell'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableCell as LocalTableCell } from './local/dispatch/TableCell'

// Re-exported so existing `import type { TableCellProps } from '.../adapters/TableCell'`
// call sites keep working — the types now live in common/TableCell.ts.
export type { TableCellProps } from './common/TableCell'

function SharedTableCell(props: TableCellProps) {
  const Component = useComponent('TableCell')
  return (
    <Suspense fallback={props.isHeader ? <th /> : <td />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableCell = (isLocalAdapter ? LocalTableCell : SharedTableCell) as typeof SharedTableCell
