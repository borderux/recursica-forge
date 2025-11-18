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
import { useJsonExport, ExportComplianceModal } from '../../../core/export/exportWithCompliance'

export default function CarbonShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const { mode, setMode } = useThemeMode()
  const [carbon, setCarbon] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { handleExport, showModal, complianceIssues, handleAcknowledge, handleCancel } = useJsonExport()
  const onUpload = async (file?: File | null) => {
    if (!file) return
    const text = await file.text()
    const json = JSON.parse(text)
    const vars = extractCssVarsFromObject(json)
    if (Object.keys(vars).length) applyCssVars(vars)
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
      <ComposedModal open={isOpen} onClose={() => setIsOpen(false)} size="sm">
        <ModalHeader label="Import/Export" title="Import/Export" />
        <ModalBody hasForm>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e: any) => {
                onUpload(e.currentTarget.files?.[0])
                e.currentTarget.value = ''
              }}
            />
            <Button kind="secondary" onClick={() => downloadCurrentCssVars()}>Download</Button>
          </div>
        </ModalBody>
        <ModalFooter primaryButtonText="Close" onRequestClose={() => setIsOpen(false)} onRequestSubmit={() => setIsOpen(false)} />
      </ComposedModal>
      <Grid condensed style={{ padding: 16 }}>
        <Column lg={16} md={8} sm={4}>
          {children}
        </Column>
      </Grid>
      <ExportComplianceModal
        show={showModal}
        issues={complianceIssues}
        onAcknowledge={handleAcknowledge}
        onCancel={handleCancel}
      />
    </Theme>
  )
}


