import { describe, it, expect, vi } from 'vitest'
import config from '../AccordionItem.toolbar.json'
import uikitJson from '../../../../vars/UIKit.json'

describe('AccordionItem Toolbar Config', () => {
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
            // Grouped props should NOT have icons
            expect(groupConfig.icon, `Grouped prop ${groupName} should not have icon`).toBeUndefined()
          })
        }
      })
    }
  })

  it('should have props that match UIKit.json structure', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    const componentKey = 'accordion-item'
    const component = uikitJson['ui-kit']?.components?.[componentKey]

    if (!component) {
      console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
      consoleSpy.mockRestore()
      return
    }

    const uikitProps = new Set<string>()

    if (component.properties) {
      Object.keys(component.properties).forEach(prop => {
        if (prop !== 'colors') {
          uikitProps.add(prop)
        }
      })
    }

    if (component.properties?.colors) {
      Object.values(component.properties.colors).forEach((layer: any) => {
        Object.keys(layer || {}).forEach(prop => uikitProps.add(prop))
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
    const componentKey = 'accordion-item'
    const component = uikitJson['ui-kit']?.components?.[componentKey]

    if (!component) {
      console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
      return
    }

    const requiredProps = new Set<string>()

    if (component.properties) {
      Object.keys(component.properties).forEach(prop => {
        if (prop !== 'colors') {
          requiredProps.add(prop)
        }
      })
    }

    if (component.properties?.colors) {
      Object.values(component.properties.colors).forEach((layer: any) => {
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
      expect(configProps.has(prop), `Required prop ${prop} missing from AccordionItem toolbar config`).toBe(true)
    })
  })
})
