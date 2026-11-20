/**
 * TableTr Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TableTr, or forwards props to the real adapter
 * via useComponent('TableTr').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TableTrProps } from './common/TableTr'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TableTr as LocalTableTr } from './local/dispatch/TableTr'

export type { TableTrProps } from './common/TableTr'

function SharedTableTr(props: TableTrProps) {
  const Component = useComponent('TableTr')
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TableTr = (isLocalAdapter ? LocalTableTr : SharedTableTr) as typeof SharedTableTr
