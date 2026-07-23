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

  it('strips table highlight-on-hover color/opacity (now global theme hover)', () => {
    const data = {
      'ui-kit': {
        components: {
          table: {
            properties: {
              colors: {
                'layer-0': {
                  'striped-color': { $type: 'color', $value: '{brand.palettes.neutral.default.color.tone}' },
                  'highlight-on-hover-color': { $type: 'color', $value: '{brand.palettes.neutral.default.color.tone}' },
                },
              },
              opacities: {
                'layer-0': {
                  'striped-opacity': { $type: 'number', $value: '{tokens.opacities.mist}' },
                  'highlight-on-hover-opacity': { $type: 'number', $value: '{tokens.opacities.mist}' },
                },
              },
            },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const p = out['ui-kit'].components.table.properties
    expect(p.colors['layer-0']['highlight-on-hover-color']).toBeUndefined()
    expect(p.colors['layer-0']['striped-color']).toBeDefined()
    expect(p.opacities['layer-0']['highlight-on-hover-opacity']).toBeUndefined()
    expect(p.opacities['layer-0']['striped-opacity']).toBeDefined()
  })

  it('splits panel header-footer background into separate header/footer colours', () => {
    const data = {
      'ui-kit': {
        components: {
          panel: {
            properties: {
              colors: {
                'layer-0': {
                  'header-footer-background-color': { $type: 'color', $value: '{brand.layers.layer-0.properties.surface}' },
                  'border-color': { $type: 'color', $value: '{brand.layers.layer-0.properties.border-color}' },
                },
              },
            },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const c = out['ui-kit'].components.panel.properties.colors['layer-0']
    expect(c['header-footer-background-color']).toBeUndefined()
    expect(c['header-background-color'].$value).toBe('{brand.layers.layer-0.properties.surface}')
    expect(c['footer-background-color'].$value).toBe('{brand.layers.layer-0.properties.surface}')
    expect(c['border-color']).toBeDefined()
  })
})

describe('migrateImportedJson — segmented-control-item selected/unselected → selection-state variants', () => {
  const sci1x = () => ({
    'ui-kit': {
      components: {
        'segmented-control-item': {
          properties: {
            selected: {
              colors: { 'layer-0': { 'background-color': { $type: 'color', $value: '{brand.palettes.core-colors.interactive.tone}' } } },
              elevation: { $value: '{brand.elevations.elevation-1}', $extensions: { 'recursica.type': 'elevation' } },
              'border-size': { $type: 'number', $value: { value: 1, unit: 'px' } },
              'border-radius': { $type: 'dimension', $value: '{brand.dimensions.border-radii.sm}' },
            },
            unselected: {
              colors: { 'layer-0': { 'background-color': { $type: 'color', $value: '{brand.palettes.neutral.100.color.tone}' } } },
              'border-size': { $type: 'number', $value: { value: 0, unit: 'px' } },
            },
            'selected-text': { 'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.bold}' } },
            'unselected-text': { 'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.regular}' } },
            item: { height: { $type: 'dimension', $value: { value: 32, unit: 'px' } } },
          },
        },
      },
    },
  })

  it('moves selected/unselected (+ their text) into variants.selection-states and keeps item', () => {
    const out = migrateImportedJson(sci1x(), 'uikit')
    const sci = out['ui-kit'].components['segmented-control-item']
    expect(sci.properties.selected).toBeUndefined()
    expect(sci.properties.unselected).toBeUndefined()
    expect(sci.properties['selected-text']).toBeUndefined()
    expect(sci.properties.item).toBeDefined() // shared dims stay
    const ss = sci.variants['selection-states']
    expect(ss.selected.properties.colors['layer-0']['background-color'].$value)
      .toBe('{brand.palettes.core-colors.interactive.tone}')
    expect(ss.selected.properties.elevation).toBeDefined()
    expect(ss.selected.properties['border-size'].$value).toEqual({ value: 1, unit: 'px' })
    expect(ss.selected.properties.text['font-weight'].$value).toBe('{tokens.font.weights.bold}')
    expect(ss.unselected.properties.text['font-weight'].$value).toBe('{tokens.font.weights.regular}')
  })

  it('is idempotent', () => {
    const once = migrateImportedJson(sci1x(), 'uikit')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'uikit')
    expect(twice).toEqual(once)
  })
})

describe('migrateImportedJson — tabs split into tabs + tabs-item', () => {
  const tabs1x = () => ({
    'ui-kit': {
      components: {
        tabs: {
          variants: {
            styles: {
              default: {
                properties: {
                  active: {
                    colors: { 'layer-0': { 'text-color': { $type: 'color', $value: '{brand.layers.layer-0.elements.text.color}' } } },
                    'border-size': { $type: 'number', $value: { value: 2, unit: 'px' } },
                  },
                  inactive: {
                    colors: { 'layer-0': { 'text-color': { $type: 'color', $value: '{brand.palettes.neutral.500.color.tone}' } } },
                    'border-size': { $type: 'number', $value: { value: 0, unit: 'px' } },
                  },
                  'border-radius': { $type: 'dimension', $value: '{brand.dimensions.border-radii.sm}' },
                },
                variants: { orientation: { horizontal: { properties: { 'tabs-content-gap': { $type: 'dimension', $value: '{brand.dimensions.gutters.vertical}' } } } } },
              },
            },
            orientation: {
              horizontal: {
                properties: {
                  'icon-size': { $type: 'dimension', $value: '{brand.dimensions.icons.default}' },
                  'horizontal-padding': { $type: 'dimension', $value: '{brand.dimensions.general.lg}' },
                  'element-gap': { $type: 'dimension', $value: '{brand.dimensions.general.default}' },
                  'space-between-tabs': { $type: 'dimension', $value: '{brand.dimensions.general.sm}' },
                  'tab-content-alignment': { $type: 'string', $value: 'center' },
                },
              },
              vertical: {
                properties: {
                  'icon-size': { $type: 'dimension', $value: '{brand.dimensions.icons.default}' },
                  'space-between-tabs': { $type: 'dimension', $value: '{brand.dimensions.general.sm}' },
                  'tab-content-alignment': { $type: 'string', $value: 'left' },
                },
              },
            },
          },
          properties: {
            'min-width': { $type: 'dimension', $value: { value: 80, unit: 'px' } },
            'max-width': { $type: 'dimension', $value: { value: 200, unit: 'px' } },
            'active-text': { 'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.bold}' } },
            'inactive-text': { 'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.regular}' } },
          },
        },
      },
    },
  })

  it('creates tabs-item with per-style selection-state variants and strips them from tabs', () => {
    const out = migrateImportedJson(tabs1x(), 'uikit')
    const comps = out['ui-kit'].components
    // tabs container keeps layout, loses active/inactive/border-radius/text and per-tab sizing
    const defStyle = comps.tabs.variants.styles.default
    expect(defStyle.properties.active).toBeUndefined()
    expect(defStyle.properties.inactive).toBeUndefined()
    expect(defStyle.properties['border-radius']).toBeUndefined()
    expect(comps.tabs.properties?.['active-text']).toBeUndefined()
    // per-tab sizing moved off the container
    expect(comps.tabs.properties?.['min-width']).toBeUndefined()
    expect(comps.tabs.properties?.['max-width']).toBeUndefined()
    // the container's top-level orientation axis is gone (everything moved to per-style / tabs-item)
    expect(comps.tabs.variants.orientation).toBeUndefined()
    // space-between-tabs is now per style × orientation on the container
    expect(comps.tabs.variants.styles.default.variants.orientation.horizontal.properties['space-between-tabs'].$value).toBe('{brand.dimensions.general.sm}')
    // tabs-content-gap stays per style × orientation on the container
    expect(comps.tabs.variants.styles.default.variants.orientation.horizontal.properties['tabs-content-gap']).toBeDefined()
    // tabs-item built with styles → selection-states, and now owns per-tab sizing
    const item = comps['tabs-item'].variants.styles.default
    expect(item.properties['border-radius'].$value).toBe('{brand.dimensions.border-radii.sm}')
    expect(item.properties['min-width'].$value).toEqual({ value: 80, unit: 'px' })
    expect(item.properties['max-width'].$value).toEqual({ value: 200, unit: 'px' })
    expect(item.properties['icon-size'].$value).toBe('{brand.dimensions.icons.default}')
    expect(item.properties['horizontal-padding'].$value).toBe('{brand.dimensions.general.lg}')
    expect(item.properties['element-gap'].$value).toBe('{brand.dimensions.general.default}')
    // content alignment now lives on tabs-item per style × orientation
    expect(item.variants.orientation.horizontal.properties['tab-content-alignment'].$value).toBe('center')
    expect(item.variants.orientation.vertical.properties['tab-content-alignment'].$value).toBe('left')
    const ss = item.variants['selection-states']
    expect(ss.active.properties.colors['layer-0']['text-color'].$value).toBe('{brand.layers.layer-0.elements.text.color}')
    expect(ss.active.properties['border-size'].$value).toEqual({ value: 2, unit: 'px' })
    expect(ss.active.properties.text['font-weight'].$value).toBe('{tokens.font.weights.bold}')
    expect(ss.inactive.properties.text['font-weight'].$value).toBe('{tokens.font.weights.regular}')
  })

  it('is idempotent (no tabs-item rebuild on second pass)', () => {
    const once = migrateImportedJson(tabs1x(), 'uikit')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'uikit')
    expect(twice).toEqual(once)
  })
})
