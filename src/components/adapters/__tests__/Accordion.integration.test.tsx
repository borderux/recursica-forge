import { describe, it, expect, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider, useUiKit } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Accordion } from '../Accordion'

function KitSwitcher({ kit }: { kit: 'mantine' | 'material' | 'carbon' }) {
  const { setKit } = useUiKit()
  useEffect(() => {
    setKit(kit)
  }, [kit, setKit])
  return null
}

describe('Accordion Integration', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  const renderWithKit = async (kit: 'mantine' | 'material' | 'carbon') => {
    let result: ReturnType<typeof render>
    await act(async () => {
      result = render(
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
      await new Promise(resolve => setTimeout(resolve, kit === 'material' ? 100 : 50))
    })
    return result!
  }

  const waitForAccordion = async (container: HTMLElement) => {
    return await waitFor(() => {
      const el = container.querySelector('.recursica-accordion')
      if (!el) throw new Error('Accordion not found')
      return el
    }, { timeout: 20000 })
  }

  it('renders Mantine accordion when Mantine is selected', async () => {
    const { container } = await renderWithKit('mantine')
    const el = await waitForAccordion(container)
    expect(el).toBeInTheDocument()
  })

  it('renders Material accordion when Material is selected', async () => {
    const { container } = await renderWithKit('material')
    const el = await waitForAccordion(container)
    expect(el).toBeInTheDocument()
  })

  it('renders Carbon accordion when Carbon is selected', async () => {
    const { container } = await renderWithKit('carbon')
    const el = await waitForAccordion(container)
    expect(el).toBeInTheDocument()
  })
})

