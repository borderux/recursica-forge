/**
 * AA Compliance Modal Component
 * 
 * Simplified acknowledgment modal — shows issue count and links
 * to the Compliance page for details. Requires checkbox before export.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/adapters/Modal'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import type { ComplianceIssue } from './aaComplianceCheck'

interface ComplianceModalProps {
  issues: ComplianceIssue[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function ComplianceModal({ issues, onAcknowledge, onCancel }: ComplianceModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const navigate = useNavigate()

  const lightCount = issues.filter(i => i.mode === 'light').length
  const darkCount = issues.filter(i => i.mode === 'dark').length

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="WCAG AA Issues"
      style={{ '--modal-title-color': '#d40d0d' } as React.CSSProperties}
      primaryActionLabel="Continue"
      onPrimaryAction={onAcknowledge}
      primaryActionDisabled={!acknowledged}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size={480}
      scrollable={false}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(212, 13, 13, 0.08)',
            border: '1px solid rgba(212, 13, 13, 0.2)',
          }}>
            <span style={{ fontSize: '28px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.05em' }}>
                {issues.length} compliance issue{issues.length !== 1 ? 's' : ''} found
              </div>
              <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: '2px' }}>
                {lightCount > 0 && `${lightCount} in light mode`}
                {lightCount > 0 && darkCount > 0 && ' · '}
                {darkCount > 0 && `${darkCount} in dark mode`}
              </div>
            </div>
          </div>

          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9em' }}>
            Your theme has color combinations that don't meet WCAG AA contrast requirements (4.5:1 ratio).
            You can review and fix them on the Compliance page.
          </p>

          <button
            onClick={() => {
              onCancel()
              navigate('/theme/compliance')
            }}
            style={{
              background: 'none',
              border: '1px solid currentColor',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.8,
              fontSize: '0.9em',
              textAlign: 'center',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            View Compliance Page →
          </button>

          <div style={{ borderTop: '1px solid var(--modal-border-color, rgba(128,128,128,0.2))', paddingTop: '16px', marginTop: '4px' }}>
            <CheckboxItem
              checked={acknowledged}
              onChange={(checked: boolean) => setAcknowledged(checked)}
              label="I acknowledge these issues and wish to proceed with export"
              layer="layer-3"
            />
          </div>
        </div>
      }
    />
  )
}
