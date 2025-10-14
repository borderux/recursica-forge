import { ReactNode } from 'react'
import { AppShell, Group, Title, Button, Select, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function MantineShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
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

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  )
}


