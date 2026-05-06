/**
 * Export Selection Modal Component
 * 
 * Allows users to select which JSON files to export (tokens, brand, uikit)
 * and optionally export CSS variables as a stylesheet
 */

import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { Modal } from '../../components/adapters/Modal'
import { Button } from '../../components/adapters/Button'
import { CheckboxItem as Checkbox } from '../../components/adapters/CheckboxItem'
import { SegmentedControl } from '../../components/adapters/SegmentedControl'
import { Dropdown } from '../../components/adapters/Dropdown'
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
  EXPORT_FILENAME_CSS_SPECIFIC,
  EXPORT_FILENAME_CSS_SCOPED,
} from './EXPORT_FILENAMES'

interface ExportSelectionModalProps {
  show: boolean
  onExport: (files: { tokens: boolean; brand: boolean; uikit: boolean; cssSpecific: boolean; cssScoped: boolean }) => void
  onCancel: () => void
  onExportToGithub?: (files: { tokens: boolean; brand: boolean; uikit: boolean; css: boolean }) => void
}

const devTestFilesMap = import.meta.env.DEV ? import.meta.glob('../../components/test-exports/*.json') : {};

function toSentenceCase(filename: string) {
  const base = filename.replace(/\.json$/, '');
  const spaced = base.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function ExportSelectionModal({ show, onExport, onCancel, onExportToGithub }: ExportSelectionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState({
    tokens: false,
    brand: false,
    uikit: false,
    cssSpecific: false,
    cssScoped: false,
  })

  const [mode, setMode] = useState<"files" | "test-files">("files")
  const [selectedTestFile, setSelectedTestFile] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)

  // Initialize selected test file
  useEffect(() => {
    if (import.meta.env.DEV && mode === 'test-files' && selectedTestFile === "") {
      const keys = Object.keys(devTestFilesMap).sort()
      if (keys.length > 0) {
        setSelectedTestFile(keys[0])
      }
    }
  }, [mode, selectedTestFile])

  const handleTestFileDownload = async () => {
    if (!selectedTestFile) return
    setIsDownloading(true)
    try {
      const module = await (devTestFilesMap[selectedTestFile] as () => Promise<any>)()
      const json = module.default || module
      
      const filename = selectedTestFile.split('/').pop() || 'test.json'
      const baseName = filename.replace(/\.json$/, '')
      
      const zip = new JSZip()
      const folder = zip.folder(baseName)
      if (folder) {
        folder.file('recursica_ui-kit.json', JSON.stringify(json, null, 2))
      }
      
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onCancel()
    } catch (err) {
      console.error("Failed to download test file", err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Check if all JSON files are selected
  const allJsonSelected = selectedFiles.tokens && selectedFiles.brand && selectedFiles.uikit
  const someJsonSelected = selectedFiles.tokens || selectedFiles.brand || selectedFiles.uikit
  // Check if all CSS files are selected
  const allCssSelected = selectedFiles.cssSpecific && selectedFiles.cssScoped
  const someCssSelected = selectedFiles.cssSpecific || selectedFiles.cssScoped

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

  const isTestMode = mode === 'test-files'
  const isExportToGithubEnabled = !!onExportToGithub && !isTestMode
  const primaryAction = isExportToGithubEnabled ? handleExportToGithub : (isTestMode ? handleTestFileDownload : handleExport)
  const primaryLabel = isExportToGithubEnabled ? 'Export to GitHub' : 'Download'
  const primaryDisabled = isTestMode ? (!selectedTestFile || isDownloading) : !isAnyFileSelected
  
  const showSecondary = isExportToGithubEnabled
  const secondaryAction = isExportToGithubEnabled ? handleExport : undefined
  const secondaryLabel = isExportToGithubEnabled ? 'Download' : undefined
  const secondaryDisabled = isExportToGithubEnabled ? !isAnyFileSelected : undefined

  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title="Export files"
      showFooter={true}
      primaryActionLabel={primaryLabel}
      onPrimaryAction={primaryAction}
      primaryActionDisabled={primaryDisabled}
      showSecondaryButton={showSecondary}
      secondaryActionLabel={secondaryLabel}
      onSecondaryAction={secondaryAction}
      secondaryActionDisabled={secondaryDisabled}
      scrollable={true}
      layer="layer-3"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {import.meta.env.DEV && (
            <SegmentedControl
              items={[
                { value: 'files', label: 'Files' },
                { value: 'test-files', label: 'Test' }
              ]}
              value={mode}
              onChange={(val) => setMode(val as any)}
              fullWidth
              layer="layer-3"
            />
          )}

          {mode === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* JSON Files Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={allJsonSelected}
                indeterminate={someJsonSelected && !allJsonSelected}
                onChange={handleJsonAllChange}
                label="JSON files"
                layer="layer-3"
              />
              <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Checkbox
                  checked={selectedFiles.tokens}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, tokens: checked })}
                  label="Tokens (color, size, opacity and fonts)"
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.brand}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, brand: checked })}
                  label="Theme (palettes, layers, and dimensions)"
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.uikit}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, uikit: checked })}
                  label="UI kit (components)"
                  layer="layer-3"
                />
              </div>
            </div>

            {/* CSS Variables Group */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--modal-border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox
                checked={allCssSelected}
                indeterminate={someCssSelected && !allCssSelected}
                onChange={handleCssAllChange}
                label="CSS variables"
                layer="layer-3"
              />
              <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Checkbox
                  checked={selectedFiles.cssSpecific}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, cssSpecific: checked })}
                  label="Fully namespaced CSS"
                  layer="layer-3"
                />
                <Checkbox
                  checked={selectedFiles.cssScoped}
                  onChange={(checked) => setSelectedFiles({ ...selectedFiles, cssScoped: checked })}
                  label="Cascading (scoped) CSS"
                  layer="layer-3"
                />
              </div>
            </div>
          </div>
          )}

          {mode === 'test-files' && (
            <div style={{ marginTop: '8px' }}>
              <Dropdown
                label="Component"
                items={Object.keys(devTestFilesMap)
                  .sort()
                  .map((path) => {
                    const filename = path.split('/').pop() || '';
                    return {
                      value: path,
                      label: toSentenceCase(filename),
                    };
                  })}
                value={selectedTestFile}
                onChange={setSelectedTestFile}
                layer="layer-3"
                maxHeight={200}
              />
            </div>
          )}
        </div>
      }
    />
  )
}

