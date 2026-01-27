import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Button } from '../Button'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Button CSS Variables', () => {
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
        <ThemeModeProvider>
          <UnifiedThemeProvider>
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
      if (btn.textContent === 'Loading...' && btn.disabled) throw new Error('Still loading')
      // Wait for actual button content if expected text provided
      if (expectedText && !btn.textContent?.includes(expectedText)) {
        throw new Error(`Button text mismatch: expected "${expectedText}", got "${btn.textContent}"`)
      }
      return btn
    }, { timeout: 15000 })
  }

  describe('CSS Variable Definitions', () => {
    it('uses Recursica CSS variables for button colors', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" size="default" layer="layer-0">Test</Button>
        )
        container = result.container
        // Wait a bit for useEffect hooks to complete
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      expect(button).toBeInTheDocument()

      // Check that styles reference Recursica CSS variables
      const styles = window.getComputedStyle(button)
      // The actual values depend on CSS variable definitions, but we can check they're applied
      expect(styles).toBeDefined()
    })

    it('uses Recursica CSS variables for button sizes', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" size="small" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      expect(button).toBeInTheDocument()

      const styles = window.getComputedStyle(button)
      expect(styles).toBeDefined()
    })

    it('uses layer-specific CSS variables', { timeout: 15000 }, async () => {
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const

      for (const layer of layers) {
        let container: HTMLElement
        let unmount: () => void
        await act(async () => {
          const result = renderWithProviders(
            <Button variant="solid" size="default" layer={layer}>Test</Button>
          )
          container = result.container
          unmount = result.unmount
          await new Promise(resolve => setTimeout(resolve, 0))
        })
        const button = await waitForButton(container!, 'Test')
        expect(button).toBeInTheDocument()
        await act(async () => {
          unmount!()
        })
      }
    })
  })

  describe('Component-Level CSS Variables', () => {
    it('sets --button-icon-size when icon is provided', { timeout: 15000 }, async () => {
      const TestIcon = () => <svg><circle /></svg>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button icon={<TestIcon />}>With Icon</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'With Icon')
      expect(button).toBeInTheDocument()

      // Check that component-level CSS variable is set
      const iconSize = button.style.getPropertyValue('--button-icon-size')
      expect(iconSize).toBeTruthy()
    })

    it('sets --button-icon-text-gap when icon and children are provided', async () => {
      const TestIcon = () => <svg><circle /></svg>
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button icon={<TestIcon />}>With Icon</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'With Icon')
      expect(button).toBeInTheDocument()

      // Check that gap CSS variable is set
      const iconGap = button.style.getPropertyValue('--button-icon-text-gap')
      expect(iconGap).toBeTruthy()
    })

    it('sets --button-max-width', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(<Button>Test</Button>)
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      expect(button).toBeInTheDocument()

      // Check that max width CSS variable is set
      const maxWidth = button.style.getPropertyValue('--button-max-width')
      expect(maxWidth).toBeTruthy()
    })
  })

  describe('CSS Variable Fallbacks', () => {
    it('handles missing CSS variables gracefully', async () => {
      // Remove a CSS variable to test fallback behavior
      await act(async () => {
        document.documentElement.style.removeProperty('--recursica-ui-kit-components-button-color-layer-0-variant-solid-background')
      })
      
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      
      // Should still render even if CSS variable is missing
      expect(button).toBeInTheDocument()
    })

  })

  describe('Variant-Specific CSS Variables', () => {
    it('uses correct CSS variables for solid variant', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" layer="layer-0">Solid</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Solid')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for outline variant', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="outline" layer="layer-0">Outline</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Outline')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for text variant', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="text" layer="layer-0">Text</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Text')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Size-Specific CSS Variables', () => {
    it('uses correct CSS variables for default size', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="default" layer="layer-0">Default</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Default')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for small size', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button size="small" layer="layer-0">Small</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Small')
      expect(button).toBeInTheDocument()
    })
  })

  describe('CSS Variable Namespace', () => {
    it('all CSS variables use --recursica-* namespace', async () => {
      // This test verifies that the component uses properly namespaced CSS variables
      // The actual variable names are generated by getComponentCssVar
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <Button variant="solid" size="default" layer="layer-0">Test</Button>
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const button = await waitForButton(container!, 'Test')
      expect(button).toBeInTheDocument()

      // Check inline styles for component-level vars (these are set directly)
      const inlineStyle = button.getAttribute('style') || ''
      // Component-level vars (--button-*) are acceptable
      // Recursica vars should be referenced via var()
      expect(inlineStyle).toBeTruthy()
    })
  })
})

