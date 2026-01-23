import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Accordion } from '../Accordion'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath } from '../../utils/cssVarNames'

describe('Accordion Toolbar Props Integration', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
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

  it('updates header background when toolbar changes background', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)
    const bgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')

    await act(async () => {
      updateCssVar(bgVar, '#ff0000')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [bgVar] } }))
    })

    await waitFor(() => {
      const bgValue = root.style.getPropertyValue('--accordion-header-bg')
      expect(bgValue).toContain(`var(${bgVar})`)
    })
  })

  it('updates divider color when toolbar changes divider', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true, divider: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)
    const dividerVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'divider')

    await act(async () => {
      updateCssVar(dividerVar, '#dddddd')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [dividerVar] } }))
    })

    await waitFor(() => {
      const colorValue = root.style.getPropertyValue('--accordion-divider-color')
      expect(colorValue).toContain(`var(${dividerVar})`)
    })
  })

  it('updates content text when toolbar changes content-text', async () => {
    const { container } = renderWithProviders(
      <Accordion
        items={[
          { id: 'a', title: 'Item A', content: 'Content A', open: true },
        ]}
      />
    )

    const root = await waitForAccordion(container)
    const textVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'content-text')

    await act(async () => {
      updateCssVar(textVar, '#222222')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [textVar] } }))
    })

    await waitFor(() => {
      const textValue = root.style.getPropertyValue('--accordion-content-text')
      expect(textValue).toContain(`var(${textVar})`)
    })
  })
})

