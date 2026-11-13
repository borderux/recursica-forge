/**
 * Button Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Button, or forwards props to the real
 * adapter's via useComponent.
 */

import React, { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ButtonProps } from './common/Button'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Button as LocalButton } from './local/dispatch/Button'

// Re-exported so existing `import type { ButtonProps } from '.../adapters/Button'`
// call sites keep working — the types now live in common/Button.ts.
export type { ButtonProps } from './common/Button'

const SharedButton = React.forwardRef<any, ButtonProps>((props, ref) => {
  const Component = useComponent('Button')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} ref={ref} />
    </Suspense>
  )
})

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Button = (isLocalAdapter ? LocalButton : SharedButton) as typeof SharedButton
