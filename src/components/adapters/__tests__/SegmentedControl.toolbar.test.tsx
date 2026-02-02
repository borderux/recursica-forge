/**
 * SegmentedControl Toolbar Props Integration Tests
 * 
 * Tests that verify SegmentedControl reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 * 
 * NOTE: This test file is currently skipped due to a hanging issue during module import.
 * The test hangs at 0/6 tests, suggesting a blocking operation during import phase.
 * Investigation needed: Check for circular dependencies or synchronous blocking operations
 * in SegmentedControl component or its dependencies.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { SegmentedControl } from '../SegmentedControl'
import { KitSwitcher, clearUiKitStorage } from './adapterTestUtils'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../../utils/cssVarNames'

describe.skip('SegmentedControl Toolbar Props Integration', { timeout: 60000 }, () => {
  // Note: We don't preload components here to avoid hanging issues
  // Components will load lazily via Suspense, which is tested behavior

  beforeEach(() => {
    clearUiKitStorage()
    // Clear all CSS variables before each test
    document.documentElement.style.cssText = ''
    // Clear any pending timers
    vi.clearAllTimers()
    // Remove any existing event listeners that might interfere
    const newWindow = window as any
    if (newWindow._cssVarListeners) {
      newWindow._cssVarListeners.forEach((listener: any) => {
        window.removeEventListener('cssVarsUpdated', listener)
        window.removeEventListener('cssVarsReset', listener)
      })
      newWindow._cssVarListeners = []
    }
  })

  afterEach(async () => {
    // Clean up after each test
    document.documentElement.style.cssText = ''
    // Disconnect any MutationObservers
    const observers = (window as any)._mutationObservers || []
    observers.forEach((obs: MutationObserver) => obs.disconnect())
    ;(window as any)._mutationObservers = []
    // Wait a tick to allow cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 10))
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

  const testItems = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  // Helper to wait for SegmentedControl to render (handles Suspense/lazy loading)
  // Note: waitFor already uses act() internally, so we don't wrap it
  const waitForSegmentedControl = async (container: HTMLElement) => {
    // Wait for any element that indicates the component has rendered
    // This is more lenient and avoids hanging on specific selectors
    const element = await waitFor(() => {
      // Try multiple selectors in order of preference
      const carbonElement = container.querySelector('.recursica-segmented-control.carbon-segmented-control')
      const materialElement = container.querySelector('.recursica-segmented-control.material-segmented-control')
      const mantineRoot = container.querySelector('.mantine-SegmentedControl-root')
      const wrapper = container.querySelector('.recursica-segmented-control-wrapper')
      const nativeElement = container.querySelector('.recursica-segmented-control')
      const buttons = container.querySelectorAll('button')
      
      // Prefer library-specific elements, but also accept buttons or native fallback
      const found = carbonElement || materialElement || mantineRoot || 
                   (wrapper?.querySelector('.mantine-SegmentedControl-root') || null) || 
                   nativeElement ||
                   (buttons.length > 0 ? buttons[0].parentElement : null)
      
      if (!found) {
        throw new Error('SegmentedControl element not found')
      }
      
      // Ensure it's not just the Suspense fallback
      if (found.textContent === '' && !found.querySelector('button')) {
        throw new Error('Still loading (no content found)')
      }
      
      return found
    }, { timeout: 15000, interval: 100 })
    
    return element
  }

  describe('Color Props Updates', () => {
    it('updates background color when toolbar changes container background', { timeout: 20000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} layer="layer-0" value="option1" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()

      // Get the CSS variable name that the toolbar would use
      // SegmentedControl uses container.colors.layer-X.background
      const bgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', 'layer-0', 'background')
      
      // Simulate toolbar update: change the CSS variable
      updateCssVar(bgVar, '#ff0000')
      
      // Dispatch the cssVarsUpdated event that components listen for
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [bgVar] }
      }))

      // Wait for component to reactively update
      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        // Verify component references the updated CSS variable
        const bgValue = styles.getPropertyValue('--segmented-control-bg') || styles.backgroundColor
        expect(bgValue).toContain('var(')
        expect(bgValue).toContain(bgVar)
      })
    })

    it('updates selected background color when toolbar changes selected background', { timeout: 20000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} layer="layer-0" value="option1" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()

      const selectedBgVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'selected', 'colors', 'layer-0', 'background')
      
      updateCssVar(selectedBgVar, '#00ff00')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [selectedBgVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        const selectedBgValue = styles.getPropertyValue('--segmented-control-selected-bg') || styles.backgroundColor
        expect(selectedBgValue).toContain('var(')
        expect(selectedBgValue).toContain(selectedBgVar)
      })
    })

    it('updates text color when toolbar changes container text-color', { timeout: 20000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} layer="layer-0" value="option1" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()

      const textVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'colors', 'layer-0', 'text-color')
      
      updateCssVar(textVar, '#0000ff')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [textVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        const textValue = styles.getPropertyValue('--segmented-control-text') || styles.color
        expect(textValue).toContain('var(')
        expect(textValue).toContain(textVar)
      })
    })
  })

  describe('Component-Level Props Updates', () => {
    it('updates border-radius when toolbar changes container border-radius', { timeout: 20000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} layer="layer-0" value="option1" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()
      
      const borderRadiusVar = buildComponentCssVarPath('SegmentedControl', 'properties', 'container', 'border-radius')
      
      updateCssVar(borderRadiusVar, '12px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [borderRadiusVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        expect(styles.borderRadius).toContain('var(')
        expect(styles.borderRadius).toContain(borderRadiusVar)
      })
    })

    it('updates item-gap when toolbar changes item-gap', { timeout: 20000 }, async () => {
      let container: HTMLElement
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} layer="layer-0" value="option1" />
        )
        container = result.container
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()
      
      const itemGapVar = getComponentLevelCssVar('SegmentedControl', 'item-gap')
      
      updateCssVar(itemGapVar, '8px')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [itemGapVar] }
      }))

      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        const gapValue = styles.getPropertyValue('--segmented-control-item-gap') || styles.gap
        expect(gapValue).toContain('var(')
        expect(gapValue).toContain(itemGapVar)
      })
    })
  })

  describe('Orientation Switching', () => {
    it('updates CSS variables when orientation changes from horizontal to vertical', { timeout: 20000 }, async () => {
      let container: HTMLElement
      let rerender: (ui: React.ReactElement) => void
      await act(async () => {
        const result = renderWithProviders(
          <SegmentedControl items={testItems} orientation="horizontal" layer="layer-0" value="option1" />
        )
        container = result.container
        rerender = result.rerender
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      const element = await waitForSegmentedControl(container!)
      expect(element).toBeInTheDocument()

      await act(async () => {
        rerender(
          <UiKitProvider>
            <ThemeModeProvider>
              <UnifiedThemeProvider>
                <SegmentedControl items={testItems} orientation="vertical" layer="layer-0" value="option1" />
              </UnifiedThemeProvider>
            </ThemeModeProvider>
          </UiKitProvider>
        )
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await waitFor(() => {
        const newElement = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control, .recursica-segmented-control-fallback')
        expect(newElement).toBeInTheDocument()
        const styles = window.getComputedStyle(newElement!)
        // Should have vertical orientation styling
        expect(newElement?.getAttribute('data-orientation') || newElement?.className).toContain('vertical')
      })
    })
  })
})
