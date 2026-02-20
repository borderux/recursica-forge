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
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper, ExportValidationErrorModal, GitHubExportModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { createBugReport } from '../utils/bugReport'
import { Button } from '../../../components/adapters/Button'
import { Tooltip } from '../../../components/adapters/Tooltip'
import { Switch } from '../../../components/adapters/Switch'
import { SegmentedControl } from '../../../components/adapters/SegmentedControl'
import type { SegmentedControlItem } from '../../../components/adapters/SegmentedControl'
import { Sidebar } from '../Sidebar'
import { ThemeSidebar } from '../ThemeSidebar'
import { Modal } from '../../../components/adapters/Modal'
import { Dropdown } from '../../../components/adapters/Dropdown'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { getVarsStore } from '../../../core/store/varsStore'
import { randomizeAllVariables } from '../../../core/utils/randomizeVariables'
import { RandomizeOptionsModal } from '../../../core/utils/RandomizeOptionsModal'
import { getCssAuditAutoRun, setCssAuditAutoRun } from '../../../core/utils/cssAuditPreference'
import { runCssVarAudit } from '../../../core/utils/runCssVarAudit'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const location = useLocation()
  const navigate = useNavigate()
  const [mat, setMat] = useState<any>(null)
  const [styles, setStyles] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const [showRandomizeModal, setShowRandomizeModal] = useState(false)
  const [cssAuditAutoRun, setCssAuditAutoRunState] = useState(() => getCssAuditAutoRun())
  const { handleExport, showSelectionModal, showComplianceModal, showValidationModal, showGitHubModal, githubExportFiles, validationErrors, complianceIssues, handleSelectionConfirm, handleSelectionCancel, handleAcknowledge, handleCancel, handleValidationModalClose, handleExportToGithub, handleGitHubExportCancel, handleGitHubExportSuccess } = useJsonExport()
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
      <path fillRule="evenodd" clipRule="evenodd" d="M2.73689 0C1.22535 0 0 1.23486 0 2.75813V40.2687C0 41.792 1.22535 43.0269 2.73689 43.0269H61.3063C62.8178 43.0269 64.0431 41.792 64.0431 40.2687V2.75813C64.0431 1.23486 62.8178 0 61.3063 0H2.73689ZM4.10533 38.8628C4.10533 20.1314 18.8106 4.86124 37.2217 4.1372V38.8628H4.10533ZM45.4323 38.8628C42.4092 38.8628 39.9585 36.3931 39.9585 33.3465H45.4323V38.8628ZM59.8947 24.2447H39.9585V4.15383C50.6584 4.836 59.2177 13.4618 59.8947 24.2447ZM59.8674 27.0028C59.2296 33.2132 54.3317 38.1491 48.1692 38.7918V27.0028H59.8674ZM43.5165 27.0297C41.5515 27.0297 39.9585 28.635 39.9585 30.6153H43.5165V27.0297Z" fill={`var(--recursica-brand-themes-${mode}-palettes-palette-1-primary-tone)`} />
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

  if (!mat || !styles) return <div style={{ padding: 'var(--recursica-brand-dimensions-general-lg)' }}>Loading Material UI…</div>

  const { AppBar, Toolbar, Container, CssBaseline, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Box, Tabs, Tab } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  const layer1Base = `--recursica-brand-themes-${mode}-layers-layer-1-properties`
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
            backgroundColor: `var(${layer0Base}-surface)`,
            paddingTop: 'var(--recursica-brand-dimensions-general-lg)',
            paddingBottom: 'var(--recursica-brand-dimensions-general-lg)',
            paddingLeft: 'var(--recursica-brand-dimensions-general-xl)',
            paddingRight: 'var(--recursica-brand-dimensions-general-xl)',
            height: 'auto',
            flexShrink: 0,
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ gap: 'var(--recursica-brand-dimensions-general-xl)', justifyContent: 'space-between', minHeight: 'auto !important', width: '100%' }}>
            {/* Chunk 1: Logo and Brand */}
            <Box sx={{ minWidth: '220px', display: 'flex', alignItems: 'center' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)', textDecoration: 'none' }}>
                <LogoIcon />
                <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Box
                    component="span"
                    sx={{
                      color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                      opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`,
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
                      color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                      opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                    }}
                  >
                    Theme Forge
                  </Box>
                </Box>
              </Link>
            </Box>

            {/* Chunk 2: Navigation Tabs */}
            {(() => {
              const buttonTextBg = getComponentCssVar('Button', 'colors', 'text-background', 'layer-0')
              const buttonTextText = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
              const buttonSolidBg = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
              const buttonSolidText = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
              const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
              const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
              const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)

              return (
                <Tabs
                  value={currentRoute}
                  variant="standard"
                  onChange={(e: any, newValue: any) => {
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
                      opacity: currentRoute === 'tokens' ? 1 : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                      fontWeight: currentRoute === 'tokens' ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
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
                      opacity: currentRoute === 'theme' ? 1 : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                      fontWeight: currentRoute === 'theme' ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
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
                      opacity: currentRoute === 'components' ? 1 : `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                      fontWeight: currentRoute === 'components' ? 600 : 'var(--recursica-brand-typography-body-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)', marginLeft: 'auto' }}>
              <Tooltip label="Reset all changes">
                <Button
                  variant="outline"
                  size="small"
                  icon={(() => {
                    const RefreshIcon = iconNameToReactComponent('arrow-path')
                    return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                  onClick={() => {
                    clearOverrides(tokensJson as any)
                    resetAll()
                  }}
                />
              </Tooltip>
              <Tooltip label="Import theme">
                <Button
                  variant="outline"
                  size="small"
                  icon={(() => {
                    const UploadIcon = iconNameToReactComponent('arrow-up-tray')
                    return UploadIcon ? <UploadIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                  onClick={() => setIsDialogOpen(true)}
                />
              </Tooltip>
              <Tooltip label="Export theme">
                <Button
                  variant="outline"
                  size="small"
                  icon={(() => {
                    const DownloadIcon = iconNameToReactComponent('arrow-down-tray')
                    return DownloadIcon ? <DownloadIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                  onClick={handleExport}
                />
              </Tooltip>
              <Tooltip label="Check AA Compliance">
                <Button
                  variant="outline"
                  size="small"
                  icon={(() => {
                    const CheckIcon = iconNameToReactComponent('check-circle')
                    return CheckIcon ? <CheckIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                  onClick={() => {
                    getVarsStore().updateCoreColorOnTonesForAA()
                  }}
                />
              </Tooltip>
              <Tooltip label="Report a bug">
                <Button
                  variant="outline"
                  size="small"
                  icon={(() => {
                    const BugIcon = iconNameToReactComponent('bug')
                    return BugIcon ? <BugIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                  onClick={() => createBugReport()}
                />
              </Tooltip>
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Tooltip label="Randomize all variables (dev only)">
                    <Button
                      variant="outline"
                      size="small"
                      icon={(() => {
                        const ShuffleIcon = iconNameToReactComponent('swap')
                        return ShuffleIcon ? <ShuffleIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                      })()}
                      onClick={() => setShowRandomizeModal(true)}
                    />
                  </Tooltip>
                  <Tooltip label="Auto-run CSS audit (dev only)">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-sm)' }}>
                      <Switch
                        checked={cssAuditAutoRun}
                        onChange={(checked: boolean) => {
                          setCssAuditAutoRunState(checked)
                          setCssAuditAutoRun(checked)
                          // Trigger audit immediately when enabled
                          if (checked) {
                            setTimeout(() => {
                              runCssVarAudit(false)
                            }, 500) // Small delay to ensure CSS vars are ready
                          }
                        }}
                        sizeVariant="small"
                      />
                    </div>
                  </Tooltip>
                </>
              )}
              <Dropdown
                value={kit}
                onChange={(v) => onKitChange((v as UiKit) ?? 'mantine')}
                items={[
                  { label: 'Mantine', value: 'mantine' },
                  { label: 'Material UI', value: 'material' },
                  { label: 'Carbon', value: 'carbon' },
                ]}
                state="disabled"
                style={{ width: 180, marginLeft: 8 }}
                layer="layer-0"
                disableTopBottomMargin={true}
              />
            </Box>

            {/* Chunk 4: Theme Mode Segmented Control */}
            {(() => {
              const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
              const buttonSmallHeight = getComponentCssVar('Button', 'size', 'small-height', undefined)
              const buttonSmallMinWidth = getComponentCssVar('Button', 'size', 'small-min-width', undefined)
              const buttonSmallIcon = getComponentCssVar('Button', 'size', 'small-icon', undefined)
              const buttonSmallIconPadding = getComponentCssVar('Button', 'size', 'small-icon-padding', undefined)
              const buttonSolidBg = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
              const buttonSolidText = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
              const buttonTextBg = getComponentCssVar('Button', 'colors', 'text-background', 'layer-0')
              const buttonTextText = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')

              const SunIcon = iconNameToReactComponent('sun')
              const MoonIcon = iconNameToReactComponent('moon')
              const modeItems: SegmentedControlItem[] = [
                {
                  value: 'light',
                  icon: SunIcon ? <SunIcon style={{ width: `var(${buttonSmallIcon})`, height: `var(${buttonSmallIcon})` }} /> : undefined,
                  tooltip: 'Light theme',
                },
                {
                  value: 'dark',
                  icon: MoonIcon ? <MoonIcon style={{ width: `var(${buttonSmallIcon})`, height: `var(${buttonSmallIcon})` }} /> : undefined,
                  tooltip: 'Dark theme',
                },
              ]
              return (
                <SegmentedControl
                  items={modeItems}
                  value={mode}
                  onChange={(value) => setMode(value as 'light' | 'dark')}
                  orientation="horizontal"
                  fullWidth={false}
                  layer="layer-0"
                  componentNameForCssVars="SegmentedControl"
                />
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
            color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
          }}>
            {children}
          </main>
        </div>
        <Modal
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}
          title="Import JSON Files"
          layer="layer-1"
          primaryActionLabel="Import"
          onPrimaryAction={handleImportClick}
          primaryActionDisabled={selectedFileNames.length === 0}
          onSecondaryAction={() => { setIsDialogOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}
          content={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-md)', minWidth: 400 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--recursica-brand-dimensions-general-default)', fontWeight: 'bold' }}>Select JSON Files:</label>
                <input
                  type="file"
                  accept="application/json,.json"
                  multiple
                  onChange={(e) => {
                    onFileSelect(e.currentTarget.files)
                    e.currentTarget.value = ''
                  }}
                  style={{ marginBottom: 'var(--recursica-brand-dimensions-general-default)', width: '100%' }}
                />
                {selectedFileNames.length > 0 && (
                  <div style={{ fontSize: 'var(--recursica-brand-typography-caption-font-size)', color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`, opacity: 0.6, marginTop: 'var(--recursica-brand-dimensions-general-sm)' }}>
                    Selected: {selectedFileNames.join(', ')}
                  </div>
                )}
                <div style={{ fontSize: 'var(--recursica-brand-typography-caption-font-size)', color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`, opacity: 0.4, marginTop: 'var(--recursica-brand-dimensions-general-sm)' }}>
                  Upload tokens.json, brand.json, and/or uikit.json files
                </div>
              </div>
            </div>
          }
        />
        <ExportValidationErrorModal
          show={showValidationModal}
          errors={validationErrors}
          onClose={handleValidationModalClose}
        />
        <ExportSelectionModalWrapper
          show={showSelectionModal}
          onConfirm={handleSelectionConfirm}
          onCancel={handleSelectionCancel}
          onExportToGithub={handleExportToGithub}
        />
        <GitHubExportModalWrapper
          show={showGitHubModal}
          selectedFiles={githubExportFiles}
          onCancel={handleGitHubExportCancel}
          onSuccess={handleGitHubExportSuccess}
        />
        <ExportComplianceModal
          show={showComplianceModal}
          issues={complianceIssues}
          onAcknowledge={handleAcknowledge}
          onCancel={handleCancel}
        />
        {process.env.NODE_ENV === 'development' && (
          <RandomizeOptionsModal
            show={showRandomizeModal}
            onRandomize={(options) => {
              randomizeAllVariables(options)
              setShowRandomizeModal(false)
            }}
            onCancel={() => setShowRandomizeModal(false)}
          />
        )}
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


