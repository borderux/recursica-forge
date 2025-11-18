/**
 * MaterialShell
 *
 * App frame using Material UI; lazy-loads MUI packages on mount and
 * provides navigation, reset defaults, and download controls.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const [mat, setMat] = useState<any>(null)
  const [styles, setStyles] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
      setIsDialogOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }
  
  const handleDirtyAcknowledgeWithClose = () => {
    handleDirtyAcknowledge(() => {
      setIsDialogOpen(false)
      clearSelectedFiles()
      setSelectedFileNames([])
    })
  }

  useEffect(() => {
    let mounted = true
    Promise.all([import('@mui/material'), import('@mui/material/styles')]).then(([m, s]) => {
      if (mounted) {
        setMat(m)
        setStyles(s)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!mat || !styles) return <div style={{ padding: 16 }}>Loading Material UI…</div>

  const { AppBar, Toolbar, Typography, Button, Select, MenuItem, Container, CssBaseline, Tabs, Tab, IconButton, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Recursica Theme Forge</Link>
          </Typography>
          <Tabs value={kit} textColor="inherit" indicatorColor="secondary" sx={{ mx: 'auto' }}>
            <Tab value="tokens" label="Tokens" component={Link as any} to="/tokens" />
            <Tab value="palettes" label="Palettes" component={Link as any} to="/palettes" />
            <Tab value="type" label="Type" component={Link as any} to="/type" />
            <Tab value="layers" label="Layers" component={Link as any} to="/layers" />
            <Tab value="uikit" label="UI Kit" component={Link as any} to="/uikit" />
          </Tabs>
          <IconButton color="inherit" size="small" onClick={() => { clearOverrides(tokensJson as any); resetAll() }} title="Reset to defaults">↺</IconButton>
          <IconButton color="inherit" size="small" onClick={() => setIsDialogOpen(true)} title="Import / Export CSS Variables">⤓</IconButton>
          <IconButton color="inherit" size="small" onClick={handleExport} title="Export JSON Files">📥</IconButton>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                size="small"
                sx={{ color: 'white' }}
              />
            }
            label={mode === 'dark' ? 'Dark' : 'Light'}
            sx={{ color: 'white', ml: 1 }}
          />
          <Select
            size="small"
            value={kit}
            onChange={(e: any) => onKitChange((e.target.value as UiKit) ?? 'mantine')}
            sx={{ color: 'white', ml: 1, minWidth: 150, '& .MuiSelect-select': { color: 'white' } }}
          >
            <MenuItem value="mantine">Mantine</MenuItem>
            <MenuItem value="material">Material UI</MenuItem>
            <MenuItem value="carbon">Carbon</MenuItem>
          </Select>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {children}
      </Container>
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
        <DialogTitle>Import JSON Files</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 400 }}>
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
                style={{ marginBottom: 8, width: '100%' }}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
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
    </ThemeProvider>
  )
}


