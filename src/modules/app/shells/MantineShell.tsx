import { ReactNode, useEffect, useState } from 'react'
import { AppShell, Group, Title, Button, Select, MantineProvider, Modal } from '@mantine/core'
import '@mantine/core/styles.css'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { applyTheme, LIGHT_MODE } from '../../theme/index'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  useEffect(() => {
    applyTheme(LIGHT_MODE)
  }, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
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
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Title order={3}>
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>recursica-forge</Link>
              </Title>
            </Group>
            <Group gap="xs">
              <Button component={Link} to="/">Home</Button>
              <Button component={Link} to="/theme" variant="light">Theme</Button>
              <Button component={Link} to="/type" variant="subtle">Type</Button>
              <Button variant="default" onClick={() => setIsModalOpen(true)}>Import/Export</Button>
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


