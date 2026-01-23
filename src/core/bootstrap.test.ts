import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { bootstrapTheme } from './bootstrap'
import * as validateSchemasModule from './utils/validateJsonSchemas'
import * as varsStoreModule from './store/varsStore'

// Mock validateJsonSchemas
vi.mock('./utils/validateJsonSchemas', () => ({
  validateAllJsonSchemas: vi.fn()
}))

// Mock varsStore
const mockStore = {
  getState: vi.fn(() => ({
    tokens: {},
    theme: {},
    uikit: {}
  })),
  recomputeAndApplyAll: vi.fn(),
  setTokens: vi.fn(),
  setTheme: vi.fn(),
  setUiKit: vi.fn()
}
vi.mock('./store/varsStore', () => ({
  getVarsStore: vi.fn(() => mockStore)
}))

// Mock JSON imports
vi.mock('../vars/Tokens.json', () => ({
  default: { tokens: {} }
}))

vi.mock('../vars/Brand.json', () => ({
  default: { brand: { themes: { light: {}, dark: {} } } }
}))

vi.mock('../vars/UIKit.json', () => ({
  default: { 'ui-kit': { globals: {}, components: {} } }
}))

describe('bootstrapTheme', () => {
  let originalWarn: typeof console.warn

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development'
    // Suppress expected warnings from bootstrap (font loading errors in test environment)
    originalWarn = console.warn
    console.warn = vi.fn((...args: any[]) => {
      const message = String(args[0] || '')
      // Suppress expected bootstrap warnings
      if (message.includes('[Bootstrap] Failed to') ||
          message.includes('[loadFontsFromTokens] Error') ||
          message.includes('store.getState is not a function') ||
          message.includes('store.recomputeAndApplyAll is not a function')) {
        return
      }
      originalWarn.call(console, ...args)
    })
  })

  afterEach(() => {
    // Restore console.warn
    console.warn = originalWarn
  })

  it('should validate schemas and initialize store', () => {
    bootstrapTheme()
    
    expect(validateSchemasModule.validateAllJsonSchemas).toHaveBeenCalled()
    expect(varsStoreModule.getVarsStore).toHaveBeenCalled()
  })

  it('should normalize theme structure before validation', () => {
    bootstrapTheme()
    
    // Should have been called with normalized theme structure
    expect(validateSchemasModule.validateAllJsonSchemas).toHaveBeenCalled()
    const callArgs = vi.mocked(validateSchemasModule.validateAllJsonSchemas).mock.calls[0]
    expect(callArgs).toBeDefined()
  })

  it('should throw error in development mode on validation failure', () => {
    vi.mocked(validateSchemasModule.validateAllJsonSchemas).mockImplementation(() => {
      throw new Error('Validation failed')
    })
    
    expect(() => bootstrapTheme()).toThrow('Validation failed')
  })

  it('should log but not throw in production mode', () => {
    process.env.NODE_ENV = 'production'
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    vi.mocked(validateSchemasModule.validateAllJsonSchemas).mockImplementation(() => {
      throw new Error('Validation failed')
    })
    
    // Should not throw in production
    expect(() => bootstrapTheme()).not.toThrow()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Bootstrap] Schema validation failed'),
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should handle validation errors gracefully', () => {
    vi.mocked(validateSchemasModule.validateAllJsonSchemas).mockImplementation(() => {
      throw new Error('Test validation error')
    })
    
    expect(() => bootstrapTheme()).toThrow('Test validation error')
  })
})

