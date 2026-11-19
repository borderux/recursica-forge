/**
 * TableThead Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableThead, or forwards props to the real adapter
 * via useComponent('TableThead').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableTheadProps } from './common/TableThead'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableThead as LocalTableThead } from './local/dispatch/TableThead'

export type { TableTheadProps } from './common/TableThead'

function SharedTableThead(props: TableTheadProps) {
  const Component = useComponent('TableThead')
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableThead = (isLocalAdapter ? LocalTableThead : SharedTableThead) as typeof SharedTableThead
