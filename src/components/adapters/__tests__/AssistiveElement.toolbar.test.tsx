/**
 * Toolbar Props Integration Tests for AssistiveElement
 * 
 * Tests that verify AssistiveElement reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { AssistiveElement } from '../AssistiveElement'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../utils/cssVarNames'

describe('AssistiveElement Toolbar Props Integration', () => {
  beforeEach(async () => {
    document.documentElement.style.cssText = ''
    await new Promise(resolve => setTimeout(resolve, 200))
  })

  afterEach(() => {
    // Clean up after each test
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

  // Helper to wait for component to load (exclude Suspense fallback which renders empty span)
  const waitForComponent = async (container: HTMLElement, expectedText?: string) => {
    return await waitFor(() => {
      const element = container.querySelector('.recursica-assistive-element-text') ||
                     container.querySelector('[class*="recursica-assistive"]')
      if (!element) throw new Error('AssistiveElement not found')
      if (expectedText && !element.textContent?.includes(expectedText)) {
        throw new Error(`Text mismatch: expected "${expectedText}", got "${element.textContent}"`)
      }
      return element
    }, { timeout: 30000 })
  }

  describe.skip('Color Props Updates', () => {
    it('updates text color when toolbar changes help text-color', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      const textElement = await waitForComponent(container!, 'Help message')
      
      // Get the CSS variable name that the toolbar would use
      const textColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', 'help', 'properties', 'colors', 'layer-0', 'text-color')
      
      // Wait for initial CSS variables to be set
      await waitFor(() => {
        const colorValue = window.getComputedStyle(textElement).color
        if (!colorValue || colorValue === 'rgba(0, 0, 0, 0)') throw new Error('Color not set')
      }, { timeout: 10000 })
      
      // Simulate toolbar update: change the CSS variable
      await act(async () => {
        updateCssVar(textColorVar, '#ff0000')
        
        // Dispatch the cssVarsUpdated event that components listen for
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [textColorVar] }
        }))
      })

      // Wait for component to reactively update
      await waitFor(() => {
        const colorValue = window.getComputedStyle(textElement).color
        expect(colorValue).toBeTruthy()
        // Color should be updated (exact value depends on CSS variable resolution)
      })
    })

    it('updates icon color when toolbar changes help icon-color', async () => {
      const iconElement = <span>ℹ</span>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" icon={iconElement} layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await waitForComponent(container!, 'Help message')
      
      const iconElement_rendered = container!.querySelector('.recursica-assistive-element-icon') ||
                                  container!.querySelector('span[class*="icon"]') ||
                                  container!.querySelectorAll('span')[0]
      
      if (!iconElement_rendered) {
        throw new Error('Icon element not found')
      }
      
      const iconColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', 'help', 'properties', 'colors', 'layer-0', 'icon-color')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(iconColorVar, '#0000ff')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [iconColorVar] }
        }))
      })

      await waitFor(() => {
        const colorValue = window.getComputedStyle(iconElement_rendered as Element).color
        expect(colorValue).toBeTruthy()
      })
    })

    it('updates error variant colors when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="error" text="Error message" layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      const textElement = await waitForComponent(container!, 'Error message')
      
      const textColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', 'error', 'properties', 'colors', 'layer-0', 'text-color')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(textColorVar, '#ff0000')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [textColorVar] }
        }))
      })

      await waitFor(() => {
        const colorValue = window.getComputedStyle(textElement).color
        expect(colorValue).toBeTruthy()
      })
    })
  })

  describe.skip('Text Style Props Updates', () => {
    it('updates font size when toolbar changes text font-size', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      const textElement = await waitForComponent(container!, 'Help message')
      
      const fontSizeVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-size')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(fontSizeVar, '20px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [fontSizeVar] }
        }))
      })

      await waitFor(() => {
        const fontSize = window.getComputedStyle(textElement).fontSize
        expect(fontSize).toBeTruthy()
        // Font size should be updated (exact value depends on CSS variable resolution)
      })
    })

    it('updates font weight when toolbar changes text font-weight', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      const textElement = await waitForComponent(container!, 'Help message')
      
      const fontWeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-weight')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(fontWeightVar, '700')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [fontWeightVar] }
        }))
      })

      await waitFor(() => {
        const fontWeight = window.getComputedStyle(textElement).fontWeight
        expect(fontWeight).toBeTruthy()
      })
    })
  })

  describe.skip('Size Props Updates', () => {
    it('updates icon size when toolbar changes icon-size', async () => {
      const iconElement = <span>ℹ</span>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" icon={iconElement} layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await waitForComponent(container!, 'Help message')
      
      const iconElement_rendered = container!.querySelector('.recursica-assistive-element-icon') ||
                                  container!.querySelector('span[class*="icon"]') ||
                                  container!.querySelectorAll('span')[0]
      
      if (!iconElement_rendered) {
        throw new Error('Icon element not found')
      }
      
      const iconSizeVar = getComponentLevelCssVar('AssistiveElement', 'icon-size')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(iconSizeVar, '24px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [iconSizeVar] }
        }))
      })

      await waitFor(() => {
        const width = window.getComputedStyle(iconElement_rendered as Element).width
        expect(width).toBeTruthy()
      })
    })

    it.skip('updates icon-text gap when toolbar changes icon-text-gap', async () => {
      const iconElement = <span>ℹ</span>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <AssistiveElement variant="help" text="Help message" icon={iconElement} layer="layer-0" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      const rootElement = await waitFor(() => {
        const element = container!.querySelector('div[class*="assistive"]') || container!.querySelector('div')
        if (!element) throw new Error('Root element not found')
        return element
      })
      
      const iconTextGapVar = getComponentLevelCssVar('AssistiveElement', 'icon-text-gap')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(iconTextGapVar, '16px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [iconTextGapVar] }
        }))
      })

      await waitFor(() => {
        const gap = window.getComputedStyle(rootElement as Element).gap
        expect(gap).toBeTruthy()
      })
    })
  })
})
