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
import { Link } from '../../components/adapters/Link'
import { useCompliance } from '../compliance/ComplianceContext'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'

interface ComplianceModalProps {
  issues: unknown[]
  onAcknowledge: () => void
  onCancel: () => void
}

export function ComplianceModal({ onAcknowledge, onCancel }: ComplianceModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const navigate = useNavigate()
  const { issueCount } = useCompliance()
  const { mode } = useThemeMode()
  const layer3Elements = `--recursica-brand-themes-${mode}-layers-layer-3-elements`

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="WCAG AA Issues"
      primaryActionLabel="Continue"
      onPrimaryAction={onAcknowledge}
      primaryActionDisabled={!acknowledged}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onCancel}
      layer="layer-3"
      size={480}
      scrollable={false}
      content={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: `var(${layer3Elements}-text-color)`,
          opacity: `var(${layer3Elements}-text-high-emphasis)`,
        }}>
          <h4 style={{
            margin: 0,
            fontSize: 'var(--recursica-brand-typography-h4-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h4-font-weight)',
            fontFamily: 'var(--recursica-brand-typography-h4-font-family)',
            letterSpacing: 'var(--recursica-brand-typography-h4-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h4-line-height)',
          }}>
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
          </h4>

          <p style={{
            margin: 0,
            fontSize: 'var(--recursica-brand-typography-body-font-size)',
            fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
            fontFamily: 'var(--recursica-brand-typography-body-font-family)',
            letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-body-line-height)',
          }}>
            Your theme has color combinations that don't meet WCAG AA contrast requirements (4.5:1 ratio).
            You can review and fix them on the Compliance page.
          </p>

          <Link
            onClick={(e) => {
              e.preventDefault()
              onCancel()
              navigate('/theme/compliance')
            }}
            href="#"
          >
            View Compliance Page →
          </Link>

          <div style={{ borderTop: '1px solid var(--modal-border-color, rgba(128,128,128,0.2))', paddingTop: '16px', marginTop: '4px' }}>
            <CheckboxItem
              checked={acknowledged}
              onChange={(checked: boolean) => setAcknowledged(checked)}
              label="Export with compliance issues"
              layer="layer-3"
            />
          </div>
        </div>
      }
    />
  )
}
