/**
 * Validation Error Modal Component
 * 
 * Displays validation errors for JSON and CSS files before export.
 */

import { Modal } from '../../components/adapters/Modal'
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
  EXPORT_FILENAME_CSS_SPECIFIC,
  EXPORT_FILENAME_CSS_SCOPED,
} from './EXPORT_FILENAMES'

export interface ValidationError {
  file: 'tokens' | 'brand' | 'uikit' | 'css-specific' | 'css-scoped'
  message: string
}

interface ValidationErrorModalProps {
  show: boolean
  errors: ValidationError[]
  onClose: () => void
}

export function ValidationErrorModal({ show, errors, onClose }: ValidationErrorModalProps) {
  if (!show || errors.length === 0) return null

  // Group errors by file type
  const errorsByFile = errors.reduce((acc, error) => {
    if (!acc[error.file]) {
      acc[error.file] = []
    }
    acc[error.file].push(error)
    return acc
  }, {} as Record<string, ValidationError[]>)

  const fileLabels: Record<string, string> = {
    'tokens': EXPORT_FILENAME_TOKENS,
    'brand': EXPORT_FILENAME_BRAND,
    'uikit': EXPORT_FILENAME_UIKIT,
    'css-specific': EXPORT_FILENAME_CSS_SPECIFIC,
    'css-scoped': EXPORT_FILENAME_CSS_SCOPED,
  }

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title="Validation Errors"
      style={{ '--modal-title-color': '#d32f2f' } as React.CSSProperties}
      primaryActionLabel="Close"
      onPrimaryAction={onClose}
      showSecondaryButton={false}
      layer="layer-3"
      size="md"
      scrollable={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, opacity: 0.7 }}>
          The following validation errors were found. Please fix these issues before exporting:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(errorsByFile).map(([file, fileErrors]) => (
            <div key={file}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                {fileLabels[file] || file}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {fileErrors.map((error, idx) => (
                  <li key={idx} style={{ marginBottom: '4px', fontSize: '13px' }}>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
