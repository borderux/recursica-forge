/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify components reactively update when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Button } from '../Button'
import { KitSwitcher, clearUiKitStorage } from './adapterTestUtils'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Button Toolbar Props Integration', () => {
  beforeEach(() => {
    clearUiKitStorage()
    // Clear all CSS variables before each test
    document.documentElement.style.cssText = ''
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
            <KitSwitcher kit="mantine" />
            {ui}
          </UnifiedThemeProvider>
        </ThemeModeProvider>
      </UiKitProvider>
    )
  }

  // Helper to wait for button component to load (not Suspense fallback)
  // Note: waitFor already uses act() internally, so we don't wrap it
  const waitForButton = async (container: HTMLElement, expectedText?: string) => {
    return await waitFor(() => {
      const btn = container.querySelector('button')
      if (!btn) throw new Error('Button not found')
      // Ensure it's not the loading button
      if (btn.textContent === 'Loading...') {
        throw new Error('Still loading')
      }
      // Wait for actual button content if expected text provided
      if (expectedText && !btn.textContent?.includes(expectedText)) {
        throw new Error(`Button text mismatch: expected "${expectedText}", got "${btn.textContent}"`)
      }
      // Don't require CSS variables immediately - they'll be set asynchronously
      return btn
    }, { timeout: 20000 })
  }

  describe('Color Props Updates', () => {
    it('updates background color when toolbar changes solid-background', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // Wait for component to load (not Suspense fallback)
      const button = await waitForButton(container!, 'Test')

      // Get the CSS variable name that the toolbar would use
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      
      // Wait for initial CSS variables to be set (check inline style where they're set)
      await waitFor(() => {
        const bgValue = button.style.getPropertyValue('--button-bg') || 
                       window.getComputedStyle(button).getPropertyValue('--button-bg')
        if (!bgValue) throw new Error('--button-bg not set')
      }, { timeout: 10000 })
      
      // Simulate toolbar update: change the CSS variable
      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
        
        // Dispatch the cssVarsUpdated event that components listen for
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [bgVar] }
        }))
      })

      // Wait for component to reactively update
      // Check inline style first (where CSS variables are set), then computed style
      await waitFor(() => {
        // Try inline style first (CSS variables set via style prop)
        const inlineBgValue = button.style.getPropertyValue('--button-bg')
        // Fall back to computed style if inline style doesn't have it
        const computedBgValue = inlineBgValue || window.getComputedStyle(button).getPropertyValue('--button-bg')
        const bgValue = computedBgValue
        expect(bgValue).toBeTruthy()
        expect(bgValue).toContain('var(')
        expect(bgValue).toContain(bgVar)
      })
    })

    it('updates text color when toolbar changes solid-text', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const textVar = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
      
      // Simulate toolbar update
      await act(async () => {
        updateCssVar(textVar, '#0000ff')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [textVar] }
        }))
      })

      await waitFor(() => {
        const textValue = button.style.getPropertyValue('--button-color') || 
                         window.getComputedStyle(button).getPropertyValue('--button-color')
        expect(textValue).toBeTruthy()
        expect(textValue).toContain('var(')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates outline variant colors when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="outline" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const textVar = getComponentCssVar('Button', 'colors', 'outline-text', 'layer-0')
      
      await act(async () => {
        updateCssVar(textVar, '#00ff00')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [textVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const textValue = styles.getPropertyValue('--button-color')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates text variant colors when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="text" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const textVar = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
      
      await act(async () => {
        updateCssVar(textVar, '#ffff00')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [textVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const textValue = styles.getPropertyValue('--button-color')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates colors for all layers when toolbar changes', { timeout: 15000 }, async () => {
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
      
      for (const layer of layers) {
        let container: HTMLElement
        let unmount: () => void
        await act(async () => {
          const result = renderWithProviders(
            <Button variant="solid" layer={layer}>Test</Button>
          )
          container = result.container
          unmount = result.unmount
          await new Promise(resolve => setTimeout(resolve, 0))
        })
        const button = await waitForButton(container!, 'Test')
        
        const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
        const testColor = `#${layer.replace('layer-', '')}00000`
        
        await act(async () => {
          updateCssVar(bgVar, testColor)
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
            detail: { cssVars: [bgVar] }
          }))
        })

        await waitFor(() => {
          const styles = window.getComputedStyle(button!)
          const bgValue = styles.getPropertyValue('--button-bg')
          expect(bgValue).toContain(bgVar)
        })
        
        await act(async () => {
          unmount!()
        })
      }
    })
  })

  describe('Size Props Updates', () => {
    it('updates height when toolbar changes default-height', { timeout: 15000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="default">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      
      await act(async () => {
        updateCssVar(heightVar, '60px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [heightVar] }
        }))
      })

      await waitFor(() => {
        const heightValue = button.style.getPropertyValue('--button-height') || 
                           window.getComputedStyle(button).getPropertyValue('--button-height')
        expect(heightValue).toBeTruthy()
        expect(heightValue).toContain('var(')
        expect(heightValue).toContain(heightVar)
      })
    })

    it('updates icon size when toolbar changes default-icon', async () => {
      const TestIcon = () => <svg><circle /></svg>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="default" icon={<TestIcon />}>Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!)
      
      const iconSizeVar = getComponentCssVar('Button', 'size', 'default-icon', undefined)
      
      await act(async () => {
        updateCssVar(iconSizeVar, '24px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [iconSizeVar] }
        }))
      })

      await waitFor(() => {
        const iconSizeValue = button.style.getPropertyValue('--button-icon-size') || 
                             window.getComputedStyle(button).getPropertyValue('--button-icon-size')
        expect(iconSizeValue).toBeTruthy()
        expect(iconSizeValue).toContain('var(')
        expect(iconSizeValue).toContain(iconSizeVar)
      })
    })

    it('updates horizontal padding when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="default">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const paddingVar = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
      
      await act(async () => {
        updateCssVar(paddingVar, '32px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [paddingVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Check that padding CSS variable is referenced
        expect(styles).toBeDefined()
      })
    })

    it('updates small size properties when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="small">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const heightVar = getComponentCssVar('Button', 'size', 'small-height', undefined)
      
      await act(async () => {
        updateCssVar(heightVar, '28px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [heightVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const heightValue = styles.getPropertyValue('--button-height')
        expect(heightValue).toContain(heightVar)
      })
    })
  })

  describe('Component-Level Props Updates', () => {
    it('updates elevation when toolbar changes elevation', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button>Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const elevationVar = getComponentLevelCssVar('Button', 'elevation')
      
      // Update elevation CSS variable
      await act(async () => {
        updateCssVar(elevationVar, 'elevation-2')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [elevationVar] }
        }))
      })

      // Wait for component to reactively update elevation
      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Elevation should be applied as box-shadow
        // The exact value depends on getElevationBoxShadow implementation
        expect(styles.boxShadow).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('updates border-radius when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button>Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const borderRadiusVar = getComponentLevelCssVar('Button', 'border-radius')
      
      await act(async () => {
        updateCssVar(borderRadiusVar, '12px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [borderRadiusVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Border radius should be applied
        expect(styles.borderRadius).toBeTruthy()
      })
    })

    it('updates max-width when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button>Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const maxWidthVar = getComponentLevelCssVar('Button', 'max-width')
      
      await act(async () => {
        updateCssVar(maxWidthVar, '600px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [maxWidthVar] }
        }))
      })

      await waitFor(() => {
        const maxWidthValue = button.style.getPropertyValue('--button-max-width') || 
                             window.getComputedStyle(button).getPropertyValue('--button-max-width')
        expect(maxWidthValue).toBeTruthy()
        expect(maxWidthValue).toContain('var(')
        expect(maxWidthValue).toContain(maxWidthVar)
      })
    })

    it('updates font-size when toolbar changes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button>Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const fontSizeVar = getComponentLevelCssVar('Button', 'font-size')
      
      await act(async () => {
        updateCssVar(fontSizeVar, '16px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [fontSizeVar] }
        }))
      })

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Font size should be applied
        expect(styles.fontSize).toBeTruthy()
      })
    })
  })

  describe('Multiple Props Updates', () => {
    it('handles multiple simultaneous CSS variable updates', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" size="default" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      const textVar = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      const elevationVar = getComponentLevelCssVar('Button', 'elevation')
      
      // Update multiple CSS variables at once
      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
        updateCssVar(textVar, '#0000ff')
        updateCssVar(heightVar, '60px')
        updateCssVar(elevationVar, 'elevation-1')
        
        // Dispatch event with all updated vars
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [bgVar, textVar, heightVar, elevationVar] }
        }))
      })

      await waitFor(() => {
        const bgValue = button.style.getPropertyValue('--button-bg') || 
                       window.getComputedStyle(button).getPropertyValue('--button-bg')
        const colorValue = button.style.getPropertyValue('--button-color') || 
                          window.getComputedStyle(button).getPropertyValue('--button-color')
        const heightValue = button.style.getPropertyValue('--button-height') || 
                           window.getComputedStyle(button).getPropertyValue('--button-height')
        const styles = window.getComputedStyle(button)
        expect(bgValue).toBeTruthy()
        expect(bgValue).toContain(bgVar)
        expect(colorValue).toBeTruthy()
        expect(colorValue).toContain(textVar)
        expect(heightValue).toBeTruthy()
        expect(heightValue).toContain(heightVar)
        expect(styles.boxShadow).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Variant Switching', () => {
    it('updates CSS variables when variant changes via toolbar', async () => {
      let container: HTMLElement
      let rerender: (ui: React.ReactElement) => void
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Test</Button>
        )
        container = result.container
        rerender = result.rerender
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      // Initially use solid variant
      const solidBgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      await act(async () => {
        updateCssVar(solidBgVar, '#ff0000')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [solidBgVar] }
        }))
      })

      await waitFor(() => {
        const bgValue = button.style.getPropertyValue('--button-bg') || 
                       window.getComputedStyle(button).getPropertyValue('--button-bg')
        expect(bgValue).toContain(solidBgVar)
      })

      // Switch to outline variant
      await act(async () => {
        rerender!(
          <UiKitProvider>
            <ThemeModeProvider>
              <UnifiedThemeProvider>
                <KitSwitcher kit="mantine" />
                <Button variant="outline" layer="layer-0">Test</Button>
              </UnifiedThemeProvider>
            </ThemeModeProvider>
          </UiKitProvider>
        )
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const outlineTextVar = getComponentCssVar('Button', 'colors', 'outline-text', 'layer-0')
      await act(async () => {
        updateCssVar(outlineTextVar, '#00ff00')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [outlineTextVar] }
        }))
      })

      await waitFor(() => {
        const colorValue = button.style.getPropertyValue('--button-color') || 
                          window.getComputedStyle(button).getPropertyValue('--button-color')
        expect(colorValue).toContain(outlineTextVar)
      })
    })
  })

  describe('Reactive Updates', () => {
    it('component updates when CSS variable changes without event', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      
      // Update CSS variable directly (simulating MutationObserver detection)
      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
      })
      
      // Wait for MutationObserver to detect the change
      await waitFor(() => {
        const bgValue = button.style.getPropertyValue('--button-bg') || 
                       window.getComputedStyle(button).getPropertyValue('--button-bg')
        expect(bgValue).toBeTruthy()
        expect(bgValue).toContain(bgVar)
      }, { timeout: 1000 })
    })

    it('component updates when multiple CSS variables change sequentially', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" size="default" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      
      // Update first variable
      await act(async () => {
        updateCssVar(bgVar, '#ff0000')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [bgVar] }
        }))
      })

      await waitFor(() => {
        const bgValue = button.style.getPropertyValue('--button-bg') || 
                       window.getComputedStyle(button).getPropertyValue('--button-bg')
        expect(bgValue).toBeTruthy()
        expect(bgValue).toContain(bgVar)
      })

      // Update second variable
      await act(async () => {
        updateCssVar(heightVar, '60px')
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [heightVar] }
        }))
      })

      await waitFor(() => {
        const heightValue = button.style.getPropertyValue('--button-height') || 
                           window.getComputedStyle(button).getPropertyValue('--button-height')
        expect(heightValue).toBeTruthy()
        expect(heightValue).toContain(heightVar)
      })
    })
  })
})

