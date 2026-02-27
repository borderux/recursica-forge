/**
 * RadioButtonGroup Toolbar Props Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { RadioButtonItem } from '../RadioButtonItem'
import { RadioButtonGroup } from '../RadioButtonGroup'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath } from '../../utils/cssVarNames'

describe.skip('RadioButtonGroup Toolbar Props Integration', () => {
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

    const waitForGroup = async (container: HTMLElement) => {
        return await waitFor(() => {
            const group = container.querySelector('[role="radiogroup"]')
            if (!group) throw new Error('RadioButtonGroup not found')
            return group as HTMLElement
        }, { timeout: 20000 })
    }

    describe('Spacing Props Updates', () => {
        it('updates item gap when toolbar changes', { timeout: 60000 }, async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonGroup
                        label="Test Group"
                        layer="layer-0"
                        orientation="vertical"
                    >
                        <RadioButtonItem
                            label="Option 1"
                            value="opt1"
                            selected={true}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                        <RadioButtonItem
                            label="Option 2"
                            value="opt2"
                            selected={false}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                    </RadioButtonGroup>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForGroup(container!)

            const gapVar = buildComponentCssVarPath('RadioButtonGroup', 'properties', 'item-gap')

            await act(async () => {
                updateCssVar(gapVar, '24px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [gapVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(gapVar)
                if (!rootStyle || rootStyle !== '24px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates padding when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonGroup
                        label="Test Group"
                        layer="layer-0"
                        orientation="vertical"
                    >
                        <RadioButtonItem
                            label="Option 1"
                            value="opt1"
                            selected={true}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                    </RadioButtonGroup>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForGroup(container!)

            const paddingVar = buildComponentCssVarPath('RadioButtonGroup', 'properties', 'padding')

            await act(async () => {
                updateCssVar(paddingVar, '12px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [paddingVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(paddingVar)
                if (!rootStyle || rootStyle !== '12px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })

    describe('Layout Variants', () => {
        it('renders stacked layout correctly', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonGroup
                        label="Stacked Group"
                        layout="stacked"
                        layer="layer-0"
                        orientation="vertical"
                    >
                        <RadioButtonItem
                            label="Option 1"
                            value="opt1"
                            selected={true}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                        <RadioButtonItem
                            label="Option 2"
                            value="opt2"
                            selected={false}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                    </RadioButtonGroup>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const group = await waitForGroup(container!)
            expect(group).toBeTruthy()
            // Verify role="radiogroup" is set
            expect(group.getAttribute('role')).toBe('radiogroup')
        })

        it('renders side-by-side layout correctly', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonGroup
                        label="Side-by-Side Group"
                        layout="side-by-side"
                        layer="layer-0"
                        orientation="vertical"
                    >
                        <RadioButtonItem
                            label="Option 1"
                            value="opt1"
                            selected={true}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                    </RadioButtonGroup>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            const group = await waitForGroup(container!)
            expect(group).toBeTruthy()
            expect(group.getAttribute('role')).toBe('radiogroup')
        })
    })

    describe('Top-Bottom Margin Updates', () => {
        it('updates stacked top-bottom margin when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonGroup
                        label="Test Group"
                        layout="stacked"
                        layer="layer-0"
                    >
                        <RadioButtonItem
                            label="Option 1"
                            value="opt1"
                            selected={true}
                            onChange={() => { }}
                            layer="layer-0"
                        />
                    </RadioButtonGroup>
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForGroup(container!)

            const marginVar = buildComponentCssVarPath('RadioButtonGroup', 'variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin')

            await act(async () => {
                updateCssVar(marginVar, '20px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [marginVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(marginVar)
                if (!rootStyle || rootStyle !== '20px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })
})
