/**
 * Export Selection Modal Component
 * 
 * Allows users to select which JSON files to export (tokens, brand, uikit)
 * and optionally export CSS variables as a stylesheet
 */

import { useState } from 'react'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'

interface ExportSelectionModalProps {
  show: boolean
  onExport: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
  onCancel: () => void
  onExportToGithub?: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
}

export function ExportSelectionModal({ show, onExport, onCancel, onExportToGithub }: ExportSelectionModalProps) {
  const { mode } = useThemeMode()
  const [selectedFiles, setSelectedFiles] = useState({
    tokens: true,
    brand: true,
    uikit: true,
    css: false,
  })
  
  if (!show) return null
  
  const handleExport = () => {
    // Ensure at least one file is selected (CSS is independent, so check JSON files)
    if (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) {
      return
    }
    onExport(selectedFiles)
  }

  const handleExportToGithub = () => {
    // Ensure at least one file is selected (CSS is independent, so check JSON files)
    if (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) {
      return
    }
    if (onExportToGithub) {
      onExportToGithub(selectedFiles)
    }
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
          onCancel()
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
          maxWidth: '510px',
          minHeight: '300px',
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>
          Select Files to Export
        </h2>
        
        <p style={{ marginBottom: '20px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)`, fontSize: '14px' }}>
          Choose which files you want to export:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedFiles.tokens}
              onChange={(e) => setSelectedFiles({ ...selectedFiles, tokens: e.target.checked })}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>
              <strong>tokens.json</strong> - Color, size, opacity, and font tokens
            </span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedFiles.brand}
              onChange={(e) => setSelectedFiles({ ...selectedFiles, brand: e.target.checked })}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>
              <strong>brand.json</strong> - Palettes, layers, and theme configurations
            </span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedFiles.uikit}
              onChange={(e) => setSelectedFiles({ ...selectedFiles, uikit: e.target.checked })}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>
              <strong>uikit.json</strong> - UI Kit component styles
            </span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedFiles.css}
              onChange={(e) => setSelectedFiles({ ...selectedFiles, css: e.target.checked })}
              style={{ marginRight: '8px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>
              <strong>recursica-variables.css</strong> - All CSS variables in one stylesheet
            </span>
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
              color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              backgroundColor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) ? '#ccc' : '#0066cc',
              color: 'white',
              cursor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) ? 'not-allowed' : 'pointer',
            }}
          >
            Export Files
          </button>
          {onExportToGithub && (
            <button
              onClick={handleExportToGithub}
              disabled={!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
                backgroundColor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) ? '#ccc' : '#24292e',
                color: 'white',
                cursor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.css) ? 'not-allowed' : 'pointer',
              }}
            >
              Export to GitHub
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

