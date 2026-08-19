import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getComplianceService } from './ComplianceService'

// Mock varsStore to get a basic state
vi.mock('../store/varsStore', () => ({
  getVarsStore: vi.fn(() => ({
    getState: vi.fn(() => ({
      uikit: {
        'ui-kit': {
          components: {
            tabs: {
              variants: {
                styles: {
                  default: {
                    properties: {
                      active: {
                        colors: {
                          'layer-0': {
                            'text-color': '{brand.palettes.core-colors.interactive.on-tone}',
                            'icon-color': '{brand.palettes.core-colors.interactive.on-tone}',
                            background: null
                          }
                        }
                      },
                      inactive: {
                        colors: {
                          'layer-0': {
                            'text-color': '{brand.palettes.core-colors.interactive.tone}',
                            'icon-color': '{brand.palettes.core-colors.interactive.tone}',
                            background: null
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            link: {
              variants: {
                states: {
                  default: {
                    properties: {
                      colors: {
                        'layer-0': {
                          text: '{brand.palettes.core-colors.interactive.tone}',
                          icon: '{brand.palettes.core-colors.interactive.tone}'
                        }
                      }
                    }
                  }
                }
              }
            },
            tooltip: {
              properties: {
                colors: {
                  'layer-0': {
                    background: '{brand.palettes.neutral.1000.color.tone}',
                    text: '{brand.palettes.neutral.050.color.tone}'
                  }
                }
              }
            },
            button: {
              variants: {
                styles: {
                  solid: {
                    properties: {
                      colors: {
                        'layer-0': {
                          'background-color': '{brand.palettes.core-colors.interactive.tone}',
                          'text-color': '{brand.palettes.core-colors.interactive.on-tone}'
                        }
                      }
                    }
                  }
                }
              }
            },
            toast: {
              variants: {
                styles: {
                  default: {
                    properties: {
                      colors: {
                        'layer-0': {
                          // Real ui-kit keys are `background-color` / `text-color`.
                          // The fixture previously used `background` / `text`, which only
                          // matched the audit's own incorrect key names.
                          'background-color': '{brand.palettes.neutral.050.color.tone}',
                          'text-color': '{brand.palettes.neutral.050.color.on-tone}'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })),
    writeCssVarsDirect: vi.fn()
  }))
}))

const mockTokens = {
  tokens: {
    color: {
      gray: {
        '000': { $value: '#ffffff' },
        '1000': { $value: '#000000' },
        '500': { $value: '#808080' }
      }
    }
  }
}

const mockTheme = {
  brand: {
    themes: {
      light: {
        palettes: {
          'core-colors': {
            'high-contrast': { $value: '{tokens.colors.scale-02.1000}' },
            'low-contrast': { $value: '{tokens.colors.scale-02.000}' },
            interactive: { $value: '{tokens.colors.scale-02.500}' }
          }
        },
        layers: {
          'layer-0': {
            properties: {
              surface: { $value: '{tokens.colors.scale-02.000}' }
            }
          }
        }
      },
      dark: {
        palettes: {
          'core-colors': {
            'high-contrast': { $value: '{tokens.colors.scale-02.000}' },
            'low-contrast': { $value: '{tokens.colors.scale-02.1000}' },
            interactive: { $value: '{tokens.colors.scale-02.500}' }
          }
        },
        layers: {
          'layer-0': {
            properties: {
              surface: { $value: '{tokens.colors.scale-02.1000}' }
            }
          }
        }
      }
    }
  }
}

describe('ComplianceService Components Audit', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    
    // Set up light mode variables
    document.documentElement.style.setProperty('--recursica_tokens_color_gray_000', '#ffffff')
    document.documentElement.style.setProperty('--recursica_tokens_color_gray_500', '#808080')
    document.documentElement.style.setProperty('--recursica_tokens_color_gray_1000', '#000000')
    
    document.documentElement.style.setProperty('--recursica_brand_themes_light_layers_layer-0_properties_surface', '#ffffff')
    document.documentElement.style.setProperty('--recursica_brand_themes_dark_layers_layer-0_properties_surface', '#000000')

    // Inactive tabs and link text have low contrast (e.g. gray #cccccc on white #ffffff background in light mode)
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_tabs_variants_styles_default_properties_inactive_colors_layer-0_text-color',
      '#cccccc'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_tabs_variants_styles_default_properties_inactive_colors_layer-0_icon-color',
      '#cccccc'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_link_variants_states_default_properties_colors_layer-0_text',
      '#cccccc'
    )
    
    // Set up dark mode variables with low contrast (e.g. #333333 on #000000)
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_tabs_variants_styles_default_properties_inactive_colors_layer-0_text-color',
      '#333333'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_tabs_variants_styles_default_properties_inactive_colors_layer-0_icon-color',
      '#333333'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_link_variants_states_default_properties_colors_layer-0_text',
      '#333333'
    )

    // Active tabs text has high contrast
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_tabs_variants_styles_default_properties_active_colors_layer-0_text-color',
      '#000000'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_tabs_variants_styles_default_properties_active_colors_layer-0_text-color',
      '#ffffff'
    )

    // Set up tooltip and toast variables with low contrast
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_tooltip_properties_colors_layer-0_background',
      '#ffffff'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_tooltip_properties_colors_layer-0_text',
      '#cccccc'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_toast_variants_styles_default_properties_colors_layer-0_background-color',
      '#ffffff'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_toast_variants_styles_default_properties_colors_layer-0_text-color',
      '#cccccc'
    )

    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_tooltip_properties_colors_layer-0_background',
      '#000000'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_tooltip_properties_colors_layer-0_text',
      '#333333'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_toast_variants_styles_default_properties_colors_layer-0_background-color',
      '#000000'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_toast_variants_styles_default_properties_colors_layer-0_text-color',
      '#333333'
    )
  })

  // Button solid: text and background resolve to the SAME colour, i.e. invisible label
  // at exactly 1.00:1. This is the state produced by editing the interactive colour, and
  // the audit must report it. Before the key-name fix the standard-components loop bailed
  // on a missing `background` key and never checked button at all.
  beforeEach(() => {
    for (const mode of ['light', 'dark'] as const) {
      const base = `--recursica_ui-kit_themes_${mode}_components_button_variants_styles_solid_properties_colors_layer-0`
      document.documentElement.style.setProperty(`${base}_background-color`, '#1a7f8c')
      document.documentElement.style.setProperty(`${base}_text-color`, '#1a7f8c')
    }
  })

  it('reports the button solid label when it matches its own background (1.00:1)', () => {
    const service = getComplianceService()
    service.connect(() => mockTokens, () => mockTheme)
    service.runFullScan()
    const componentIssues = service.getComponentIssues()
    const buttonIssues = componentIssues.filter(i => i.componentName === 'button')

    expect(buttonIssues.length).toBeGreaterThan(0)
    const textIssue = buttonIssues.find(i => i.location.includes('Text'))
    expect(textIssue).toBeDefined()
    expect(textIssue?.light.passes).toBe(false)
    expect(textIssue?.dark.passes).toBe(false)
  })

  it('should detect low contrast issues for tabs, links, tooltips, and toasts', () => {
    const service = getComplianceService()
    service.connect(() => mockTokens, () => mockTheme)

    // Run the scan
    service.runFullScan()

    const componentIssues = service.getComponentIssues()

    // Filter issues for components
    const tabIssues = componentIssues.filter(i => i.componentName === 'tabs')
    const linkIssues = componentIssues.filter(i => i.componentName === 'link')
    const tooltipIssues = componentIssues.filter(i => i.componentName === 'tooltip')
    const toastIssues = componentIssues.filter(i => i.componentName === 'toast')

    expect(tabIssues.length).toBeGreaterThan(0)
    expect(linkIssues.length).toBeGreaterThan(0)
    expect(tooltipIssues.length).toBeGreaterThan(0)
    expect(toastIssues.length).toBeGreaterThan(0)

    // Verify tooltip and toast issues
    const tooltipTextIssue = tooltipIssues.find(i => i.location.includes('Tooltip') && i.location.includes('Text'))
    expect(tooltipTextIssue).toBeDefined()
    expect(tooltipTextIssue?.light.passes).toBe(false)
    expect(tooltipTextIssue?.dark.passes).toBe(false)

    const toastTextIssue = toastIssues.find(i => i.location.includes('Toast') && i.location.includes('Text'))
    expect(toastTextIssue).toBeDefined()
    expect(toastTextIssue?.light.passes).toBe(false)
    expect(toastTextIssue?.dark.passes).toBe(false)
  })
})

describe('ComplianceService interactive-color write path (2.1.0)', () => {
  // Regression guard. Before 2.1.0 the layer's readable interactive colour lived under
  // `elements.interactive.tone`, which is also the fill. A contrast fix for text therefore
  // repainted the fill, and the routine additionally deleted `elements.interactive.color`
  // and cascaded an `on-tone` fix. Those slots are now independent, so a scan must write
  // `color` and leave `tone` alone — otherwise the next compliance run silently reverts
  // the 2.1.0 structural change.
  //
  // Scope: this exercises the var -> JSON-path ROUTING only. The value resolver
  // (cssVarRefToJsonRef) needs injected tokens plus live DOM CSS vars, so it is stubbed;
  // routing is the part 2.1.0 changed.

  // Shape matters: the layer write path resolves `root.themes?.[mode] ?? root[mode]`, so
  // the fixture must be mode-keyed. A bare { layers: ... } matches nothing and makes every
  // "left untouched" assertion vacuously true.
  const makeThemeCopy = () => ({
    themes: {
      dark: {
        layers: {
          'layer-3': {
            elements: {
              interactive: {
                tone: { $type: 'color', $value: '{tokens.colors.scale-06.60}' },
                color: { $type: 'color', $value: '{tokens.colors.scale-06.80}' },
                'on-tone': { $type: 'color', $value: '{tokens.colors.scale-06.10}' }
              }
            }
          }
        }
      }
    }
  })

  const interOf = (t: any) => t.themes.dark.layers['layer-3'].elements.interactive
  const VAR = '--recursica_brand_themes_dark_layers_layer-3_elements_interactive-color'
  const TONE_VAR = '--recursica_brand_themes_dark_layers_layer-3_elements_interactive-tone'
  const FIXED = '{tokens.colors.scale-06.100}'

  let svc: any
  let original: any

  beforeEach(() => {
    // getComplianceService() is a singleton, so stash and restore the real resolver.
    svc = getComplianceService() as any
    original = svc.cssVarRefToJsonRef
    svc.cssVarRefToJsonRef = () => FIXED
  })

  afterEach(() => {
    svc.cssVarRefToJsonRef = original
  })

  it('writes the fixed value to elements.interactive.color', () => {
    const theme = makeThemeCopy()
    svc.applyFixToThemeCopy(theme, VAR, 'var(--whatever)')
    expect(interOf(theme).color.$value).toBe(FIXED)
  })

  it('leaves elements.interactive.tone (the fill) untouched', () => {
    const theme = makeThemeCopy()
    svc.applyFixToThemeCopy(theme, VAR, 'var(--whatever)')
    expect(interOf(theme).tone.$value).toBe('{tokens.colors.scale-06.60}')
  })

  it('does not delete elements.interactive.color as a side effect', () => {
    const theme = makeThemeCopy()
    svc.applyFixToThemeCopy(theme, VAR, 'var(--whatever)')
    expect(interOf(theme).color).toBeDefined()
  })

  it('does not cascade an on-tone fix when only the readable colour changed', () => {
    const theme = makeThemeCopy()
    svc.applyFixToThemeCopy(theme, VAR, 'var(--whatever)')
    expect(interOf(theme)['on-tone'].$value).toBe('{tokens.colors.scale-06.10}')
  })

  it('still routes interactive-tone to the fill, independently', () => {
    const theme = makeThemeCopy()
    svc.applyFixToThemeCopy(theme, TONE_VAR, 'var(--whatever)')
    expect(interOf(theme).tone.$value).toBe(FIXED)
    expect(interOf(theme).color.$value).toBe('{tokens.colors.scale-06.80}')
  })

  it('is idempotent across repeated scans', () => {
    const theme = makeThemeCopy()
    for (let i = 0; i < 3; i++) svc.applyFixToThemeCopy(theme, VAR, 'var(--whatever)')
    expect(interOf(theme).color.$value).toBe(FIXED)
    expect(interOf(theme).tone.$value).toBe('{tokens.colors.scale-06.60}')
  })
})
