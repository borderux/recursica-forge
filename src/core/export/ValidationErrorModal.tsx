/**
 * Validation Error Modal Component
 * 
 * Displays validation errors for JSON and CSS files before export.
 */

import { useThemeMode } from '../../modules/theme/ThemeModeContext'

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
  const { mode } = useThemeMode()
  
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
    'tokens': 'tokens.json',
    'brand': 'brand.json',
    'uikit': 'uikit.json',
    'css-specific': 'recursica-variables-specific.css',
    'css-scoped': 'recursica-variables-scoped.css',
  }
  
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
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
          border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
          borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
          padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding)`,
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          color: '#d32f2f',
        }}>
          Validation Errors
        </h2>
        
        <p style={{
          marginBottom: '20px',
          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)`,
          fontFamily: 'var(--recursica-brand-typography-body-font-family)',
          fontSize: 'var(--recursica-brand-typography-body-font-size)',
          fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
          lineHeight: 'var(--recursica-brand-typography-body-line-height)',
          letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
        }}>
          The following validation errors were found. Please fix these issues before exporting:
        </p>
        
        <div style={{ marginBottom: '20px', maxHeight: '400px', overflow: 'auto' }}>
          {Object.entries(errorsByFile).map(([file, fileErrors]) => (
            <div key={file} style={{ marginBottom: '16px' }}>
              <h3 style={{
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
              }}>
                {fileLabels[file] || file}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {fileErrors.map((error, idx) => (
                  <li key={idx} style={{
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                  }}>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              backgroundColor: '#0066cc',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
