import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bootstrapTheme } from './bootstrap'
import * as validateSchemasModule from './utils/validateJsonSchemas'
import * as varsStoreModule from './store/varsStore'

// Mock validateJsonSchemas
vi.mock('./utils/validateJsonSchemas', () => ({
  validateAllJsonSchemas: vi.fn()
}))

// Mock varsStore
const mockStore = {}
vi.mock('./store/varsStore', () => ({
  getVarsStore: vi.fn(() => mockStore)
}))

// Mock JSON imports
vi.mock('../vars/Tokens.json', () => ({
  default: { tokens: {} }
}), { virtual: true })

vi.mock('../vars/Brand.json', () => ({
  default: { brand: { themes: { light: {}, dark: {} } } }
}), { virtual: true })

vi.mock('../vars/UIKit.json', () => ({
  default: { 'ui-kit': { global: {}, components: {} } }
}), { virtual: true })

describe('bootstrapTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development'
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

