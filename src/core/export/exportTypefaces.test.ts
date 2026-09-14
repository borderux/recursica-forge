/**
 * Typeface export: which fonts end up in recursica_tokens.json.
 *
 * Regression cover for #482 — deleted fonts reappearing in exports. The export used to union the
 * bundled original's typefaces with the store's, which resurrected every font the user had
 * removed: a deleted font is gone from the store but necessarily still present in the original.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportTokensJson } from './jsonExport'
import bundledTokens from '../../../recursica_tokens.json'

// The typefaces shipped in the bundled tokens file — the "original" the export reads for metadata.
const BUNDLED = Object.keys((bundledTokens as any).tokens.font.typefaces).filter(k => !k.startsWith('$'))

const typeface = (family: string, generic = 'sans-serif') => ({
  $type: 'fontFamily',
  $value: [family, generic],
})

let storeTypefaces: Record<string, unknown> = {}

vi.mock('../store/varsStore', () => ({
  getVarsStore: vi.fn(() => ({
    getState: vi.fn(() => ({
      tokens: { tokens: { font: { typefaces: { $type: 'fontFamily', ...storeTypefaces } } } },
      theme: { brand: {} },
      uikit: { 'ui-kit': {} },
    })),
  })),
}))

const exportedTypefaces = () => {
  const out: any = exportTokensJson()
  return Object.keys(out?.tokens?.font?.typefaces ?? {}).filter(k => !k.startsWith('$'))
}

describe('typeface export', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') document.documentElement.style.cssText = ''
  })

  it('the bundled file ships only typefaces the brand actually uses', () => {
    // Guards the data itself: orphans here are what the user sees in their export.
    expect(BUNDLED).toEqual(['dongle', 'nunito-sans'])
  })

  it('omits a font the user deleted, even though the original still has it', () => {
    storeTypefaces = { dongle: typeface('Dongle') }
    const exported = exportedTypefaces()
    expect(exported).toEqual(['dongle'])
    // nunito-sans is in the bundled original but no longer in the store — it must not come back
    expect(BUNDLED).toContain('nunito-sans')
    expect(exported).not.toContain('nunito-sans')
  })

  it('still exports a font added at runtime, which exists only in the store', () => {
    storeTypefaces = { dongle: typeface('Dongle'), inter: typeface('Inter') }
    const exported = exportedTypefaces()
    expect(exported).toContain('inter')
    expect(exported).toEqual(['dongle', 'inter'])
  })

  it('keeps every font when none were removed', () => {
    storeTypefaces = { dongle: typeface('Dongle'), 'nunito-sans': typeface('Nunito Sans') }
    expect(exportedTypefaces()).toEqual(['dongle', 'nunito-sans'])
  })

  it('falls back to the original only when the store has no typeface group at all', () => {
    // An empty group after a sync means the fonts are genuinely gone; no group means the font
    // list never synced, and dropping every typeface then would be data loss.
    storeTypefaces = {}
    expect(exportedTypefaces()).toEqual(BUNDLED)
  })
})
