import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../theme/ThemeModeContext'

export type CustomFontModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (fontName: string, fontFile?: File) => void
}

const ALLOWED_FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2', '.eot']

export function CustomFontModal({
  open,
  onClose,
  onAccept,
}: CustomFontModalProps) {
  const [fontName, setFontName] = useState('')
  const [fontFile, setFontFile] = useState<File | null>(null)
  const [fontFileError, setFontFileError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mode } = useThemeMode()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFontFile(null)
      setFontFileError('')
      return
    }

    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_FONT_EXTENSIONS.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      setFontFileError(`Invalid file type. Allowed: ${ALLOWED_FONT_EXTENSIONS.join(', ')}`)
      setFontFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setFontFileError('')
    setFontFile(file)
  }

  const handleAccept = () => {
    const trimmedName = fontName.trim()
    if (!trimmedName) {
      return
    }
    onAccept(trimmedName, fontFile || undefined)
    // Reset state
    setFontName('')
    setFontFile(null)
    setFontFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    // Reset state on close
    setFontName('')
    setFontFile(null)
    setFontFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: `var(--recursica-brand-${mode}-layer-layer-2-property-surface, #ffffff)`,
          color: `var(--recursica-brand-${mode}-layer-layer-2-property-element-text-color, #111111)`,
          border: `1px solid var(--recursica-brand-${mode}-layer-layer-2-property-border-color, rgba(0,0,0,0.1))`,
          borderRadius: 12,
          boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-2-x-axis) var(--recursica-brand-${mode}-elevations-elevation-2-y-axis) var(--recursica-brand-${mode}-elevations-elevation-2-blur) var(--recursica-brand-${mode}-elevations-elevation-2-spread) var(--recursica-brand-${mode}-elevations-elevation-2-shadow-color)`,
          padding: 20,
          display: 'grid',
          gap: 16,
          width: 400,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add Custom Font</div>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Font Name</span>
            <input
              type="text"
              value={fontName}
              onChange={(e) => setFontName(e.target.value)}
              placeholder="e.g., My Custom Font"
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`,
                background: `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`,
                color: `var(--recursica-brand-${mode}-layer-layer-1-property-element-text-color)`,
                fontSize: 14,
              }}
              autoFocus
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Font File (Optional)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FONT_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`,
                background: `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`,
                color: `var(--recursica-brand-${mode}-layer-layer-1-property-element-text-color)`,
                fontSize: 14,
                cursor: 'pointer',
              }}
            />
            {fontFile && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: -4 }}>
                Selected: {fontFile.name}
              </div>
            )}
            {fontFileError && (
              <div style={{ fontSize: 12, color: '#d32f2f', marginTop: -4 }}>
                {fontFileError}
              </div>
            )}
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: -4 }}>
              Supported formats: {ALLOWED_FONT_EXTENSIONS.join(', ')}
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!fontName.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: fontName.trim()
                ? `var(--recursica-brand-${mode}-layer-layer-1-property-element-text-color)`
                : 'rgba(0,0,0,0.2)',
              color: fontName.trim()
                ? `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`
                : 'rgba(0,0,0,0.4)',
              cursor: fontName.trim() ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Add Font
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

