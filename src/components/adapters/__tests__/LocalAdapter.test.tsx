import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Render a few components through the public dispatchers with the local adapter active, to prove
// the local registry + dispatchers are wired end to end (the other adapter tests run against
// the real adapter).
describe('local adapter wiring', () => {
  let Button: typeof import('../Button').Button
  let T: {
    Table: typeof import('../Table').Table
    TableThead: typeof import('../TableThead').TableThead
    TableTbody: typeof import('../TableTbody').TableTbody
    TableTfoot: typeof import('../TableTfoot').TableTfoot
    TableTr: typeof import('../TableTr').TableTr
    TableHeader: typeof import('../TableHeader').TableHeader
    TableCell: typeof import('../TableCell').TableCell
    TableFooter: typeof import('../TableFooter').TableFooter
  }
  let Providers: React.ComponentType<{ children: React.ReactNode }>

  beforeAll(async () => {
    window.localStorage.setItem('recursica:mantine-adapter', 'local')
    vi.resetModules()
    await import('../../registry/local')
    const { preloadComponent } = await import('../../registry')
    await preloadComponent('local', 'Button')
    ;({ Button } = await import('../Button'))
    const tableParts = ['Table', 'TableThead', 'TableTbody', 'TableTfoot', 'TableTr', 'TableHeader', 'TableCell', 'TableFooter'] as const
    await Promise.all(tableParts.map((name) => preloadComponent('local', name)))
    T = {
      Table: (await import('../Table')).Table,
      TableThead: (await import('../TableThead')).TableThead,
      TableTbody: (await import('../TableTbody')).TableTbody,
      TableTfoot: (await import('../TableTfoot')).TableTfoot,
      TableTr: (await import('../TableTr')).TableTr,
      TableHeader: (await import('../TableHeader')).TableHeader,
      TableCell: (await import('../TableCell')).TableCell,
      TableFooter: (await import('../TableFooter')).TableFooter,
    }
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

  it('renders a Table composed only from Table parts, with real sections and rows', async () => {
    const { Table, TableThead, TableTbody, TableTfoot, TableTr, TableHeader, TableCell, TableFooter } = T
    const { container } = render(
      <Providers>
        <Table>
          <TableThead>
            <TableTr>
              <TableHeader>Name</TableHeader>
            </TableTr>
          </TableThead>
          <TableTbody>
            <TableTr selected>
              <TableCell>Zog</TableCell>
            </TableTr>
          </TableTbody>
          <TableTfoot>
            <TableTr>
              <TableFooter>Total</TableFooter>
            </TableTr>
          </TableTfoot>
        </Table>
      </Providers>
    )
    await waitFor(() => expect(screen.getByText('Total')).toBeInTheDocument())
    expect(container.querySelector('.recursica-table')).not.toBeNull()
    expect(screen.getByText('Name').closest('thead')).not.toBeNull()
    expect(screen.getByText('Zog').closest('tr')?.getAttribute('data-selected')).toBe('true')
    expect(screen.getByText('Zog').closest('tbody')).not.toBeNull()
    expect(screen.getByText('Total').closest('tfoot')).not.toBeNull()
    expect(screen.queryByText(/not implemented|no adapter/i)).toBeNull()
  })
})
