/**
 * AA Compliance Modal Component
 * 
 * Displays AA compliance issues and requires user acknowledgment
 * before allowing JSON export.
 */

import { useState } from 'react'
import type { ComplianceIssue } from './aaComplianceCheck'

interface ComplianceModalProps {
  issues: ComplianceIssue[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function ComplianceModal({ issues, onAcknowledge, onCancel }: ComplianceModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  
  const groupedIssues = issues.reduce((acc, issue) => {
    const key = `${issue.type}-${issue.mode}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(issue)
    return acc
  }, {} as Record<string, ComplianceIssue[]>)
  
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
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#d40d0d' }}>
          AA Compliance Issues Detected
        </h2>
        
        <p style={{ marginBottom: '16px', color: '#666' }}>
          The following color combinations do not meet WCAG AA contrast requirements (4.5:1 ratio).
          You must acknowledge these deficiencies before exporting.
        </p>
        
        <div style={{ marginBottom: '20px', maxHeight: '400px', overflow: 'auto' }}>
          {Object.entries(groupedIssues).map(([key, groupIssues]) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {groupIssues[0].type.replace(/-/g, ' ')} ({groupIssues[0].mode})
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {groupIssues.map((issue, idx) => (
                  <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>
                    <strong>{issue.location}:</strong> {issue.message}
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      Tone: {issue.toneHex} | On-tone: {issue.onToneHex} | Ratio: {issue.contrastRatio.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span style={{ fontSize: '14px' }}>
            I acknowledge that these color combinations do not meet AA compliance standards
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
            Acknowledge & Export
          </button>
        </div>
      </div>
    </div>
  )
}

