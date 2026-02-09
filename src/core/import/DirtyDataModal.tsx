/**
 * Dirty Data Warning Modal Component
 * 
 * Warns users that unexported changes will be discarded when importing JSON files.
 */

import { useState } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Checkbox } from '../../components/adapters/Checkbox'

interface DirtyDataModalProps {
  filesToImport: string[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function DirtyDataModal({ filesToImport, onAcknowledge, onCancel }: DirtyDataModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Unexported Changes Detected"
      style={{ '--modal-title-color': '#d40d0d' } as React.CSSProperties}
      primaryActionLabel="Import Anyway"
      onPrimaryAction={onAcknowledge}
      primaryActionDisabled={!acknowledged}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, opacity: 0.7 }}>
            You have unexported changes that will be discarded when importing the following files:
          </p>

          <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
            {filesToImport.map((file, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                <strong>{file}</strong>
              </li>
            ))}
          </ul>

          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9em' }}>
            Consider exporting your current changes before importing to avoid losing your work.
          </p>

          <div style={{ borderTop: '1px solid var(--modal-border-color)', paddingTop: '16px', marginTop: '8px' }}>
            <Checkbox
              checked={acknowledged}
              onChange={setAcknowledged}
              label={
                <span style={{ fontSize: '14px' }}>
                  I understand that unexported changes will be discarded
                </span>
              }
              layer="layer-3"
            />
          </div>
        </div>
      }
    />
  )
}
