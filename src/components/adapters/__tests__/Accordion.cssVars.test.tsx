import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { Accordion } from '../Accordion'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../utils/cssVarNames'

describe('Accordion CSS Variables', () => {
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

  const waitForAccordion = async (container: HTMLElement) => {
    return await waitFor(() => {
      const el = container.querySelector('.recursica-accordion') as HTMLElement | null
      if (!el) throw new Error('Accordion not found')
      return el
    }, { timeout: 15000 })
  }

  it('sets CSS custom properties using UIKit variables', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)

    const headerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')
    const itemPaddingVar = getComponentLevelCssVar('Accordion', 'item-padding')

    const headerBgValue = root.style.getPropertyValue('--accordion-header-bg')
    const itemPaddingValue = root.style.getPropertyValue('--accordion-item-padding')

    expect(headerBgValue).toContain(`var(${headerBgVar})`)
    expect(itemPaddingValue).toContain(`var(${itemPaddingVar})`)
  })
})

