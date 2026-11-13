/**
 * FileUpload Component Adapter
 *
 * Thin dispatcher: renders the local adapter's FileUpload, or the real adapter's via
 * useComponent.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { FileUploadProps } from './common/FileUpload'
import { isLocalAdapter } from '../registry/activeAdapter'
import { FileUpload as LocalFileUpload } from './local/dispatch/FileUpload'

// Re-exported so existing `import type { FileUploadItem, FileUploadProps } from '.../adapters/FileUpload'`
// call sites keep working — the types now live in common/FileUpload.ts.
export type { FileUploadItem, FileUploadProps } from './common/FileUpload'

function SharedFileUpload(props: FileUploadProps) {
  const Component = useComponent('FileUpload')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const FileUpload = (isLocalAdapter ? LocalFileUpload : SharedFileUpload) as typeof SharedFileUpload
