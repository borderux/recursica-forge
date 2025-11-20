/**
 * MantineShell
 *
 * App frame using Mantine components; provides navigation, reset defaults,
 * and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState } from 'react'
import { AppShell, Group, Select, MantineProvider, Modal, Switch } from '@mantine/core'
import '@mantine/core/styles.css'
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { extractCssVarsFromObject, applyCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { Button } from '../../../components/adapters/Button'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const { handleExport, showSelectionModal, showComplianceModal, complianceIssues, handleSelectionConfirm, handleSelectionCancel, handleAcknowledge, handleCancel } = useJsonExport()
  const { selectedFiles, setSelectedFiles, handleImport, showDirtyModal, filesToImport, handleAcknowledge: handleDirtyAcknowledge, handleCancel: handleDirtyCancel, clearSelectedFiles } = useJsonImport()
  const location = useLocation()
  const navigate = useNavigate()
  
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
      setIsModalOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }
  
  const handleDirtyAcknowledgeWithClose = () => {
    handleDirtyAcknowledge(() => {
      setIsModalOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }
  return (
    <MantineProvider>
      <AppShell header={{ height: 56 }} padding="md">
        <AppShell.Header>
          <Group h="100%" px="var(--recursica-tokens-size-2x)" justify="space-between" wrap="nowrap">
            {/* Logo and Brand */}
            <Group gap="var(--recursica-tokens-size-default)" wrap="nowrap">
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <LogoIcon />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--recursica-tokens-size-md)' }}>
                  Recursica
                </Link>
                <span style={{ fontSize: 'var(--recursica-tokens-size-xs)', opacity: 0.7 }}>Theme Forge</span>
              </div>
            </Group>

            {/* Navigation Buttons */}
            <Group gap="var(--recursica-tokens-size-0-5x)" wrap="nowrap">
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
            </Group>

            {/* Action Icons and Controls */}
            <Group gap="var(--recursica-tokens-size-xs)" wrap="nowrap">
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
                onClick={() => setIsModalOpen(true)}
                title="Import / Export CSS Variables"
              />
              <Button
                variant="text"
                size="small"
                icon={<ArrowUpTrayIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
                onClick={handleExport}
                title="Export JSON Files"
              />
              <Switch
                checked={mode === 'dark'}
                onChange={(e) => setMode(e.currentTarget.checked ? 'dark' : 'light')}
                size="sm"
                styles={{
                  track: {
                    backgroundColor: mode === 'dark' ? 'var(--recursica-brand-light-palettes-core-interactive)' : 'var(--recursica-brand-light-layer-layer-1-property-border-color)',
                  },
                }}
              />
              <Select
                value={kit}
                onChange={(v) => onKitChange((v as UiKit) ?? 'mantine')}
                data={[
                  { label: 'Mantine', value: 'mantine' },
                  { label: 'Material UI', value: 'material' },
                  { label: 'Carbon', value: 'carbon' },
                ]}
                allowDeselect={false}
                w={180}
                styles={{
                  input: {
                    backgroundColor: 'var(--recursica-brand-light-layer-layer-0-property-surface)',
                    borderColor: 'var(--recursica-brand-light-layer-layer-1-property-border-color)',
                  },
                }}
              />
            </Group>
          </Group>
        </AppShell.Header>
        <Modal opened={isModalOpen} onClose={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }} title="Import JSON Files">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-tokens-size-1-5x)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--recursica-tokens-size-default)', fontWeight: 'bold' }}>Select JSON Files:</label>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(e) => {
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
            <Group gap="sm" justify="flex-end" style={{ borderTop: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', paddingTop: 'var(--recursica-tokens-size-1-5x)' }}>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
                Cancel
              </Button>
              <Button variant="solid" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
                Import
              </Button>
            </Group>
          </div>
        </Modal>

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
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
    </MantineProvider>
  )
}


