/**
 * TableFooter Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableFooter, or forwards props to the real adapter
 * via useComponent('TableFooter').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableFooterProps } from './common/TableFooter'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableFooter as LocalTableFooter } from './local/dispatch/TableFooter'

// Re-exported so existing `import type { TableFooterProps } from '.../adapters/TableFooter'`
// call sites keep working — the types now live in common/TableFooter.ts.
export type { TableFooterProps } from './common/TableFooter'

function SharedTableFooter(props: TableFooterProps) {
  const Component = useComponent('TableFooter')
  return (
    <Suspense fallback={<td />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableFooter = (isLocalAdapter ? LocalTableFooter : SharedTableFooter) as typeof SharedTableFooter
