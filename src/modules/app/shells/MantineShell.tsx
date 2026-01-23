/**
 * MantineShell
 *
 * App frame using Mantine components; provides navigation, reset defaults,
 * and import/export of CSS variables.
 */
import { ReactNode, useEffect, useState, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { AppShell, Group, Select, MantineProvider, Modal, Tabs as MantineTabs } from '@mantine/core'
import '@mantine/core/styles.css'
import './MantineShell.css'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useJsonExport, ExportComplianceModal, ExportSelectionModalWrapper } from '../../../core/export/exportWithCompliance'
import { useJsonImport, ImportDirtyDataModal, processUploadedFilesAsync } from '../../../core/import/importWithDirtyData'
import { Button } from '../../../components/adapters/Button'
import { Tooltip } from '../../../components/adapters/Tooltip'
import { Sidebar } from '../Sidebar'
import { ThemeSidebar } from '../ThemeSidebar'
import { ComponentsSidebar } from '../../preview/ComponentsSidebar'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { getVarsStore } from '../../../core/store/varsStore'
import { createBugReport } from '../utils/bugReport'

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
    
    try {
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
    } catch (error) {
      console.error('Error processing files:', error)
      setSelectedFiles({})
      setSelectedFileNames([])
    }
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
  
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const showSidebar = location.pathname.startsWith('/tokens')
  const showThemeSidebar = location.pathname.startsWith('/theme')
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
  
  return (
    <MantineProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header
          ref={headerRef}
          style={{
            backgroundColor: `var(${layer0Base}-surface)`,
            paddingTop: 'var(--recursica-brand-dimensions-general-lg)',
            paddingBottom: 'var(--recursica-brand-dimensions-general-lg)',
            paddingLeft: 'var(--recursica-brand-dimensions-general-xl)',
            paddingRight: 'var(--recursica-brand-dimensions-general-xl)',
            height: 'auto',
            flexShrink: 0,
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: `var(--recursica-brand-themes-${mode}-palettes-neutral-primary-tone)`,
          }}
        >
          <Group gap="var(--recursica-brand-dimensions-general-xl)" wrap="nowrap" style={{ width: '100%' }}>
            {/* Chunk 1: Logo and Brand */}
            <div style={{ minWidth: '220px', display: 'flex', alignItems: 'center' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)', textDecoration: 'none' }}>
                <LogoIcon />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span
                    style={{
                      color: `var(${layer0Base}-element-text-color)`,
                      opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                      fontWeight: 600,
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    }}
                  >
                    Recursica
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                      color: `var(${layer0Base}-element-text-color)`,
                      opacity: `var(${layer0Base}-element-text-low-emphasis)`,
                    }}
                  >
                    Theme Forge
                  </span>
                </div>
              </Link>
            </div>

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
                <div
                  style={{
                    '--header-tab-active-bg': `var(${buttonSolidBg})`,
                    '--header-tab-active-text': `var(${buttonSolidText})`,
                  } as CSSProperties}
                >
                <MantineTabs
                  value={currentRoute}
                  variant="pills"
                  onChange={(value) => {
                    if (value === 'tokens') navigate('/tokens')
                    else if (value === 'theme') navigate('/theme')
                    else if (value === 'components') navigate('/components')
                  }}
                  classNames={{
                    tab: 'header-nav-tab',
                  }}
                  styles={{
                    root: {
                      flex: 1,
                    },
                    list: {
                      gap: 'var(--recursica-brand-dimensions-general-default)',
                    },
                    tab: {
                      color: `var(${buttonTextText})`,
                      backgroundColor: `var(${buttonTextBg})`,
                      opacity: `var(${layer0Base}-element-text-low-emphasis)`,
                      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
                      fontSize: 'var(--recursica-brand-typography-button-font-size)',
                      height: `var(${buttonHeight})`,
                      paddingLeft: `var(${buttonPadding})`,
                      paddingRight: `var(${buttonPadding})`,
                      borderRadius: `var(${buttonBorderRadius})`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                      },
                      '&[dataActive]': {
                        color: `var(${buttonSolidText})`,
                        backgroundColor: `var(${buttonSolidBg})`,
                        opacity: 1,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <MantineTabs.List>
                    <MantineTabs.Tab value="tokens">Tokens</MantineTabs.Tab>
                    <MantineTabs.Tab value="theme">Theme</MantineTabs.Tab>
                    <MantineTabs.Tab value="components">Components</MantineTabs.Tab>
                  </MantineTabs.List>
                </MantineTabs>
                </div>
              )
            })()}

            {/* Chunk 3: Action Buttons and Framework Dropdown */}
            <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-general-default)', alignItems: 'center', marginLeft: 'auto' }}>
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
                  onClick={() => setIsModalOpen(true)}
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
                      backgroundColor: `var(${layer0Base}-surface)`,
                      borderColor: `var(${layer0Base}-border-color)`,
                    },
                  }}
              />
            </div>

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
              
              return (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                backgroundColor: `var(${layer0Base}-surface)`,
                border: `1px solid var(${layer0Base}-border-color)`,
                borderRadius: `var(${buttonBorderRadius})`,
                padding: `var(${buttonSmallIconPadding})`,
                gap: 0,
              }}>
                <Tooltip label="Light theme">
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
                      opacity: mode === 'light' ? 1 : `var(${layer0Base}-element-text-low-emphasis)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
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
                </Tooltip>
                <Tooltip label="Dark theme">
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
                      opacity: mode === 'dark' ? 1 : `var(${layer0Base}-element-text-low-emphasis)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
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
                </Tooltip>
              </div>
              )
            })()}
          </Group>
        </header>
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
        <Modal opened={isModalOpen} onClose={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }} title="Import JSON Files">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-md)' }}>
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
                style={{ marginBottom: 'var(--recursica-brand-dimensions-general-default)' }}
              />
              {selectedFileNames.length > 0 && (
                <div style={{ 
                  fontSize: 'var(--recursica-brand-typography-caption-font-size)', 
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-medium-emphasis)`,
                  marginTop: 'var(--recursica-brand-dimensions-general-sm)' 
                }}>
                  Selected: {selectedFileNames.join(', ')}
                </div>
              )}
              <div style={{ 
                fontSize: 'var(--recursica-brand-typography-caption-font-size)', 
                color: `var(${layer0Base}-element-text-color)`,
                opacity: `var(${layer0Base}-element-text-low-emphasis)`,
                marginTop: 'var(--recursica-brand-dimensions-general-sm)' 
              }}>
                Upload tokens.json, brand.json, and/or uikit.json files
              </div>
            </div>
            <Group gap="sm" justify="flex-end" style={{ borderTop: `1px solid var(${layer0Base}-border-color)`, paddingTop: 'var(--recursica-brand-dimensions-general-md)' }}>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); clearSelectedFiles(); setSelectedFileNames([]) }}>
                Cancel
              </Button>
              <Button variant="solid" onClick={handleImportClick} disabled={selectedFileNames.length === 0}>
                Import
              </Button>
            </Group>
          </div>
        </Modal>
      </div>
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


