/**
 * Dirty Data Warning Modal Component
 * 
 * Warns users that unexported changes will be discarded when importing JSON files.
 */

import { Modal } from '../../components/adapters/Modal'

interface DirtyDataModalProps {
  filesToImport: string[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function DirtyDataModal({ onAcknowledge, onCancel }: DirtyDataModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Unsaved changes"
      primaryActionLabel="Discard changes and import"
      onPrimaryAction={onAcknowledge}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, opacity: 0.7 }}>
            There are currently unexported changes. Importing will discard these changes. Are you sure you want to continue?
          </p>
        </div>
      }
    />
  )
}

