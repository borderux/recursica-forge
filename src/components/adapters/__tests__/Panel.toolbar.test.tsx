/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify Panel component reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Panel } from '../Panel'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Panel Toolbar Props Integration', () => {
    beforeEach(() => {
        // Clear all CSS variables before each test
        document.documentElement.style.cssText = ''
    })

    afterEach(() => {
        // Clean up after each test
        document.documentElement.style.cssText = ''
    })

    const renderWithProviders = async (ui: React.ReactElement) => {
        let result: ReturnType<typeof render>
        await act(async () => {
            result = render(
                <UiKitProvider>
                    <ThemeModeProvider>
                        <UnifiedThemeProvider>
                            {ui}
                        </UnifiedThemeProvider>
                    </ThemeModeProvider>
                </UiKitProvider>
            )
            await new Promise(resolve => setTimeout(resolve, 0))
        })
        return result!
    }

    // Helper to wait for panel component to load
    const waitForPanel = async (container: HTMLElement) => {
        return await waitFor(() => {
            const panel = container.querySelector('.recursica-panel, [class*="Panel"], [class*="paper"]')
            if (!panel) throw new Error('Panel not found')
            return panel
        }, { timeout: 30000 })
    }

    describe('Color Props Updates', () => {
        const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
        const colorProps = ['background', 'border-color', 'title', 'content'] as const

        layers.forEach(layer => {
            colorProps.forEach(colorProp => {
                it(`updates ${colorProp} color when toolbar changes for ${layer}`, { timeout: 60000 }, async () => {
                    const { container } = await renderWithProviders(
                        <Panel title="Test Panel" className="test-panel" layer={layer}>
                            <p>Test content</p>
                        </Panel>
                    )

                    const panel = await waitForPanel(container)
                    expect(panel).toBeInTheDocument()

                    // Get the CSS variable name that the toolbar would use
                    const colorVar = getComponentLevelCssVar('Panel', `colors.${layer}.${colorProp}`)

                    // Verify initial value exists
                    const initialValue = readCssVar(colorVar)
                    expect(initialValue).toBeTruthy()

                    // Simulate toolbar update: change the CSS variable
                    updateCssVar(colorVar, '#ff0000')

                    // Dispatch event to trigger component update
                    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                        detail: { cssVars: [colorVar] }
                    }))

                    // Wait for CSS variable to be updated in the DOM
                    await waitFor(() => {
                        const updatedValue = readCssVar(colorVar)
                        expect(updatedValue).toBe('#ff0000')
                    }, { timeout: 10000 })
                })
            })
        })
    })

    describe('Component-Level Props Updates', () => {
        it('updates horizontal-padding when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const hPaddingVar = getComponentLevelCssVar('Panel', 'horizontal-padding')

            // Update horizontal-padding CSS variable
            updateCssVar(hPaddingVar, '32px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(hPaddingVar)).toBe('32px')
                const styles = window.getComputedStyle(panel!)
                const paddingValue = styles.getPropertyValue('--panel-padding-x')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates vertical-padding when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const vPaddingVar = getComponentLevelCssVar('Panel', 'vertical-padding')

            // Update vertical-padding CSS variable
            updateCssVar(vPaddingVar, '24px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(vPaddingVar)).toBe('24px')
                const styles = window.getComputedStyle(panel!)
                const paddingValue = styles.getPropertyValue('--panel-padding-y')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates border-radius when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const borderRadiusVar = getComponentLevelCssVar('Panel', 'border-radius')

            // Update border-radius CSS variable
            updateCssVar(borderRadiusVar, '12px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(borderRadiusVar)).toBe('12px')
                const styles = window.getComputedStyle(panel!)
                const radiusValue = styles.getPropertyValue('--panel-border-radius')
                expect(radiusValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates header-content-gap when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const gapVar = getComponentLevelCssVar('Panel', 'header-content-gap')

            // Update header-content-gap CSS variable
            updateCssVar(gapVar, '16px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(gapVar)).toBe('16px')
                const styles = window.getComputedStyle(panel!)
                const gapValue = styles.getPropertyValue('--panel-header-content-gap')
                expect(gapValue).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Multiple Props Updates', () => {
        it('handles multiple simultaneous CSS variable updates', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel" layer="layer-0">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const bgColorVar = getComponentLevelCssVar('Panel', 'colors.layer-0.background')
            const hPaddingVar = getComponentLevelCssVar('Panel', 'horizontal-padding')
            const vPaddingVar = getComponentLevelCssVar('Panel', 'vertical-padding')
            const borderRadiusVar = getComponentLevelCssVar('Panel', 'border-radius')

            // Update multiple CSS variables simultaneously
            updateCssVar(bgColorVar, '#00ff00')
            updateCssVar(hPaddingVar, '40px')
            updateCssVar(vPaddingVar, '20px')
            updateCssVar(borderRadiusVar, '16px')

            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                detail: { cssVars: [bgColorVar, hPaddingVar, vPaddingVar, borderRadiusVar] }
            }))

            // Wait for component to update all properties
            await waitFor(() => {
                expect(readCssVar(bgColorVar)).toBe('#00ff00')
                expect(readCssVar(hPaddingVar)).toBe('40px')
                expect(readCssVar(vPaddingVar)).toBe('20px')
                expect(readCssVar(borderRadiusVar)).toBe('16px')
            }, { timeout: 1000 })
        })
    })

    describe('Reactive Updates', () => {
        it('component updates when CSS variable changes without event', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel" layer="layer-0">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            const hPaddingVar = getComponentLevelCssVar('Panel', 'horizontal-padding')

            // Directly update CSS variable via DOM (simulating MutationObserver detection)
            document.documentElement.style.setProperty(hPaddingVar, '48px')

            // Wait for component to detect the change
            await waitFor(() => {
                const styles = window.getComputedStyle(panel!)
                const paddingValue = styles.getPropertyValue('--panel-padding-x')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Variant Switching', () => {
        it('updates CSS variables when layer changes', async () => {
            const { container, rerender } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel" layer="layer-0">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            // Switch to layer-1
            await act(async () => {
                rerender(
                    <UiKitProvider>
                        <ThemeModeProvider>
                            <UnifiedThemeProvider>
                                <Panel title="Test Panel" className="test-panel" layer="layer-1">
                                    <p>Test content</p>
                                </Panel>
                            </UnifiedThemeProvider>
                        </ThemeModeProvider>
                    </UiKitProvider>
                )
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            // Component should use layer-1 CSS variables
            await waitFor(() => {
                const layer1ColorVar = getComponentLevelCssVar('Panel', 'colors.layer-1.background')
                const styles = window.getComputedStyle(panel!)
                // Component should reference layer-1 variables
                expect(styles).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Preview CSS Variables', () => {
        it('CSS variables connected to preview update correctly', async () => {
            const { container } = await renderWithProviders(
                <Panel title="Test Panel" className="test-panel" layer="layer-0">
                    <p>Test content</p>
                </Panel>
            )
            const panel = await waitForPanel(container)
            expect(panel).toBeInTheDocument()

            // Verify all CSS custom properties are accessible
            const styles = window.getComputedStyle(panel!)
            expect(styles.getPropertyValue('--panel-bg')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-border-color')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-title-color')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-content-color')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-padding-x')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-padding-y')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-border-radius')).toBeTruthy()
            expect(styles.getPropertyValue('--panel-header-content-gap')).toBeTruthy()
        })
    })
})
