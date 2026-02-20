/**
 * AA Compliance Modal Component
 * 
 * Displays AA compliance issues and requires user acknowledgment
 * before allowing JSON export.
 */

import { useState } from 'react'
import { Modal } from '../../components/adapters/Modal'
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
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="AA Compliance Issues Detected"
      style={{ '--modal-title-color': '#d40d0d' } as React.CSSProperties}
      primaryActionLabel="Continue"
      onPrimaryAction={onAcknowledge}
      primaryActionDisabled={!acknowledged}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size={600}
      scrollable={true}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, opacity: 0.7 }}>
            The following color combinations do not meet WCAG AA contrast requirements (4.5:1 ratio).
            You must acknowledge these deficiencies before exporting.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(groupedIssues).map(([key, groupIssues]) => (
              <div key={key}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: 'inherit',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  fontFamily: 'inherit'
                }}>
                  {groupIssues[0].type.replace(/-/g, ' ')} ({groupIssues[0].mode})
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {groupIssues.map((issue, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      <strong>{issue.location}:</strong> {issue.message}
                      <div style={{ fontSize: '0.85em', opacity: 0.6, marginTop: '2px' }}>
                        Tone: {issue.toneHex} | On-tone: {issue.onToneHex} | Ratio: {issue.contrastRatio.toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--modal-border-color)', paddingTop: '16px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: 'inherit' }}>
                I acknowledge that these color combinations do not meet AA compliance standards
              </span>
            </label>
          </div>
        </div>
      }
    />
  )
}

