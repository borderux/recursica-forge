/**
 * CarbonShell
 *
 * App frame using IBM Carbon components; lazy-loads Carbon and wiring for
 * navigation, reset defaults and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { Button } from '../../../components/adapters/Button'

export default function CarbonShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const location = useLocation()
  const navigate = useNavigate()
  const [carbon, setCarbon] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const { handleExport, showSelectionModal, showComplianceModal, complianceIssues, handleSelectionConfirm, handleSelectionCancel, handleAcknowledge, handleCancel } = useJsonExport()
  const { selectedFiles, setSelectedFiles, handleImport, showDirtyModal, filesToImport, handleAcknowledge: handleDirtyAcknowledge, handleCancel: handleDirtyCancel, clearSelectedFiles } = useJsonImport()
  
  // Determine current route for navigation highlighting
  const getCurrentRoute = () => {
    if (location.pathname.startsWith('/tokens')) return 'tokens'
    if (location.pathname.startsWith('/theme')) return 'theme'
    if (location.pathname.startsWith('/components')) return 'components'
    return 'tokens'
  }
  const currentRoute = getCurrentRoute()
  
  // Logo placeholder SVG
  const LogoIcon = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#DC2626" rx="4"/>
      <path d="M20 20 L20 10 Q20 8 18 8 L10 8 Q8 8 8 10 L8 18 Q8 20 10 20 L20 20 Z" fill="white" fillOpacity="0.9"/>
      <path d="M20 20 L20 30 Q20 32 22 32 L30 32 Q32 32 32 30 L32 22 Q32 20 30 20 L20 20 Z" fill="white" fillOpacity="0.7"/>
      <path d="M20 20 L10 20 Q8 20 8 22 L8 30 Q8 32 10 32 L18 32 Q20 32 20 30 L20 20 Z" fill="white" fillOpacity="0.5"/>
    </svg>
  )
  
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

  if (!carbon) return <div style={{ padding: 'var(--recursica-tokens-size-2x)' }}>Loading Carbon…</div>

  const { Header, HeaderName, HeaderGlobalBar, Select, SelectItem, Theme, Grid, Column, ComposedModal, ModalHeader, ModalBody, ModalFooter, Toggle } = carbon

  return (
    <Theme theme="g10">
      <Header aria-label="Recursica Theme Forge">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-default)', paddingLeft: 'var(--recursica-tokens-size-2x)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <LogoIcon />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--recursica-tokens-size-md)' }}>
              Recursica
            </Link>
            <span style={{ fontSize: 'var(--recursica-tokens-size-xs)', opacity: 0.7 }}>Theme Forge</span>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 'var(--recursica-tokens-size-0-5x)' }}>
          <Button
            variant={currentRoute === 'tokens' ? 'solid' : 'text'}
            onClick={() => navigate('/tokens')}
            size="default"
          >
            Tokens
          </Button>
          <Button
            variant={currentRoute === 'theme' ? 'solid' : 'text'}
            onClick={() => navigate('/theme')}
            size="default"
          >
            Theme
          </Button>
          <Button
            variant={currentRoute === 'components' ? 'solid' : 'text'}
            onClick={() => navigate('/components')}
            size="default"
          >
            Components
          </Button>
        </div>
        <HeaderGlobalBar>
          <Button
            variant="text"
            size="small"
            icon={<ArrowPathIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
            onClick={() => {
              clearOverrides(tokensJson as any)
              resetAll()
            }}
            title="Reset to defaults"
          />
          <Button
            variant="text"
            size="small"
            icon={<ArrowDownTrayIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
            onClick={() => setIsOpen(true)}
            title="Import / Export CSS Variables"
          />
          <Button
            variant="text"
            size="small"
            icon={<ArrowUpTrayIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
            onClick={handleExport}
            title="Export JSON Files"
          />
          <Toggle
            id="theme-mode-toggle"
            labelText={mode === 'dark' ? 'Dark' : 'Light'}
            toggled={mode === 'dark'}
            onToggle={(checked) => setMode(checked ? 'dark' : 'light')}
            style={{ marginRight: 'var(--recursica-tokens-size-default)' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-tokens-size-1-5x)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--recursica-tokens-size-default)', fontWeight: 'bold' }}>Select JSON Files:</label>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(e: any) => {
                  onFileSelect(e.currentTarget.files)
                  e.currentTarget.value = ''
                }}
                style={{ marginBottom: 'var(--recursica-tokens-size-default)' }}
              />
              {selectedFileNames.length > 0 && (
                <div style={{ fontSize: 'var(--recursica-tokens-size-xs)', color: '#666', marginTop: 'var(--recursica-tokens-size-0-5x)' }}>
                  Selected: {selectedFileNames.join(', ')}
                </div>
              )}
              <div style={{ fontSize: 'var(--recursica-tokens-size-xs)', color: '#888', marginTop: 'var(--recursica-tokens-size-0-5x)' }}>
                Upload tokens.json, brand.json, and/or uikit.json files
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setIsOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
            Import
          </Button>
        </ModalFooter>
      </ComposedModal>
      <Grid condensed style={{ padding: 'var(--recursica-tokens-size-2x)' }}>
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


