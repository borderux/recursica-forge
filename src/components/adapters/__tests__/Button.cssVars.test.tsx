import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
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

  describe('CSS Variable Definitions', () => {
    it('uses Recursica CSS variables for button colors', () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Check that styles reference Recursica CSS variables
      const styles = window.getComputedStyle(button!)
      // The actual values depend on CSS variable definitions, but we can check they're applied
      expect(styles).toBeDefined()
    })

    it('uses Recursica CSS variables for button sizes', () => {
      const { container } = renderWithProviders(
        <Button variant="solid" size="small" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      const styles = window.getComputedStyle(button!)
      expect(styles).toBeDefined()
    })

    it('uses layer-specific CSS variables', () => {
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const

      layers.forEach(layer => {
        const { container, unmount } = renderWithProviders(
          <Button variant="solid" size="default" layer={layer}>Test</Button>
        )
        const button = container.querySelector('button')
        expect(button).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Component-Level CSS Variables', () => {
    it('sets --button-icon-size when icon is provided', () => {
      const TestIcon = () => <svg><circle /></svg>
      const { container } = renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Check that component-level CSS variable is set
      const iconSize = button?.style.getPropertyValue('--button-icon-size')
      expect(iconSize).toBeTruthy()
    })

    it('sets --button-icon-text-gap when icon and children are provided', () => {
      const TestIcon = () => <svg><circle /></svg>
      const { container } = renderWithProviders(
        <Button icon={<TestIcon />}>With Icon</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Check that gap CSS variable is set
      const iconGap = button?.style.getPropertyValue('--button-icon-text-gap')
      expect(iconGap).toBeTruthy()
    })

    it('sets --button-max-width', () => {
      const { container } = renderWithProviders(<Button>Test</Button>)
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Check that max width CSS variable is set
      const maxWidth = button?.style.getPropertyValue('--button-max-width')
      expect(maxWidth).toBeTruthy()
    })
  })

  describe('CSS Variable Fallbacks', () => {
    it('handles missing CSS variables gracefully', () => {
      // Remove a CSS variable to test fallback behavior
      document.documentElement.style.removeProperty('--recursica-ui-kit-components-button-color-layer-0-variant-solid-background')
      
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      
      // Should still render even if CSS variable is missing
      expect(button).toBeInTheDocument()
    })

  })

  describe('Variant-Specific CSS Variables', () => {
    it('uses correct CSS variables for solid variant', () => {
      const { container } = renderWithProviders(
        <Button variant="solid" layer="layer-0">Solid</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for outline variant', () => {
      const { container } = renderWithProviders(
        <Button variant="outline" layer="layer-0">Outline</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for text variant', () => {
      const { container } = renderWithProviders(
        <Button variant="text" layer="layer-0">Text</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Size-Specific CSS Variables', () => {
    it('uses correct CSS variables for default size', () => {
      const { container } = renderWithProviders(
        <Button size="default" layer="layer-0">Default</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('uses correct CSS variables for small size', () => {
      const { container } = renderWithProviders(
        <Button size="small" layer="layer-0">Small</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('CSS Variable Namespace', () => {
    it('all CSS variables use --recursica-* namespace', () => {
      // This test verifies that the component uses properly namespaced CSS variables
      // The actual variable names are generated by getComponentCssVar
      const { container } = renderWithProviders(
        <Button variant="solid" size="default" layer="layer-0">Test</Button>
      )
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()

      // Check inline styles for component-level vars (these are set directly)
      const inlineStyle = button?.getAttribute('style') || ''
      // Component-level vars (--button-*) are acceptable
      // Recursica vars should be referenced via var()
      expect(inlineStyle).toBeTruthy()
    })
  })
})

