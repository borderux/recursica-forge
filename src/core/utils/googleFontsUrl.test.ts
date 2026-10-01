import { describe, it, expect } from 'vitest'
import { isGoogleFontsCssUrl, safeGoogleFontsUrl } from './googleFontsUrl'

describe('googleFontsUrl', () => {
  it('accepts Google Fonts stylesheet URLs', () => {
    expect(isGoogleFontsCssUrl('https://fonts.googleapis.com/css2?family=Inter:wght@400')).toBe(true)
  })

  it('rejects other hosts even when they mention Google Fonts', () => {
    expect(isGoogleFontsCssUrl('https://evil.example/x.css?fonts.googleapis.com')).toBe(false)
    expect(isGoogleFontsCssUrl('https://fonts.googleapis.com.evil.example/css2')).toBe(false)
    expect(isGoogleFontsCssUrl('http://fonts.googleapis.com/css2')).toBe(false)
    expect(isGoogleFontsCssUrl('javascript:alert(1)//fonts.googleapis.com')).toBe(false)
    expect(isGoogleFontsCssUrl(undefined)).toBe(false)
  })

  it('returns undefined for unsafe URLs', () => {
    expect(safeGoogleFontsUrl('https://evil.example/x.css')).toBeUndefined()
    expect(safeGoogleFontsUrl(' https://fonts.googleapis.com/css2 ')).toBe('https://fonts.googleapis.com/css2')
  })
})
