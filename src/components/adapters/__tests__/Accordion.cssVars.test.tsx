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

  it('sets CSS custom properties for Accordion container using UIKit variables', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)

    const containerBgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')
    const containerPaddingVar = getComponentLevelCssVar('Accordion', 'padding')
    const itemGapVar = getComponentLevelCssVar('Accordion', 'item-gap')

    const containerBgValue = root.style.getPropertyValue('--accordion-bg')
    const containerPaddingValue = root.style.getPropertyValue('--accordion-padding')
    const itemGapValue = root.style.getPropertyValue('--accordion-item-gap')

    expect(containerBgValue).toContain(`var(${containerBgVar})`)
    expect(containerPaddingValue).toContain(`var(${containerPaddingVar})`)
    expect(itemGapValue).toContain(`var(${itemGapVar})`)
  })

  it('sets CSS custom properties for AccordionItem using UIKit variables', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)

    const itemHeaderBgVar = buildComponentCssVarPath('AccordionItem', 'properties', 'colors', 'layer-0', 'background')
    const itemPaddingVar = getComponentLevelCssVar('AccordionItem', 'padding')
    const iconSizeVar = getComponentLevelCssVar('AccordionItem', 'icon-size')

    const itemHeaderBgValue = root.style.getPropertyValue('--accordion-item-header-bg')
    const itemPaddingValue = root.style.getPropertyValue('--accordion-item-padding')
    const iconSizeValue = root.style.getPropertyValue('--accordion-item-icon-size')

    expect(itemHeaderBgValue).toContain(`var(${itemHeaderBgVar})`)
    expect(itemPaddingValue).toContain(`var(${itemPaddingVar})`)
    expect(iconSizeValue).toContain(`var(${iconSizeVar})`)
  })
})

