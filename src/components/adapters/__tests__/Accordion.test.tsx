import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Accordion } from '../Accordion'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'
import { itDom } from '../../../test-utils/conditionalTests'

describe('Accordion Component (Adapter)', () => {
  beforeAll(async () => {
    // Pre-warm all provider module imports so useState initialisers in UnifiedThemeProvider
    // read from cache synchronously and isLoading starts as false.
    await Promise.all([
      import('@mantine/core'),
      import('@mui/material/styles'),
      import('@mui/material'),
      import('@carbon/react'),
    ])
    // Eagerly resolve the lazy import so <Suspense> does not suspend during tests.
    await preloadComponent('mantine', 'Accordion')
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

  // Mantine's CSS-in-JS style injection in JSDOM is synchronous and blocks the event loop
  // for ~70s on the first cold render. waitFor and per-test timeouts must both exceed that.
  const waitForAccordion = async (container: HTMLElement) => {
    return await waitFor(() => {
      const el = container.querySelector('.recursica-accordion')
      if (!el) throw new Error('Accordion not found')
      return el
    }, { timeout: 90000 })
  }

  itDom('renders accordion items with titles', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content', open: false },
      { id: 'b', title: 'Second', content: 'Second content', open: true },
    ]
    const { container } = renderWithProviders(<Accordion items={items} allowMultiple />)
    await waitForAccordion(container)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Second content')).toBeInTheDocument()
  }, 120000)

  itDom('calls onToggle when an item is toggled', async () => {
    const onToggle = vi.fn()
    const items = [
      { id: 'a', title: 'First', content: 'First content', open: false },
      { id: 'b', title: 'Second', content: 'Second content', open: false },
    ]
    const { container } = renderWithProviders(
      <Accordion items={items} onToggle={onToggle} />
    )
    await waitForAccordion(container)

    await act(async () => {
      screen.getByText('First').click()
    })

    expect(onToggle).toHaveBeenCalled()
    expect(onToggle).toHaveBeenCalledWith('a', true)
  }, 60000)

  itDom('renders items without per-item divider attributes (dividers are CSS-only)', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content' },
      { id: 'b', title: 'Second', content: 'Second content' },
    ]
    const { container } = renderWithProviders(<Accordion items={items} />)
    await waitForAccordion(container)
    // Dividers are now CSS pseudo-elements at the container level, not data attributes
    const dividerItems = container.querySelectorAll('[data-divider]')
    expect(dividerItems.length).toBe(0)
  }, 60000)
})
