/**
 * Modal Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Modal, or the real adapter's via useComponent.
 * Keeps the Forge defaults that change what the real adapter renders: `layer` (layer-1,
 * applied as a LayerScope by useComponent), the footer button labels, and `centered`
 * (Mantine defaults to false).
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ModalProps } from './common/Modal'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Modal as LocalModal } from './local/dispatch/Modal'

// Re-exported so existing `import type { ModalProps } from '.../adapters/Modal'`
// call sites keep working — the types now live in common/Modal.ts.
export type { ModalProps } from './common/Modal'

function SharedModal({
  layer = 'layer-1',
  primaryActionLabel = 'Save',
  secondaryActionLabel = 'Cancel',
  centered = true,
  ...props
}: ModalProps) {
  const Component = useComponent('Modal')
  return (
    <Suspense fallback={null}>
      <Component
        {...props}
        layer={layer}
        primaryActionLabel={primaryActionLabel}
        secondaryActionLabel={secondaryActionLabel}
        centered={centered}
      />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Modal = (isLocalAdapter ? LocalModal : SharedModal) as typeof SharedModal
