/**
 * Export Selection Modal Component
 * 
 * Allows users to select which JSON files to export (tokens, brand, uikit)
 */

import { useState } from 'react'

interface ExportSelectionModalProps {
  show: boolean
  onExport: (files: { tokens: boolean; brand: boolean; uikit: boolean }) => void
  onCancel: () => void
}

export function ExportSelectionModal({ show, onExport, onCancel }: ExportSelectionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState({
    tokens: true,
    brand: true,
    uikit: true,
  })
  
  if (!show) return null
  
  const handleExport = () => {
    // Ensure at least one file is selected
    if (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit) {
      return
    }
    onExport(selectedFiles)
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
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>
          Select Files to Export
        </h2>
        
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          Choose which JSON files you want to export:
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
        </div>
        
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
            onClick={handleExport}
            disabled={!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit) ? '#ccc' : '#0066cc',
              color: 'white',
              cursor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit) ? 'not-allowed' : 'pointer',
            }}
          >
            Export Selected
          </button>
        </div>
      </div>
    </div>
  )
}

