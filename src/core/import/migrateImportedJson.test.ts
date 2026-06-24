import { describe, it, expect } from 'vitest'
import { migrateImportedJson } from './migrateImportedJson'

describe('migrateImportedJson', () => {
  it('should migrate tokens.opacity to tokens.opacities', () => {
    const input = {
      $value: '{tokens.opacity.mist}'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.opacities.mist}')
  })

  it('should migrate tokens.size to tokens.sizes', () => {
    const input = {
      $value: '{tokens.size.0-5x}'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.sizes.0-5x}')
  })

  it('should migrate tokens.color to tokens.colors', () => {
    const input = {
      $value: '{tokens.color.scale-01_100}'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.colors.scale-01.100}')
  })

  it('should migrate underscore separated colors to dot separated', () => {
    const input = {
      $value: '{tokens.colors.scale-01_100}'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.colors.scale-01.100}')
  })

  it('should migrate underscore separated brand palettes to dot separated', () => {
    const input = {
      nested: {
        $value: '{brand.palettes.core-colors_interactive_tone}'
      }
    }
    const output = migrateImportedJson(input)
    expect(output.nested.$value).toBe('{brand.palettes.core-colors.interactive_tone}')
  })

  it('should convert raw CSS variable injections back to DTCG refs', () => {
    const input = {
      $value: 'var(--recursica_tokens_opacity_mist)'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.opacities.mist}')
  })
  
  it('should convert raw CSS variable injections for sizes back to DTCG refs', () => {
    const input = {
      $value: 'var(--recursica_tokens_sizes_0-5x)'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{tokens.sizes.0-5x}')
  })

  it('should not modify non-matching strings', () => {
    const input = {
      $value: '{brand.palettes.neutral.100}'
    }
    const output = migrateImportedJson(input)
    expect(output.$value).toBe('{brand.palettes.neutral.100}')
  })

  it('should recursively migrate arrays and objects', () => {
    const input = {
      list: [
        { $value: '{tokens.opacity.mist}' },
        '{tokens.size.0-5x}'
      ]
    }
    const output = migrateImportedJson(input)
    expect(output.list[0].$value).toBe('{tokens.opacities.mist}')
    expect(output.list[1]).toBe('{tokens.sizes.0-5x}')
  })
})
