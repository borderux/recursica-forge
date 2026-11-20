/**
 * TableTbody Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableTbody, or forwards props to the real adapter
 * via useComponent('TableTbody').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableTbodyProps } from './common/TableTbody'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableTbody as LocalTableTbody } from './local/dispatch/TableTbody'

export type { TableTbodyProps } from './common/TableTbody'

function SharedTableTbody(props: TableTbodyProps) {
  const Component = useComponent('TableTbody')
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableTbody = (isLocalAdapter ? LocalTableTbody : SharedTableTbody) as typeof SharedTableTbody
