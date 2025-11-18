/**
 * MantineShell
 *
 * App frame using Mantine components; provides navigation, reset defaults,
 * and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState } from 'react'
import { AppShell, Group, Title, Button, Select, MantineProvider, Modal, Tabs, ActionIcon, Switch } from '@mantine/core'
import '@mantine/core/styles.css'
import { extractCssVarsFromObject, applyCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const { handleExport, showSelectionModal, showComplianceModal, complianceIssues, handleSelectionConfirm, handleSelectionCancel, handleAcknowledge, handleCancel } = useJsonExport()
  const { selectedFiles, setSelectedFiles, handleImport, showDirtyModal, filesToImport, handleAcknowledge: handleDirtyAcknowledge, handleCancel: handleDirtyCancel, clearSelectedFiles } = useJsonImport()
  const location = useLocation()
  const navigate = useNavigate()
  const currentTab = location.pathname.startsWith('/tokens') ? 'tokens' : location.pathname.startsWith('/type') ? 'type' : location.pathname.startsWith('/layers') ? 'layers' : location.pathname.startsWith('/uikit') ? 'uikit' : 'palettes'
  
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
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Title order={3}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Recursica Theme Forge</Link>
            </Title>

            <Tabs value={currentTab} onChange={(val) => {
              const v = (val as string) || 'tokens'
              if (v === 'tokens') navigate('/tokens')
              else if (v === 'palettes') navigate('/palettes')
              else if (v === 'uikit') navigate('/uikit')
              else navigate(`/${v}`)
            }} keepMounted={false} variant="pills" radius="xl">
              <Tabs.List>
                <Tabs.Tab value="tokens">Tokens</Tabs.Tab>
                <Tabs.Tab value="palettes">Palettes</Tabs.Tab>
                <Tabs.Tab value="type">Type</Tabs.Tab>
                <Tabs.Tab value="layers">Layers</Tabs.Tab>
                <Tabs.Tab value="uikit">UI Kit</Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Group gap="xs" wrap="nowrap">
              <ActionIcon variant="default" onClick={() => {
                clearOverrides(tokensJson as any)
                resetAll()
              }} title="Reset to defaults">
                ↺
              </ActionIcon>
              <ActionIcon variant="default" onClick={() => setIsModalOpen(true)} title="Import / Export CSS Variables">
                ⤓
              </ActionIcon>
              <ActionIcon variant="default" onClick={handleExport} title="Export JSON Files">
                📥
              </ActionIcon>
              <Switch
                checked={mode === 'dark'}
                onChange={(e) => setMode(e.currentTarget.checked ? 'dark' : 'light')}
                label={mode === 'dark' ? 'Dark' : 'Light'}
                size="sm"
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
              />
            </Group>
          </Group>
        </AppShell.Header>
        <Modal opened={isModalOpen} onClose={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }} title="Import JSON Files">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Select JSON Files:</label>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(e) => {
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
            <Group gap="sm" justify="flex-end" style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
              <Button variant="default" onClick={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
                Cancel
              </Button>
              <Button variant="filled" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
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


