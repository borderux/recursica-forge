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

    // Wait for CSS variables to be set (they might be set asynchronously)
    await waitFor(() => {
      const containerBgValue = root.style.getPropertyValue('--accordion-bg') || 
                               window.getComputedStyle(root).getPropertyValue('--accordion-bg')
      const containerPaddingValue = root.style.getPropertyValue('--accordion-padding') || 
                                    window.getComputedStyle(root).getPropertyValue('--accordion-padding')
      const itemGapValue = root.style.getPropertyValue('--accordion-item-gap') || 
                          window.getComputedStyle(root).getPropertyValue('--accordion-item-gap')
      
      if (!containerBgValue || !containerPaddingValue || !itemGapValue) {
        throw new Error('CSS variables not set yet')
      }
      
      expect(containerBgValue).toContain(`var(${containerBgVar})`)
      expect(containerPaddingValue).toContain(`var(${containerPaddingVar})`)
      expect(itemGapValue).toContain(`var(${itemGapVar})`)
    }, { timeout: 10000 })
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

    // Wait for CSS variables to be set (they might be set asynchronously)
    await waitFor(() => {
      const itemHeaderBgValue = root.style.getPropertyValue('--accordion-item-header-bg') || 
                                window.getComputedStyle(root).getPropertyValue('--accordion-item-header-bg')
      const itemPaddingValue = root.style.getPropertyValue('--accordion-item-padding') || 
                              window.getComputedStyle(root).getPropertyValue('--accordion-item-padding')
      const iconSizeValue = root.style.getPropertyValue('--accordion-item-icon-size') || 
                           window.getComputedStyle(root).getPropertyValue('--accordion-item-icon-size')
      
      if (!itemHeaderBgValue || !itemPaddingValue || !iconSizeValue) {
        throw new Error('CSS variables not set yet')
      }
      
      expect(itemHeaderBgValue).toContain(`var(${itemHeaderBgVar})`)
      expect(itemPaddingValue).toContain(`var(${itemPaddingVar})`)
      expect(iconSizeValue).toContain(`var(${iconSizeVar})`)
    }, { timeout: 10000 })
  })
})

