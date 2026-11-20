/**
 * AssistiveElement Component Adapter
 *
 * Thin dispatcher: renders the local adapter's AssistiveElement, or forwards props to the
 * real adapter's via useComponent. Used for help text and error text in forms.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { AssistiveElementProps } from './common/AssistiveElement'
import { isLocalAdapter } from '../registry/activeAdapter'
import { AssistiveElement as LocalAssistiveElement } from './local/dispatch/AssistiveElement'

// Re-exported so existing `import type { AssistiveElementProps } from '.../adapters/AssistiveElement'`
// call sites keep working — the types now live in common/AssistiveElement.ts.
export type { AssistiveElementProps } from './common/AssistiveElement'

function SharedAssistiveElement(props: AssistiveElementProps) {
  const Component = useComponent('AssistiveElement')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const AssistiveElement = (isLocalAdapter ? LocalAssistiveElement : SharedAssistiveElement) as typeof SharedAssistiveElement
