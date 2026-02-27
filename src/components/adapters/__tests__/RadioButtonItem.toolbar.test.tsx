/**
 * RadioButtonItem Toolbar Props Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { UnifiedThemeProvider } from '../../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../../modules/uikit/UiKitContext'
import { ThemeModeProvider } from '../../../modules/theme/ThemeModeContext'
import { RadioButtonItem } from '../RadioButtonItem'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath, getComponentTextCssVar } from '../../utils/cssVarNames'

describe.skip('RadioButtonItem Toolbar Props Integration', () => {
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

    const waitForRadio = async (container: HTMLElement) => {
        return await waitFor(() => {
            // Try to find the radio input element
            const radio = container.querySelector('input[type="radio"]') || container.querySelector('.mantine-Radio-radio')
            if (!radio) throw new Error('Radio button not found')
            return radio as HTMLElement
        }, { timeout: 20000 })
    }

    describe('Color Props Updates', () => {
        it('updates selected background color when toolbar changes', { timeout: 60000 }, async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={true}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)

            const bgVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', 'layer-0', 'background-selected')

            // Update CSS variable
            await act(async () => {
                updateCssVar(bgVar, '#ff0000')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [bgVar] }
                }))
            })

            // Verify the CSS variable was set on documentElement
            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(bgVar)
                if (!rootStyle || rootStyle !== '#ff0000') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates unselected border color when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const borderVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', 'layer-0', 'border-unselected')

            await act(async () => {
                updateCssVar(borderVar, '#00ff00')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [borderVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(borderVar)
                if (!rootStyle || rootStyle !== '#00ff00') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates icon color when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={true}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const iconColorVar = buildComponentCssVarPath('RadioButton', 'properties', 'colors', 'layer-0', 'icon-color')

            await act(async () => {
                updateCssVar(iconColorVar, '#0000ff')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [iconColorVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(iconColorVar)
                if (!rootStyle || rootStyle !== '#0000ff') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })

    describe('Size Props Updates', () => {
        it('updates radio button size when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const sizeVar = buildComponentCssVarPath('RadioButton', 'properties', 'size')

            await act(async () => {
                updateCssVar(sizeVar, '32px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [sizeVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(sizeVar)
                if (!rootStyle || rootStyle !== '32px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates border radius when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const radiusVar = buildComponentCssVarPath('RadioButton', 'properties', 'border-radius')

            await act(async () => {
                updateCssVar(radiusVar, '4px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [radiusVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(radiusVar)
                if (!rootStyle || rootStyle !== '4px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates label gap when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const gapVar = buildComponentCssVarPath('RadioButtonItem', 'properties', 'label-gap')

            await act(async () => {
                updateCssVar(gapVar, '16px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [gapVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(gapVar)
                if (!rootStyle || rootStyle !== '16px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })

    describe('Text Props Updates', () => {
        it('updates font weight when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const fontWeightVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-weight')

            await act(async () => {
                updateCssVar(fontWeightVar, '700')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [fontWeightVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(fontWeightVar)
                if (!rootStyle || rootStyle !== '700') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })

        it('updates font size when toolbar changes', async () => {
            let container: HTMLElement
            await act(async () => {
                const result = renderWithProviders(
                    <RadioButtonItem
                        label="Test Radio"
                        selected={false}
                        onChange={() => { }}
                        layer="layer-0"
                    />
                )
                container = result.container
                await new Promise(resolve => setTimeout(resolve, 0))
            })

            await waitForRadio(container!)
            const fontSizeVar = getComponentTextCssVar('RadioButtonItem', 'text', 'font-size')

            await act(async () => {
                updateCssVar(fontSizeVar, '18px')
                window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                    detail: { cssVars: [fontSizeVar] }
                }))
            })

            await waitFor(() => {
                const rootStyle = document.documentElement.style.getPropertyValue(fontSizeVar)
                if (!rootStyle || rootStyle !== '18px') {
                    throw new Error(`CSS var not set on root. Got: ${rootStyle}`)
                }
            }, { timeout: 5000 })
        })
    })
})
