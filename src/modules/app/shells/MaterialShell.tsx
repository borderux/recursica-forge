/**
 * MaterialShell
 *
 * App frame using Material UI; lazy-loads MUI packages on mount and
 * provides navigation, reset defaults, and download controls.
 */
import { ReactNode, useEffect, useState, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { iconNameToReactComponent } from '../../components/iconUtils'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { Button } from '../../../components/adapters/Button'
import { Sidebar } from '../Sidebar'
import { ThemeSidebar } from '../ThemeSidebar'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'

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
  const currentRoute = useMemo(() => {
    if (location.pathname.startsWith('/tokens')) return 'tokens'
    if (location.pathname.startsWith('/theme')) return 'theme'
    if (location.pathname.startsWith('/components')) return 'components'
    return 'tokens'
  }, [location.pathname])
  
  // Logo SVG
  const LogoIcon = () => (
    <svg width="65" height="44" viewBox="0 0 65 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.73689 0C1.22535 0 0 1.23486 0 2.75813V40.2687C0 41.792 1.22535 43.0269 2.73689 43.0269H61.3063C62.8178 43.0269 64.0431 41.792 64.0431 40.2687V2.75813C64.0431 1.23486 62.8178 0 61.3063 0H2.73689ZM4.10533 38.8628C4.10533 20.1314 18.8106 4.86124 37.2217 4.1372V38.8628H4.10533ZM45.4323 38.8628C42.4092 38.8628 39.9585 36.3931 39.9585 33.3465H45.4323V38.8628ZM59.8947 24.2447H39.9585V4.15383C50.6584 4.836 59.2177 13.4618 59.8947 24.2447ZM59.8674 27.0028C59.2296 33.2132 54.3317 38.1491 48.1692 38.7918V27.0028H59.8674ZM43.5165 27.0297C41.5515 27.0297 39.9585 28.635 39.9585 30.6153H43.5165V27.0297Z" fill={`var(--recursica-brand-themes-${mode}-palettes-palette-1-primary-tone)`}/>
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

  const headerRef = useRef<HTMLElement>(null)

  // Measure header height and set CSS variable
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        // Use getBoundingClientRect to get accurate height including borders
        const rect = headerRef.current.getBoundingClientRect()
        document.documentElement.style.setProperty('--header-height', `${rect.height}px`)
      }
    }
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      updateHeaderHeight()
    })
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [mode])

  if (!mat || !styles) return <div style={{ padding: 'var(--recursica-brand-dimensions-spacer-lg)' }}>Loading Material UI…</div>

  const { AppBar, Toolbar, Select, MenuItem, Container, CssBaseline, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Box, Tabs, Tab } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const showSidebar = location.pathname.startsWith('/tokens')
  const showThemeSidebar = location.pathname.startsWith('/theme')
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          ref={headerRef}
          position="static"
          sx={{
            backgroundColor: `var(${layer1Base}-surface)`,
            paddingTop: 'var(--recursica-brand-dimensions-spacer-lg)',
            paddingBottom: 'var(--recursica-brand-dimensions-spacer-lg)',
            paddingLeft: 'var(--recursica-brand-dimensions-spacer-xl)',
            paddingRight: 'var(--recursica-brand-dimensions-spacer-xl)',
            height: 'auto',
            flexShrink: 0,
            boxShadow: 'none',
            borderBottomWidth: `var(${layer1Base}-border-thickness, 1px)`,
            borderBottomStyle: 'solid',
            borderBottomColor: `var(${layer1Base}-border-color)`,
          }}
        >
          <Toolbar sx={{ gap: 'var(--recursica-brand-dimensions-spacer-xl)', justifyContent: 'space-between', minHeight: 'auto !important', width: '100%' }}>
            {/* Chunk 1: Logo and Brand */}
            <Box sx={{ minWidth: '220px', display: 'flex', alignItems: 'center' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacer-default)', textDecoration: 'none' }}>
                <LogoIcon />
                <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Box
                  component="span"
                  sx={{
                    color: `var(${layer1Base}-element-text-color)`,
                    opacity: `var(${layer1Base}-element-text-high-emphasis)`,
                    fontWeight: 600,
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  }}
                >
                  Recursica
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer1Base}-element-text-color)`,
                    opacity: `var(${layer1Base}-element-text-low-emphasis)`,
                  }}
                >
                  Theme Forge
                </Box>
                </Box>
              </Link>
            </Box>

            {/* Chunk 2: Navigation Tabs */}
            {(() => {
              const buttonTextBg = getComponentCssVar('Button', 'color', 'text-background', 'layer-0')
              const buttonTextText = getComponentCssVar('Button', 'color', 'text-text', 'layer-0')
              const buttonSolidBg = getComponentCssVar('Button', 'color', 'solid-background', 'layer-0')
              const buttonSolidText = getComponentCssVar('Button', 'color', 'solid-text', 'layer-0')
              const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
              const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
              const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
              
              return (
                <Tabs
                  value={currentRoute}
                  variant="pills"
                  onChange={(e, newValue) => {
                    if (newValue === 'tokens') navigate('/tokens')
                    else if (newValue === 'theme') navigate('/theme')
                    else if (newValue === 'components') navigate('/components')
                  }}
                  sx={{
                    flex: 1,
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                  }}
                >
                  <Tab 
                    value="tokens" 
                    label="Tokens"
                    sx={{
                      color: `var(${buttonTextText})`,
                      backgroundColor: `var(${buttonTextBg})`,
                      opacity: currentRoute === 'tokens' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
                      fontWeight: currentRoute === 'tokens' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-button-font-size)',
                      height: `var(${buttonHeight})`,
                      minHeight: `var(${buttonHeight})`,
                      paddingLeft: `var(${buttonPadding})`,
                      paddingRight: `var(${buttonPadding})`,
                      borderRadius: `var(${buttonBorderRadius})`,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        color: `var(${buttonSolidText})`,
                        backgroundColor: `var(${buttonSolidBg})`,
                        opacity: 1,
                      },
                    }}
                  />
                  <Tab 
                    value="theme" 
                    label="Theme"
                    sx={{
                      color: `var(${buttonTextText})`,
                      backgroundColor: `var(${buttonTextBg})`,
                      opacity: currentRoute === 'theme' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
                      fontWeight: currentRoute === 'theme' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-button-font-size)',
                      height: `var(${buttonHeight})`,
                      minHeight: `var(${buttonHeight})`,
                      paddingLeft: `var(${buttonPadding})`,
                      paddingRight: `var(${buttonPadding})`,
                      borderRadius: `var(${buttonBorderRadius})`,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        color: `var(${buttonSolidText})`,
                        backgroundColor: `var(${buttonSolidBg})`,
                        opacity: 1,
                      },
                    }}
                  />
                  <Tab 
                    value="components" 
                    label="Components"
                    sx={{
                      color: `var(${buttonTextText})`,
                      backgroundColor: `var(${buttonTextBg})`,
                      opacity: currentRoute === 'components' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
                      fontWeight: currentRoute === 'components' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-button-font-size)',
                      height: `var(${buttonHeight})`,
                      minHeight: `var(${buttonHeight})`,
                      paddingLeft: `var(${buttonPadding})`,
                      paddingRight: `var(${buttonPadding})`,
                      borderRadius: `var(${buttonBorderRadius})`,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        color: `var(${buttonSolidText})`,
                        backgroundColor: `var(${buttonSolidBg})`,
                        opacity: 1,
                      },
                    }}
                  />
                </Tabs>
              )
            })()}

          {/* Chunk 3: Action Buttons and Framework Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacer-default)', marginLeft: 'auto' }}>
            <Button
              variant="outline"
              size="small"
              icon={(() => {
                const RefreshIcon = iconNameToReactComponent('arrow-path')
                return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icon-default)', height: 'var(--recursica-brand-dimensions-icon-default)' }} /> : null
              })()}
              onClick={() => {
                clearOverrides(tokensJson as any)
                resetAll()
              }}
              title="Reset to defaults"
            />
            <Button
              variant="outline"
              size="small"
              icon={(() => {
                const DownloadIcon = iconNameToReactComponent('arrow-down-tray')
                return DownloadIcon ? <DownloadIcon style={{ width: 'var(--recursica-brand-dimensions-icon-default)', height: 'var(--recursica-brand-dimensions-icon-default)' }} /> : null
              })()}
              onClick={() => setIsDialogOpen(true)}
              title="Import / Export CSS Variables"
            />
            <Button
              variant="outline"
              size="small"
              icon={(() => {
                const UploadIcon = iconNameToReactComponent('arrow-up-tray')
                return UploadIcon ? <UploadIcon style={{ width: 'var(--recursica-brand-dimensions-icon-default)', height: 'var(--recursica-brand-dimensions-icon-default)' }} /> : null
              })()}
              onClick={handleExport}
              title="Export JSON Files"
            />
            <Select
              size="small"
              value={kit}
              onChange={(e: any) => onKitChange((e.target.value as UiKit) ?? 'mantine')}
              sx={{ 
                ml: 1, 
                minWidth: 150,
                color: `var(${layer1Base}-element-text-color)`,
                '& .MuiSelect-select': { 
                  color: `var(${layer1Base}-element-text-color)`,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `var(${layer1Base}-border-color)`,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `var(${layer1Base}-border-color)`,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: `var(${layer1Base}-border-color)`,
                },
              }}
            >
              <MenuItem 
                value="mantine"
                sx={{ color: `var(${layer1Base}-element-text-color)` }}
              >
                Mantine
              </MenuItem>
              <MenuItem 
                value="material"
                sx={{ color: `var(${layer1Base}-element-text-color)` }}
              >
                Material UI
              </MenuItem>
              <MenuItem 
                value="carbon"
                sx={{ color: `var(${layer1Base}-element-text-color)` }}
              >
                Carbon
              </MenuItem>
            </Select>
          </Box>

          {/* Chunk 4: Theme Mode Segmented Control */}
          {(() => {
            const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
            const buttonSmallHeight = getComponentCssVar('Button', 'size', 'small-height', undefined)
            const buttonSmallMinWidth = getComponentCssVar('Button', 'size', 'small-min-width', undefined)
            const buttonSmallIcon = getComponentCssVar('Button', 'size', 'small-icon', undefined)
            const buttonSmallIconPadding = getComponentCssVar('Button', 'size', 'small-icon-padding', undefined)
            const buttonSolidBg = getComponentCssVar('Button', 'color', 'solid-background', 'layer-0')
            const buttonSolidText = getComponentCssVar('Button', 'color', 'solid-text', 'layer-0')
            const buttonTextBg = getComponentCssVar('Button', 'color', 'text-background', 'layer-0')
            const buttonTextText = getComponentCssVar('Button', 'color', 'text-text', 'layer-0')
            
            return (
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                backgroundColor: `var(${layer1Base}-surface)`,
                border: `1px solid var(${layer1Base}-border-color)`,
                borderRadius: `var(${buttonBorderRadius})`,
                padding: `var(${buttonSmallIconPadding})`,
                gap: 0,
              }}>
                <button
                  onClick={() => setMode('light')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: `var(${buttonSmallMinWidth})`,
                    height: `var(${buttonSmallHeight})`,
                    minWidth: `var(${buttonSmallMinWidth})`,
                    border: 'none',
                    borderRadius: `calc(var(${buttonBorderRadius}) - var(${buttonSmallIconPadding}))`,
                    backgroundColor: mode === 'light' ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
                    color: mode === 'light' ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
                    opacity: mode === 'light' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Light theme"
                >
                  {(() => {
                    const SunIcon = iconNameToReactComponent('sun')
                    return SunIcon ? <SunIcon 
                      style={{ 
                        width: `var(${buttonSmallIcon})`, 
                        height: `var(${buttonSmallIcon})`,
                      }} 
                    /> : null
                  })()}
                </button>
                <button
                  onClick={() => setMode('dark')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: `var(${buttonSmallMinWidth})`,
                    height: `var(${buttonSmallHeight})`,
                    minWidth: `var(${buttonSmallMinWidth})`,
                    border: 'none',
                    borderRadius: `calc(var(${buttonBorderRadius}) - var(${buttonSmallIconPadding}))`,
                    backgroundColor: mode === 'dark' ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
                    color: mode === 'dark' ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
                    opacity: mode === 'dark' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Dark theme"
                >
                  {(() => {
                    const MoonIcon = iconNameToReactComponent('moon')
                    return MoonIcon ? <MoonIcon
                      style={{ 
                        width: `var(${buttonSmallIcon})`, 
                        height: `var(${buttonSmallIcon})`,
                      }} 
                    /> : null
                  })()}
                </button>
              </Box>
            )
          })()}
        </Toolbar>
      </AppBar>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showSidebar && <Sidebar />}
        {showThemeSidebar && <ThemeSidebar />}
        <main style={{ 
          flex: 1,
          minHeight: 0,
          backgroundColor: `var(${layer0Base}-surface)`,
          color: `var(${layer0Base}-element-text-color)`,
        }}>
          {children}
        </main>
      </div>
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
        <DialogTitle>Import JSON Files</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-spacer-md)', minWidth: 400 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--recursica-brand-dimensions-spacer-default)', fontWeight: 'bold' }}>Select JSON Files:</label>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={(e) => {
                  onFileSelect(e.currentTarget.files)
                  e.currentTarget.value = ''
                }}
                style={{ marginBottom: 'var(--recursica-brand-dimensions-spacer-default)', width: '100%' }}
              />
              {selectedFileNames.length > 0 && (
                <div style={{ fontSize: 'var(--recursica-brand-typography-caption-font-size)', color: '#666', marginTop: 'var(--recursica-brand-dimensions-spacer-sm)' }}>
                  Selected: {selectedFileNames.join(', ')}
                </div>
              )}
              <div style={{ fontSize: 'var(--recursica-brand-typography-caption-font-size)', color: '#888', marginTop: 'var(--recursica-brand-dimensions-spacer-sm)' }}>
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
      </div>
    </ThemeProvider>
  )
}


