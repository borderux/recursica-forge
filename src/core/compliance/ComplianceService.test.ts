import { describe, it, expect, beforeEach, vi } from 'vitest'
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
            toast: {
              variants: {
                styles: {
                  default: {
                    properties: {
                      colors: {
                        'layer-0': {
                          background: '{brand.palettes.neutral.050.color.tone}',
                          text: '{brand.palettes.neutral.050.color.on-tone}'
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
      '--recursica_ui-kit_themes_light_components_toast_variants_styles_default_properties_colors_layer-0_background',
      '#ffffff'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_light_components_toast_variants_styles_default_properties_colors_layer-0_text',
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
      '--recursica_ui-kit_themes_dark_components_toast_variants_styles_default_properties_colors_layer-0_background',
      '#000000'
    )
    document.documentElement.style.setProperty(
      '--recursica_ui-kit_themes_dark_components_toast_variants_styles_default_properties_colors_layer-0_text',
      '#333333'
    )
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
