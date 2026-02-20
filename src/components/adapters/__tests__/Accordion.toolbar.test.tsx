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
  beforeEach(async () => {
    document.documentElement.style.cssText = ''
    await new Promise(resolve => setTimeout(resolve, 200))
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
    }, { timeout: 30000 })
  }

  describe.skip('Accordion Container Color Props Updates - All Layers', () => {
    const layers: ComponentLayer[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
    const colorProperties = [
      { name: 'background', cssVar: '--accordion-bg' },
      { name: 'border', cssVar: '--accordion-border' },
    ]

    layers.forEach((layer) => {
      colorProperties.forEach(({ name, cssVar }) => {
        it(`updates ${name} when toolbar changes ${name} on ${layer}`, async () => {
          const { container } = renderWithProviders(
            <Accordion
              items={[
                { id: 'a', title: 'Item A', content: 'Content A', open: true },
              ]}
              layer={layer}
            />
          )

          const root = await waitForAccordion(container)
          const colorVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', layer, name)
          const testColor = `#${layer.replace('layer-', '')}${name === 'background' ? '00000' : '11111'}`

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
          }, { timeout: 10000 })
        })
      })
    })
  })

  describe.skip('Accordion Container Component-Level Props Updates', () => {
    it('updates border-size when toolbar changes border-size', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const borderSizeVar = getComponentLevelCssVar('Accordion', 'border-size')

      await act(async () => {
        updateCssVar(borderSizeVar, '2px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [borderSizeVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-border-size') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-border-size')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(borderSizeVar)
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

    it('updates item-gap when toolbar changes item-gap', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
            { id: 'b', title: 'Item B', content: 'Content B', open: false },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const itemGapVar = getComponentLevelCssVar('Accordion', 'item-gap')

      await act(async () => {
        updateCssVar(itemGapVar, '16px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [itemGapVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-item-gap') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-item-gap')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(itemGapVar)
      })
    })

    it('updates padding when toolbar changes padding', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const paddingVar = getComponentLevelCssVar('Accordion', 'padding')

      await act(async () => {
        updateCssVar(paddingVar, '16px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [paddingVar] } }))
      })

      await waitFor(() => {
        const value = root.style.getPropertyValue('--accordion-padding') || 
                     window.getComputedStyle(root).getPropertyValue('--accordion-padding')
        expect(value).toBeTruthy()
        expect(value).toContain('var(')
        expect(value).toContain(paddingVar)
      })
    })
  })

  describe('Multiple Props Updates', () => {
    it.skip('handles multiple simultaneous CSS variable updates for Accordion container', async () => {
      const { container } = renderWithProviders(
        <Accordion
          items={[
            { id: 'a', title: 'Item A', content: 'Content A', open: true },
          ]}
        />
      )

      const root = await waitForAccordion(container)
      const bgVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background')
      const borderVar = buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'border')
      const paddingVar = getComponentLevelCssVar('Accordion', 'padding')

      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
        updateCssVar(borderVar, '#0000ff')
        updateCssVar(paddingVar, '16px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
          detail: { cssVars: [bgVar, borderVar, paddingVar] } 
        }))
      })

      await waitFor(() => {
        const bgValue = root.style.getPropertyValue('--accordion-bg') || 
                       window.getComputedStyle(root).getPropertyValue('--accordion-bg')
        const borderValue = root.style.getPropertyValue('--accordion-border') || 
                           window.getComputedStyle(root).getPropertyValue('--accordion-border')
        const paddingValue = root.style.getPropertyValue('--accordion-padding') || 
                            window.getComputedStyle(root).getPropertyValue('--accordion-padding')
        
        expect(bgValue).toContain(`var(${bgVar})`)
        expect(borderValue).toContain(`var(${borderVar})`)
        expect(paddingValue).toContain(`var(${paddingVar})`)
      })
    })
  })

  describe.skip('Layer Switching', () => {
    it('updates Accordion container colors when layer prop changes', async () => {
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
        const value = root.style.getPropertyValue('--accordion-bg')
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
        const value = newRoot?.style.getPropertyValue('--accordion-bg') || 
                     window.getComputedStyle(newRoot!).getPropertyValue('--accordion-bg')
        expect(value).toContain(`var(${layer1Var})`)
      })
    })
  })
})

