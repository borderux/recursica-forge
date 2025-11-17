import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { updateCssVar } from './updateCssVar'
import { readCssVar, readCssVarResolved } from './readCssVar'
import { applyCssVars } from './apply'

describe('CSS Variable Propagation', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('should propagate token changes to brand vars', () => {
    // Set up token
    updateCssVar('--recursica-tokens-color-gray-500', '#808080')
    
    // Set brand var to reference token
    updateCssVar('--recursica-brand-light-palettes-core-black', 'var(--recursica-tokens-color-gray-500)')
    
    // Change token
    updateCssVar('--recursica-tokens-color-gray-500', '#404040')
    
    // Brand var should still reference token (propagation happens via CSS cascade)
    const brandVar = readCssVar('--recursica-brand-light-palettes-core-black')
    expect(brandVar).toBe('var(--recursica-tokens-color-gray-500)')
    
    // Resolved value should reflect new token value
    const resolved = readCssVarResolved('--recursica-brand-light-palettes-core-black')
    expect(resolved).toBe('#404040')
  })

  it('should handle nested var() references', () => {
    updateCssVar('--recursica-tokens-color-gray-500', '#808080')
    updateCssVar('--recursica-brand-light-palettes-core-black', 'var(--recursica-tokens-color-gray-500)')
    updateCssVar('--recursica-brand-light-layer-layer-0-property-surface', 'var(--recursica-brand-light-palettes-core-black)')
    
    const resolved = readCssVarResolved('--recursica-brand-light-layer-layer-0-property-surface')
    expect(resolved).toBe('#808080')
  })

  it('should maintain references when applying multiple vars', () => {
    const vars = {
      '--recursica-tokens-color-gray-500': '#808080',
      '--recursica-brand-light-palettes-core-black': 'var(--recursica-tokens-color-gray-500)',
      '--recursica-brand-light-layer-layer-0-property-surface': 'var(--recursica-brand-light-palettes-core-black)'
    }
    
    applyCssVars(vars)
    
    expect(readCssVar('--recursica-tokens-color-gray-500')).toBe('#808080')
    expect(readCssVar('--recursica-brand-light-palettes-core-black')).toBe('var(--recursica-tokens-color-gray-500)')
    expect(readCssVar('--recursica-brand-light-layer-layer-0-property-surface')).toBe('var(--recursica-brand-light-palettes-core-black)')
    
    // Change token
    updateCssVar('--recursica-tokens-color-gray-500', '#404040')
    
    // Resolved chain should reflect new value
    const resolved = readCssVarResolved('--recursica-brand-light-layer-layer-0-property-surface')
    expect(resolved).toBe('#404040')
  })
})


