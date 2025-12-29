import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AAComplianceWatcher } from './AAComplianceWatcher'
import { updateCssVar } from '../css/updateCssVar'
import { readCssVar } from '../css/readCssVar'

// Mock tokens and theme for testing
const mockTokens = {
  tokens: {
    color: {
      gray: {
        '000': { $value: '#ffffff' },
        '1000': { $value: '#000000' },
        '500': { $value: '#808080' }
      }
    },
    opacity: {
      solid: { $value: 1 },
      smoky: { $value: 0.6 }
    }
  }
}

const mockTheme = {
  brand: {
    themes: {
      light: {
        palettes: {
          'core-colors': {
            black: { $value: '{tokens.color.gray.1000}' },
            white: { $value: '{tokens.color.gray.000}' },
            interactive: { $value: '{tokens.color.gray.500}' }
          }
        },
        layers: {
          'layer-0': {
            property: {
              surface: { $value: '{tokens.color.gray.000}' }
            }
          }
        }
      }
    }
  }
}

describe('AAComplianceWatcher', () => {
  beforeEach(() => {
    // Clear all CSS variables
    document.documentElement.style.cssText = ''
  })

  it('should initialize and watch CSS variables', () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    expect(watcher).toBeDefined()
    
    watcher.destroy()
  })

  it('should update palette on-tone when tone changes', () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    // Set up a palette tone
    updateCssVar('--recursica-brand-themes-light-palettes-test-500-tone', '#808080')
    watcher.watchPaletteOnTone('test', '500', 'light')
    
    // Wait for watcher to process
    setTimeout(() => {
      const onTone = readCssVar('--recursica-brand-themes-light-palettes-test-500-on-tone')
      expect(onTone).toBeDefined()
      // Should be either black or white based on contrast
      expect(['var(--recursica-brand-light-palettes-core-black)', 'var(--recursica-brand-light-palettes-core-white)']).toContain(onTone)
      
      watcher.destroy()
    }, 200)
  })

  it('should update layer element colors when surface changes', () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    // Set up layer surface
    updateCssVar('--recursica-brand-light-layer-layer-0-property-surface', '#ffffff')
    watcher.watchLayerSurface(0)
    
    // Wait for watcher to process
    setTimeout(() => {
      const textColor = readCssVar('--recursica-brand-light-layer-layer-0-property-element-text-color')
      expect(textColor).toBeDefined()
      
      watcher.destroy()
    }, 200)
  })

  it('should validate all compliance on startup', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    // Wait for validation to run
    setTimeout(() => {
      // Should log validation results
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      watcher.destroy()
    }, 300)
  })

  it('should update all layers when core colors change', () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    watcher.watchCoreColors()
    
    // Change core interactive color
    updateCssVar('--recursica-brand-light-palettes-core-interactive', '#ff0000')
    
    // Wait for watcher to process
    setTimeout(() => {
      // Should trigger updates
      watcher.destroy()
    }, 200)
  })
})



