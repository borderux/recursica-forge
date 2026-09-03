import { describe, it, expect } from 'vitest'
import {
  migrateImportedJson,
  mapOldUikitPath,
  migrateInteractiveElementTo2_1,
  repointInteractiveRefsTo2_1,
  reconcileUikitFontRefs,
  repairCorruptedGoogleFontsUrls,
} from './migrateImportedJson'
import { validateBrandJson, validateUIKitJson } from '../utils/validateJsonSchemas'
import brandJson from '../../../recursica_brand.json'

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

  it('stamps the current structure version', () => {
    const out = migrateImportedJson(brand1x(), 'brand')
    expect(out.$extensions['recursica.metadata'].version).toBe('2.1.1')
  })

  it('is idempotent — a 2.x brand is left unchanged', () => {
    const once = migrateImportedJson(brand1x(), 'brand')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'brand')
    expect(twice.brand.themes.light.states).toEqual(once.brand.themes.light.states)
  })

  // Regression: a real user exported from 1.x (bare-number `hover`, no `focus`/`link`) and the
  // import rejected it because the raw file was validated before migration. A migrated 1.x brand
  // must satisfy the current schema — otherwise older exports can't be imported.
  it('a migrated 1.x brand passes current schema validation', () => {
    const brand = JSON.parse(JSON.stringify(brandJson)) as any
    for (const mode of ['light', 'dark'] as const) {
      const states = brand.brand.themes[mode].states
      states.hover = { $type: 'number', $value: '{tokens.opacities.mist}' }
      delete states.focus
      delete states.link
    }
    const migrated = migrateImportedJson(brand, 'brand')
    expect(() => validateBrandJson(migrated)).not.toThrow()
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

  it('splits modal background into separate header/content/footer colours', () => {
    const data = {
      'ui-kit': {
        components: {
          modal: {
            properties: {
              colors: {
                'layer-0': {
                  'background-color': { $type: 'color', $value: '{brand.layers.layer-1.properties.surface}' },
                  title: { $type: 'color', $value: '{brand.layers.layer-0.elements.text.color}' },
                },
              },
            },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const c = out['ui-kit'].components.modal.properties.colors['layer-0']
    expect(c['background-color']).toBeUndefined()
    expect(c['header-background-color'].$value).toBe('{brand.layers.layer-1.properties.surface}')
    expect(c['content-background-color'].$value).toBe('{brand.layers.layer-1.properties.surface}')
    expect(c['footer-background-color'].$value).toBe('{brand.layers.layer-1.properties.surface}')
    expect(c.title).toBeDefined()
  })

  it('splits modal padding into header/footer and content padding', () => {
    const data = {
      'ui-kit': {
        components: {
          modal: {
            properties: {
              'horizontal-padding': { $type: 'dimension', $value: '{brand.dimensions.general.xl}' },
              'vertical-padding': { $type: 'dimension', $value: '{brand.dimensions.general.lg}' },
            },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const p = out['ui-kit'].components.modal.properties
    expect(p['horizontal-padding']).toBeUndefined()
    expect(p['vertical-padding']).toBeUndefined()
    expect(p['header-footer-horizontal-padding'].$value).toBe('{brand.dimensions.general.xl}')
    expect(p['content-horizontal-padding'].$value).toBe('{brand.dimensions.general.xl}')
    expect(p['header-footer-vertical-padding'].$value).toBe('{brand.dimensions.general.lg}')
    expect(p['content-vertical-padding'].$value).toBe('{brand.dimensions.general.lg}')
  })

  it('moves menu-item selected/unselected colors into a selection-states variant', () => {
    const data = {
      'ui-kit': {
        components: {
          'menu-item': {
            properties: {
              colors: {
                'layer-0': {
                  'unselected-item': { 'background-color': { $type: 'color', $value: null }, 'text-color': { $type: 'color', $value: '{brand.layers.layer-0.elements.text.color}' } },
                  'selected-item': { 'background-color': { $type: 'color', $value: '{brand.palettes.palette-1.100.color.tone}' }, 'text-color': { $type: 'color', $value: '{brand.palettes.palette-1.100.color.on-tone}' } },
                },
              },
              'border-radius': { $type: 'dimension', $value: '{brand.dimensions.border-radii.none}' },
            },
            variants: { states: { disabled: { properties: { opacity: { $type: 'number', $value: '{brand.states.disabled}' } } } } },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const mi = out['ui-kit'].components['menu-item']
    expect(mi.properties.colors).toBeUndefined()
    expect(mi.properties['border-radius']).toBeDefined()
    const ss = mi.variants['selection-states']
    expect(ss.unselected.properties.colors['layer-0']['text-color'].$value).toBe('{brand.layers.layer-0.elements.text.color}')
    expect(ss.selected.properties.colors['layer-0']['background-color'].$value).toBe('{brand.palettes.palette-1.100.color.tone}')
    expect(ss.selected.properties.colors['layer-0']['text-color'].$value).toBe('{brand.palettes.palette-1.100.color.on-tone}')
    // disabled is nested per selection-state, and the top-level states block is removed
    expect(mi.variants.states).toBeUndefined()
    // disabled opacity now references the ui-kit global, which in turn references the brand value
    expect(ss.unselected.variants.states.disabled.properties.opacity.$value).toBe('{ui-kit.globals.states.disabled}')
    expect(ss.selected.variants.states.disabled.properties.opacity.$value).toBe('{ui-kit.globals.states.disabled}')
    const disabledGlobal = out['ui-kit'].globals.states.disabled
    expect(disabledGlobal.$value).toBe('{brand.states.disabled}')
  })

  it('moves pagination active-page button ref to properties.active-pages and drops variants', () => {
    const data = {
      'ui-kit': {
        components: {
          pagination: {
            properties: {
              'inactive-pages': { $value: '{ui-kit.components.button}', $extensions: { 'recursica.component': { 'selected-variants': { style: '{ui-kit.components.button.variants.styles.outline}' } } } },
            },
            variants: {
              states: {
                active: {
                  properties: {
                    pages: { $value: '{ui-kit.components.button}', $extensions: { 'recursica.component': { 'selected-variants': { style: '{ui-kit.components.button.variants.styles.solid}' } } } },
                  },
                },
              },
            },
          },
        },
      },
    }
    const out = migrateImportedJson(data, 'uikit')
    const pag = out['ui-kit'].components.pagination
    expect(pag.variants).toBeUndefined()
    expect(pag.properties['active-pages'].$value).toBe('{ui-kit.components.button}')
    expect(pag.properties['active-pages'].$extensions['recursica.component']['selected-variants'].style)
      .toBe('{ui-kit.components.button.variants.styles.solid}')
    expect(pag.properties['inactive-pages']).toBeDefined()
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

describe('mapOldUikitPath — 1.x → 2.x uikit value overlay', () => {
  it('renames colour keys and promotes the form-input default state', () => {
    expect(mapOldUikitPath('components.text-field.variants.states.default.properties.colors.layer-0.background'))
      .toEqual(['components.text-field.properties.colors.layer-0.background-color'])
    // leading/trailing icon colours stay un-suffixed in 2.x
    expect(mapOldUikitPath('components.text-field.variants.states.default.properties.colors.layer-0.leading-icon'))
      .toEqual(['components.text-field.properties.colors.layer-0.leading-icon'])
  })

  it('moves chip error/error-selected styles to nested selection-state error blocks', () => {
    expect(mapOldUikitPath('components.chip.variants.styles.error.properties.colors.layer-0.background'))
      .toEqual(['components.chip.variants.selection-states.unselected.variants.states.error.properties.colors.layer-0.background-color'])
    expect(mapOldUikitPath('components.chip.variants.styles.error-selected.properties.colors.layer-1.text'))
      .toEqual(['components.chip.variants.selection-states.selected.variants.states.error.properties.colors.layer-1.text-color'])
  })

  it('splits checkbox flat colours into selection-states (one → many for shared disabled)', () => {
    expect(mapOldUikitPath('components.checkbox.properties.colors.layer-0.background-checked'))
      .toEqual(['components.checkbox.variants.selection-states.checked.properties.colors.layer-0.background-color'])
    expect(mapOldUikitPath('components.checkbox.properties.colors.layer-0.disabled-background')).toEqual([
      'components.checkbox.variants.selection-states.checked.variants.states.disabled.properties.colors.layer-0.background-color',
      'components.checkbox.variants.selection-states.unchecked.variants.states.disabled.properties.colors.layer-0.background-color',
      'components.checkbox.variants.selection-states.indeterminate.variants.states.disabled.properties.colors.layer-0.background-color',
    ])
  })

  it('splits timeline-bullet active/inactive into selection-states', () => {
    expect(mapOldUikitPath('components.timeline-bullet.variants.types.icon.properties.colors.layer-2.active-background'))
      .toEqual(['components.timeline-bullet.variants.types.icon.variants.selection-states.active.properties.colors.layer-2.background-color'])
  })

  it('drops values that became global in 2.x (hover/focus/per-component disabled-opacity)', () => {
    expect(mapOldUikitPath('components.text-field.variants.states.focus.properties.colors.layer-0.background')).toEqual([])
    expect(mapOldUikitPath('components.button.variants.sizes.default.properties.disabled-opacity')).toEqual([])
    expect(mapOldUikitPath('components.button.variants.styles.solid.properties.hover-elevation')).toEqual([])
  })
})

describe('migrateImportedJson — 1.x uikit overlays onto the current structure', () => {
  const oldUikit = () => ({
    'ui-kit': {
      components: {
        chip: { variants: { styles: { selected: { properties: { colors: {
          'layer-0': { background: { $type: 'color', $value: '{brand.palettes.palette-1.default.color.tone}' } },
        } } } } } },
        'text-field': { variants: { states: { default: { properties: { colors: {
          'layer-0': { background: { $type: 'color', $value: '{brand.palettes.palette-2.default.color.tone}' } },
        } } } } } },
        checkbox: { properties: { colors: {
          'layer-0': { 'background-checked': { $type: 'color', $value: '{brand.palettes.palette-1.default.color.tone}' } },
        } } },
      },
    },
  })

  it('produces a schema-valid, structurally-current uikit and carries old values to their 2.x paths', () => {
    const out: any = migrateImportedJson(oldUikit(), 'uikit')
    expect(() => validateUIKitJson(out)).not.toThrow()
    const at = (p: string) => p.split('.').reduce((n: any, k) => n?.[k], out['ui-kit'])
    expect(at('components.chip.variants.selection-states.selected.properties.colors.layer-0.background-color').$value)
      .toBe('{brand.palettes.palette-1.default.color.tone}')
    expect(at('components.text-field.properties.colors.layer-0.background-color').$value)
      .toBe('{brand.palettes.palette-2.default.color.tone}')
    expect(at('components.checkbox.variants.selection-states.checked.properties.colors.layer-0.background-color').$value)
      .toBe('{brand.palettes.palette-1.default.color.tone}')
    // the old `variants.styles` axis is gone (structure is current)
    expect(at('components.chip.variants.styles')).toBeUndefined()
  })

  it('leaves an already-2.x uikit untouched (no overlay)', () => {
    const twoX = { 'ui-kit': { components: { badge: { properties: {} } } } }
    const out: any = migrateImportedJson(JSON.parse(JSON.stringify(twoX)), 'uikit')
    expect(out['ui-kit'].components.badge).toEqual({ properties: {} })
  })
})

describe('2.0.x → 2.1.0: interactive fill vs readable interactive colour', () => {
  const leaf = (v: string) => ({ $type: 'color', $value: v })
  const CORE_TONE = '{brand.themes.light.palettes.core-colors.interactive.tone}'
  const STEPPED = '{tokens.colors.scale-06.100}'

  describe('migrateInteractiveElementTo2_1 (brand)', () => {
    const brand = (interactive: any) => ({
      brand: { themes: { light: { layers: { 'layer-0': { elements: { interactive } } } } } },
    })
    const inter = (b: any) => b.brand.themes.light.layers['layer-0'].elements.interactive

    it('renames interactive.tone to interactive.color, preserving the value', () => {
      const out = migrateInteractiveElementTo2_1(brand({ tone: leaf(CORE_TONE) }))
      expect(inter(out).color).toEqual(leaf(CORE_TONE))
      expect(inter(out).tone).toBeUndefined()
    })

    it('preserves a contrast-fixed value — that is exactly what belongs under color', () => {
      const out = migrateInteractiveElementTo2_1(brand({ tone: leaf(STEPPED) }))
      expect(inter(out).color.$value).toBe(STEPPED)
    })

    it('keeps sibling keys and the position of the renamed key', () => {
      const out = migrateInteractiveElementTo2_1(
        brand({ tone: leaf(CORE_TONE), 'on-tone': leaf('{x.y}') }),
      )
      expect(Object.keys(inter(out))).toEqual(['color', 'on-tone'])
    })

    it('does not clobber an existing color', () => {
      const mine = leaf('{tokens.colors.scale-05.700}')
      const out = migrateInteractiveElementTo2_1(brand({ tone: leaf(CORE_TONE), color: mine }))
      expect(inter(out).color).toEqual(mine)
      expect(inter(out).tone).toEqual(leaf(CORE_TONE))
    })

    it('is idempotent', () => {
      const once = migrateInteractiveElementTo2_1(brand({ tone: leaf(CORE_TONE) }))
      const twice = migrateInteractiveElementTo2_1(JSON.parse(JSON.stringify(once)))
      expect(twice).toEqual(once)
    })

    it('runs as part of the brand import path', () => {
      const out: any = migrateImportedJson(brand({ tone: leaf(CORE_TONE) }), 'brand')
      expect(inter(out).color).toEqual(leaf(CORE_TONE))
    })
  })

  describe('repointInteractiveRefsTo2_1 (ui-kit)', () => {
    const tone = (n: number) => `{brand.layers.layer-${n}.elements.interactive.tone}`
    const sample = () => ({
      'ui-kit': { components: { link: { properties: { colors: { 'layer-2': {
        'text-color': leaf(tone(2)),
        'icon-color': leaf(tone(2)),
        'background-color': leaf(tone(2)),
        'border-color': leaf(tone(2)),
        'track-color': leaf(tone(2)),
      } } } } } },
    })
    const colors = (o: any) => o['ui-kit'].components.link.properties.colors['layer-2']

    it('sends text and icon colours to the layer readable colour', () => {
      const c = colors(repointInteractiveRefsTo2_1(sample()))
      expect(c['text-color'].$value).toBe('{brand.layers.layer-2.elements.interactive.color}')
      expect(c['icon-color'].$value).toBe('{brand.layers.layer-2.elements.interactive.color}')
    })

    it('sends every other role to the brand interactive fill', () => {
      const c = colors(repointInteractiveRefsTo2_1(sample()))
      for (const k of ['background-color', 'border-color', 'track-color']) {
        expect(c[k].$value).toBe('{brand.palettes.core-colors.interactive.tone}')
      }
    })

    it('leaves unrelated references alone', () => {
      const other = '{brand.palettes.palette-1.800.color.tone}'
      const input: any = { c: { colors: { 'layer-0': { 'text-color': leaf(other) } } } }
      expect(repointInteractiveRefsTo2_1(input).c.colors['layer-0']['text-color'].$value).toBe(other)
    })

    it('is idempotent', () => {
      const once = repointInteractiveRefsTo2_1(sample())
      const twice = repointInteractiveRefsTo2_1(JSON.parse(JSON.stringify(once)))
      expect(twice).toEqual(once)
    })

    it('runs as part of the uikit import path', () => {
      const c = colors(migrateImportedJson(sample(), 'uikit'))
      expect(c['text-color'].$value).toBe('{brand.layers.layer-2.elements.interactive.color}')
      expect(c['background-color'].$value).toBe('{brand.palettes.core-colors.interactive.tone}')
    })
  })
})

describe('2.1.0 → 2.1.1: repair Google Fonts URLs corrupted by pasted @import snippets', () => {
  const CORRUPTED = "https://fonts.googleapis.com/css2?family=Dongle:wght@300;400;700&display=swap')%3B"
  const CLEAN = 'https://fonts.googleapis.com/css2?family=Dongle:wght@300;400;700&display=swap'
  const tokensWith = (url: string) => ({
    tokens: { font: { families: { dongle: {
      $type: 'fontFamily',
      $value: ['Dongle', 'sans-serif'],
      $extensions: { 'com.google.fonts': { url } },
    } } } },
  })
  const urlOf = (out: any) => out.tokens.font.families.dongle.$extensions['com.google.fonts'].url

  it('repairs a corrupted url', () => {
    const out = repairCorruptedGoogleFontsUrls(tokensWith(CORRUPTED))
    expect(urlOf(out)).toBe(CLEAN)
  })

  it('leaves an already-clean url unchanged', () => {
    const out = repairCorruptedGoogleFontsUrls(tokensWith(CLEAN))
    expect(urlOf(out)).toBe(CLEAN)
  })

  it('leaves non-Google-Fonts extensions and other tokens alone', () => {
    const input = { tokens: { color: { primary: { $type: 'color', $value: '#fff' } } } }
    const out = repairCorruptedGoogleFontsUrls(JSON.parse(JSON.stringify(input)))
    expect(out.tokens).toEqual(input.tokens)
  })

  it('is idempotent', () => {
    const once = repairCorruptedGoogleFontsUrls(tokensWith(CORRUPTED))
    const twice = repairCorruptedGoogleFontsUrls(JSON.parse(JSON.stringify(once)))
    expect(urlOf(twice)).toBe(CLEAN)
  })

  it('stamps the current structure version', () => {
    const out = repairCorruptedGoogleFontsUrls(tokensWith(CLEAN))
    expect(out.$extensions['recursica.metadata'].version).toBe('2.1.1')
  })

  it('runs as part of the tokens import path', () => {
    const out: any = migrateImportedJson(tokensWith(CORRUPTED), 'tokens')
    expect(urlOf(out)).toBe(CLEAN)
  })
})

// A 1.x tree: flat selected-*/unselected-* colours and selected-text/unselected-text
// typography. In 2.x both live under variants/selection-states/{selected,unselected}.
// Without the mapping the overlay keeps the template's own defaults, silently discarding the
// user's tree styling — and the template's `{brand.fonts.secondary}` default then dangles on a
// single-typeface brand, blocking export.
describe('migrateImportedJson — tree selection-states', () => {
  const tree1x = () => ({
    'ui-kit': {
      components: {
        // sentinel: forces the 1.x overlay path
        checkbox: { properties: { colors: { 'layer-0': { background: { $type: 'color', $value: '{brand.palettes.neutral.100.color.tone}' } } } } },
        tree: {
          properties: {
            indent: { $type: 'dimension', $value: '{brand.dimensions.general.default}' },
            colors: {
              'layer-0': {
                'selected-background': { $type: 'color', $value: '{brand.palettes.palette-2.100.color.tone}' },
                'selected-border-color': { $type: 'color', $value: '{brand.palettes.palette-2.default.color.tone}' },
                'selected-text': { $type: 'color', $value: '{brand.palettes.palette-2.800.color.tone}' },
                'unselected-text': { $type: 'color', $value: '{brand.palettes.core-colors.high-contrast.tone}' },
                'hover-background': { $type: 'color', $value: '{brand.palettes.palette-2.050.color.tone}' },
              },
            },
            'selected-text': {
              'font-family': { $type: 'fontFamily', $value: '{brand.fonts.primary}' },
              'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.bold}' },
            },
            'unselected-text': {
              'font-family': { $type: 'fontFamily', $value: '{brand.fonts.primary}' },
              'font-weight': { $type: 'fontWeight', $value: '{tokens.font.weights.regular}' },
            },
          },
        },
      },
    },
  })

  const ss = (out: any) => out['ui-kit'].components.tree.variants['selection-states']

  it('maps the flat colour keys onto the selection-state axis', () => {
    expect(mapOldUikitPath('components.tree.properties.colors.layer-0.selected-background'))
      .toEqual(['components.tree.variants.selection-states.selected.properties.colors.layer-0.background-color'])
    expect(mapOldUikitPath('components.tree.properties.colors.layer-2.unselected-text'))
      .toEqual(['components.tree.variants.selection-states.unselected.properties.colors.layer-2.text-color'])
    expect(mapOldUikitPath('components.tree.properties.selected-text.font-family'))
      .toEqual(['components.tree.variants.selection-states.selected.properties.text.font-family'])
    // hover became global in 2.x — intentionally dropped
    expect(mapOldUikitPath('components.tree.properties.colors.layer-0.hover-background')).toEqual([])
  })

  it('carries the tree colours and typography across the overlay', () => {
    const out = migrateImportedJson(tree1x(), 'uikit')
    expect(ss(out).selected.properties.colors['layer-0']['background-color'].$value)
      .toBe('{brand.palettes.palette-2.100.color.tone}')
    expect(ss(out).selected.properties.colors['layer-0']['border-color'].$value)
      .toBe('{brand.palettes.palette-2.default.color.tone}')
    expect(ss(out).selected.properties.colors['layer-0']['text-color'].$value)
      .toBe('{brand.palettes.palette-2.800.color.tone}')
    expect(ss(out).unselected.properties.colors['layer-0']['text-color'].$value)
      .toBe('{brand.palettes.core-colors.high-contrast.tone}')
    expect(ss(out).selected.properties.text['font-weight'].$value).toBe('{tokens.font.weights.bold}')
    expect(ss(out).unselected.properties.text['font-weight'].$value).toBe('{tokens.font.weights.regular}')
    // the template default that used to survive here
    expect(ss(out).selected.properties.text['font-family'].$value).toBe('{brand.fonts.primary}')
    expect(ss(out).unselected.properties.text['font-family'].$value).toBe('{brand.fonts.primary}')
    expect(out['ui-kit'].components.tree.properties['selected-text']).toBeUndefined()
  })

  it('is detected as 1.x on the tree shape alone', () => {
    const onlyTree: any = tree1x()
    delete onlyTree['ui-kit'].components.checkbox
    const out = migrateImportedJson(onlyTree, 'uikit')
    expect(ss(out).selected.properties.text['font-weight'].$value).toBe('{tokens.font.weights.bold}')
  })

  it('is idempotent', () => {
    const once = migrateImportedJson(tree1x(), 'uikit')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'uikit')
    expect(twice).toEqual(once)
  })
})

// brand.fonts is an ordinal list sized by the brand's typeface count, so a ui-kit reference to
// a role the brand never defined is a dangling cross-file reference: import accepts it and
// export refuses it, with nothing the user can fix in the UI.
describe('reconcileUikitFontRefs', () => {
  const leaf = (v: string) => ({ $type: 'fontFamily', $value: v })
  const uikit = () => ({
    'ui-kit': {
      components: {
        tree: { variants: { 'selection-states': { selected: { properties: { text: { 'font-family': leaf('{brand.fonts.secondary}') } } } } } },
        label: { properties: { 'label-text': { 'font-family': leaf('{brand.fonts.primary}') } } },
        badge: { properties: { text: { 'font-family': leaf('{brand.fonts.quaternary}') } } },
      },
    },
  })
  const ff = (out: any, comp: string) => comp === 'tree'
    ? out['ui-kit'].components.tree.variants['selection-states'].selected.properties.text['font-family'].$value
    : comp === 'label'
      ? out['ui-kit'].components.label.properties['label-text']['font-family'].$value
      : out['ui-kit'].components.badge.properties.text['font-family'].$value

  it('degrades missing roles to primary on a single-typeface brand', () => {
    const out = reconcileUikitFontRefs(uikit(), { brand: { fonts: { $type: 'fontFamily', primary: leaf('{tokens.font.typefaces.lexend}') } } })
    expect(ff(out, 'tree')).toBe('{brand.fonts.primary}')
    expect(ff(out, 'badge')).toBe('{brand.fonts.primary}')
    expect(ff(out, 'label')).toBe('{brand.fonts.primary}')
  })

  it('leaves roles the brand defines untouched', () => {
    const out = reconcileUikitFontRefs(uikit(), {
      brand: { fonts: { primary: leaf('{tokens.font.typefaces.lexend}'), secondary: leaf('{tokens.font.typefaces.bellota-text}') },
      },
    })
    expect(ff(out, 'tree')).toBe('{brand.fonts.secondary}')
    expect(ff(out, 'badge')).toBe('{brand.fonts.primary}')
  })

  it('accepts an unwrapped brand and a brand with no fonts group', () => {
    expect(ff(reconcileUikitFontRefs(uikit(), { fonts: { primary: leaf('x') } }), 'tree')).toBe('{brand.fonts.primary}')
    expect(ff(reconcileUikitFontRefs(uikit(), { brand: {} }), 'tree')).toBe('{brand.fonts.secondary}')
  })

  it('is idempotent', () => {
    const brand = { brand: { fonts: { primary: leaf('x') } } }
    const once = reconcileUikitFontRefs(uikit(), brand)
    const twice = reconcileUikitFontRefs(JSON.parse(JSON.stringify(once)), brand)
    expect(twice).toEqual(once)
  })
})

// 1.x kept the enabled and disabled table colours side by side as `<prop>-color-enabled` /
// `-disabled`. 2.x keeps enabled on the component and moves disabled onto the states axis, so
// without a mapping neither has a 2.x home and the user's table colours are dropped.
describe('migrateImportedJson — table enabled/disabled colours', () => {
  const PARTS = ['table-cell', 'table-header', 'table-footer'] as const
  const color = (v: string) => ({ $type: 'color', $value: v })
  const table1x = () => ({
    'ui-kit': {
      components: {
        // sentinel: forces the 1.x overlay path
        checkbox: { properties: { colors: { 'layer-0': { background: color('{brand.palettes.neutral.100.color.tone}') } } } },
        ...Object.fromEntries(PARTS.map(part => [part, {
          properties: {
            colors: {
              'layer-0': {
                'text-color-enabled': color('{brand.layers.layer-0.elements.text.color}'),
                'text-color-disabled': color('{brand.palettes.neutral.400.color.tone}'),
                'cell-color-enabled': color('{brand.palettes.palette-2.050.color.tone}'),
                'cell-color-disabled': color('{brand.palettes.neutral.050.color.tone}'),
              },
            },
          },
        }])),
        table: {
          properties: {
            colors: { 'layer-0': { 'highlight-on-hover-color': color('{brand.palettes.neutral.100.color.tone}') } },
            opacities: { 'layer-0': { 'highlight-on-hover-opacity': { $type: 'number', $value: 0.5 } } },
          },
        },
      },
    },
  })

  it('splits the suffixed keys across properties and states.disabled', () => {
    for (const part of PARTS) {
      expect(mapOldUikitPath(`components.${part}.properties.colors.layer-0.text-color-enabled`))
        .toEqual([`components.${part}.properties.colors.layer-0.text-color`])
      expect(mapOldUikitPath(`components.${part}.properties.colors.layer-2.cell-color-enabled`))
        .toEqual([`components.${part}.properties.colors.layer-2.cell-color`])
      expect(mapOldUikitPath(`components.${part}.properties.colors.layer-0.text-color-disabled`))
        .toEqual([`components.${part}.variants.states.disabled.properties.colors.layer-0.text-color`])
      expect(mapOldUikitPath(`components.${part}.properties.colors.layer-3.cell-color-disabled`))
        .toEqual([`components.${part}.variants.states.disabled.properties.colors.layer-3.cell-color`])
    }
  })

  it('leaves the keys that already map 1:1 alone', () => {
    expect(mapOldUikitPath('components.table-header.properties.colors.layer-0.sorted-text-color'))
      .toEqual(['components.table-header.properties.colors.layer-0.sorted-text-color'])
    expect(mapOldUikitPath('components.table-footer.properties.colors.layer-0.horizontal-divider-color'))
      .toEqual(['components.table-footer.properties.colors.layer-0.horizontal-divider-color'])
  })

  it('drops table highlight-on-hover (hover is global in 2.x)', () => {
    expect(mapOldUikitPath('components.table.properties.colors.layer-0.highlight-on-hover-color')).toEqual([])
    expect(mapOldUikitPath('components.table.properties.opacities.layer-0.highlight-on-hover-opacity')).toEqual([])
  })

  it('carries the values across the overlay', () => {
    const out = migrateImportedJson(table1x(), 'uikit')
    for (const part of PARTS) {
      const c = out['ui-kit'].components[part]
      expect(c.properties.colors['layer-0']['text-color'].$value).toBe('{brand.layers.layer-0.elements.text.color}')
      expect(c.properties.colors['layer-0']['cell-color'].$value).toBe('{brand.palettes.palette-2.050.color.tone}')
      const d = c.variants.states.disabled.properties.colors['layer-0']
      expect(d['text-color'].$value).toBe('{brand.palettes.neutral.400.color.tone}')
      expect(d['cell-color'].$value).toBe('{brand.palettes.neutral.050.color.tone}')
      expect(c.properties.colors['layer-0']['text-color-enabled']).toBeUndefined()
    }
  })

  it('is detected as 1.x on the table shape alone', () => {
    const onlyTable: any = table1x()
    delete onlyTable['ui-kit'].components.checkbox
    const out = migrateImportedJson(onlyTable, 'uikit')
    expect(out['ui-kit'].components['table-cell'].variants.states.disabled.properties.colors['layer-0']['text-color'].$value)
      .toBe('{brand.palettes.neutral.400.color.tone}')
  })

  it('is idempotent', () => {
    const once = migrateImportedJson(table1x(), 'uikit')
    const twice = migrateImportedJson(JSON.parse(JSON.stringify(once)), 'uikit')
    expect(twice).toEqual(once)
  })
})
