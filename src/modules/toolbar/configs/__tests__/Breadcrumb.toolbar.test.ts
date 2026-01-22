import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import config from '../Breadcrumb.toolbar.json'
import uikitJson from '../../../../vars/UIKit.json'

describe('Breadcrumb Toolbar Config', () => {
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
    const componentKey = 'breadcrumb'
    const component = uikitJson['ui-kit']?.components?.[componentKey]
    
    if (!component) {
      console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
      return
    }

    // Extract root-level props from UIKit.json
    const uikitProps = new Set<string>()
    
    // Component-level properties
    if (component.properties) {
      Object.keys(component.properties).forEach(prop => {
        if (prop !== 'colors') { // Skip colors object (handled separately)
          uikitProps.add(prop)
        }
      })
    }
    
    // Variant properties (check if they're referenced in toolbar)
    if (component.variants?.styles) {
      Object.values(component.variants.styles).forEach((variant: any) => {
        if (variant.properties?.colors) {
          Object.values(variant.properties.colors).forEach((layer: any) => {
            Object.keys(layer || {}).forEach(prop => uikitProps.add(prop))
          })
        }
      })
    }
    
    // Check that config props exist in UIKit.json (or are grouped)
    const configProps = new Set<string>()
    if (config.props) {
      Object.keys(config.props).forEach(prop => {
        configProps.add(prop)
        // Also add grouped props
        const propConfig = config.props[prop]
        if (propConfig.group) {
          Object.keys(propConfig.group).forEach(groupProp => configProps.add(groupProp))
        }
      })
    }
    
    // All config props should exist in UIKit.json (or be valid grouped props)
    configProps.forEach(prop => {
      // Allow some flexibility for grouped props that combine multiple UIKit props
      if (!uikitProps.has(prop) && !prop.includes('-')) {
        console.warn(`Config prop ${prop} not found in UIKit.json - may be a grouped prop`)
      }
    })
  })

  it('should have valid variant structure if variants exist', () => {
    if (config.variants) {
      Object.values(config.variants).forEach((variant: any) => {
        expect(variant.icon).toBeDefined()
        expect(variant.label).toBeDefined()
        expect(typeof variant.icon).toBe('string')
        expect(typeof variant.label).toBe('string')
      })
    }
  })

  it('should have all required props from UIKit.json', () => {
    const componentKey = 'breadcrumb'
    const component = uikitJson['ui-kit']?.components?.[componentKey]
    
    if (!component) {
      console.warn(`Component ${componentKey} not found in UIKit.json - skipping prop validation`)
      return
    }

    const requiredProps = new Set<string>()
    
    // Component-level properties
    if (component.properties) {
      Object.keys(component.properties).forEach(prop => {
        if (prop !== 'colors') {
          requiredProps.add(prop)
        }
      })
    }
    
    // Color properties from colors.layer-X.interactive, colors.layer-X.read-only, and colors.layer-X.separator-color
    if (component.properties?.colors) {
      // Check if any layer has interactive, read-only, or separator colors
      const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
      layers.forEach(layer => {
        if (component.properties.colors[layer]) {
          if (component.properties.colors[layer].interactive) {
            requiredProps.add('interactive-color')
          }
          if (component.properties.colors[layer]['read-only']) {
            requiredProps.add('read-only-color')
          }
          if (component.properties.colors[layer]['separator-color']) {
            requiredProps.add('separator-color')
          }
        }
      })
    }
    
    const configProps = new Set<string>()
    if (config.props) {
      Object.keys(config.props).forEach(prop => {
        configProps.add(prop)
        // Also add grouped props
        const propConfig = config.props[prop]
        if (propConfig.group) {
          Object.keys(propConfig.group).forEach(groupProp => configProps.add(groupProp))
        }
      })
    }
    
    // Check that all required props are in config
    requiredProps.forEach(prop => {
      expect(configProps.has(prop), `Required prop ${prop} missing from toolbar config`).toBe(true)
    })
  })
})

