/**
 * Textarea Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Textarea, or forwards props to the real adapter
 * via useComponent('Textarea').
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TextareaProps } from './common/Textarea'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Textarea as LocalTextarea } from './local/dispatch/Textarea'

// Re-exported so existing `import type { TextareaProps } from '.../adapters/Textarea'`
// call sites keep working — the types now live in common/Textarea.ts.
export type { TextareaProps } from './common/Textarea'

function SharedTextarea(props: TextareaProps) {
  const Component = useComponent('Textarea')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Textarea = (isLocalAdapter ? LocalTextarea : SharedTextarea) as typeof SharedTextarea
