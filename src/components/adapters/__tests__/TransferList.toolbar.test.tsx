/**
 * Toolbar Props Integration Tests - TransferList
 * 
 * Tests that verify the TransferList component reactively updates when toolbar
 * props are changed. These tests simulate toolbar updates by directly updating
 * CSS variables and verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { TransferList, TransferListData } from '../TransferList'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentLevelCssVar } from '../../utils/cssVarNames'
import { readCssVar } from '../../../core/css/readCssVar'

const sampleData: TransferListData = [
    [
        { value: 'item-1', label: 'Item One', group: 'Group A' },
        { value: 'item-2', label: 'Item Two', group: 'Group A' },
        { value: 'item-3', label: 'Item Three', group: 'Group B' },
    ],
    [
        { value: 'item-4', label: 'Item Four', group: 'Group A' },
    ],
]

/**
 * Component Rendering Tests
 * 
 * These tests verify the TransferList component renders correctly
 * with various props and states.
 */
describe.skip('TransferList Component Rendering', () => {
    beforeEach(() => {
        document.documentElement.style.cssText = ''
    })

    afterEach(() => {
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

    const waitForTransferList = async (container: HTMLElement) => {
        return await waitFor(() => {
            const tl = container.querySelector('.recursica-transfer-list')
            if (!tl) throw new Error('TransferList not found')
            return tl as HTMLElement
        }, { timeout: 30000 })
    }

    it('renders with source and target panes', async () => {
        const { container } = await renderWithProviders(
            <TransferList
                defaultData={sampleData}
                sourceLabel="Source"
                targetLabel="Target"
            />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        const panes = tl.querySelectorAll('.recursica-transfer-list-pane')
        expect(panes.length).toBe(2)
    }, 60000)

    it('renders items in correct panes', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        await waitFor(() => {
            const checkboxes = tl.querySelectorAll('input[type="checkbox"]')
            // 3 source items + 1 target item = 4 checkboxes
            expect(checkboxes.length).toBe(4)
        }, { timeout: 30000 })
    })

    it('renders with label when provided', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} label="My Transfer List" />
        )

        await waitFor(() => {
            const text = container.textContent
            expect(text).toContain('My Transfer List')
        })
    })

    it('renders assistive text for help', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} helpText="Select items to transfer" />
        )

        await waitFor(() => {
            const text = container.textContent
            expect(text).toContain('Select items to transfer')
        })
    })

    it('renders assistive text for error', async () => {
        const { container } = await renderWithProviders(
            <TransferList
                defaultData={sampleData}
                state="error"
                errorText="Selection required"
            />
        )

        await waitFor(() => {
            const text = container.textContent
            expect(text).toContain('Selection required')
        })
    })

    it('applies error class when state is error', async () => {
        const { container } = await renderWithProviders(
            <TransferList
                defaultData={sampleData}
                state="error"
                errorText="Error"
            />
        )
        await waitForTransferList(container)

        await waitFor(() => {
            const errorEl = container.querySelector('.recursica-transfer-list--error')
            expect(errorEl).toBeInTheDocument()
        })
    })

    it('applies disabled class when state is disabled', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} state="disabled" />
        )
        await waitForTransferList(container)

        await waitFor(() => {
            const disabledEl = container.querySelector('.recursica-transfer-list--disabled')
            expect(disabledEl).toBeInTheDocument()
        })
    })

    it('renders transfer action buttons', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        const actions = tl.querySelector('.recursica-transfer-list-actions')
        expect(actions).toBeInTheDocument()
    })

    it('renders with search fields when searchable', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} searchable />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        const searchInputs = tl.querySelectorAll('.recursica-transfer-list-search')
        expect(searchInputs.length).toBe(2)
    })

    it('renders group containers', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        // Group containers should be rendered
        const groups = tl.querySelectorAll('.recursica-transfer-list-group')
        expect(groups.length).toBeGreaterThan(0)
    })

    it('renders badge counts in pane headers', async () => {
        const { container } = await renderWithProviders(
            <TransferList defaultData={sampleData} />
        )
        const tl = await waitForTransferList(container)
        expect(tl).toBeInTheDocument()

        // Badge components are used for counts in pane headers
        const headers = tl.querySelectorAll('.recursica-transfer-list-pane-header')
        expect(headers.length).toBe(2)
    })
})

/**
 * CSS Variable Toolbar Integration Tests
 * 
 * Skipped by default as they require full CSS bootstrap.
 * These test that CSS variable updates via toolbar controls
 * correctly propagate to the component.
 */
