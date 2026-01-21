import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../theme/ThemeModeContext'

export type CustomFontModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (fontName: string, fontSource: { type: 'npm' | 'git'; url: string }) => void
}

export function CustomFontModal({
  open,
  onClose,
  onAccept,
}: CustomFontModalProps) {
  const [fontName, setFontName] = useState('')
  const [fontSourceType, setFontSourceType] = useState<'npm' | 'git'>('npm')
  const [npmPackage, setNpmPackage] = useState('')
  const [gitRepo, setGitRepo] = useState('')
  const [fontPath, setFontPath] = useState('')
  const [sourceError, setSourceError] = useState<string>('')
  const { mode } = useThemeMode()

  const handleAccept = () => {
    const trimmedName = fontName.trim()
    if (!trimmedName) {
      return
    }

    let fontSource: { type: 'npm' | 'git'; url: string } | undefined

    if (fontSourceType === 'npm' && npmPackage.trim()) {
      const pkg = npmPackage.trim()
      // Validate npm package format (e.g., @fontsource/inter or fontsource-inter)
      if (!/^(@[\w-]+\/)?[\w-]+/.test(pkg)) {
        setSourceError('Invalid npm package name. Example: @fontsource/inter or fontsource-inter')
        return
      }
      fontSource = { type: 'npm', url: pkg }
    } else if (fontSourceType === 'git' && gitRepo.trim()) {
      const repo = gitRepo.trim()
      const path = fontPath.trim() || 'fonts'
      // Validate git repo URL (supports github.com, gitlab.com, etc.)
      if (!/^https?:\/\/(github|gitlab)\.com\/[\w.-]+\/[\w.-]+/.test(repo)) {
        setSourceError('Invalid git repository URL. Example: https://github.com/user/repo')
        return
      }
      fontSource = { type: 'git', url: `${repo}#${path}` }
    }

    if (!fontSource) {
      setSourceError('Please provide either an npm package name or git repository URL')
      return
    }

    onAccept(trimmedName, fontSource)
    // Reset state
    setFontName('')
    setNpmPackage('')
    setGitRepo('')
    setFontPath('')
    setSourceError('')
    setFontSourceType('npm')
  }

  const handleClose = () => {
    // Reset state on close
    setFontName('')
    setNpmPackage('')
    setGitRepo('')
    setFontPath('')
    setSourceError('')
    setFontSourceType('npm')
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
          background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, #ffffff)`,
          color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, #111111)`,
          border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, rgba(0,0,0,0.1))`,
          borderRadius: 12,
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
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
                border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
                color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`,
                fontSize: 14,
              }}
              autoFocus
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Font Source</span>
            <select
              value={fontSourceType}
              onChange={(e) => {
                setFontSourceType(e.target.value as 'npm' | 'git')
                setSourceError('')
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
                color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <option value="npm">NPM Package</option>
              <option value="git">Git Repository</option>
            </select>
          </label>

          {fontSourceType === 'npm' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                NPM Package Name
              </span>
              <input
                type="text"
                value={npmPackage}
                onChange={(e) => {
                  setNpmPackage(e.target.value)
                  setSourceError('')
                }}
                placeholder="e.g., @fontsource/inter or fontsource-inter"
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                  background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
                  color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`,
                  fontSize: 14,
                }}
              />
              {sourceError && (
                <div style={{ fontSize: 12, color: '#d32f2f', marginTop: -4 }}>
                  {sourceError}
                </div>
              )}
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: -4 }}>
                Enter the npm package name (e.g., @fontsource/inter). The font will be loaded from unpkg.com CDN.
              </div>
            </label>
          )}

          {fontSourceType === 'git' && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Git Repository URL
                </span>
                <input
                  type="text"
                  value={gitRepo}
                  onChange={(e) => {
                    setGitRepo(e.target.value)
                    setSourceError('')
                  }}
                  placeholder="e.g., https://github.com/user/repo"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                    background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`,
                    fontSize: 14,
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Font Path (Optional)
                </span>
                <input
                  type="text"
                  value={fontPath}
                  onChange={(e) => setFontPath(e.target.value)}
                  placeholder="e.g., fonts or dist/fonts"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                    background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`,
                    fontSize: 14,
                  }}
                />
                {sourceError && (
                  <div style={{ fontSize: 12, color: '#d32f2f', marginTop: -4 }}>
                    {sourceError}
                  </div>
                )}
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: -4 }}>
                  Path to font files in the repository (default: fonts). Fonts will be loaded from jsdelivr.com CDN.
                </div>
              </label>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!fontName.trim() || (fontSourceType === 'npm' && !npmPackage.trim()) || (fontSourceType === 'git' && !gitRepo.trim())}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: (fontName.trim() && ((fontSourceType === 'npm' && npmPackage.trim()) || (fontSourceType === 'git' && gitRepo.trim())))
                ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`
                : 'rgba(0,0,0,0.2)',
              color: (fontName.trim() && ((fontSourceType === 'npm' && npmPackage.trim()) || (fontSourceType === 'git' && gitRepo.trim())))
                ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                : 'rgba(0,0,0,0.4)',
              cursor: (fontName.trim() && ((fontSourceType === 'npm' && npmPackage.trim()) || (fontSourceType === 'git' && gitRepo.trim()))) ? 'pointer' : 'not-allowed',
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

