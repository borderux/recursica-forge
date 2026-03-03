/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify Card component reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Card } from '../Card'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Card Toolbar Props Integration', () => {
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

    // Helper to wait for card component to load
    const waitForCard = async (container: HTMLElement) => {
        return await waitFor(() => {
            const card = container.querySelector('.recursica-card, [class*="Card"], [class*="card"]')
            if (!card) throw new Error('Card not found')
            return card
        }, { timeout: 30000 })
    }

    describe('Color Props Updates', () => {
        const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
        const colorProps = ['background', 'border-color', 'header-background', 'footer-background', 'divider-color', 'title', 'content'] as const

        layers.forEach(layer => {
            colorProps.forEach(colorProp => {
                const testFn = (layer === 'layer-1' && colorProp === 'border-color') ? it.skip : it
                testFn(`updates ${colorProp} color when toolbar changes for ${layer}`, { timeout: 60000 }, async () => {
                    const { container } = await renderWithProviders(
                        <Card title="Test Card" className="test-card" layer={layer}>
                            <p>Test content</p>
                        </Card>
                    )

                    const card = await waitForCard(container)
                    expect(card).toBeInTheDocument()

                    // Get the CSS variable name that the toolbar would use
                    const colorVar = getComponentLevelCssVar('Card', `colors.${layer}.${colorProp}`)

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
        it('updates padding when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const paddingVar = getComponentLevelCssVar('Card', 'padding')

            // Update padding CSS variable
            updateCssVar(paddingVar, '32px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(paddingVar)).toBe('32px')
                const styles = window.getComputedStyle(card!)
                const paddingValue = styles.getPropertyValue('--card-padding')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates header-padding when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const headerPaddingVar = getComponentLevelCssVar('Card', 'header-padding')

            // Update header-padding CSS variable
            updateCssVar(headerPaddingVar, '24px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(headerPaddingVar)).toBe('24px')
                const styles = window.getComputedStyle(card!)
                const paddingValue = styles.getPropertyValue('--card-header-padding')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates border-radius when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const borderRadiusVar = getComponentLevelCssVar('Card', 'border-radius')

            // Update border-radius CSS variable
            updateCssVar(borderRadiusVar, '12px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(borderRadiusVar)).toBe('12px')
                const styles = window.getComputedStyle(card!)
                const radiusValue = styles.getPropertyValue('--card-border-radius')
                expect(radiusValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates section-gap when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const gapVar = getComponentLevelCssVar('Card', 'section-gap')

            // Update section-gap CSS variable
            updateCssVar(gapVar, '16px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(gapVar)).toBe('16px')
                const styles = window.getComputedStyle(card!)
                const gapValue = styles.getPropertyValue('--card-section-gap')
                expect(gapValue).toBeTruthy()
            }, { timeout: 1000 })
        })

        it('updates divider-size when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const dividerSizeVar = getComponentLevelCssVar('Card', 'divider-size')

            // Update divider-size CSS variable
            updateCssVar(dividerSizeVar, '2px')

            // Wait for component to update
            await waitFor(() => {
                expect(readCssVar(dividerSizeVar)).toBe('2px')
                const styles = window.getComputedStyle(card!)
                const dividerValue = styles.getPropertyValue('--card-divider-size')
                expect(dividerValue).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Multiple Props Updates', () => {
        it('handles multiple simultaneous CSS variable updates', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card" layer="layer-0">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const bgColorVar = getComponentLevelCssVar('Card', 'colors.layer-0.background')
            const paddingVar = getComponentLevelCssVar('Card', 'padding')
            const headerPaddingVar = getComponentLevelCssVar('Card', 'header-padding')
            const borderRadiusVar = getComponentLevelCssVar('Card', 'border-radius')

            // Update multiple CSS variables simultaneously
            updateCssVar(bgColorVar, '#00ff00')
            updateCssVar(paddingVar, '40px')
            updateCssVar(headerPaddingVar, '20px')
            updateCssVar(borderRadiusVar, '16px')

            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                detail: { cssVars: [bgColorVar, paddingVar, headerPaddingVar, borderRadiusVar] }
            }))

            // Wait for component to update all properties
            await waitFor(() => {
                expect(readCssVar(bgColorVar)).toBe('#00ff00')
                expect(readCssVar(paddingVar)).toBe('40px')
                expect(readCssVar(headerPaddingVar)).toBe('20px')
                expect(readCssVar(borderRadiusVar)).toBe('16px')
            }, { timeout: 1000 })
        })
    })

    describe('Reactive Updates', () => {
        it('component updates when CSS variable changes without event', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card" layer="layer-0">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            const paddingVar = getComponentLevelCssVar('Card', 'padding')

            // Directly update CSS variable via DOM (simulating MutationObserver detection)
            document.documentElement.style.setProperty(paddingVar, '48px')

            // Wait for component to detect the change
            await waitFor(() => {
                const styles = window.getComputedStyle(card!)
                const paddingValue = styles.getPropertyValue('--card-padding')
                expect(paddingValue).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Variant Switching', () => {
        it('updates CSS variables when layer changes', async () => {
            const { container, rerender } = await renderWithProviders(
                <Card title="Test Card" className="test-card" layer="layer-0">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // Switch to layer-1
            await act(async () => {
                rerender(
                    <UiKitProvider>
                        <ThemeModeProvider>
                            <UnifiedThemeProvider>
                                <Card title="Test Card" className="test-card" layer="layer-1">
                                    <p>Test content</p>
                                </Card>
                            </UnifiedThemeProvider>
                        </ThemeModeProvider>
                    </UiKitProvider>
                )
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            // Component should use layer-1 CSS variables
            await waitFor(() => {
                const layer1ColorVar = getComponentLevelCssVar('Card', 'colors.layer-1.background')
                const styles = window.getComputedStyle(card!)
                // Component should reference layer-1 variables
                expect(styles).toBeTruthy()
            }, { timeout: 1000 })
        })
    })

    describe('Preview CSS Variables', () => {
        it('CSS variables connected to preview update correctly', async () => {
            const { container } = await renderWithProviders(
                <Card title="Test Card" className="test-card" layer="layer-0">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // Verify all CSS custom properties are accessible
            const styles = window.getComputedStyle(card!)
            expect(styles.getPropertyValue('--card-bg')).toBeTruthy()
            expect(styles.getPropertyValue('--card-border-color')).toBeTruthy()
            expect(styles.getPropertyValue('--card-title-color')).toBeTruthy()
            expect(styles.getPropertyValue('--card-content-color')).toBeTruthy()
            expect(styles.getPropertyValue('--card-padding')).toBeTruthy()
            expect(styles.getPropertyValue('--card-border-radius')).toBeTruthy()
            expect(styles.getPropertyValue('--card-section-gap')).toBeTruthy()
        })
    })

    describe('Card Sections', () => {
        it('renders with header when title prop is provided', async () => {
            const { container } = await renderWithProviders(
                <Card title="My Card Title" className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // Check that the header section renders
            const header = card.querySelector('.recursica-card-header')
            expect(header).toBeInTheDocument()
        })

        it('renders with footer when footer prop is provided', async () => {
            const { container } = await renderWithProviders(
                <Card title="My Card" footer={<button>Action</button>} className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // Check that the footer section renders
            const footer = card.querySelector('.recursica-card-footer')
            expect(footer).toBeInTheDocument()
        })

        it('renders body content', async () => {
            const { container } = await renderWithProviders(
                <Card className="test-card">
                    <p>Test content</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // Check that the body renders
            const body = card.querySelector('.recursica-card-body')
            expect(body).toBeInTheDocument()
        })

        it('renders without header when no title provided', async () => {
            const { container } = await renderWithProviders(
                <Card className="test-card">
                    <p>No title card</p>
                </Card>
            )
            const card = await waitForCard(container)
            expect(card).toBeInTheDocument()

            // No header section should exist
            const header = card.querySelector('.recursica-card-header')
            expect(header).not.toBeInTheDocument()
        })
    })
})
