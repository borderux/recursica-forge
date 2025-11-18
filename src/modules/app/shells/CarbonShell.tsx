/**
 * CarbonShell
 *
 * App frame using IBM Carbon components; lazy-loads Carbon and wiring for
 * navigation, reset defaults and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'

export default function CarbonShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const [carbon, setCarbon] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const { handleExport, showSelectionModal, showComplianceModal, complianceIssues, handleSelectionConfirm, handleSelectionCancel, handleAcknowledge, handleCancel } = useJsonExport()
  const { selectedFiles, setSelectedFiles, handleImport, showDirtyModal, filesToImport, handleAcknowledge: handleDirtyAcknowledge, handleCancel: handleDirtyCancel, clearSelectedFiles } = useJsonImport()
  
  const onFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedFiles({})
      setSelectedFileNames([])
      return
    }
    
    // Process files and detect types
    const importFiles = await processUploadedFilesAsync(files)
    
    // Update selected files display
    const fileNames: string[] = []
    if (importFiles.tokens) fileNames.push('tokens.json')
    if (importFiles.brand) fileNames.push('brand.json')
    if (importFiles.uikit) fileNames.push('uikit.json')
    setSelectedFileNames(fileNames)
    
    // Store files for import
    setSelectedFiles(importFiles)
  }
  
  const handleImportClick = () => {
    handleImport(() => {
      // Close modal and clear selection on success
      setIsOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }
  
  const handleDirtyAcknowledgeWithClose = () => {
    handleDirtyAcknowledge(() => {
      setIsOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }

  useEffect(() => {
    let mounted = true
    Promise.all([
      import('@carbon/react'),
      import('@carbon/styles/css/styles.css'),
    ]).then(([c]) => {
      if (mounted) setCarbon(c)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!carbon) return <div style={{ padding: 16 }}>Loading Carbon…</div>

  const { Header, HeaderName, HeaderGlobalBar, Select, SelectItem, Theme, Grid, Column, ComposedModal, ModalHeader, ModalBody, ModalFooter, Button, Toggle } = carbon

  return (
    <Theme theme="g10">
      <Header aria-label="Recursica Theme Forge">
        <HeaderName prefix="">Recursica Theme Forge</HeaderName>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 16 }}>
          <a href="/tokens" style={{ color: 'inherit', textDecoration: 'none' }}>Tokens</a>
          <a href="/palettes" style={{ color: 'inherit', textDecoration: 'none' }}>Palettes</a>
          <a href="/type" style={{ color: 'inherit', textDecoration: 'none' }}>Type</a>
          <a href="/layers" style={{ color: 'inherit', textDecoration: 'none' }}>Layers</a>
          <a href="/uikit" style={{ color: 'inherit', textDecoration: 'none' }}>UI Kit</a>
        </div>
        <HeaderGlobalBar>
          <button onClick={() => { clearOverrides(tokensJson as any); resetAll() }} title="Reset to defaults" style={{ marginRight: 8 }}>↺</button>
          <button onClick={() => downloadCurrentCssVars()} title="Download CSS Variables" style={{ marginRight: 8 }}>⤓</button>
          <button onClick={handleExport} title="Export JSON Files" style={{ marginRight: 8 }}>📥</button>
          <Toggle
            id="theme-mode-toggle"
            labelText={mode === 'dark' ? 'Dark' : 'Light'}
            toggled={mode === 'dark'}
            onToggle={(checked) => setMode(checked ? 'dark' : 'light')}
            style={{ marginRight: 8 }}
          />
          <div style={{ minWidth: 180 }}>
            <Select id="kit-select" labelText=" " hideLabel value={kit} onChange={(e: any) => onKitChange((e.target.value as UiKit) ?? 'mantine')}>
              <SelectItem text="Mantine" value="mantine" />
              <SelectItem text="Material UI" value="material" />
              <SelectItem text="Carbon" value="carbon" />
            </Select>
          </div>
        </HeaderGlobalBar>
      </Header>
      <ComposedModal open={isOpen} onClose={() => { setIsOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }} size="sm">
        <ModalHeader label="Import JSON Files" title="Import JSON Files" />
        <ModalBody hasForm>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Select JSON Files:</label>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(e: any) => {
                  onFileSelect(e.currentTarget.files)
                  e.currentTarget.value = ''
                }}
                style={{ marginBottom: 8 }}
              />
              {selectedFileNames.length > 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  Selected: {selectedFileNames.join(', ')}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
                Upload tokens.json, brand.json, and/or uikit.json files
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => { setIsOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
            Cancel
          </Button>
          <Button kind="primary" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
            Import
          </Button>
        </ModalFooter>
      </ComposedModal>
      <Grid condensed style={{ padding: 16 }}>
        <Column lg={16} md={8} sm={4}>
          {children}
        </Column>
      </Grid>
      <ExportSelectionModalWrapper
        show={showSelectionModal}
        onConfirm={handleSelectionConfirm}
        onCancel={handleSelectionCancel}
      />
      <ExportComplianceModal
        show={showComplianceModal}
        issues={complianceIssues}
        onAcknowledge={handleAcknowledge}
        onCancel={handleCancel}
      />
      <ImportDirtyDataModal
        show={showDirtyModal}
        filesToImport={filesToImport}
        onAcknowledge={handleDirtyAcknowledgeWithClose}
        onCancel={handleDirtyCancel}
      />
    </Theme>
  )
}


