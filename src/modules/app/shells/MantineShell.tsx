import { ReactNode, useEffect, useState } from 'react'
import { AppShell, Group, Title, Button, Select, MantineProvider, Modal, Tabs, ActionIcon } from '@mantine/core'
import '@mantine/core/styles.css'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { applyTheme, LIGHT_MODE } from '../../theme/index'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  useEffect(() => {
    applyTheme(LIGHT_MODE)
  }, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const currentTab = location.pathname.startsWith('/tokens') ? 'tokens' : location.pathname.startsWith('/type') ? 'type' : location.pathname.startsWith('/elevation') ? 'elevation' : location.pathname.startsWith('/layers') ? 'layers' : location.pathname.startsWith('/uikit') ? 'uikit' : 'palettes'
  const onUpload = async (file?: File | null) => {
    if (!file) return
    const text = await file.text()
    const json = JSON.parse(text)
    const vars = extractCssVarsFromObject(json)
    if (Object.keys(vars).length) applyCssVars(vars)
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
                <Tabs.Tab value="elevation">Elevation</Tabs.Tab>
                <Tabs.Tab value="layers">Layers</Tabs.Tab>
                <Tabs.Tab value="uikit">UI Kit</Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Group gap="xs" wrap="nowrap">
              <ActionIcon variant="default" onClick={() => {
                // Clear all saved overrides (colors, type, palette choices, etc.)
                clearOverrides(tokensJson as any)
                // Re-apply baseline theme CSS variables
                applyTheme(LIGHT_MODE)
                // Re-seed core palette CSS variables so alternative layers reset immediately
                try {
                  const get = (name: string): string | undefined => {
                    const parts = (name || '').split('/')
                    if (parts[0] === 'color' && parts.length >= 3) {
                      const fam = parts[1]
                      const lvl = parts[2]
                      const v = (tokensJson as any)?.color?.[fam]?.[lvl]?.$value
                      return typeof v === 'string' ? v : undefined
                    }
                    return undefined
                  }
                  const defaults: Record<string, { token: string; hex: string }> = {
                    '--palette-black': { token: 'color/gray/1000', hex: get('color/gray/1000') || '#000000' },
                    '--palette-white': { token: 'color/gray/000', hex: get('color/gray/000') || '#ffffff' },
                    '--palette-alert': { token: 'color/mandy/500', hex: get('color/mandy/500') || get('color/mandy/600') || '#d40d0d' },
                    '--palette-warning': { token: 'color/mandarin/500', hex: get('color/mandarin/500') || '#fc7527' },
                    '--palette-success': { token: 'color/greensheen/500', hex: get('color/greensheen/500') || '#008b38' },
                  }
                  const colors: Record<string, string> = {}
                  Object.entries(defaults).forEach(([cssVar, info]) => { colors[cssVar] = info.hex })
                  applyCssVars(colors)
                } catch {}
                // Notify interested pages/components (e.g., Palettes, Layers) to refresh any derived state
                try { window.dispatchEvent(new CustomEvent('paletteReset')) } catch {}
              }} title="Reset to defaults">
                ↺
              </ActionIcon>
              <ActionIcon variant="default" onClick={() => setIsModalOpen(true)} title="Import / Export">
                ⤓
              </ActionIcon>
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
        <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Import/Export">
          <Group gap="sm">
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                onUpload(e.currentTarget.files?.[0])
                e.currentTarget.value = ''
              }}
            />
            <Button variant="default" onClick={() => downloadCurrentCssVars()}>Download</Button>
          </Group>
        </Modal>

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  )
}


