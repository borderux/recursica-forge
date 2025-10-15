import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'

export default function CarbonShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const [carbon, setCarbon] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
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

  const { Header, HeaderName, HeaderGlobalBar, Select, SelectItem, Theme, Grid, Column, ComposedModal, ModalHeader, ModalBody, ModalFooter, Button } = carbon

  return (
    <Theme theme="g10">
      <Header aria-label="Recursica Theme Forge">
        <HeaderName prefix="">Recursica Theme Forge</HeaderName>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 16 }}>
          <a href="/color" style={{ color: 'inherit', textDecoration: 'none' }}>Color</a>
          <a href="/type" style={{ color: 'inherit', textDecoration: 'none' }}>Type</a>
          <a href="/elevation" style={{ color: 'inherit', textDecoration: 'none' }}>Elevation</a>
          <a href="/layers" style={{ color: 'inherit', textDecoration: 'none' }}>Layers</a>
          <a href="/preview" style={{ color: 'inherit', textDecoration: 'none' }}>Preview</a>
        </div>
        <HeaderGlobalBar>
          <button onClick={() => downloadCurrentCssVars()} title="Download" style={{ marginRight: 8 }}>⤓</button>
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
    </Theme>
  )
}


