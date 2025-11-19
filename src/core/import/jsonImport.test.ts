import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  importTokensJson, 
  importBrandJson, 
  importUIKitJson, 
  importJsonFiles,
  detectJsonFileType,
  detectDirtyData
} from './jsonImport'
import * as validateSchemasModule from '../utils/validateJsonSchemas'
import * as varsStoreModule from '../store/varsStore'

// Mock validateJsonSchemas
vi.mock('../utils/validateJsonSchemas', () => ({
  validateBrandJson: vi.fn(),
  validateTokensJson: vi.fn(),
  validateUIKitJson: vi.fn()
}))

// Mock varsStore
const mockStore = {
  setTokens: vi.fn(),
  setTheme: vi.fn(),
  setUiKit: vi.fn(),
  getState: vi.fn(() => ({
    tokens: {},
    theme: {},
    uikit: {}
  }))
}

vi.mock('../store/varsStore', () => ({
  getVarsStore: vi.fn(() => mockStore)
}))

describe('detectJsonFileType', () => {
  it('should detect tokens.json', () => {
    expect(detectJsonFileType({ tokens: {} })).toBe('tokens')
  })

  it('should detect brand.json', () => {
    expect(detectJsonFileType({ brand: {} })).toBe('brand')
    expect(detectJsonFileType({ themes: {} })).toBe('brand')
  })

  it('should detect uikit.json', () => {
    expect(detectJsonFileType({ 'ui-kit': {} })).toBe('uikit')
    expect(detectJsonFileType({ uiKit: {} })).toBe('uikit')
  })

  it('should return null for unknown types', () => {
    expect(detectJsonFileType({})).toBeNull()
    expect(detectJsonFileType({ unknown: {} })).toBeNull()
  })
})

describe('detectDirtyData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.getState.mockReturnValue({
      tokens: {},
      theme: {},
      uikit: {}
    })
  })

  it('should return false when data matches original', () => {
    // Mock getState to return same structure as original
    mockStore.getState.mockReturnValue({
      tokens: { tokens: {} },
      theme: { brand: {} },
      uikit: { 'ui-kit': {} }
    })
    
    const result = detectDirtyData()
    expect(result).toBe(false)
  })

  it('should return true when tokens differ', () => {
    mockStore.getState.mockReturnValue({
      tokens: { tokens: { color: { gray: { '500': { $value: '#ff0000' } } } } },
      theme: { brand: {} },
      uikit: { 'ui-kit': {} }
    })
    
    const result = detectDirtyData()
    expect(result).toBe(true)
  })

  it('should return true when theme differs', () => {
    mockStore.getState.mockReturnValue({
      tokens: { tokens: {} },
      theme: { brand: { themes: { light: { palettes: {} } } } },
      uikit: { 'ui-kit': {} }
    })
    
    const result = detectDirtyData()
    expect(result).toBe(true)
  })

  it('should return false on error (assume clean)', () => {
    mockStore.getState.mockImplementation(() => {
      throw new Error('Test error')
    })
    
    const result = detectDirtyData()
    expect(result).toBe(false)
  })
})

describe('importTokensJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate and import tokens', () => {
    const tokens = { tokens: { color: { gray: { '500': { $value: '#808080' } } } } }
    
    importTokensJson(tokens)
    
    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalledWith(tokens)
    expect(mockStore.setTokens).toHaveBeenCalledWith(tokens)
  })

  it('should normalize tokens structure', () => {
    const tokens = { color: { gray: { '500': { $value: '#808080' } } } }
    
    importTokensJson(tokens)
    
    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalledWith({ tokens })
    expect(mockStore.setTokens).toHaveBeenCalledWith({ tokens })
  })

  it('should throw on validation failure', () => {
    const tokens = { tokens: { invalid: 'data' } }
    vi.mocked(validateSchemasModule.validateTokensJson).mockImplementation(() => {
      throw new Error('Validation failed')
    })
    
    expect(() => importTokensJson(tokens)).toThrow('Failed to import tokens.json')
  })
})

describe('importBrandJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate and import brand', () => {
    const brand = { brand: { themes: { light: {} } } }
    
    importBrandJson(brand)
    
    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalledWith(brand)
    expect(mockStore.setTheme).toHaveBeenCalledWith(brand)
  })

  it('should normalize brand structure', () => {
    const brand = { themes: { light: {} } }
    
    importBrandJson(brand)
    
    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalledWith({ brand })
    expect(mockStore.setTheme).toHaveBeenCalledWith({ brand })
  })

  it('should throw on validation failure', () => {
    const brand = { brand: { invalid: 'data' } }
    vi.mocked(validateSchemasModule.validateBrandJson).mockImplementation(() => {
      throw new Error('Validation failed')
    })
    
    expect(() => importBrandJson(brand)).toThrow('Failed to import brand.json')
  })
})

describe('importUIKitJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate and import uikit', () => {
    const uikit = { 'ui-kit': { global: {}, components: {} } }
    
    importUIKitJson(uikit)
    
    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalledWith(uikit)
    expect(mockStore.setUiKit).toHaveBeenCalledWith(uikit)
  })

  it('should normalize uikit structure', () => {
    const uikit = { global: {}, components: {} }
    
    importUIKitJson(uikit)
    
    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalledWith({ 'ui-kit': uikit })
    expect(mockStore.setUiKit).toHaveBeenCalledWith({ 'ui-kit': uikit })
  })

  it('should throw on validation failure', () => {
    const uikit = { 'ui-kit': { invalid: 'data' } }
    vi.mocked(validateSchemasModule.validateUIKitJson).mockImplementation(() => {
      throw new Error('Validation failed')
    })
    
    expect(() => importUIKitJson(uikit)).toThrow('Failed to import uikit.json')
  })
})

describe('importJsonFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.documentElement.style
    if (typeof document !== 'undefined') {
      document.documentElement.style.cssText = ''
    }
  })

  it('should import all files when provided', () => {
    const files = {
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { 'ui-kit': {} }
    }
    
    importJsonFiles(files)
    
    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalled()
    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalled()
    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalled()
    expect(mockStore.setTokens).toHaveBeenCalled()
    expect(mockStore.setTheme).toHaveBeenCalled()
    expect(mockStore.setUiKit).toHaveBeenCalled()
  })

  it('should import only tokens when provided', () => {
    const files = {
      tokens: { tokens: {} }
    }
    
    importJsonFiles(files)
    
    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalled()
    expect(validateSchemasModule.validateBrandJson).not.toHaveBeenCalled()
    expect(validateSchemasModule.validateUIKitJson).not.toHaveBeenCalled()
  })

  it('should import files in correct order', () => {
    const files = {
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { 'ui-kit': {} }
    }
    
    const callOrder: string[] = []
    vi.mocked(mockStore.setTokens).mockImplementation(() => callOrder.push('tokens'))
    vi.mocked(mockStore.setTheme).mockImplementation(() => callOrder.push('brand'))
    vi.mocked(mockStore.setUiKit).mockImplementation(() => callOrder.push('uikit'))
    
    importJsonFiles(files)
    
    expect(callOrder).toEqual(['tokens', 'brand', 'uikit'])
  })
})

