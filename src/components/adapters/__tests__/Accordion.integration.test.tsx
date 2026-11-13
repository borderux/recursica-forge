import { describe, expect, beforeAll, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider, useUiKit } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Accordion } from '../Accordion'
import { preloadComponent } from '../../registry'
import '../../../components/registry/mantine'

function KitSwitcher({ kit }: { kit: 'mantine' }) {
  const { setKit } = useUiKit()
  useEffect(() => {
    setKit(kit)
  }, [kit, setKit])
  return null
}

describe('Accordion Integration', () => {
  beforeAll(async () => {
    // Pre-warm all provider module imports so useState initialisers in UnifiedThemeProvider
    // read from cache synchronously and isLoading starts as false.
    await Promise.all([
      import('@mantine/core'),
    ])
    // Eagerly resolve the lazy import so <Suspense> never suspends during tests.
    await preloadComponent('mantine', 'Accordion')
  })

  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  // Mantine's CSS-in-JS style injection in JSDOM is slow (~30-40s on first cold render).
  // Use plain render() (no act() wrapper) so waitFor can poll while Mantine processes.
  const renderWithKit = (kit: 'mantine') => {
    return render(
      <UiKitProvider>
        <ThemeModeProvider>
          <UnifiedThemeProvider>
            <KitSwitcher kit={kit} />
            <Accordion
              items={[
                { id: 'a', title: 'Item A', content: 'Content A', open: true },
                { id: 'b', title: 'Item B', content: 'Content B' },
              ]}
              allowMultiple
            />
          </UnifiedThemeProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  }

  // Look for the kit-specific class (.mantine-accordion) rather than the generic
  // .recursica-accordion.
  // Mantine's CSS-in-JS is synchronous/blocking in JSDOM (~70s first cold render),
  // so the waitFor timeout must exceed that.
  const waitForAccordion = async (container: HTMLElement, kit: 'mantine') => {
    return await waitFor(() => {
      const el = container.querySelector(`.${kit}-accordion`)
      if (!el) throw new Error(`${kit} Accordion not found`)
      return el
    }, { timeout: 90000 })
  }

  it('renders Mantine accordion when Mantine is selected', async () => {
    const { container } = renderWithKit('mantine')
    const el = await waitForAccordion(container, 'mantine')
    expect(el).toBeInTheDocument()
  }, 120000)
})
