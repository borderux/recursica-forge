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
  onExport: (files: { tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean }) => void
  onCancel: () => void
  onExportToGithub?: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
}

export function ExportSelectionModal({ show, onExport, onCancel, onExportToGithub }: ExportSelectionModalProps) {
  const { mode } = useThemeMode()
  const [selectedFiles, setSelectedFiles] = useState({
    tokens: false,
    brand: false,
    uikit: false,
    cssSpecific: false,
    cssScoped: false,
  })
  
  if (!show) return null
  
  // Check if all JSON files are selected
  const allJsonSelected = selectedFiles.tokens && selectedFiles.brand && selectedFiles.uikit
  // Check if all CSS files are selected
  const allCssSelected = selectedFiles.cssSpecific && selectedFiles.cssScoped
  
  const handleJsonAllChange = (checked: boolean) => {
    setSelectedFiles({
      ...selectedFiles,
      tokens: checked,
      brand: checked,
      uikit: checked,
    })
  }
  
  const handleCssAllChange = (checked: boolean) => {
    setSelectedFiles({
      ...selectedFiles,
      cssSpecific: checked,
      cssScoped: checked,
    })
  }
  
  const handleExport = () => {
    // Ensure at least one file is selected
    if (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.cssSpecific && !selectedFiles.cssScoped) {
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
          maxWidth: '600px',
          maxHeight: '90vh',
          minHeight: '300px',
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
        }}>
          Select Files to Export
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {/* JSON Files Group */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={allJsonSelected}
                onChange={(e) => handleJsonAllChange(e.target.checked)}
                style={{ marginRight: '8px', width: '18px', height: '18px' }}
              />
              <span style={{
                fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                fontSize: 'var(--recursica-brand-typography-body-font-size)',
                fontWeight: 'bold',
                lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
              }}>
                JSON Files
              </span>
            </label>
            <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFiles.tokens}
                  onChange={(e) => setSelectedFiles({ ...selectedFiles, tokens: e.target.checked })}
                  style={{ marginRight: '8px', width: '18px', height: '18px' }}
                />
                <span style={{
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                  lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                }}>
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
                <span style={{
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                  lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                }}>
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
                <span style={{
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                  lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                }}>
                  <strong>uikit.json</strong> - UI Kit component styles
                </span>
              </label>
            </div>
          </div>
          
          {/* CSS Variables Group */}
          <div style={{ paddingTop: '12px', borderTop: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)` }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={allCssSelected}
                onChange={(e) => handleCssAllChange(e.target.checked)}
                style={{ marginRight: '8px', width: '18px', height: '18px' }}
              />
              <span style={{
                fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                fontSize: 'var(--recursica-brand-typography-body-font-size)',
                fontWeight: 'bold',
                lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
              }}>
                CSS Variables
              </span>
            </label>
            <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFiles.cssSpecific}
                  onChange={(e) => setSelectedFiles({ ...selectedFiles, cssSpecific: e.target.checked })}
                  style={{ marginRight: '8px', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                  lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                }}>
                  <strong>recursica-variables-specific.css</strong><br />
                  <span style={{ fontSize: '13px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)` }}>
                    All CSS variables with theme and layer embedded in variable names. Example: <code style={{ fontSize: '11px', backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, padding: '1px 3px', borderRadius: '2px' }}>--recursica-ui-kit-components-button-color-layer-0-variant-solid_background</code>.
                  </span>
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFiles.cssScoped}
                  onChange={(e) => setSelectedFiles({ ...selectedFiles, cssScoped: e.target.checked })}
                  style={{ marginRight: '8px', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                  lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                  letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                }}>
                  <strong>recursica-variables-scoped.css</strong><br />
                  <span style={{ fontSize: '13px', color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-low-emphasis)` }}>
                    CSS variables scoped via <code style={{ fontSize: '11px', backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, padding: '1px 3px', borderRadius: '2px' }}>data-recursica-theme</code> and <code style={{ fontSize: '11px', backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, padding: '1px 3px', borderRadius: '2px' }}>data-recursica-layer</code> attributes. Variable names exclude theme/layer. Example: <code style={{ fontSize: '11px', backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, padding: '1px 3px', borderRadius: '2px' }}>--recursica-ui-kit-components-button-color-variant-solid_background</code> (scoped with <code style={{ fontSize: '11px', backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, padding: '1px 3px', borderRadius: '2px' }}>data-recursica-layer="0"</code>).
                  </span>
                </span>
              </label>
            </div>
          </div>
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
            disabled={!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.cssSpecific && !selectedFiles.cssScoped}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`,
              backgroundColor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.cssSpecific && !selectedFiles.cssScoped) ? '#ccc' : '#0066cc',
              color: 'white',
              cursor: (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !selectedFiles.cssSpecific && !selectedFiles.cssScoped) ? 'not-allowed' : 'pointer',
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

