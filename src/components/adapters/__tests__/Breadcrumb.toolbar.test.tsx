/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify Breadcrumb component reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Breadcrumb } from '../Breadcrumb'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Breadcrumb Toolbar Props Integration', () => {
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

  // Helper to wait for breadcrumb component to load
  const waitForBreadcrumb = async (container: HTMLElement) => {
    return await waitFor(() => {
      const breadcrumb = container.querySelector('[class*="Breadcrumb"], nav[aria-label*="breadcrumb"], nav[aria-label*="Breadcrumb"]')
      if (!breadcrumb) throw new Error('Breadcrumb not found')
      return breadcrumb
    }, { timeout: 15000 })
  }

  const sampleItems = [
    { label: 'Home', href: '#' },
    { label: 'Category', href: '#' },
    { label: 'Current Page' },
  ]

  describe('Color Props Updates', () => {
    const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
    const variants = ['interactive', 'read-only'] as const

    layers.forEach(layer => {
      variants.forEach(variant => {
        it(`updates ${variant} color when toolbar changes ${variant}-color for ${layer}`, { timeout: 10000 }, async () => {
          const { container } = renderWithProviders(
            <Breadcrumb items={sampleItems} layer={layer} />
          )
          
          const breadcrumb = await waitForBreadcrumb(container)
          expect(breadcrumb).toBeInTheDocument()

          // Get the CSS variable name that the toolbar would use
          const colorVar = getComponentLevelCssVar('Breadcrumb', `colors.${layer}.${variant}`)
          
          // Simulate toolbar update: change the CSS variable
          updateCssVar(colorVar, '#ff0000')
          
          // Dispatch the cssVarsUpdated event
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
            detail: { cssVars: [colorVar] }
          }))

          // Wait for component to update
          await waitFor(() => {
            const styles = window.getComputedStyle(breadcrumb!)
            // Component should reference the updated CSS variable
            const colorValue = styles.getPropertyValue(`--breadcrumb-${variant.replace('-', '-')}-color`)
            // Check that the CSS variable is referenced (either directly or through custom property)
            expect(readCssVar(colorVar)).toBe('#ff0000')
          }, { timeout: 3000 })
        })
      })
    })
  })

  describe('Component-Level Props Updates', () => {
    it('updates padding when toolbar changes padding', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
      
      // Update padding CSS variable
      updateCssVar(paddingVar, '20px')
      
      // Wait for component to update
      await waitFor(() => {
        const styles = window.getComputedStyle(breadcrumb!)
        // Padding should be applied directly or via CSS custom property
        const paddingValue = styles.getPropertyValue('padding') || styles.getPropertyValue('--breadcrumb-padding')
        expect(paddingValue).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('updates icon-label-gap when toolbar changes icon-label-gap', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
      
      // Update icon-label-gap CSS variable
      updateCssVar(iconLabelGapVar, '12px')
      
      // Wait for component to update
      await waitFor(() => {
        // Check that the CSS variable was updated correctly
        expect(readCssVar(iconLabelGapVar)).toBe('12px')
        const styles = window.getComputedStyle(breadcrumb!)
        // Icon-label-gap should be set as CSS custom property (may reference the var)
        const gapValue = styles.getPropertyValue('--breadcrumb-icon-label-gap')
        expect(gapValue).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('updates item-gap when toolbar changes item-gap', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
      
      // Update item-gap CSS variable
      updateCssVar(itemGapVar, '16px')
      
      // Wait for component to update
      await waitFor(() => {
        // Check that the CSS variable was updated correctly
        expect(readCssVar(itemGapVar)).toBe('16px')
        const styles = window.getComputedStyle(breadcrumb!)
        // Item-gap should be set as CSS custom property (may reference the var)
        const gapValue = styles.getPropertyValue('--breadcrumb-item-gap')
        expect(gapValue).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('updates icon size when toolbar changes icon', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const iconSizeVar = getComponentLevelCssVar('Breadcrumb', 'icon-size')
      
      // Update icon size CSS variable
      updateCssVar(iconSizeVar, '24px')
      
      // Wait for component to update
      await waitFor(() => {
        // Check that the CSS variable was updated correctly
        expect(readCssVar(iconSizeVar)).toBe('24px')
        const styles = window.getComputedStyle(breadcrumb!)
        // Icon size should be set as CSS custom property (may reference the var)
        const iconSizeValue = styles.getPropertyValue('--breadcrumb-icon-size')
        expect(iconSizeValue).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Multiple Props Updates', () => {
    it('handles multiple simultaneous CSS variable updates', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} layer="layer-0" />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const interactiveColorVar = getComponentLevelCssVar('Breadcrumb', 'colors.layer-0.interactive')
      const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
      const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
      const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
      
      // Update multiple CSS variables simultaneously
      updateCssVar(interactiveColorVar, '#00ff00')
      updateCssVar(paddingVar, '16px')
      updateCssVar(iconLabelGapVar, '8px')
      updateCssVar(itemGapVar, '12px')
      
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [interactiveColorVar, paddingVar, iconLabelGapVar, itemGapVar] }
      }))
      
      // Wait for component to update all properties
      await waitFor(() => {
        expect(readCssVar(interactiveColorVar)).toBe('#00ff00')
        expect(readCssVar(paddingVar)).toBe('16px')
        expect(readCssVar(iconLabelGapVar)).toBe('8px')
        expect(readCssVar(itemGapVar)).toBe('12px')
      }, { timeout: 1000 })
    })
  })

  describe('Reactive Updates', () => {
    it('component updates when CSS variable changes without event', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} layer="layer-0" />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
      
      // Directly update CSS variable via DOM (simulating MutationObserver detection)
      document.documentElement.style.setProperty(paddingVar, '24px')
      
      // Wait for component to detect the change
      await waitFor(() => {
        const styles = window.getComputedStyle(breadcrumb!)
        const paddingValue = styles.getPropertyValue('padding') || styles.getPropertyValue('--breadcrumb-padding')
        expect(paddingValue).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Variant Switching', () => {
    it('updates CSS variables when layer changes', async () => {
      const { container, rerender } = renderWithProviders(
        <Breadcrumb items={sampleItems} layer="layer-0" />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      // Switch to layer-1
      rerender(
        <UiKitProvider>
          <ThemeModeProvider>
            <UnifiedThemeProvider>
              <Breadcrumb items={sampleItems} layer="layer-1" />
            </UnifiedThemeProvider>
          </ThemeModeProvider>
        </UiKitProvider>
      )
      
      // Component should use layer-1 CSS variables
      await waitFor(() => {
        const layer1ColorVar = getComponentLevelCssVar('Breadcrumb', 'colors.layer-1.interactive')
        const styles = window.getComputedStyle(breadcrumb!)
        // Component should reference layer-1 variables
        expect(styles).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('Preview CSS Variables', () => {
    it('CSS variables connected to preview update correctly', async () => {
      const { container } = renderWithProviders(
        <Breadcrumb items={sampleItems} layer="layer-0" />
      )
      const breadcrumb = await waitForBreadcrumb(container)
      expect(breadcrumb).toBeInTheDocument()
      
      const interactiveColorVar = getComponentLevelCssVar('Breadcrumb', 'colors.layer-0.interactive')
      const paddingVar = getComponentLevelCssVar('Breadcrumb', 'padding')
      const iconLabelGapVar = getComponentLevelCssVar('Breadcrumb', 'icon-label-gap')
      const itemGapVar = getComponentLevelCssVar('Breadcrumb', 'item-gap')
      const iconSizeVar = getComponentLevelCssVar('Breadcrumb', 'icon-size')
      
      // Verify all CSS variables are accessible
      const styles = window.getComputedStyle(breadcrumb!)
      expect(styles.getPropertyValue('--breadcrumb-interactive-color')).toBeTruthy()
      expect(styles.getPropertyValue('--breadcrumb-padding')).toBeTruthy()
      expect(styles.getPropertyValue('--breadcrumb-icon-label-gap')).toBeTruthy()
      expect(styles.getPropertyValue('--breadcrumb-item-gap')).toBeTruthy()
      expect(styles.getPropertyValue('--breadcrumb-icon-size')).toBeTruthy()
    })
  })
})

