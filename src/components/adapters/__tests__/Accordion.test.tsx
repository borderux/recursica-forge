import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Accordion } from '../Accordion'
import { KitSwitcher, clearUiKitStorage } from './adapterTestUtils'

describe('Accordion Component (Adapter)', () => {
  beforeEach(async () => {
    clearUiKitStorage()
    document.documentElement.style.cssText = ''
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <UiKitProvider>
        <ThemeModeProvider>
          <UnifiedThemeProvider>
            <KitSwitcher kit="mantine" />
            {ui}
          </UnifiedThemeProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  }

  const waitForAccordion = async (container: HTMLElement) => {
    // First wait for providers to be ready (they might be loading)
    await waitFor(() => {
      const loadingPlaceholders = container.querySelectorAll('[data-testid$="-provider-loading"]')
      if (loadingPlaceholders.length > 0) {
        throw new Error('Providers still loading')
      }
    }, { timeout: 5000 }).catch(() => {
      // If providers don't load quickly, continue anyway
    })
    
    // Then wait for accordion component
    return await waitFor(() => {
      const el = container.querySelector('.recursica-accordion')
      if (!el) throw new Error('Accordion not found')
      return el
    }, { timeout: 15000 })
  }

  it('renders accordion items with titles', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content', open: false },
      { id: 'b', title: 'Second', content: 'Second content', open: true },
    ]
    const { container } = renderWithProviders(<Accordion items={items} allowMultiple />)
    await waitForAccordion(container)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Second content')).toBeInTheDocument()
  })

  it('calls onToggle when an item is toggled', async () => {
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
  })

  it('respects divider visibility per item', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content', divider: true },
      { id: 'b', title: 'Second', content: 'Second content', divider: false },
    ]
    const { container } = renderWithProviders(<Accordion items={items} />)
    await waitForAccordion(container)
    const dividerItems = container.querySelectorAll('[data-divider="true"]')
    expect(dividerItems.length).toBe(1)
  })
})

