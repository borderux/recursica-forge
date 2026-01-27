import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Accordion } from '../Accordion'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../utils/cssVarNames'
import type { ComponentLayer } from '../../registry/types'

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

  describe('Color Props Updates - All Layers', () => {
    const layers: ComponentLayer[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
    const colorProperties = [
      { name: 'background', cssVar: '--accordion-header-bg' },
      { name: 'background-hover', cssVar: '--accordion-header-hover' },
      { name: 'text', cssVar: '--accordion-header-text' },
      { name: 'icon', cssVar: '--accordion-icon-color' },
      { name: 'divider', cssVar: '--accordion-divider-color' },
      { name: 'content-background', cssVar: '--accordion-content-bg' },
      { name: 'content-text', cssVar: '--accordion-content-text' },
    ]

    layers.forEach((layer) => {
      colorProperties.forEach(({ name, cssVar }) => {
        it(`updates ${name} when toolbar changes ${name} on ${layer}`, async () => {
          const { container } = renderWithProviders(
            <Accordion
              items={[
                { id: 'a', title: 'Item A', content: 'Content A', open: true, divider: name === 'divider' },
              ]}
              layer={layer}
            />
          )

          const root = await waitForAccordion(container)
          const colorVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, name)
          const testColor = `#${layer.replace('layer-', '')}${name === 'background' ? '00000' : name === 'text' ? '11111' : '22222'}`

          await act(async () => {
            updateCssVar(colorVar, testColor)
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [colorVar] } }))
          })

          await waitFor(() => {
            const value = root.style.getPropertyValue(cssVar) || 
                         window.getComputedStyle(root).getPropertyValue(cssVar)
            expect(value).toBeTruthy()
            expect(value).toContain('var(')
            expect(value).toContain(colorVar)
          })
        })
      })
    })
  })

  describe('Component-Level Props Updates', () => {
    it('updates item-padding when toolbar changes item-padding', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const paddingVar = getComponentLevelCssVar('Accordion', 'item-padding')

      await act(async () => {
        updateCssVar(paddingVar, '20px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [paddingVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-item-padding') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-item-padding')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(paddingVar)
      })
    })

    it('updates content-padding when toolbar changes content-padding', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const paddingVar = getComponentLevelCssVar('Accordion', 'content-padding')

      await act(async () => {
        updateCssVar(paddingVar, '24px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [paddingVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-content-padding') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-content-padding')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(paddingVar)
      })
    })

    it('updates icon-size when toolbar changes icon-size', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const iconSizeVar = getComponentLevelCssVar('Accordion', 'icon-size')

      await act(async () => {
        updateCssVar(iconSizeVar, '18px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [iconSizeVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-icon-size') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-icon-size')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(iconSizeVar)
      })
    })

    it('updates icon-gap when toolbar changes icon-gap', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const iconGapVar = getComponentLevelCssVar('Accordion', 'icon-gap')

      await act(async () => {
        updateCssVar(iconGapVar, '12px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [iconGapVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-icon-gap') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-icon-gap')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(iconGapVar)
      })
    })

    it('updates border-radius when toolbar changes border-radius', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const borderRadiusVar = getComponentLevelCssVar('Accordion', 'border-radius')

      await act(async () => {
        updateCssVar(borderRadiusVar, '8px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [borderRadiusVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-border-radius') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-border-radius')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(borderRadiusVar)
      })
    })
  })

  describe('Multiple Props Updates', () => {
    it('handles multiple simultaneous CSS variable updates', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true, divider: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const bgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')
      const textVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'text')
      const paddingVar = getComponentLevelCssVar('Accordion', 'item-padding')

      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
        updateCssVar(textVar, '#0000ff')
        updateCssVar(paddingVar, '20px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
          detail: { cssVars: [bgVar, textVar, paddingVar] } 
        }))
      })

      await waitFor(() => {
        const bgValue = root.style.getPropertyValue('--accordion-header-bg') || 
                       window.getComputedStyle(root).getPropertyValue('--accordion-header-bg')
        const textValue = root.style.getPropertyValue('--accordion-header-text') || 
                         window.getComputedStyle(root).getPropertyValue('--accordion-header-text')
        const paddingValue = root.style.getPropertyValue('--accordion-item-padding') || 
                            window.getComputedStyle(root).getPropertyValue('--accordion-item-padding')
        
        expect(bgValue).toContain(`var(${bgVar})`)
        expect(textValue).toContain(`var(${textVar})`)
        expect(paddingValue).toContain(`var(${paddingVar})`)
      })
    })
  })

  describe('Layer Switching', () => {
    it('updates colors when layer prop changes', async () => {
      const { container, rerender } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
          layer="layer-0"
        />
      )

      const root = await waitForAccordion(container)
      const layer0Var = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')
      const layer1Var = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-1', 'background')

      // Set layer-0 color
      await act(async () => {
        updateCssVar(layer0Var, '#ff0000')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [layer0Var] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-header-bg')
        expect(value).toContain(`var(${layer0Var})`)
      })

      // Switch to layer-1
      await act(async () => {
        rerender(
          <UiKitProvider>
            <ThemeModeProvider>
              <UnifiedThemeProvider>
                <Accordion
                  items={[
                    { id: 'a', title: 'Item A', content: 'Content A', open: true },
                  ]}
                  layer="layer-1"
                />
              </UnifiedThemeProvider>
            </ThemeModeProvider>
          </UiKitProvider>
        )
        updateCssVar(layer1Var, '#00ff00')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [layer1Var] } }))
      })

      await waitFor(() => {
        const newRoot = container.querySelector('.recursica-accordion') as HTMLElement
        const value = newRoot?.style.getPropertyValue('--accordion-header-bg') || 
                     window.getComputedStyle(newRoot!).getPropertyValue('--accordion-header-bg')
        expect(value).toContain(`var(${layer1Var})`)
      })
    })
  })
})

