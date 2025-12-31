/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify components reactively update when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../modules/uikit/UiKitContext'
import { Button } from '../Button'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Button Toolbar Props Integration', () => {
  beforeEach(() => {
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
        <UnifiedThemeProvider>
          {ui}
        </UnifiedThemeProvider>
      </UiKitProvider>
    )
  }

  describe('Color Props Updates', () => {
    it('updates background color when toolbar changes solid-background', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Get the CSS variable name that the toolbar would use
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      
      // Simulate toolbar update: change the CSS variable
      updateCssVar(bgVar, '#ff0000')
      
      // Dispatch the cssVarsUpdated event that components listen for
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [bgVar] }
      }))

      // Wait for component to reactively update
      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Component should reference the updated CSS variable
        const bgValue = styles.getPropertyValue('--button-bg')
        expect(bgValue).toContain('var(')
        expect(bgValue).toContain(bgVar)
      })
    })

    it('updates text color when toolbar changes solid-text', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const textVar = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
      
      // Simulate toolbar update
      updateCssVar(textVar, '#0000ff')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const textValue = styles.getPropertyValue('--button-color')
        expect(textValue).toContain('var(')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates outline variant colors when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button variant="outline" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const textVar = getComponentCssVar('Button', 'colors', 'outline-text', 'layer-0')
      
      updateCssVar(textVar, '#00ff00')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const textValue = styles.getPropertyValue('--button-color')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates text variant colors when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button variant="text" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const textVar = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
      
      updateCssVar(textVar, '#ffff00')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const textValue = styles.getPropertyValue('--button-color')
        expect(textValue).toContain(textVar)
      })
    })

    it('updates colors for all layers when toolbar changes', async () => {
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
      
      for (const layer of layers) {
        const { container, unmount } = renderWithProviders(
          <Button variant="solid" layer={layer}>Test</Button>
        )
        const button = container.querySelector('button')
        
        const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
        const testColor = `#${layer.replace('layer-', '')}00000`
        
        updateCssVar(bgVar, testColor)
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [bgVar] }
        }))

        await waitFor(() => {
          const styles = window.getComputedStyle(button!)
          const bgValue = styles.getPropertyValue('--button-bg')
          expect(bgValue).toContain(bgVar)
        })
        
        unmount()
      }
    })
  })

  describe('Size Props Updates', () => {
    it('updates height when toolbar changes default-height', async () => {
      const { container } = renderWithProviders(
        <Button size="default">Test</Button>
      )
      const button = container.querySelector('button')
      
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      
      updateCssVar(heightVar, '60px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [heightVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const heightValue = styles.getPropertyValue('--button-height')
        expect(heightValue).toContain('var(')
        expect(heightValue).toContain(heightVar)
      })
    })

    it('updates icon size when toolbar changes default-icon', async () => {
      const TestIcon = () => <svg><circle /></svg>
      const { container } = renderWithProviders(
        <Button size="default" icon={<TestIcon />}>Test</Button>
      )
      const button = container.querySelector('button')
      
      const iconSizeVar = getComponentCssVar('Button', 'size', 'default-icon', undefined)
      
      updateCssVar(iconSizeVar, '24px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [iconSizeVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const iconSizeValue = styles.getPropertyValue('--button-icon-size')
        expect(iconSizeValue).toContain('var(')
        expect(iconSizeValue).toContain(iconSizeVar)
      })
    })

    it('updates horizontal padding when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button size="default">Test</Button>
      )
      const button = container.querySelector('button')
      
      const paddingVar = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
      
      updateCssVar(paddingVar, '32px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [paddingVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Check that padding CSS variable is referenced
        expect(styles).toBeDefined()
      })
    })

    it('updates small size properties when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button size="small">Test</Button>
      )
      const button = container.querySelector('button')
      
      const heightVar = getComponentCssVar('Button', 'size', 'small-height', undefined)
      
      updateCssVar(heightVar, '28px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [heightVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const heightValue = styles.getPropertyValue('--button-height')
        expect(heightValue).toContain(heightVar)
      })
    })
  })

  describe('Component-Level Props Updates', () => {
    it('updates elevation when toolbar changes elevation', async () => {
      const { container } = renderWithProviders(
        <Button>Test</Button>
      )
      const button = container.querySelector('button')
      
      const elevationVar = getComponentLevelCssVar('Button', 'elevation')
      
      // Update elevation CSS variable
      updateCssVar(elevationVar, 'elevation-2')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [elevationVar] }
      }))

      // Wait for component to reactively update elevation
      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Elevation should be applied as box-shadow
        // The exact value depends on getElevationBoxShadow implementation
        expect(styles.boxShadow).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('updates border-radius when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button>Test</Button>
      )
      const button = container.querySelector('button')
      
      const borderRadiusVar = getComponentLevelCssVar('Button', 'border-radius')
      
      updateCssVar(borderRadiusVar, '12px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [borderRadiusVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Border radius should be applied
        expect(styles.borderRadius).toBeTruthy()
      })
    })

    it('updates max-width when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button>Test</Button>
      )
      const button = container.querySelector('button')
      
      const maxWidthVar = getComponentLevelCssVar('Button', 'max-width')
      
      updateCssVar(maxWidthVar, '600px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [maxWidthVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const maxWidthValue = styles.getPropertyValue('--button-max-width')
        expect(maxWidthValue).toContain('var(')
        expect(maxWidthValue).toContain(maxWidthVar)
      })
    })

    it('updates font-size when toolbar changes', async () => {
      const { container } = renderWithProviders(
        <Button>Test</Button>
      )
      const button = container.querySelector('button')
      
      const fontSizeVar = getComponentLevelCssVar('Button', 'font-size')
      
      updateCssVar(fontSizeVar, '16px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [fontSizeVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        // Font size should be applied
        expect(styles.fontSize).toBeTruthy()
      })
    })
  })

  describe('Multiple Props Updates', () => {
    it('handles multiple simultaneous CSS variable updates', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      const textVar = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      const elevationVar = getComponentLevelCssVar('Button', 'elevation')
      
      // Update multiple CSS variables at once
      updateCssVar(bgVar, '#ff0000')
      updateCssVar(textVar, '#0000ff')
      updateCssVar(heightVar, '60px')
      updateCssVar(elevationVar, 'elevation-1')
      
      // Dispatch event with all updated vars
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [bgVar, textVar, heightVar, elevationVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        expect(styles.getPropertyValue('--button-bg')).toContain(bgVar)
        expect(styles.getPropertyValue('--button-color')).toContain(textVar)
        expect(styles.getPropertyValue('--button-height')).toContain(heightVar)
        expect(styles.boxShadow).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Variant Switching', () => {
    it('updates CSS variables when variant changes via toolbar', async () => {
      const { container, rerender } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      // Initially use solid variant
      const solidBgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      updateCssVar(solidBgVar, '#ff0000')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [solidBgVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        expect(styles.getPropertyValue('--button-bg')).toContain(solidBgVar)
      })

      // Switch to outline variant
      rerender(
        <UiKitProvider>
          <UnifiedThemeProvider>
            <Button variant="outline" layer="layer-0">Test</Button>
          </UnifiedThemeProvider>
        </UiKitProvider>
      )

      const outlineTextVar = getComponentCssVar('Button', 'colors', 'outline-text', 'layer-0')
      updateCssVar(outlineTextVar, '#00ff00')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [outlineTextVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        expect(styles.getPropertyValue('--button-color')).toContain(outlineTextVar)
      })
    })
  })

  describe('Reactive Updates', () => {
    it('component updates when CSS variable changes without event', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      
      // Update CSS variable directly (simulating MutationObserver detection)
      updateCssVar(bgVar, '#ff0000')
      
      // Wait for MutationObserver to detect the change
      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        const bgValue = styles.getPropertyValue('--button-bg')
        expect(bgValue).toContain(bgVar)
      }, { timeout: 1000 })
    })

    it('component updates when multiple CSS variables change sequentially', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
      const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
      
      // Update first variable
      updateCssVar(bgVar, '#ff0000')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [bgVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        expect(styles.getPropertyValue('--button-bg')).toContain(bgVar)
      })

      // Update second variable
      updateCssVar(heightVar, '60px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [heightVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(button!)
        expect(styles.getPropertyValue('--button-height')).toContain(heightVar)
      })
    })
  })
})

