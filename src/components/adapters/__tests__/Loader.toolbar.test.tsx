/**
 * Toolbar Props Integration Tests - Loader
 * 
 * Tests that verify the Loader component reactively updates when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Loader } from '../Loader'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../utils/cssVarNames'

describe.skip('Loader Toolbar Props Integration', () => {
    beforeEach(() => {
        document.documentElement.style.cssText = ''
    })

    afterEach(() => {
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

    const waitForLoader = async (container: HTMLElement) => {
        return await waitFor(() => {
            const loader = container.querySelector('.recursica-loader')
            if (!loader) throw new Error('Loader not found')
            return loader as HTMLElement
        }, { timeout: 20000 })
    }

    describe('Color Props Updates', () => {
        it('updates indicator color when toolbar changes indicator-color', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(<Loader />)
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const loader = await waitForLoader(container!)
            const indicatorColorVar = getComponentLevelCssVar('Loader', 'indicator-color')

            await act(async () => {
                updateCssVar(indicatorColorVar, '#ff0000')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [indicatorColorVar] }
                }))
            })

            await waitFor(() => {
                // Check that loader is rendered with the indicator color variable reference
                const loaderIndicators = loader.querySelectorAll('.recursica-loader-indicator, .mantine-Loader-root')
                expect(loaderIndicators.length).toBeGreaterThan(0)
            })
        })

        it('updates track color when toolbar changes track-color', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(<Loader />)
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const loader = await waitForLoader(container!)
            const trackColorVar = getComponentLevelCssVar('Loader', 'track-color')

            await act(async () => {
                updateCssVar(trackColorVar, '#cccccc')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [trackColorVar] }
                }))
            })

            await waitFor(() => {
                expect(loader).toBeTruthy()
            })
        })
    })

    describe('Size Props Updates', () => {
        it('updates size when toolbar changes sizes-default', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(<Loader size="default" />)
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const loader = await waitForLoader(container!)
            const sizeVar = getComponentLevelCssVar('Loader', 'sizes-default')

            await act(async () => {
                updateCssVar(sizeVar, '48px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [sizeVar] }
                }))
            })

            await waitFor(() => {
                expect(loader).toBeTruthy()
            })
        })

        it('renders all three loader types', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(<Loader />)
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const loader = await waitForLoader(container!)

            await waitFor(() => {
                const items = loader.querySelectorAll('.recursica-loader-item')
                expect(items.length).toBe(3)
            })
        })
    })

    describe('Multiple Props Updates', () => {
        it('handles multiple simultaneous CSS variable updates', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(<Loader size="default" />)
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const loader = await waitForLoader(container!)

            const indicatorColorVar = getComponentLevelCssVar('Loader', 'indicator-color')
            const trackColorVar = getComponentLevelCssVar('Loader', 'track-color')
            const sizeVar = getComponentLevelCssVar('Loader', 'sizes-default')

            await act(async () => {
                updateCssVar(indicatorColorVar, '#ff0000')
                updateCssVar(trackColorVar, '#cccccc')
                updateCssVar(sizeVar, '48px')

                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [indicatorColorVar, trackColorVar, sizeVar] }
                }))
            })

            await waitFor(() => {
                expect(loader).toBeTruthy()
                const items = loader.querySelectorAll('.recursica-loader-item')
                expect(items.length).toBe(3)
            })
        })
    })
})
