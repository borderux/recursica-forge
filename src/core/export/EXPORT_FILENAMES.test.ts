import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  EXPORT_FILENAME_TOKENS,
  EXPORT_FILENAME_BRAND,
  EXPORT_FILENAME_UIKIT,
  EXPORT_FILENAME_CSS_SPECIFIC,
  EXPORT_FILENAME_CSS_SCOPED,
} from './EXPORT_FILENAMES'
import { exportCssStylesheet } from './jsonExport'

describe('export filenames', () => {
  it('use new naming convention (underscores, recursica_ prefix)', () => {
    expect(EXPORT_FILENAME_TOKENS).toBe('recursica_tokens.json')
    expect(EXPORT_FILENAME_BRAND).toBe('recursica_brand.json')
    expect(EXPORT_FILENAME_UIKIT).toBe('recursica_ui-kit.json')
    expect(EXPORT_FILENAME_CSS_SPECIFIC).toBe('recursica_variables_specific.css')
    expect(EXPORT_FILENAME_CSS_SCOPED).toBe('recursica_variables_scoped.css')
  })
})

describe('exportCssStylesheet output', () => {
  const testVar = '--recursica-tokens-colors-scale-02-500'
  const testValue = '#ffffff'

  beforeEach(() => {
    document.documentElement.style.setProperty(testVar, testValue)
  })

  afterEach(() => {
    document.documentElement.style.removeProperty(testVar)
  })

  it('specific CSS converts hyphens to underscores in key segments', () => {
    const { specific } = exportCssStylesheet({ specific: true, scoped: false })
    expect(specific).toBeDefined()
    const varLine = specific!.split('\n').find((l) => l.includes('scale-02') && l.includes(testValue))
    expect(varLine).toBeDefined()
    expect(varLine).toMatch(/^\s*--recursica-tokens-colors-scale-02_500:\s*#ffffff;\s*$/)
  })
})
