import { describe, expect, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Table } from '../Table'
import { TableCell } from '../TableCell'
import { TableThead } from '../TableThead'
import { TableTbody } from '../TableTbody'
import { TableTr } from '../TableTr'
import { TableTfoot } from '../TableTfoot'
import { TableFooter } from '../TableFooter'
import { TableHeader } from '../TableHeader'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'
import { itDom } from '../../../test-utils/conditionalTests'

describe('Table Component (Adapter)', () => {
  beforeAll(async () => {
    await Promise.all([
      import('@mantine/core'),
    ])
    await preloadComponent('mantine', 'Table')
    await preloadComponent('mantine', 'TableCell')
    await preloadComponent('mantine', 'TableThead')
    await preloadComponent('mantine', 'TableTbody')
    await preloadComponent('mantine', 'TableTr')
    await preloadComponent('mantine', 'TableTfoot')
    await preloadComponent('mantine', 'TableFooter')
    await preloadComponent('mantine', 'TableHeader')
  })

  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <UiKitProvider>
        <ThemeModeProvider>
          <UnifiedThemeProvider>
            {ui}
          </UnifiedThemeProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  }

  const waitForTable = async (container: HTMLElement) => {
    return await waitFor(() => {
      // `table`, not `.recursica-table`: that class only exists on the local adapter's Table.
      const el = container.querySelector('table')
      if (!el) throw new Error('Table not found')
      return el
    }, { timeout: 90000 })
  }

  it('renders table and table cells', async () => {
    const { container } = renderWithProviders(
      <Table>
        <TableThead>
          <TableTr>
            <TableCell isHeader>Header 1</TableCell>
            <TableCell isHeader>Header 2</TableCell>
          </TableTr>
        </TableThead>
        <TableTbody>
          <TableTr>
            <TableCell>Row 1 Col 1</TableCell>
            <TableCell>Row 1 Col 2</TableCell>
          </TableTr>
        </TableTbody>
      </Table>
    )
    await waitForTable(container)
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Row 1 Col 1')).toBeInTheDocument()
    // Cells must sit in real sections, with nothing (no LayerScope div, no error marker)
    // between the row and its cells.
    expect(screen.getByText('Header 1').closest('th')?.parentElement?.parentElement?.tagName).toBe('THEAD')
    expect(screen.getByText('Row 1 Col 1').closest('td')?.parentElement?.parentElement?.tagName).toBe('TBODY')
    expect(container.querySelector('[data-adapter-error]')).toBeNull()
  }, 120000)

  it('renders header, selected row and footer cells inside their sections on a non-zero layer', async () => {
    const { container } = renderWithProviders(
      <Table layer="layer-1">
        <TableThead>
          <TableTr>
            <TableHeader layer="layer-1" sorted="asc">Name</TableHeader>
            <TableHeader layer="layer-1">Loot</TableHeader>
          </TableTr>
        </TableThead>
        <TableTbody>
          <TableTr selected>
            <TableCell layer="layer-1">Zog</TableCell>
            <TableCell layer="layer-1" variant="currency">12 GP</TableCell>
          </TableTr>
        </TableTbody>
        <TableTfoot>
          <TableTr>
            <TableFooter layer="layer-1">Total</TableFooter>
            <TableFooter layer="layer-1" variant="currency">12 GP</TableFooter>
          </TableTr>
        </TableTfoot>
      </Table>
    )
    await waitForTable(container)
    // Table parts skip LayerScope, so each cell's parent is the row itself (no wrapper div).
    expect(screen.getByText('Name').closest('th')?.parentElement?.tagName).toBe('TR')
    expect(screen.getByText('Zog').closest('td')?.parentElement?.tagName).toBe('TR')
    expect(screen.getByText('Zog').closest('tr')?.getAttribute('data-selected')).toBe('true')
    // TableFooter is a footer CELL (Table.Td inside Table.Tfoot), not a nested <tfoot>.
    const total = screen.getByText('Total').closest('td')
    expect(total?.parentElement?.parentElement?.tagName).toBe('TFOOT')
    expect(container.querySelectorAll('tfoot').length).toBe(1)
    expect(container.querySelector('[data-adapter-error]')).toBeNull()
  }, 120000)
})
