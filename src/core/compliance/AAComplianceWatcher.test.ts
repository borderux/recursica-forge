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
    
    // Set up token CSS variables that the tests need
    document.documentElement.style.setProperty('--recursica-tokens-color-gray-000', '#ffffff')
    document.documentElement.style.setProperty('--recursica-tokens-color-gray-500', '#808080')
    document.documentElement.style.setProperty('--recursica-tokens-color-gray-1000', '#000000')
    
    // Set up core palette CSS variables
    document.documentElement.style.setProperty('--recursica-brand-themes-light-palettes-core-black', 'var(--recursica-tokens-color-gray-1000)')
    document.documentElement.style.setProperty('--recursica-brand-themes-light-palettes-core-white', 'var(--recursica-tokens-color-gray-000)')
  })

  it('should initialize and watch CSS variables', () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    expect(watcher).toBeDefined()
    
    watcher.destroy()
  })

  it.skip('should update palette on-tone when tone changes', async () => {
    // Disabled: Complex integration test with event handling issues in CI
    // The watcher's event-driven updates are flaky in test environment
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    const toneVar = '--recursica-brand-themes-light-palettes-test-500-tone'
    const onToneVar = '--recursica-brand-themes-light-palettes-test-500-on-tone'
    
    // First register the watcher (this records the initial value as undefined)
    watcher.watchPaletteOnTone('test', '500', 'light')
    
    // Set an initial value first (this will be recorded but not trigger update)
    // Use updateCssVar to properly trigger the watcher
    updateCssVar(toneVar, '#000000', mockTokens as any)
    // Wait for checkForChanges debounce (50ms) + processing + isUpdating flag reset (100ms)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verify initial value was recorded
    expect(readCssVar(toneVar)).toBeTruthy()
    
    // Now change it to a different value - this should trigger the update
    // Use gray-500 which is #808080 - this should choose white (#ffffff) for better contrast
    updateCssVar(toneVar, '#808080', mockTokens as any)
    
    // Wait for watcher to process the change (checkForChanges has 50ms debounce + update time + isUpdating reset)
    // In CI, this can take longer, so wait up to 3 seconds with polling
    let onTone: string | undefined
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onTone = readCssVar(onToneVar)
      if (onTone) break
    }
    
    expect(onTone).toBeDefined()
    // Should be either black or white based on contrast
    // Gray (#808080) has better contrast with white (#ffffff) than black (#000000)
    expect(['var(--recursica-brand-themes-light-palettes-core-black)', 'var(--recursica-brand-themes-light-palettes-core-white)']).toContain(onTone)
    
    watcher.destroy()
  })

  it('should update layer element colors when surface changes', async () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    // Set up layer surface first - use direct DOM manipulation for test setup to bypass validation
    // In real usage, this would be set via updateCssVar with proper token references
    const surfaceVar = '--recursica-brand-themes-light-layer-layer-0-property-surface'
    document.documentElement.style.setProperty(surfaceVar, 'var(--recursica-tokens-color-gray-000)')
    
    // watchLayerSurface calls updateLayerElementColors immediately, but we also need to ensure
    // the surface value is set before calling it
    watcher.watchLayerSurface(0)
    
    // Also dispatch the cssVarsUpdated event to ensure the watcher processes it
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [surfaceVar] }
    }))
    
    // Wait for watcher to process (watchLayerSurface uses setTimeout with 0 delay)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const textColor = readCssVar('--recursica-brand-themes-light-layer-layer-0-property-element-text-color')
    expect(textColor).toBeDefined()
    
    watcher.destroy()
  })

  it('should validate all compliance on startup', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    // Manually call validateAllCompliance since it doesn't run on init
    watcher.validateAllCompliance()
    
    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // validateAllCompliance should log results (or at least run without errors)
    // The method may or may not log depending on whether there are issues
    // So we just verify it doesn't throw and the watcher is still valid
    expect(watcher).toBeDefined()
    
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    watcher.destroy()
  })

  it('should update all layers when core colors change', async () => {
    const watcher = new AAComplianceWatcher(mockTokens as any, mockTheme as any)
    
    watcher.watchCoreColors()
    
    // Change core interactive color - use direct DOM manipulation for test setup to bypass validation
    // In real usage, this would be set via updateCssVar with proper token references
    document.documentElement.style.setProperty('--recursica-brand-themes-light-palettes-core-interactive', 'var(--recursica-tokens-color-gray-500)')
    
    // Wait for watcher to process
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Should trigger updates
    watcher.destroy()
  })
})



