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
  
  // Logo SVG
  const LogoIcon = () => (
    <svg width="65" height="44" viewBox="0 0 65 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.73689 0C1.22535 0 0 1.23486 0 2.75813V40.2687C0 41.792 1.22535 43.0269 2.73689 43.0269H61.3063C62.8178 43.0269 64.0431 41.792 64.0431 40.2687V2.75813C64.0431 1.23486 62.8178 0 61.3063 0H2.73689ZM4.10533 38.8628C4.10533 20.1314 18.8106 4.86124 37.2217 4.1372V38.8628H4.10533ZM45.4323 38.8628C42.4092 38.8628 39.9585 36.3931 39.9585 33.3465H45.4323V38.8628ZM59.8947 24.2447H39.9585V4.15383C50.6584 4.836 59.2177 13.4618 59.8947 24.2447ZM59.8674 27.0028C59.2296 33.2132 54.3317 38.1491 48.1692 38.7918V27.0028H59.8674ZM43.5165 27.0297C41.5515 27.0297 39.9585 28.635 39.9585 30.6153H43.5165V27.0297Z" fill={`var(--recursica-brand-${mode}-palettes-palette-1-primary-tone)`}/>
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

  const { Select, SelectItem, Theme, Grid, Column, ComposedModal, ModalHeader, ModalBody, ModalFooter, Toggle } = carbon
  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`

  return (
    <Theme theme="g10">
      <header
        aria-label="Recursica Theme Forge"
        style={{
          backgroundColor: `var(${layer0Base}-surface)`,
          paddingTop: 'var(--recursica-tokens-size-2x)',
          paddingBottom: 'var(--recursica-tokens-size-2x)',
          paddingLeft: 'var(--recursica-tokens-size-3x)',
          paddingRight: 'var(--recursica-tokens-size-3x)',
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo, Brand, and Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-2x)' }}>
          {/* Logo and Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-default)', textDecoration: 'none' }}>
            <LogoIcon />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span
                style={{
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                  fontWeight: 600,
                  fontSize: 'var(--recursica-tokens-size-md)',
                }}
              >
                Recursica
              </span>
              <span
                style={{
                  fontSize: 'var(--recursica-tokens-size-xs)',
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-low-emphasis)`,
                }}
              >
                Theme Forge
              </span>
            </div>
          </Link>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: 'var(--recursica-tokens-size-default)' }}>
            <Button
              variant={currentRoute === 'tokens' ? 'solid' : 'text'}
              onClick={() => navigate('/tokens')}
              size="default"
              layer="layer-0"
            >
              Tokens
            </Button>
            <Button
              variant={currentRoute === 'theme' ? 'solid' : 'text'}
              onClick={() => navigate('/theme')}
              size="default"
              layer="layer-0"
            >
              Theme
            </Button>
            <Button
              variant={currentRoute === 'components' ? 'solid' : 'text'}
              onClick={() => navigate('/components')}
              size="default"
              layer="layer-0"
            >
              Components
            </Button>
          </div>
        </div>

        {/* Action Icons and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-xs)' }}>
          <Button
            variant="outline"
            size="default"
            icon={<ArrowPathIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
            onClick={() => {
              clearOverrides(tokensJson as any)
              resetAll()
            }}
            title="Reset to defaults"
          />
          <Button
            variant="outline"
            size="default"
            icon={<ArrowDownTrayIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
            onClick={() => setIsOpen(true)}
            title="Import / Export CSS Variables"
          />
          <Button
            variant="outline"
            size="default"
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
        </div>
      </header>
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


