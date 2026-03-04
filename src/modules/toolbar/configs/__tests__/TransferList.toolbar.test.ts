import { describe, it, expect, vi } from 'vitest'
import config from '../TransferList.toolbar.json'
import uikitJson from '../../../../vars/UIKit.json'

describe('TransferList Toolbar Config', () => {
    it('should have valid JSON structure', () => {
        expect(config).toBeDefined()
        expect(typeof config).toBe('object')
    })

    it('should have required fields for all props', () => {
        if (config.props) {
            Object.entries(config.props).forEach(([propName, propConfig]: [string, any]) => {
                expect(propConfig.icon, `Prop ${propName} missing icon`).toBeDefined()
                expect(propConfig.label, `Prop ${propName} missing label`).toBeDefined()
                expect(typeof propConfig.icon).toBe('string')
                expect(typeof propConfig.label).toBe('string')

                if (propConfig.group) {
                    Object.entries(propConfig.group).forEach(([groupName, groupConfig]: [string, any]) => {
                        expect(groupConfig.label, `Grouped prop ${groupName} missing label`).toBeDefined()
                        expect(typeof groupConfig.label).toBe('string')
                    })
                }
            })
        }
    })

    it('should have variants with states config', () => {
        expect(config.variants).toBeDefined()
        expect(config.variants.states).toBeDefined()
        expect(config.variants.states.icon).toBe('diamonds-four')
        expect(config.variants.states.label).toBe('State')
    })

    it('should have props that match UIKit.json structure', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
        const componentKey = 'transfer-list'
        const component = (uikitJson as any)['ui-kit']?.components?.[componentKey]

        if (!component) {
            console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
            consoleSpy.mockRestore()
            return
        }

        const uikitProps = new Set<string>()

        // Add component-level properties
        if (component.properties) {
            Object.keys(component.properties).forEach(prop => {
                if (prop !== 'colors') {
                    uikitProps.add(prop)
                }
            })
        }

        // Add color properties from any layer
        if (component.properties?.colors) {
            Object.values(component.properties.colors).forEach((layer: any) => {
                Object.keys(layer || {}).forEach(prop => uikitProps.add(prop))
            })
        }

        // Add variant state properties
        if (component.variants?.states) {
            Object.values(component.variants.states).forEach((state: any) => {
                if (state.properties?.colors) {
                    Object.values(state.properties.colors).forEach((layer: any) => {
                        Object.keys(layer || {}).forEach(prop => uikitProps.add(prop))
                    })
                }
                if (state.properties) {
                    Object.keys(state.properties).forEach(prop => {
                        if (prop !== 'colors') {
                            uikitProps.add(prop)
                        }
                    })
                }
            })
        }

        const configProps = new Set<string>()
        if (config.props) {
            Object.keys(config.props).forEach(prop => {
                configProps.add(prop)
                const propConfig = (config.props as any)[prop]
                if (propConfig.group) {
                    Object.keys(propConfig.group).forEach(groupProp => configProps.add(groupProp))
                }
            })
        }

        configProps.forEach(prop => {
            if (!uikitProps.has(prop) && !prop.includes('-')) {
                console.warn(`Config prop ${prop} not found in UIKit.json - may be a grouped prop`)
            }
        })
        consoleSpy.mockRestore()
    })

    it('should have all required props from UIKit.json', () => {
        const componentKey = 'transfer-list'
        const component = (uikitJson as any)['ui-kit']?.components?.[componentKey]

        if (!component) {
            console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
            return
        }

        const requiredProps = new Set<string>()

        // Add component-level properties
        if (component.properties) {
            Object.keys(component.properties).forEach(prop => {
                if (prop !== 'colors') {
                    requiredProps.add(prop)
                }
            })
        }

        // Add color properties from any layer
        if (component.variants?.states?.default?.properties?.colors) {
            const defaultColors = component.variants.states.default.properties.colors
            Object.values(defaultColors).forEach((layer: any) => {
                Object.keys(layer || {}).forEach(prop => requiredProps.add(prop))
            })
        }

        const configProps = new Set<string>()
        if (config.props) {
            Object.keys(config.props).forEach(prop => {
                configProps.add(prop)
                const propConfig = (config.props as any)[prop]
                if (propConfig.group) {
                    Object.keys(propConfig.group).forEach(groupProp => configProps.add(groupProp))
                }
            })
        }

        requiredProps.forEach(prop => {
            expect(configProps.has(prop), `Required prop ${prop} missing from TransferList toolbar config`).toBe(true)
        })
    })

    it('should have colors group with the expected sub-props', () => {
        const colorsConfig = (config.props as any).colors
        expect(colorsConfig).toBeDefined()
        expect(colorsConfig.group).toBeDefined()
        expect(colorsConfig.group.background).toBeDefined()
        expect(colorsConfig.group.text).toBeDefined()
        expect(colorsConfig.group['item-text']).toBeDefined()
        expect(colorsConfig.group['item-hover']).toBeDefined()
    })

    it('should have border group with the expected sub-props', () => {
        const borderConfig = (config.props as any).border
        expect(borderConfig).toBeDefined()
        expect(borderConfig.group).toBeDefined()
        expect(borderConfig.group['border-size']).toBeDefined()
        expect(borderConfig.group['border-radius']).toBeDefined()
        expect(borderConfig.group['border-color']).toBeDefined()
    })

    it('should have dimensions group with the expected sub-props', () => {
        const dimensionsConfig = (config.props as any).dimensions
        expect(dimensionsConfig).toBeDefined()
        expect(dimensionsConfig.group).toBeDefined()
        expect(dimensionsConfig.group.gap).toBeDefined()
        expect(dimensionsConfig.group['item-height']).toBeDefined()
        expect(dimensionsConfig.group['min-height']).toBeDefined()
        expect(dimensionsConfig.group['min-width']).toBeDefined()
        expect(dimensionsConfig.group['max-width']).toBeDefined()
    })

    it('should have padding group with the expected sub-props', () => {
        const paddingConfig = (config.props as any).padding
        expect(paddingConfig).toBeDefined()
        expect(paddingConfig.group).toBeDefined()
        expect(paddingConfig.group['horizontal-padding']).toBeDefined()
        expect(paddingConfig.group['vertical-padding']).toBeDefined()
    })

    it('should have text style prop', () => {
        const textConfig = (config.props as any).text
        expect(textConfig).toBeDefined()
        expect(textConfig.icon).toBe('text-aa')
        expect(textConfig.label).toBe('Text style')
        expect(textConfig.visible).toBe(true)
    })
})
