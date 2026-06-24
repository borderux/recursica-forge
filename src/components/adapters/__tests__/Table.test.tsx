import { describe, expect, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Table } from '../Table'
import { TableCell } from '../TableCell'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'
import { itDom } from '../../../test-utils/conditionalTests'

describe('Table Component (Adapter)', () => {
  beforeAll(async () => {
    await Promise.all([
      import('@mantine/core'),
      import('@mui/material/styles'),
      import('@mui/material'),
      import('@carbon/react'),
    ])
    await preloadComponent('mantine', 'Table')
    await preloadComponent('mantine', 'TableCell')
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
      const el = container.querySelector('.recursica-table')
      if (!el) throw new Error('Table not found')
      return el
    }, { timeout: 90000 })
  }

  itDom('renders table and table cells', async () => {
    const { container } = renderWithProviders(
      <Table>
        <thead>
          <tr>
            <TableCell isHeader>Header 1</TableCell>
            <TableCell isHeader>Header 2</TableCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TableCell>Row 1 Col 1</TableCell>
            <TableCell>Row 1 Col 2</TableCell>
          </tr>
        </tbody>
      </Table>
    )
    await waitForTable(container)
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Row 1 Col 1')).toBeInTheDocument()
  }, 120000)
})
