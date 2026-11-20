/**
 * Toast Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Toast, or forwards props to the real adapter
 * via useComponent('Toast').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ToastProps } from './common/Toast'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Toast as LocalToast } from './local/dispatch/Toast'

// Re-exported so existing `import type { ToastProps } from '.../adapters/Toast'`
// call sites keep working — the types now live in common/Toast.ts.
export type { ToastProps } from './common/Toast'

function SharedToast(props: ToastProps) {
  const Component = useComponent('Toast')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Toast = (isLocalAdapter ? LocalToast : SharedToast) as typeof SharedToast
