/**
 * Tree Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Tree, or forwards props to the real adapter
 * via useComponent('Tree').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TreeProps } from './common/Tree'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Tree as LocalTree } from './local/dispatch/Tree'

// Re-exported so existing `import type { TreeProps } from '.../adapters/Tree'`
// call sites keep working — the types now live in common/Tree.ts.
export type { TreeProps } from './common/Tree'

function SharedTree(props: TreeProps) {
  const Component = useComponent('Tree')
  return (
    <Suspense fallback={<div />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Tree = (isLocalAdapter ? LocalTree : SharedTree) as typeof SharedTree
