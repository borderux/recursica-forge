/**
 * MaterialShell
 *
 * App frame using Material UI; lazy-loads MUI packages on mount and
 * provides navigation, reset defaults, and download controls.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { Button } from '../../../components/adapters/Button'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const location = useLocation()
  const navigate = useNavigate()
  const [mat, setMat] = useState<any>(null)
  const [styles, setStyles] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  if (!mat || !styles) return <div style={{ padding: 'var(--recursica-tokens-size-2x)' }}>Loading Material UI…</div>

  const { AppBar, Toolbar, Select, MenuItem, Container, CssBaseline, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Box } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{
          backgroundColor: `var(${layer1Base}-surface)`,
          paddingTop: 'var(--recursica-tokens-size-2x)',
          paddingBottom: 'var(--recursica-tokens-size-2x)',
          paddingLeft: 'var(--recursica-tokens-size-3x)',
          paddingRight: 'var(--recursica-tokens-size-3x)',
          height: 'auto',
          boxShadow: 'none',
          borderBottomWidth: `var(${layer1Base}-border-thickness, 1px)`,
          borderBottomStyle: 'solid',
          borderBottomColor: `var(${layer1Base}-border-color)`,
        }}
      >
        <Toolbar sx={{ gap: 'var(--recursica-tokens-size-3x)', justifyContent: 'space-between', minHeight: 'auto !important', width: '100%' }}>
          {/* Chunk 1: Logo and Brand */}
          <Box sx={{ minWidth: '220px', display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-default)', textDecoration: 'none' }}>
              <LogoIcon />
              <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Box
                  component="span"
                  sx={{
                    color: `var(${layer1Base}-element-text-color)`,
                    opacity: `var(${layer1Base}-element-text-high-emphasis)`,
                    fontWeight: 600,
                    fontSize: 'var(--recursica-tokens-size-md)',
                  }}
                >
                  Recursica
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: 'var(--recursica-tokens-size-xs)',
                    color: `var(${layer1Base}-element-text-color)`,
                    opacity: `var(${layer1Base}-element-text-low-emphasis)`,
                  }}
                >
                  Theme Forge
                </Box>
              </Box>
            </Link>
          </Box>

          {/* Chunk 2: Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 'var(--recursica-tokens-size-default)', alignItems: 'center' }}>
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
          </Box>

          {/* Chunk 3: Action Buttons and Framework Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-tokens-size-default)', marginLeft: 'auto' }}>
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
              onClick={() => setIsDialogOpen(true)}
              title="Import / Export CSS Variables"
            />
            <Button
              variant="outline"
              size="default"
              icon={<ArrowUpTrayIcon style={{ width: 'var(--recursica-tokens-size-md)', height: 'var(--recursica-tokens-size-md)' }} />}
              onClick={handleExport}
              title="Export JSON Files"
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
          </Box>

          {/* Chunk 4: Theme Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 'var(--recursica-tokens-size-2x)' }}>
        {children}
      </Container>
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
        <DialogTitle>Import JSON Files</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-tokens-size-1-5x)', minWidth: 400 }}>
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
                style={{ marginBottom: 'var(--recursica-tokens-size-default)', width: '100%' }}
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
        </DialogContent>
        <DialogActions>
          <Button variant="outline" onClick={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
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


