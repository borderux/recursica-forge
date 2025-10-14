import { AppShell, Group, Title, Button } from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
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
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}


