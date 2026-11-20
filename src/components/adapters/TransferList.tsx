/**
 * TransferList Component Adapter
 *
 * Thin dispatcher: renders the local adapter's TransferList, or forwards props to the real adapter
 * via useComponent('TransferList').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TransferListProps } from './common/TransferList'
import { isLocalAdapter } from '../registry/activeAdapter'
import { TransferList as LocalTransferList } from './local/dispatch/TransferList'

// Re-exported so existing `import type { TransferListItem } from '.../adapters/TransferList'`
// call sites keep working — the types now live in common/TransferList.ts.
export type { TransferListItem, TransferListData, TransferListProps } from './common/TransferList'

function SharedTransferList(props: TransferListProps) {
  const Component = useComponent('TransferList')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const TransferList = (isLocalAdapter ? LocalTransferList : SharedTransferList) as typeof SharedTransferList
