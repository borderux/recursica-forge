import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Render a few components through the public dispatchers with the local adapter active, to prove
// the local registry + dispatchers are wired end to end (the other adapter tests run against
// the real adapter).
describe('local adapter wiring', () => {
  let Button: typeof import('../Button').Button
  let Providers: React.ComponentType<{ children: React.ReactNode }>

  beforeAll(async () => {
    window.localStorage.setItem('recursica:mantine-adapter', 'local')
    vi.resetModules()
    await import('../../registry/local')
    const { preloadComponent } = await import('../../registry')
    await preloadComponent('local', 'Button')
    ;({ Button } = await import('../Button'))
    const { UiKitProvider } = await import('../../../modules/uikit/UiKitContext')
    const { ThemeModeProvider } = await import('../../../modules/theme/ThemeModeContext')
    const { MantineProvider } = await import('@mantine/core')
    Providers = ({ children }) => (
      <UiKitProvider>
        <ThemeModeProvider>
          <MantineProvider>{children}</MantineProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  })

  it('renders Button from the local adapter, not the shared fallback', async () => {
    render(
      <Providers>
        <Button>Save</Button>
      </Providers>
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument())
    expect(screen.queryByText(/not implemented|no adapter/i)).toBeNull()
  })
})
