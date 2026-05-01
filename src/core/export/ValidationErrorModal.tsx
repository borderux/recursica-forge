/**
 * Validation Error Modal Component
 *
 * Displays validation errors for JSON and CSS files before export.
 * Users cannot fix these errors manually — they should file a bug report.
 */

import { Modal } from '../../components/adapters/Modal'
import { createBugReport } from '../../modules/app/utils/bugReport'
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
  EXPORT_FILENAME_CSS_SPECIFIC,
  EXPORT_FILENAME_CSS_SCOPED,
} from './EXPORT_FILENAMES'

export interface ValidationError {
  file: 'tokens' | 'brand' | 'uikit' | 'css-specific' | 'css-scoped' | 'references'
  message: string
}

interface ValidationErrorModalProps {
  show: boolean
  errors: ValidationError[]
  onClose: () => void
}

/**
 * Parse a raw validation error message string into individual bullet lines.
 *
 * The validator throws a single string like:
 *   "Validation failed (N invalid item(s)). DTCG: …\n  path1: ref → error\n  path2: ref → error"
 *
 * This function returns the summary line plus each indented detail as separate items.
 */
function parseErrorLines(message: string): string[] {
  const lines = message.split('\n').map(l => l.trim()).filter(Boolean)
  return lines
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
    'references': 'Cross-file References',
  }

  // Build a plain-text summary of all errors for the GitHub issue body
  const bugReportBody = Object.entries(errorsByFile)
    .map(([file, fileErrors]) => {
      const label = fileLabels[file] || file
      const lines = fileErrors.flatMap(e => parseErrorLines(e.message))
      return [`**${label}**`, ...lines.map(l => `- ${l}`)].join('\n')
    })
    .join('\n\n')

  const handleFileBug = () => {
    createBugReport(bugReportBody)
    onClose()
  }

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title="Validation Errors"
      style={{ '--modal-title-color': '#d32f2f' } as React.CSSProperties}
      primaryActionLabel="File Bug"
      onPrimaryAction={handleFileBug}
      showSecondaryButton={true}
      secondaryActionLabel="Close"
      onSecondaryAction={onClose}
      layer="layer-3"
      size="md"
      scrollable={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, opacity: 0.7 }}>
          The following validation errors were detected. These are internal issues that cannot be fixed manually — please file a bug report so the team can investigate.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(errorsByFile).map(([file, fileErrors]) => (
            <div key={file}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                {fileLabels[file] || file}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {fileErrors.flatMap((error, errorIdx) =>
                  parseErrorLines(error.message).map((line, lineIdx) => (
                    <li
                      key={`${errorIdx}-${lineIdx}`}
                      style={{ fontSize: '13px', lineHeight: '1.5' }}
                    >
                      {line}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
