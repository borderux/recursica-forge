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

describe('migrateImportedJson — brand 1.x → 2.x states', () => {
  const brand1x = () => ({
    brand: {
      themes: {
        light: {
          states: {
            disabled: { $type: 'number', $value: '{tokens.opacities.ghost}' },
            hover: { $type: 'number', $value: '{tokens.opacities.mist}' },
            overlay: {
              color: { $type: 'color', $value: '{brand.themes.light.palettes.core-colors.high-contrast.tone}' },
              opacity: { $type: 'number', $value: '{tokens.opacities.ghost}' },
            },
          },
        },
        dark: {
          states: {
            disabled: { $type: 'number', $value: '{tokens.opacities.ghost}' },
            hover: { $type: 'number', $value: '{tokens.opacities.veil}' },
          },
        },
      },
    },
  })

  it('reshapes bare-number hover into { color, opacity }, preserving the old opacity', () => {
    const out = migrateImportedJson(brand1x(), 'brand')
    const hover = out.brand.themes.light.states.hover
    expect(hover.opacity).toEqual({ $type: 'number', $value: '{tokens.opacities.mist}' })
    expect(hover.color.$type).toBe('color')
    expect(hover.color.$value).toBe('{brand.themes.light.palettes.neutral.400.color.tone}')
    // dark keeps its own opacity value
    expect(out.brand.themes.dark.states.hover.opacity.$value).toBe('{tokens.opacities.veil}')
  })

  it('adds focus and link blocks with 2.x defaults, scoped to each mode', () => {
    const out = migrateImportedJson(brand1x(), 'brand')
    const light = out.brand.themes.light.states
    expect(light.focus.color.$value).toBe('{brand.themes.light.palettes.core-colors.interactive.tone}')
    expect(light.focus['border-size'].$value).toEqual({ value: 1, unit: 'px' })
    expect(light.focus.margin.$value).toEqual({ value: 2, unit: 'px' })
    expect(light.focus.blur.$value).toEqual({ value: 4, unit: 'px' })
    expect(light.link).toEqual({
      decoration: { $type: 'string', $value: 'underline' },
      style: { $type: 'string', $value: 'normal' },
      weight: { $type: 'string', $value: '400' },
    })
    expect(out.brand.themes.dark.states.focus.color.$value)
      .toBe('{brand.themes.dark.palettes.core-colors.interactive.tone}')
  })

  it('preserves disabled and overlay untouched', () => {
    const out = migrateImportedJson(brand1x(), 'brand')
    expect(out.brand.themes.light.states.disabled).toEqual({ $type: 'number', $value: '{tokens.opacities.ghost}' })
    expect(out.brand.themes.light.states.overlay.color.$value)
      .toBe('{brand.themes.light.palettes.core-colors.high-contrast.tone}')
  })

  it('stamps the structure version to 2.0.0', () => {
    const out = migrateImportedJson(brand1x(), 'brand')
    expect(out.$extensions['recursica.metadata'].version).toBe('2.0.0')
  })

  it('is idempotent — a 2.x brand is left unchanged', () => {
    const once = migrateImportedJson(brand1x(), 'brand')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'brand')
    expect(twice.brand.themes.light.states).toEqual(once.brand.themes.light.states)
  })
})

describe('migrateImportedJson — uikit 1.x → 2.x', () => {
  const uikit1x = () => ({
    'ui-kit': {
      globals: {
        form: { field: { colors: {
          'border-color': { $type: 'color', $value: '{brand.palettes.neutral.500.color.tone}' },
          'border-error': { $type: 'color', $value: '{brand.palettes.alert.500.color.tone}' },
        } } },
      },
      components: {
        button: { variants: { styles: { solid: { variants: { states: {
          disabled: { properties: { opacity: { $type: 'number', $value: '{tokens.opacities.ghost}' } } },
          hover: { properties: { colors: { 'layer-0': { 'background-color': { $type: 'color', $value: '{brand.palettes.neutral.300.color.tone}' } } } } },
          focus: { properties: { 'border-size': { $type: 'number', $value: { value: 2, unit: 'px' } } } },
        } } } } } },
        link: { variants: { states: {
          visited: { properties: { colors: { 'layer-0': { 'text-color': { $type: 'color', $value: '{brand.palettes.palette-1.800.color.tone}' } } } } },
          'visited-hover': { properties: { colors: { 'layer-0': { 'text-color': { $type: 'color', $value: '{brand.palettes.palette-1.900.color.tone}' } } } } },
        } } },
        'text-field': { variants: { states: {
          error: { properties: { colors: { 'layer-0': { 'border-color': { $type: 'color', $value: '{ui-kit.globals.form.field.colors.border-error}' } } } } },
        } } },
      },
    },
  })

  it('renames the border-error global key to error-border-color', () => {
    const out = migrateImportedJson(uikit1x(), 'uikit')
    const colors = out['ui-kit'].globals.form.field.colors
    expect(colors['error-border-color']).toBeDefined()
    expect(colors['border-error']).toBeUndefined()
    expect(colors['error-border-color'].$value).toBe('{brand.palettes.alert.500.color.tone}')
  })

  it('rewrites references to the renamed global', () => {
    const out = migrateImportedJson(uikit1x(), 'uikit')
    const ref = out['ui-kit'].components['text-field'].variants.states.error.properties.colors['layer-0']['border-color'].$value
    expect(ref).toBe('{ui-kit.globals.form.field.colors.error-border-color}')
  })

  it('strips per-component hover / focus / visited-hover states and prunes empties', () => {
    const out = migrateImportedJson(uikit1x(), 'uikit')
    const solidStates = out['ui-kit'].components.button.variants.styles.solid.variants.states
    expect(solidStates.hover).toBeUndefined()
    expect(solidStates.focus).toBeUndefined()
    expect(solidStates.disabled).toBeDefined()   // kept
    // link had only visited + visited-hover → visited-hover removed, visited kept
    const linkStates = out['ui-kit'].components.link.variants.states
    expect(linkStates['visited-hover']).toBeUndefined()
    expect(linkStates.visited).toBeDefined()
  })

  it('keeps error/disabled states intact', () => {
    const out = migrateImportedJson(uikit1x(), 'uikit')
    expect(out['ui-kit'].components['text-field'].variants.states.error).toBeDefined()
  })

  it('is idempotent — a 2.x uikit is left unchanged', () => {
    const once = migrateImportedJson(uikit1x(), 'uikit')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'uikit')
    expect(twice).toEqual(once)
  })
})
