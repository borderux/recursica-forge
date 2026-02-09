/**
 * Export Selection Modal Component
 * 
 * Allows users to select which JSON files to export (tokens, brand, uikit)
 * and optionally export CSS variables as a stylesheet
 */

import { useState } from 'react'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { Checkbox } from '../../components/adapters/Checkbox'

interface ExportSelectionModalProps {
  show: boolean
  onExport: (files: { tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean }) => void
  onCancel: () => void
  onExportToGithub?: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
}

export function ExportSelectionModal({ show, onExport, onCancel, onExportToGithub }: ExportSelectionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState({
    tokens: false,
    brand: false,
    uikit: false,
    cssSpecific: false,
    cssScoped: false,
  })

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
    const hasCss = selectedFiles.cssSpecific || selectedFiles.cssScoped
    if (!selectedFiles.tokens && !selectedFiles.brand && !selectedFiles.uikit && !hasCss) {
      return
    }
    if (onExportToGithub) {
      onExportToGithub({
        tokens: selectedFiles.tokens,
        brand: selectedFiles.brand,
        uikit: selectedFiles.uikit,
        css: hasCss,
      })
    }
  }

  const isAnyFileSelected = selectedFiles.tokens || selectedFiles.brand || selectedFiles.uikit || selectedFiles.cssSpecific || selectedFiles.cssScoped

  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title="Export files"
      showFooter={false}
      layer="layer-3"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* JSON Files Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={allJsonSelected}
                onChange={handleJsonAllChange}
                label={<span style={{ fontWeight: 'bold' }}>JSON Files</span>}
                layer="layer-3"
              />
              <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Checkbox
                  checked={selectedFiles.tokens}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, tokens: checked })}
                  label={<span><strong>tokens.json</strong> - Color, size, opacity, and font tokens</span>}
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.brand}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, brand: checked })}
                  label={<span><strong>brand.json</strong> - Palettes, layers, and theme configurations</span>}
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.uikit}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, uikit: checked })}
                  label={<span><strong>uikit.json</strong> - UI Kit component styles</span>}
                  layer="layer-3"
                />
              </div>
            </div>

            {/* CSS Variables Group */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--modal-border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={allCssSelected}
                onChange={handleCssAllChange}
                label={<span style={{ fontWeight: 'bold' }}>CSS Variables</span>}
                layer="layer-3"
              />
              <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Checkbox
                  checked={selectedFiles.cssSpecific}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, cssSpecific: checked })}
                  label={
                    <span>
                      <strong>recursica-variables-specific.css</strong><br />
                      <span style={{ fontSize: '13px', opacity: 0.6 }}>
                        All CSS variables with theme and layer embedded in variable names.
                      </span>
                    </span>
                  }
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.cssScoped}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, cssScoped: checked })}
                  label={
                    <span>
                      <strong>recursica-variables-scoped.css</strong><br />
                      <span style={{ fontSize: '13px', opacity: 0.6 }}>
                        CSS variables scoped via data-recursica-theme attributes.
                      </span>
                    </span>
                  }
                  layer="layer-3"
                />
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--modal-border-color)',
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            <Button variant="text" onClick={onCancel}>Cancel</Button>
            <Button variant="solid" onClick={handleExport} disabled={!isAnyFileSelected}>Download</Button>
            {onExportToGithub && (
              <Button
                variant="outline"
                onClick={handleExportToGithub}
                disabled={!isAnyFileSelected}
              >
                Export to GitHub
              </Button>
            )}
          </div>
        </div>
      }
    />
  )
}
