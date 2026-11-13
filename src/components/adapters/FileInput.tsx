/**
 * FileInput Component Adapter
 *
 * Thin dispatcher: renders the local adapter's FileInput, or the real adapter's via
 * useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { FileInputProps } from './common/FileInput'
import { isLocalAdapter } from '../registry/activeAdapter'
import { FileInput as LocalFileInput } from './local/dispatch/FileInput'

// Re-exported so existing `import type { FileInputProps } from '.../adapters/FileInput'`
// call sites keep working — the types now live in common/FileInput.ts.
export type { FileInputProps } from './common/FileInput'

function SharedFileInput({ placeholder = 'Choose file...', ...props }: FileInputProps) {
  const Component = useComponent('FileInput')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} placeholder={placeholder} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const FileInput = (isLocalAdapter ? LocalFileInput : SharedFileInput) as typeof SharedFileInput
