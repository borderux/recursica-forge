/**
 * TableTfoot Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableTfoot, or forwards props to the real adapter
 * via useComponent('TableTfoot').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableTfootProps } from './common/TableTfoot'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableTfoot as LocalTableTfoot } from './local/dispatch/TableTfoot'

export type { TableTfootProps } from './common/TableTfoot'

function SharedTableTfoot(props: TableTfootProps) {
  const Component = useComponent('TableTfoot')
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableTfoot = (isLocalAdapter ? LocalTableTfoot : SharedTableTfoot) as typeof SharedTableTfoot
