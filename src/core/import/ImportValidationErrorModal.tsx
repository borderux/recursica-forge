import { Modal } from '../../components/adapters/Modal'

interface ImportValidationErrorModalProps {
  missingNodes: string[]
  onAcknowledge: () => void
}

export function ImportValidationErrorModal({ missingNodes, onAcknowledge }: ImportValidationErrorModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onAcknowledge}
      title="Import Failed: Missing References"
      style={{ '--modal-title-color': '#d40d0d' } as React.CSSProperties}
      primaryActionLabel="Dismiss"
      onPrimaryAction={onAcknowledge}
      layer="layer-3"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, opacity: 0.7 }}>
            The imported JSON files contain dangling or missing references. The import has been aborted.
            Please fix the following missing nodes before importing:
          </p>

          <ul style={{ 
            margin: '0 0 8px 0', 
            paddingLeft: '20px', 
            maxHeight: '200px', 
            overflowY: 'auto',
            fontSize: '0.85em',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '12px 12px 12px 24px',
            borderRadius: '4px'
          }}>
            {missingNodes.map((node, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {node}
              </li>
            ))}
          </ul>
        </div>
      }
    />
  )
}
