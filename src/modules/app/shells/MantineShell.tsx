import { ReactNode, useEffect, useState } from 'react'
import { AppShell, Group, Title, Button, Select, MantineProvider, Modal, Tabs, ActionIcon } from '@mantine/core'
import '@mantine/core/styles.css'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { applyTheme, LIGHT_MODE } from '../../theme/index'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  useEffect(() => {
    applyTheme(LIGHT_MODE)
  }, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const currentTab = location.pathname.startsWith('/type') ? 'type' : location.pathname.startsWith('/elevation') ? 'elevation' : location.pathname.startsWith('/layers') ? 'layers' : 'color'
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
              const v = (val as string) || 'color'
              if (v === 'color') navigate('/color')
              else navigate(`/${v}`)
            }} keepMounted={false} variant="pills" radius="xl">
              <Tabs.List>
                <Tabs.Tab value="color">Color</Tabs.Tab>
                <Tabs.Tab value="type">Type</Tabs.Tab>
                <Tabs.Tab value="elevation">Elevation</Tabs.Tab>
                <Tabs.Tab value="layers">Layers</Tabs.Tab>
                <Tabs.Tab value="samples">Samples</Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Group gap="xs" wrap="nowrap">
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


