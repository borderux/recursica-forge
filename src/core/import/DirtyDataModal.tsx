/**
 * Dirty Data Warning Modal Component
 * 
 * Warns users that unexported changes will be discarded when importing JSON files.
 */

import { useState } from 'react'

interface DirtyDataModalProps {
  filesToImport: string[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function DirtyDataModal({ filesToImport, onAcknowledge, onCancel }: DirtyDataModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#d40d0d' }}>
          Unexported Changes Detected
        </h2>
        
        <p style={{ marginBottom: '16px', color: '#666' }}>
          You have unexported changes that will be discarded when importing the following files:
        </p>
        
        <ul style={{ marginBottom: '20px', paddingLeft: '20px', color: '#333' }}>
          {filesToImport.map((file, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>
              <strong>{file}</strong>
            </li>
          ))}
        </ul>
        
        <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
          Consider exporting your current changes before importing to avoid losing your work.
        </p>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span style={{ fontSize: '14px' }}>
            I understand that unexported changes will be discarded
          </span>
        </label>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onAcknowledge}
            disabled={!acknowledged}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: acknowledged ? '#d40d0d' : '#ccc',
              color: 'white',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
            }}
          >
            Import Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

