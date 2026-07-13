import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { Accordion } from '../Accordion'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'
import { renderMantine } from '../../../test-utils/renderMantine'

// BROWSER-ONLY suite. This runs under `npm run test:browser` (vitest.browser.config.ts), in a
// real Playwright Chromium browser — NOT in the node/unit run, which excludes *.test.tsx. In a
// headless DOM the Mantine/MUI/Carbon adapters churn and OOM the worker; in a real browser they
// render normally. This is the template for the other adapter suites (convert their describe.skip
// -> describe once verified locally).
describe('Accordion Component (Adapter)', () => {
  beforeAll(async () => {
    // Only Mantine is exercised (the default kit). Resolve the lazy adapter import up front
    // so <Suspense> does not suspend mid-render.
    await preloadComponent('mantine', 'Accordion')
  })

  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  const waitForAccordion = async (container: HTMLElement) => {
    return await waitFor(() => {
      const el = container.querySelector('.recursica-accordion')
      if (!el) throw new Error('Accordion not found')
      return el
    })
  }

  it('renders accordion items with titles', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content', open: false },
      { id: 'b', title: 'Second', content: 'Second content', open: true },
    ]
    const { container } = renderMantine(<Accordion items={items} allowMultiple />)
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
    const { container } = renderMantine(<Accordion items={items} onToggle={onToggle} />)
    await waitForAccordion(container)

    await act(async () => {
      screen.getByText('First').click()
    })

    expect(onToggle).toHaveBeenCalled()
    expect(onToggle).toHaveBeenCalledWith('a', true)
  })

  it('renders items without per-item divider attributes (dividers are CSS-only)', async () => {
    const items = [
      { id: 'a', title: 'First', content: 'First content' },
      { id: 'b', title: 'Second', content: 'Second content' },
    ]
    const { container } = renderMantine(<Accordion items={items} />)
    await waitForAccordion(container)
    // Dividers are now CSS pseudo-elements at the container level, not data attributes
    const dividerItems = container.querySelectorAll('[data-divider]')
    expect(dividerItems.length).toBe(0)
  })
})