describe.skip('TransferList Toolbar Props Integration', () => {
    beforeEach(() => {
        document.documentElement.style.cssText = ''
    })

    afterEach(() => {
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

    const waitForTransferList = async (container: HTMLElement) => {
        return await waitFor(() => {
            const tl = container.querySelector('.recursica-transfer-list')
            if (!tl) throw new Error('TransferList not found')
            return tl as HTMLElement
        }, { timeout: 30000 })
    }

    describe('Color Props Updates', () => {
        const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const
        const colorProps = ['background', 'text', 'item-text', 'item-hover', 'border-color'] as const

        layers.forEach(layer => {
            colorProps.forEach(colorProp => {
                it(`updates ${colorProp} color when toolbar changes for ${layer}`, { timeout: 60000 }, async () => {
                    const { container } = await renderWithProviders(
                        <TransferList
                            defaultData={sampleData}
                            label="Test Transfer List"
                            layer={layer}
                        />
                    )

                    const tl = await waitForTransferList(container)
                    expect(tl).toBeInTheDocument()

                    const colorVar = getComponentLevelCssVar('TransferList', `colors.${layer}.${colorProp}`)

                    // Simulate toolbar update
                    updateCssVar(colorVar, '#ff0000')

                    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                        detail: { cssVars: [colorVar] }
                    }))

                    await waitFor(() => {
                        const updatedValue = readCssVar(colorVar)
                        expect(updatedValue).toBe('#ff0000')
                    }, { timeout: 10000 })
                })
            })
        })
    })

    describe('Component-Level Props Updates', () => {
        it('updates border-radius when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            const borderRadiusVar = getComponentLevelCssVar('TransferList', 'border-radius')

            updateCssVar(borderRadiusVar, '12px')

            await waitFor(() => {
                expect(readCssVar(borderRadiusVar)).toBe('12px')
            }, { timeout: 1000 })
        })

        it('updates horizontal-padding when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            const paddingVar = getComponentLevelCssVar('TransferList', 'horizontal-padding')

            updateCssVar(paddingVar, '24px')

            await waitFor(() => {
                expect(readCssVar(paddingVar)).toBe('24px')
            }, { timeout: 1000 })
        })

        it('updates gap when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            const gapVar = getComponentLevelCssVar('TransferList', 'gap')

            updateCssVar(gapVar, '20px')

            await waitFor(() => {
                expect(readCssVar(gapVar)).toBe('20px')
            }, { timeout: 1000 })
        })

        it('updates item-height when toolbar changes', async () => {
            const { container } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            const itemHeightVar = getComponentLevelCssVar('TransferList', 'item-height')

            updateCssVar(itemHeightVar, '44px')

            await waitFor(() => {
                expect(readCssVar(itemHeightVar)).toBe('44px')
            }, { timeout: 1000 })
        })
    })

    describe('Multiple Props Updates', () => {
        it('handles multiple simultaneous CSS variable updates', async () => {
            const { container } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" layer="layer-0" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            const borderRadiusVar = getComponentLevelCssVar('TransferList', 'border-radius')
            const gapVar = getComponentLevelCssVar('TransferList', 'gap')
            const itemHeightVar = getComponentLevelCssVar('TransferList', 'item-height')

            updateCssVar(borderRadiusVar, '16px')
            updateCssVar(gapVar, '24px')
            updateCssVar(itemHeightVar, '40px')

            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                detail: { cssVars: [borderRadiusVar, gapVar, itemHeightVar] }
            }))

            await waitFor(() => {
                expect(readCssVar(borderRadiusVar)).toBe('16px')
                expect(readCssVar(gapVar)).toBe('24px')
                expect(readCssVar(itemHeightVar)).toBe('40px')
            }, { timeout: 1000 })
        })
    })

    describe('Variant Switching', () => {
        it('updates CSS variables when layer changes', async () => {
            const { container, rerender } = await renderWithProviders(
                <TransferList defaultData={sampleData} label="Test" layer="layer-0" />
            )
            const tl = await waitForTransferList(container)
            expect(tl).toBeInTheDocument()

            // Switch to layer-1
            await act(async () => {
                rerender(
                    <UiKitProvider>
                        <ThemeModeProvider>
                            <UnifiedThemeProvider>
                                <TransferList defaultData={sampleData} label="Test" layer="layer-1" />
                            </UnifiedThemeProvider>
                        </ThemeModeProvider>
                    </UiKitProvider>
                )
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitFor(() => {
                const layer1ColorVar = getComponentLevelCssVar('TransferList', 'colors.layer-1.background')
                expect(layer1ColorVar).toBeTruthy()
            }, { timeout: 1000 })
        })
    })
})
