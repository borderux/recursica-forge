/**
 * SegmentedControl Toolbar Props Integration Tests
 * 
 * Tests that verify SegmentedControl reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach, act } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../modules/theme/ThemeModeContext'
import { SegmentedControl } from '../SegmentedControl'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'

describe('SegmentedControl Toolbar Props Integration', () => {
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

  const testItems = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  describe('Color Props Updates', () => {
    it('updates background color when toolbar changes default-background', async () => {
      const { container } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
      expect(element).toBeInTheDocument()

      // Get the CSS variable name that the toolbar would use
      const bgVar = getComponentCssVar('SegmentedControl', 'colors', 'default-background', 'layer-0')
      
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

    it('updates selected background color when toolbar changes default-selected-background', async () => {
      const { container } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
      expect(element).toBeInTheDocument()

      const selectedBgVar = getComponentCssVar('SegmentedControl', 'colors', 'default-selected-background', 'layer-0')
      
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

    it('updates text color when toolbar changes default-text', async () => {
      const { container } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
      expect(element).toBeInTheDocument()

      const textVar = getComponentCssVar('SegmentedControl', 'colors', 'default-text', 'layer-0')
      
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
    it('updates border-radius when toolbar changes border-radius', async () => {
      const { container } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
      expect(element).toBeInTheDocument()
      
      const borderRadiusVar = getComponentLevelCssVar('SegmentedControl', 'border-radius')
      
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

    it('updates item-gap when toolbar changes item-gap', async () => {
      const { container } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
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

  describe('Variant Switching', () => {
    it('updates CSS variables when variant changes from default to outline', async () => {
      const { container, rerender } = renderWithProviders(
        <SegmentedControl items={testItems} variant="default" layer="layer-0" value="option1" />
      )
      const element = container.querySelector('.recursica-segmented-control, .mantine-SegmentedControl-root, .recursica-segmented-control.material-segmented-control')
      expect(element).toBeInTheDocument()

      rerender(
        <UiKitProvider>
          <UnifiedThemeProvider>
            <SegmentedControl items={testItems} variant="outline" layer="layer-0" value="option1" />
          </UnifiedThemeProvider>
        </UiKitProvider>
      )

      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        // Should reference outline variant CSS variables
        const bgValue = styles.getPropertyValue('--segmented-control-bg') || styles.backgroundColor
        expect(bgValue).toContain('outline-background')
      })
    })
  })
})
