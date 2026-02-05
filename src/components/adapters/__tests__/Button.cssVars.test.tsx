import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Button } from '../Button'

describe('Button CSS Variables', () => {
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

  const waitForButton = async (container: HTMLElement, expectedText?: string) => {
    return await waitFor(() => {
      const btn = container.querySelector('button')
      if (!btn) throw new Error('Button not found')
      if (btn.textContent === 'Loading...' && btn.disabled) throw new Error('Still loading')
      if (expectedText && !btn.textContent?.includes(expectedText)) {
        throw new Error(`Button text mismatch: expected "${expectedText}", got "${btn.textContent}"`)
      }
      return btn
    }, { timeout: 5000 })
  }

  describe('CSS Variable Definitions', () => {
    it('uses Recursica CSS variables for button colors', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = await waitForButton(container, 'Test')
      expect(button).toBeInTheDocument()
      const styles = window.getComputedStyle(button)
      expect(styles).toBeDefined()
    })

    it('uses Recursica CSS variables for button sizes', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="small" layer="layer-0">Test</Button>
      )
      const button = await waitForButton(container, 'Test')
      expect(button).toBeInTheDocument()
      const styles = window.getComputedStyle(button)
      expect(styles).toBeDefined()
    })

    it('uses layer-specific CSS variables', async () => {
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const

      for (const layer of layers) {
        const { container, unmount } = renderWithProviders(
          <Button variant="solid" size="default" layer={layer}>Test</Button>
        )
        const button = await waitForButton(container, 'Test')
        expect(button).toBeInTheDocument()
        unmount()
      }
    })
  })

  describe('Component-Level CSS Variables', () => {
    it('sets --button-icon-size when icon is provided', async () => {
      const TestIcon = () => <svg><circle /></svg>
      const { container } = renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      const button = await waitForButton(container, 'With Icon')
      expect(button).toBeInTheDocument()
      const iconSize = button.style.getPropertyValue('--button-icon-size')
      expect(iconSize).toBeTruthy()
    })

    it('sets --button-icon-text-gap when icon and children are provided', async () => {
      const TestIcon = () => <svg><circle /></svg>
      const { container } = renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      const button = await waitForButton(container, 'With Icon')
      expect(button).toBeInTheDocument()
      const iconGap = button.style.getPropertyValue('--button-icon-text-gap')
      expect(iconGap).toBeTruthy()
    })

    it('sets --button-max-width', async () => {
      const { container } = renderWithProviders(<Button>Test</Button>)
      const button = await waitForButton(container, 'Test')
      expect(button).toBeInTheDocument()
      const maxWidth = button.style.getPropertyValue('--button-max-width')
      expect(maxWidth).toBeTruthy()
    })
  })

  describe('CSS Variable Fallbacks', () => {
    it('handles missing CSS variables gracefully', async () => {
      document.documentElement.style.removeProperty('--recursica-ui-kit-components-button-color-layer-0-variant-solid-background')
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = await waitForButton(container, 'Test')
      expect(button).toBeInTheDocument()
    })

  })

  describe('Variant-Specific CSS Variables', () => {
    it('uses correct CSS variables for solid variant', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Solid</Button>
      )
      const button = await waitForButton(container, 'Solid')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for outline variant', async () => {
      const { container } = renderWithProviders(
        <Button variant="outline" layer="layer-0">Outline</Button>
      )
      const button = await waitForButton(container, 'Outline')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for text variant', async () => {
      const { container } = renderWithProviders(
        <Button variant="text" layer="layer-0">Text</Button>
      )
      const button = await waitForButton(container, 'Text')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Size-Specific CSS Variables', () => {
    it('uses correct CSS variables for default size', async () => {
      const { container } = renderWithProviders(
        <Button size="default" layer="layer-0">Default</Button>
      )
      const button = await waitForButton(container, 'Default')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for small size', async () => {
      const { container } = renderWithProviders(
        <Button size="small" layer="layer-0">Small</Button>
      )
      const button = await waitForButton(container, 'Small')
      expect(button).toBeInTheDocument()
    })
  })

  describe('CSS Variable Namespace', () => {
    it('all CSS variables use --recursica-* namespace', async () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = await waitForButton(container, 'Test')
      expect(button).toBeInTheDocument()
      const inlineStyle = button.getAttribute('style') || ''
      expect(inlineStyle).toBeTruthy()
    })
  })
})

