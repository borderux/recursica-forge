import { describe, it, expect } from 'vitest'
import { pathToExportedName, exportedNameToPath, internalNameToPath } from './exportedCssVarNames'

describe('pathToExportedName', () => {
  it('produces --recursica_ prefix and underscore-joined path', () => {
    expect(pathToExportedName(['tokens', 'colors', 'scale-02', '500'])).toBe(
      '--recursica_tokens_colors_scale-02_500'
    )
  })

  it('handles each namespace prefix', () => {
    expect(pathToExportedName(['tokens', 'sizes', 'sm'])).toBe('--recursica_tokens_sizes_sm')
    expect(pathToExportedName(['brand', 'themes', 'light', 'palettes', 'neutral', '500'])).toBe(
      '--recursica_brand_themes_light_palettes_neutral_500'
    )
    expect(pathToExportedName(['ui-kit', 'globals', 'form', 'properties', 'label-field-gap'])).toBe(
      '--recursica_ui-kit_globals_form_properties_label-field-gap'
    )
  })

  it('escapes underscore in segment to __', () => {
    expect(pathToExportedName(['ui-kit', 'globals', 'form', 'label_field_gap'])).toBe(
      '--recursica_ui-kit_globals_form_label__field__gap'
    )
    expect(pathToExportedName(['a', 'key_with_many_underscores', 'c'])).toBe(
      '--recursica_a_key__with__many__underscores_c'
    )
    expect(pathToExportedName(['a', 'b__c', 'd'])).toBe('--recursica_a_b____c_d')
  })

  it('leaves hyphens unchanged', () => {
    expect(pathToExportedName(['tokens', 'colors', 'scale-02', '500'])).toContain('scale-02')
    expect(pathToExportedName(['brand', 'on-tone'])).toBe('--recursica_brand_on-tone')
    expect(pathToExportedName(['ui-kit', 'label-field-gap'])).toContain('ui-kit')
  })

  it('empty path yields prefix only', () => {
    expect(pathToExportedName([])).toBe('--recursica_')
  })

  it('single-segment path', () => {
    expect(pathToExportedName(['tokens'])).toBe('--recursica_tokens')
  })
})

describe('exportedNameToPath', () => {
  it('returns [] for non-recursica names', () => {
    expect(exportedNameToPath('--other-prefix_foo_bar')).toEqual([])
    expect(exportedNameToPath('--recursica')).toEqual([])
    expect(exportedNameToPath('')).toEqual([])
    expect(exportedNameToPath('recursica_tokens_foo')).toEqual([])
  })

  it('parses basic names to path', () => {
    expect(exportedNameToPath('--recursica_tokens_colors_scale-02_500')).toEqual([
      'tokens',
      'colors',
      'scale-02',
      '500',
    ])
    expect(exportedNameToPath('--recursica_brand_themes_light_palettes_neutral_500')).toEqual([
      'brand',
      'themes',
      'light',
      'palettes',
      'neutral',
      '500',
    ])
  })

  it('unescapes __ to single _ in segment', () => {
    expect(exportedNameToPath('--recursica_ui-kit_globals_form_label__field__gap')).toEqual([
      'ui-kit',
      'globals',
      'form',
      'label_field_gap',
    ])
    expect(exportedNameToPath('--recursica_a_key__with__many__underscores_c')).toEqual([
      'a',
      'key_with_many_underscores',
      'c',
    ])
  })

  it('handles trailing __ in segment', () => {
    expect(exportedNameToPath('--recursica_a____b')).toEqual(['a__b'])
  })

  it('single-segment name', () => {
    expect(exportedNameToPath('--recursica_tokens')).toEqual(['tokens'])
  })

  it('prefix-only name', () => {
    expect(exportedNameToPath('--recursica_')).toEqual([''])
  })
})

describe('round-trip pathToExportedName and exportedNameToPath', () => {
  it('round-trips paths with hyphens only', () => {
    const path = ['tokens', 'colors', 'scale-02', '500']
    expect(exportedNameToPath(pathToExportedName(path))).toEqual(path)
  })

  it('round-trips paths with underscores (escaped)', () => {
    const path = ['ui-kit', 'globals', 'form', 'label_field_gap']
    expect(exportedNameToPath(pathToExportedName(path))).toEqual(path)
  })

  it('round-trips paths with mixed hyphens and underscores', () => {
    const path = ['brand', 'on-tone', 'key_with_dash']
    expect(exportedNameToPath(pathToExportedName(path))).toEqual(path)
  })

  it('round-trips long path', () => {
    const path = ['brand', 'themes', 'light', 'palettes', 'neutral', '500', 'color', 'tone']
    expect(exportedNameToPath(pathToExportedName(path))).toEqual(path)
  })

  it('round-trips single segment', () => {
    const path = ['tokens']
    expect(exportedNameToPath(pathToExportedName(path))).toEqual(path)
  })
})

describe('internalNameToPath', () => {
  it('maps tokens internal names to path', () => {
    expect(internalNameToPath('--recursica-tokens-colors-scale-02-500')).toEqual([
      'tokens',
      'colors',
      'scale-02',
      '500',
    ])
    expect(internalNameToPath('--recursica-tokens-sizes-4x')).toEqual(['tokens', 'sizes', '4x'])
    expect(internalNameToPath('--recursica-tokens-opacities-veiled')).toEqual([
      'tokens',
      'opacities',
      'veiled',
    ])
    expect(internalNameToPath('--recursica-tokens-font-sizes-md')).toEqual([
      'tokens',
      'font',
      'sizes',
      'md',
    ])
    expect(internalNameToPath('--recursica-tokens-font-line-heights-tall')).toEqual([
      'tokens',
      'font',
      'line-heights',
      'tall',
    ])
    expect(internalNameToPath('--recursica-tokens-font-letter-spacings-wide')).toEqual([
      'tokens',
      'font',
      'letter-spacings',
      'wide',
    ])
  })

  it('maps brand internal names to path', () => {
    expect(
      internalNameToPath('--recursica-brand-palettes-neutral-500-color-tone')
    ).toEqual(['brand', 'palettes', 'neutral', '500', 'color', 'tone'])
    expect(
      internalNameToPath('--recursica-brand-themes-light-palettes-neutral-500-color-tone')
    ).toEqual([
      'brand',
      'themes',
      'light',
      'palettes',
      'neutral',
      '500',
      'color',
      'tone',
    ])
  })

  it('maps ui-kit internal names to path', () => {
    expect(
      internalNameToPath('--recursica-ui-kit-globals-form-properties-label-field-gap-horizontal')
    ).toEqual([
      'ui-kit',
      'globals',
      'form',
      'properties',
      'label-field-gap-horizontal',
    ])
  })

  it('returns [] for non-recursica names', () => {
    expect(internalNameToPath('--other-foo-bar')).toEqual([])
    expect(internalNameToPath('')).toEqual([])
  })
})

describe('export CSS variable naming in output', () => {
  it('pathToExportedName(internalNameToPath(internal)) yields --recursica_ style (no internal hyphens in name)', () => {
    const internal = '--recursica-tokens-colors-scale-02-500'
    const path = internalNameToPath(internal)
    const exported = pathToExportedName(path)
    expect(exported).toMatch(/^--recursica_[a-z0-9_-]+$/)
    expect(exported).not.toContain('--recursica-tokens-')
    expect(exported).toBe('--recursica_tokens_colors_scale-02_500')
  })
})
