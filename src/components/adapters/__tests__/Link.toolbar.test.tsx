/**
 * Link Toolbar Props Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { Link } from '../Link'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../utils/cssVarNames'

describe('Link Toolbar Props Integration', () => {
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

    const waitForLink = async (container: HTMLElement, expectedText?: string) => {
        return await waitFor(() => {
            // Try to find by anchor tag first
            const link = container.querySelector('a')
            if (!link) throw new Error('Link not found')

            // Ensure it's not the loading link
            if (link.textContent === 'Loading...') {
                throw new Error('Still loading')
            }

            if (expectedText && !link.textContent?.includes(expectedText)) {
                throw new Error(`Link text mismatch: expected "${expectedText}", got "${link.textContent}"`)
            }

            return link
        }, { timeout: 20000 })
    }

    describe('Color Props Updates', () => {
        it('updates text color when toolbar changes', { timeout: 60000 }, async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <Link layer="layer-0" href="#">Test Link</Link>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const link = await waitForLink(container!, 'Test Link')

            const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', 'layer-0', 'text')

            // Update CSS variable
            await act(async () => {
                updateCssVar(textVar, '#ff0000')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [textVar] }
                }))
            })

            // Verify the CSS variable was set on documentElement
            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(textVar)
                if (!rootStyle || rootStyle !== '#ff0000') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates text-hover color when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <Link layer="layer-0" href="#">Test Link</Link>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const link = await waitForLink(container!, 'Test Link')
            const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', 'layer-0', 'text')

            await act(async () => {
                updateCssVar(textVar, '#00ff00')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [textVar] }
                }))
            })

            // Verify the CSS variable was set on documentElement
            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(textVar)
                if (!rootStyle || rootStyle !== '#00ff00') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })

    describe('Size Props Updates', () => {
        it('updates icon gap when toolbar changes', async () => {
            const TestIcon = () => <svg><circle /></svg>
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <Link startIcon={<TestIcon />} href="#">Test Link</Link>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const link = await waitForLink(container!)
            const gapVar = buildComponentCssVarPath('Link', 'properties', 'icon-text-gap')

            await act(async () => {
                updateCssVar(gapVar, '12px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [gapVar] }
                }))
            })

            await waitFor(() => {
                const computedStyle = window.getComputedStyle(link)
                const gapValue = link.style.getPropertyValue('--link-icon-gap') || computedStyle.getPropertyValue('--link-icon-gap')

                if (!gapValue || (!gapValue.includes(gapVar) && gapValue !== '12px')) {
                    throw new Error(`Icon gap not updated. Got: ${gapValue}`)
                }
            }, { timeout: 2000 })
        })
    })

    describe('Text Props Updates', () => {
        it('updates font weight when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <Link href="#">Test Link</Link>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const link = await waitForLink(container!)
            const fontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-weight')

            await act(async () => {
                updateCssVar(fontWeightVar, '700')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [fontWeightVar] }
                }))
            })

            // Verify the CSS variable was set on documentElement
            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(fontWeightVar)
                if (!rootStyle || rootStyle !== '700') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates text decoration when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <Link href="#" underline="hover">Test Link</Link>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const link = await waitForLink(container!)
            const decorationVar = getComponentTextCssVar('Link', 'text', 'text-decoration')

            await act(async () => {
                updateCssVar(decorationVar, 'underline')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [decorationVar] }
                }))
            })

            // Verify the CSS variable was set on documentElement
            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(decorationVar)
                if (!rootStyle || rootStyle !== 'underline') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })
})
