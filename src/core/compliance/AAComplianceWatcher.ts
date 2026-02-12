import { buildTokenIndex, type TokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { findAaCompliantColor } from '../resolvers/colorSteppingForAa'
import { updateCssVar } from '../css/updateCssVar'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../css/readCssVar'
import { contrastRatio, hexToRgb } from '../../modules/theme/contrastUtil'
import { parseTokenReference } from '../utils/tokenReferenceParser'
import {
  resolveCssVarToHex,
  stepUntilAACompliant,
  hexToCssVarRef,
  findColorFamilyAndLevel
} from './layerColorStepping'

// Helper to blend foreground over background with opacity
function blendHexOverBg(fgHex?: string, bgHex?: string, opacity?: number): string | undefined {
  if (!fgHex || !bgHex) return undefined
  try {
    const toRgb = (h: string): [number, number, number] => {
      const s = h.startsWith('#') ? h.slice(1) : h
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
    }
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
    const a = clamp01(typeof opacity === 'number' ? opacity : 1)
    const [fr, fg, fb] = toRgb(fgHex.replace('#', ''))
    const [br, bgc, bb] = toRgb(bgHex.replace('#', ''))
    const rr = Math.round(a * fr + (1 - a) * br)
    const rg = Math.round(a * fg + (1 - a) * bgc)
    const rb = Math.round(a * fb + (1 - a) * bb)
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`
  } catch { return fgHex }
}

// Helper to blend foreground over background with opacity (for palette on-tone calculation)
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

// Helper to get opacity value from CSS var
function getOpacityValue(opacityVar: string | undefined, tokenIndex: { get: (path: string) => any } | Map<string, any>): number {
  if (!opacityVar) return 1
  const num = Number(opacityVar)
  if (Number.isFinite(num)) {
    return num <= 1 ? num : num / 100
  }
  const tokenMatch = opacityVar.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
  if (tokenMatch) {
    const [, tokenName] = tokenMatch
    const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
    if (typeof tokenValue === 'number') {
      return tokenValue <= 1 ? tokenValue : tokenValue / 100
    }
  }
  return 1
}

// Helper to parse core token reference from theme
function parseCoreTokenRef(name: 'interactive' | 'alert' | 'warning' | 'success', theme: any, mode: 'light' | 'dark' = 'light'): { family: string; level: string } | null {
  try {
    const root: any = theme?.brand ? theme.brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const core: any =
      themes?.[mode]?.palettes?.['core']?.['$value'] || themes?.[mode]?.palettes?.['core'] ||
      themes?.[mode]?.palettes?.['core-colors']?.['$value'] || themes?.[mode]?.palettes?.['core-colors'] ||
      root?.[mode]?.palettes?.['core']?.['$value'] || root?.[mode]?.palettes?.['core'] ||
      root?.[mode]?.palettes?.['core-colors']?.['$value'] || root?.[mode]?.palettes?.['core-colors'] ||
      root?.[mode]?.palettes?.core?.['$value'] || root?.[mode]?.palettes?.core || {}
    const v: any = core?.[name]
    const s = typeof v === 'string' ? v : typeof (v?.['$value']) === 'string' ? String(v['$value']) : ''
    if (!s) return null
    const parsed = parseTokenReference(s)
    if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color') {
      return { family: parsed.path[1], level: parsed.path[2] }
    }
  } catch { }
  return null
}

/**
 * AA Compliance Utility
 * 
 * Trigger-based utility for updating colors to maintain AA compliance.
 * No watchers - all methods must be called explicitly when needed.
 */
export class AAComplianceWatcher {
  private tokenIndex: TokenIndex
  private tokens: JsonLike
  private theme: JsonLike

  constructor(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
  }

  /**
   * Update palette on-tone color for AA compliance
   * Call this explicitly when a palette tone color changes
   */
  public updatePaletteOnTone(paletteKey: string, level: string, mode: 'light' | 'dark') {
    const toneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`

    const toneValue = readCssVar(toneVar)

    if (!toneValue) return

    const toneHex = resolveCssVarToHex(toneValue, this.tokenIndex)
    if (!toneHex) return

    // Read actual core black and white colors from CSS variables (not hardcoded)
    const coreBlackVar = `--recursica-brand-themes-${mode}-palettes-core-black`
    const coreWhiteVar = `--recursica-brand-themes-${mode}-palettes-core-white`
    const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
    const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'

    // Normalize hex values (ensure they start with # and are lowercase)
    const black = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
    const white = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`

    // First, check contrast without opacity (baseline)
    const whiteBaseContrast = contrastRatio(toneHex, white)
    const blackBaseContrast = contrastRatio(toneHex, black)

    // Get emphasis opacity values from CSS variables
    const highEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${mode}-text-emphasis-high`)
    const lowEmphasisOpacity = readCssVarNumber(`--recursica-brand-themes-${mode}-text-emphasis-low`)

    // Blend white and black with tone using both opacity values
    const whiteHighBlended = blendHexOver(white, toneHex, highEmphasisOpacity)
    const whiteLowBlended = blendHexOver(white, toneHex, lowEmphasisOpacity)
    const blackHighBlended = blendHexOver(black, toneHex, highEmphasisOpacity)
    const blackLowBlended = blendHexOver(black, toneHex, lowEmphasisOpacity)

    // Calculate contrast ratios with opacity applied
    const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
    const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
    const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
    const blackLowContrast = contrastRatio(toneHex, blackLowBlended)

    const AA = 4.5

    // Check which option meets AA for both emphasis levels
    const whiteMeetsHighAA = whiteHighContrast >= AA
    const whiteMeetsLowAA = whiteLowContrast >= AA
    const whiteMeetsBothAA = whiteMeetsHighAA && whiteMeetsLowAA

    const blackMeetsHighAA = blackHighContrast >= AA
    const blackMeetsLowAA = blackLowContrast >= AA
    const blackMeetsBothAA = blackMeetsHighAA && blackMeetsLowAA

    // Determine best on-tone color based on AA compliance
    // Priority: both pass > low emphasis > high emphasis > baseline contrast
    let chosen: 'black' | 'white'

    // Priority 1: Both meet AA - choose based on baseline contrast first
    if (whiteMeetsBothAA && blackMeetsBothAA) {
      if (Math.abs(whiteBaseContrast - blackBaseContrast) > 1.0) {
        chosen = whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
      } else {
        chosen = whiteLowContrast >= blackLowContrast ? 'white' : 'black'
      }
    }
    // Priority 2: Only one meets both AA levels
    else if (whiteMeetsBothAA) {
      chosen = 'white'
    } else if (blackMeetsBothAA) {
      chosen = 'black'
    }
    // Priority 3: Check low emphasis (harder case) - prioritize this
    else if (whiteMeetsLowAA && !blackMeetsLowAA) {
      chosen = 'white'
    } else if (blackMeetsLowAA && !whiteMeetsLowAA) {
      chosen = 'black'
    }
    // Priority 4: Check high emphasis
    else if (whiteMeetsHighAA && !blackMeetsHighAA) {
      chosen = 'white'
    } else if (blackMeetsHighAA && !whiteMeetsHighAA) {
      chosen = 'black'
    }
    // Priority 5: Neither meets AA - choose based on baseline contrast
    else {
      if (Math.abs(whiteBaseContrast - blackBaseContrast) > 0.5) {
        chosen = whiteBaseContrast >= blackBaseContrast ? 'white' : 'black'
      } else {
        chosen = whiteLowContrast >= blackLowContrast ? 'white' : 'black'
      }
    }

    const onToneValue = chosen === 'white'
      ? `var(--recursica-brand-themes-${mode}-palettes-core-white)`
      : `var(--recursica-brand-themes-${mode}-palettes-core-black)`

    // Pass tokens to updateCssVar for validation
    updateCssVar(onToneVar, onToneValue, this.tokens)
  }


  /**
   * Update all component-level asterisk colors (layers 0-3) based on a changed color
   * Steps through the palette to maintain AA compliance with each layer's background
   * Call this explicitly when asterisk color changes
   */
  public updateAllComponentAsteriskColors(mode: 'light' | 'dark', changedColorValue: string) {
    // Get the hex value of the changed color
    const changedColorHex = resolveCssVarToHex(changedColorValue, this.tokenIndex)
    if (!changedColorHex) return

    // Find the color family and level from the changed color
    const colorInfo = findColorFamilyAndLevel(changedColorHex, this.tokens)
    if (!colorInfo) return

    // Update asterisk color for each layer (0-3)
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceCssVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-properties-surface`
      const surfaceValue = readCssVar(surfaceCssVar)

      if (!surfaceValue) continue

      const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
      if (!surfaceHex) continue

      // Get the component-level asterisk color CSS var
      const asteriskColorVar = `--recursica-ui-kit-components-label-properties-colors-layer-${layer}-asterisk`

      // Get the base color from the token index using the same family
      const normalizedLevel = colorInfo.level === '000' ? '050' : colorInfo.level
      // Try new format first (colors/family/level), then old format (color/family/level) for backwards compatibility
      let baseColorHex = this.tokenIndex.get(`colors/${colorInfo.family}/${normalizedLevel}`)
      if (typeof baseColorHex !== 'string') {
        baseColorHex = this.tokenIndex.get(`color/${colorInfo.family}/${normalizedLevel}`)
      }

      if (typeof baseColorHex === 'string') {
        const hex = baseColorHex.startsWith('#') ? baseColorHex.toLowerCase() : `#${baseColorHex.toLowerCase()}`
        // Step until AA compliant with this layer's surface
        const steppedHex = stepUntilAACompliant(hex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(asteriskColorVar, cssVarRef, this.tokens)
      }
    }
  }

  /**
   * Update component-level asterisk colors for all layers (0-3)
   * Steps through the palette to maintain AA compliance with each layer's background
   * Call this explicitly when alert core color changes
   */
  public updateComponentAsteriskColors(mode: 'light' | 'dark' = 'light') {
    // Get the alert core color
    const alertCoreVar = `--recursica-brand-themes-${mode}-palettes-core-alert`
    const alertCoreValue = readCssVar(alertCoreVar)

    if (!alertCoreValue) return

    const alertCoreHex = resolveCssVarToHex(alertCoreValue, this.tokenIndex)
    if (!alertCoreHex) return

    // Get the core token for alert
    const coreToken = parseCoreTokenRef('alert', this.theme, mode)

    // Update asterisk color for each layer (0-3)
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceCssVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-properties-surface`
      const surfaceValue = readCssVar(surfaceCssVar)

      if (!surfaceValue) continue

      const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
      if (!surfaceHex) continue

      // Get the component-level asterisk color CSS var
      const asteriskColorVar = `--recursica-ui-kit-components-label-properties-colors-layer-${layer}-asterisk`

      // Get opacity for text high emphasis
      const opacityVar = `--recursica-brand-themes-${mode}-layers-layer-${layer}-elements-text-high-emphasis`
      const opacityValue = readCssVar(opacityVar)
      const opacity = getOpacityValue(opacityValue, this.tokenIndex)

      // Use the same logic as updateElementColor for alert colors
      if (coreToken) {
        // Get the core color hex from the token index
        const normalizedLevel = coreToken.level === '000' ? '050' : coreToken.level
        // Try new format first (colors/family/level), then old format (color/family/level) for backwards compatibility
        let coreColorHex = this.tokenIndex.get(`colors/${coreToken.family}/${normalizedLevel}`)
        if (typeof coreColorHex !== 'string') {
          coreColorHex = this.tokenIndex.get(`color/${coreToken.family}/${normalizedLevel}`)
        }

        if (typeof coreColorHex === 'string') {
          const hex = coreColorHex.startsWith('#') ? coreColorHex.toLowerCase() : `#${coreColorHex.toLowerCase()}`
          // Step until AA compliant
          const steppedHex = stepUntilAACompliant(hex, surfaceHex, 'darker', this.tokens)
          const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
          updateCssVar(asteriskColorVar, cssVarRef, this.tokens)
        } else {
          // Fallback to findAaCompliantColor if token not found
          const aaCompliantColor = findAaCompliantColor(surfaceHex, coreToken, opacity, this.tokens)
          if (aaCompliantColor) {
            updateCssVar(asteriskColorVar, aaCompliantColor, this.tokens)
          }
        }
      }
    }
  }

  /**
   * Update layer element colors for AA compliance
   * Call this explicitly when a layer's surface color changes
   */
  public updateLayerElementColors(layerNumber: number, mode: 'light' | 'dark' = 'light') {
    // Use the correct format with "themes" in the path
    const surfaceCssVar = `--recursica-brand-themes-${mode}-layers-layer-${layerNumber}-properties-surface`
    const surfaceValue = readCssVar(surfaceCssVar)

    if (!surfaceValue) return

    const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
    if (!surfaceHex) return

    const brandBase = `--recursica-brand-themes-${mode}-layers-layer-${layerNumber}-`

    // Update each element type
    const elements = [
      {
        name: 'text-color',
        colorVar: `${brandBase}elements-text-color`,
        opacityVar: `${brandBase}elements-text-high-emphasis`,
        coreToken: null
      },
      {
        name: 'interactive-tone',
        colorVar: `${brandBase}elements-interactive-tone`,
        opacityVar: `${brandBase}elements-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-tone-hover',
        colorVar: `${brandBase}elements-interactive-tone-hover`,
        opacityVar: `${brandBase}elements-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-on-tone',
        colorVar: `${brandBase}elements-interactive-on-tone`,
        opacityVar: `${brandBase}elements-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-on-tone-hover',
        colorVar: `${brandBase}elements-interactive-on-tone-hover`,
        opacityVar: `${brandBase}elements-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      // Legacy support: keep old 'interactive-color' for backward compatibility
      {
        name: 'interactive-color',
        colorVar: `${brandBase}elements-interactive-color`,
        opacityVar: `${brandBase}elements-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'alert',
        colorVar: `${brandBase}elements-text-alert`,
        opacityVar: `${brandBase}elements-text-high-emphasis`,
        coreToken: parseCoreTokenRef('alert', this.theme, mode)
      },
      {
        name: 'warning',
        colorVar: `${brandBase}elements-text-warning`,
        opacityVar: `${brandBase}elements-text-high-emphasis`,
        coreToken: parseCoreTokenRef('warning', this.theme, mode)
      },
      {
        name: 'success',
        colorVar: `${brandBase}elements-text-success`,
        opacityVar: `${brandBase}elements-text-high-emphasis`,
        coreToken: parseCoreTokenRef('success', this.theme, mode)
      }
    ]

    elements.forEach((element) => {
      this.updateElementColor(element.name, surfaceHex, surfaceValue, element.colorVar, element.opacityVar, element.coreToken, mode)
    })
  }


  private updateElementColor(
    elementName: string,
    surfaceHex: string,
    surfaceValue: string | undefined,
    currentColorCssVar: string,
    opacityCssVar: string,
    coreToken: { family: string; level: string } | null,
    mode: 'light' | 'dark' = 'light'
  ): void {
    const opacityValue = readCssVar(opacityCssVar)
    const opacity = getOpacityValue(opacityValue, this.tokenIndex)

    if (elementName === 'text-color') {
      // Try to extract palette key and level from surface value
      // Format: var(--recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone)
      if (surfaceValue && surfaceValue.includes('palettes-')) {
        const paletteMatch = surfaceValue.match(/palettes-([a-z0-9-]+)-(\d+|primary)-tone/)
        if (paletteMatch) {
          const [, paletteKey, level] = paletteMatch
          // Get the on-tone value for this palette/level
          const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`
          const onToneValue = readCssVar(onToneVar)

          if (onToneValue) {
            // Resolve the on-tone value to hex
            const onToneHex = resolveCssVarToHex(onToneValue, this.tokenIndex)

            if (onToneHex) {
              // Blend the on-tone with opacity
              const blendedOnTone = blendHexOverBg(onToneHex, surfaceHex, opacity)

              if (blendedOnTone) {
                // Check if the current on-tone passes AA
                const contrast = contrastRatio(surfaceHex, blendedOnTone)
                const AA = 4.5

                if (contrast >= AA) {
                  // Current on-tone passes, use it
                  updateCssVar(currentColorCssVar, onToneValue, this.tokens)
                  return
                } else {
                  // Need to step through the on-tone color scale to find AA-compliant color
                  // Find which color family/scale the on-tone belongs to
                  const onToneColorInfo = findColorFamilyAndLevel(onToneHex, this.tokens)

                  if (onToneColorInfo) {
                    // Step through the on-tone scale to find AA-compliant color
                    const steppedHex = stepUntilAACompliant(onToneHex, surfaceHex, 'darker', this.tokens, 10)
                    const steppedBlended = blendHexOverBg(steppedHex, surfaceHex, opacity)

                    if (steppedBlended) {
                      const steppedContrast = contrastRatio(surfaceHex, steppedBlended)
                      if (steppedContrast >= AA) {
                        // Found AA-compliant color in the scale, convert to CSS var
                        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
                        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
                        return
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Fallback to original logic if we can't find palette on-tone
      const aaCompliantColor = findAaCompliantColor(surfaceHex, null, opacity, this.tokens)
      if (aaCompliantColor) {
        updateCssVar(currentColorCssVar, aaCompliantColor, this.tokens)
      }
      return
    } else if (elementName === 'interactive-tone') {
      // Use stepping logic for interactive tone colors (background)
      const coreInteractiveVar = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`
      const coreInteractiveHex = resolveCssVarToHex(coreInteractiveVar, this.tokenIndex) ||
        resolveCssVarToHex(`var(--recursica-brand-themes-${mode}-palettes-core-interactive)`, this.tokenIndex)

      if (coreInteractiveHex) {
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(coreInteractiveHex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      }
      return
    } else if (elementName === 'interactive-tone-hover') {
      // Use stepping logic for interactive tone hover colors (background hover)
      const coreInteractiveVar = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone)`
      const coreInteractiveHex = resolveCssVarToHex(coreInteractiveVar, this.tokenIndex)

      if (coreInteractiveHex) {
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(coreInteractiveHex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      }
      return
    } else if (elementName === 'interactive-on-tone') {
      // Use stepping logic for interactive on-tone colors (text)
      // For text on interactive background, we need to check contrast against the interactive tone
      // Get the corresponding tone CSS variable
      const interactiveToneVar = currentColorCssVar.replace('elements-interactive-on-tone', 'elements-interactive-tone')
      const interactiveToneValue = readCssVar(interactiveToneVar)
      const interactiveToneHex = interactiveToneValue
        ? resolveCssVarToHex(interactiveToneValue, this.tokenIndex)
        : resolveCssVarToHex(`var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, this.tokenIndex)

      if (interactiveToneHex) {
        // Text should contrast with the interactive tone, not the surface
        const coreOnToneVar = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`
        const coreOnToneHex = resolveCssVarToHex(coreOnToneVar, this.tokenIndex)

        if (coreOnToneHex) {
          // Step until AA compliant against the interactive tone
          const steppedHex = stepUntilAACompliant(coreOnToneHex, interactiveToneHex, 'darker', this.tokens)
          const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
          updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
        }
      }
      return
    } else if (elementName === 'interactive-on-tone-hover') {
      // Use stepping logic for interactive on-tone hover colors (text hover)
      // For text on interactive hover background, we need to check contrast against the interactive hover tone
      // Get the corresponding tone hover CSS variable
      const interactiveToneHoverVar = currentColorCssVar.replace('elements-interactive-on-tone-hover', 'elements-interactive-tone-hover')
      const interactiveToneHoverValue = readCssVar(interactiveToneHoverVar)
      const interactiveToneHoverHex = interactiveToneHoverValue
        ? resolveCssVarToHex(interactiveToneHoverValue, this.tokenIndex)
        : resolveCssVarToHex(`var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone)`, this.tokenIndex)

      if (interactiveToneHoverHex) {
        // Text should contrast with the interactive hover tone, not the surface
        const coreOnToneVar = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone)`
        const coreOnToneHex = resolveCssVarToHex(coreOnToneVar, this.tokenIndex)

        if (coreOnToneHex) {
          // Step until AA compliant against the interactive hover tone
          const steppedHex = stepUntilAACompliant(coreOnToneHex, interactiveToneHoverHex, 'darker', this.tokens)
          const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
          updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
        }
      }
      return
    } else if (elementName === 'interactive-color') {
      // Legacy support: Use stepping logic for old interactive-color property
      const coreInteractiveVar = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`
      const coreInteractiveHex = resolveCssVarToHex(coreInteractiveVar, this.tokenIndex) ||
        resolveCssVarToHex(`var(--recursica-brand-themes-${mode}-palettes-core-interactive)`, this.tokenIndex)

      if (coreInteractiveHex) {
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(coreInteractiveHex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      }
      return
    }

    // For status colors (alert, warning, success), use stepping logic with opacity consideration
    if (coreToken) {
      // Get the core color hex from the token index
      const normalizedLevel = coreToken.level === '000' ? '050' : coreToken.level
      // Try both color/ and colors/ paths
      let coreColorHex = this.tokenIndex.get(`colors/${coreToken.family}/${normalizedLevel}`)
      if (typeof coreColorHex !== 'string') {
        coreColorHex = this.tokenIndex.get(`color/${coreToken.family}/${normalizedLevel}`)
      }

      // If token lookup fails, try to get the core color directly from CSS var
      if (typeof coreColorHex !== 'string') {
        const coreColorVar = `--recursica-brand-themes-${mode}-palettes-core-${elementName}`
        const coreColorValue = readCssVar(coreColorVar)
        if (coreColorValue) {
          coreColorHex = resolveCssVarToHex(coreColorValue, this.tokenIndex)
        }
      }

      if (typeof coreColorHex === 'string') {
        const hex = coreColorHex.startsWith('#') ? coreColorHex.toLowerCase() : `#${coreColorHex.toLowerCase()}`
        const AA = 4.5

        // First, check if the current color (blended with opacity) passes AA
        const blendedColor = blendHexOverBg(hex, surfaceHex, opacity)
        if (blendedColor) {
          const currentContrast = contrastRatio(surfaceHex, blendedColor)

          if (currentContrast >= AA) {
            // Current color passes, use it
            const cssVarRef = hexToCssVarRef(hex, this.tokens)
            updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
            return
          }
        }

        // Current color doesn't pass, step through the scale manually while checking opacity
        // Use alternating pattern: +100, -100, +200, -200, etc.
        // Get color info to step through the scale
        const colorInfo = findColorFamilyAndLevel(hex, this.tokens)
        if (colorInfo) {
          const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
          const currentLevelIndex = LEVELS.indexOf(colorInfo.level)

          if (currentLevelIndex >= 0) {
            // Try alternating pattern: +100, -100, +200, -200, +300, -300, etc.
            const maxOffset = Math.max(currentLevelIndex, LEVELS.length - 1 - currentLevelIndex)
            for (let offset = 1; offset <= maxOffset; offset++) {
              // Try darker first (+offset)
              const darkerIndex = currentLevelIndex + offset
              if (darkerIndex < LEVELS.length) {
                const testLevel = LEVELS[darkerIndex]
                // Try both color/ and colors/ paths
                let testHex = this.tokenIndex.get(`colors/${colorInfo.family}/${testLevel}`)
                if (typeof testHex !== 'string') {
                  testHex = this.tokenIndex.get(`color/${colorInfo.family}/${testLevel}`)
                }
                if (typeof testHex === 'string') {
                  const testHexNormalized = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                  const testBlended = blendHexOverBg(testHexNormalized, surfaceHex, opacity)
                  if (testBlended) {
                    const testContrast = contrastRatio(surfaceHex, testBlended)
                    if (testContrast >= AA) {
                      const cssVarRef = hexToCssVarRef(testHexNormalized, this.tokens)
                      updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
                      return
                    }
                  }
                }
              }

              // Try lighter (-offset)
              const lighterIndex = currentLevelIndex - offset
              if (lighterIndex >= 0) {
                const testLevel = LEVELS[lighterIndex]
                // Try both color/ and colors/ paths
                let testHex = this.tokenIndex.get(`colors/${colorInfo.family}/${testLevel}`)
                if (typeof testHex !== 'string') {
                  testHex = this.tokenIndex.get(`color/${colorInfo.family}/${testLevel}`)
                }
                if (typeof testHex === 'string') {
                  const testHexNormalized = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                  const testBlended = blendHexOverBg(testHexNormalized, surfaceHex, opacity)
                  if (testBlended) {
                    const testContrast = contrastRatio(surfaceHex, testBlended)
                    if (testContrast >= AA) {
                      const cssVarRef = hexToCssVarRef(testHexNormalized, this.tokens)
                      updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
                      return
                    }
                  }
                }
              }
            }
          }
        }

        // If no stepped color passes, use the original color (will show warning in UI)
        const cssVarRef = hexToCssVarRef(hex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      } else {
        // Fallback to findAaCompliantColor if token not found
        const aaCompliantColor = findAaCompliantColor(surfaceHex, coreToken, opacity, this.tokens)
        if (aaCompliantColor) {
          updateCssVar(currentColorCssVar, aaCompliantColor, this.tokens)
        }
      }
    } else {
      // If coreToken is null, try to get the core color from CSS var and update it
      // This handles cases where parseCoreTokenRef fails
      const coreColorVar = `--recursica-brand-themes-${mode}-palettes-core-${elementName}`
      const coreColorValue = readCssVar(coreColorVar)
      if (coreColorValue) {
        const coreColorHex = resolveCssVarToHex(coreColorValue, this.tokenIndex)
        if (coreColorHex) {
          const AA = 4.5
          const blendedColor = blendHexOverBg(coreColorHex, surfaceHex, opacity)
          if (blendedColor) {
            const currentContrast = contrastRatio(surfaceHex, blendedColor)
            if (currentContrast >= AA) {
              // Current color passes, use it
              updateCssVar(currentColorCssVar, coreColorValue, this.tokens)
              return
            }
          }

          // Current color doesn't pass, step through the scale manually while checking opacity
          const colorInfo = findColorFamilyAndLevel(coreColorHex, this.tokens)
          if (colorInfo) {
            const LEVELS = ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000']
            const currentLevelIndex = LEVELS.indexOf(colorInfo.level)

            if (currentLevelIndex >= 0) {
              // Try alternating pattern: +100, -100, +200, -200, etc.
              const maxOffset = Math.max(currentLevelIndex, LEVELS.length - 1 - currentLevelIndex)
              for (let offset = 1; offset <= maxOffset; offset++) {
                // Try darker first (+offset)
                const darkerIndex = currentLevelIndex + offset
                if (darkerIndex < LEVELS.length) {
                  const testLevel = LEVELS[darkerIndex]
                  let testHex = this.tokenIndex.get(`colors/${colorInfo.family}/${testLevel}`)
                  if (typeof testHex !== 'string') {
                    testHex = this.tokenIndex.get(`color/${colorInfo.family}/${testLevel}`)
                  }
                  if (typeof testHex === 'string') {
                    const testHexNormalized = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                    const testBlended = blendHexOverBg(testHexNormalized, surfaceHex, opacity)
                    if (testBlended) {
                      const testContrast = contrastRatio(surfaceHex, testBlended)
                      if (testContrast >= AA) {
                        const cssVarRef = hexToCssVarRef(testHexNormalized, this.tokens)
                        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
                        return
                      }
                    }
                  }
                }

                // Try lighter (-offset)
                const lighterIndex = currentLevelIndex - offset
                if (lighterIndex >= 0) {
                  const testLevel = LEVELS[lighterIndex]
                  let testHex = this.tokenIndex.get(`colors/${colorInfo.family}/${testLevel}`)
                  if (typeof testHex !== 'string') {
                    testHex = this.tokenIndex.get(`color/${colorInfo.family}/${testLevel}`)
                  }
                  if (typeof testHex === 'string') {
                    const testHexNormalized = testHex.startsWith('#') ? testHex.toLowerCase() : `#${testHex.toLowerCase()}`
                    const testBlended = blendHexOverBg(testHexNormalized, surfaceHex, opacity)
                    if (testBlended) {
                      const testContrast = contrastRatio(surfaceHex, testBlended)
                      if (testContrast >= AA) {
                        const cssVarRef = hexToCssVarRef(testHexNormalized, this.tokens)
                        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
                        return
                      }
                    }
                  }
                }
              }
            }
          }

          // If no stepped color passes, use the original
          updateCssVar(currentColorCssVar, coreColorValue, this.tokens)
        }
      }
    }
  }

  /**
   * Update tokens and theme (call when they change)
   * No automatic checks - call update methods explicitly when needed
   */
  updateTokensAndTheme(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
  }

  /**
   * Update all layers (0-3) - used when core colors change
   */
  updateAllLayers(mode?: 'light' | 'dark') {
    // Update both modes if mode not specified, otherwise just the specified mode
    const modes: ('light' | 'dark')[] = mode ? [mode] : ['light', 'dark']

    for (const m of modes) {
      // Update regular layers 0-3
      for (let layer = 0; layer <= 3; layer++) {
        this.updateLayerElementColors(layer, m)
      }
    }
  }

  /**
   * Force update all palette on-tone variables for AA compliance (call after reset)
   */
  checkAllPaletteOnTones() {
    // Get all palettes from theme and check all their on-tone variables
    try {
      const root: any = (this.theme as any)?.brand ? (this.theme as any).brand : this.theme
      const themes = root?.themes || root
      // Include all standard levels including 1000 and 000
      const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']

      // Check both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const pal: any = themes?.[mode]?.palettes || {}
        Object.keys(pal).forEach((paletteKey) => {
          if (paletteKey === 'core' || paletteKey === 'core-colors') return
          levels.forEach((level) => {
            // Force update on-tone for this palette/level combination
            this.updatePaletteOnTone(paletteKey, level, mode)
          })
        })
      }
    } catch (err) {
      console.error('Error checking all palette on-tone variables:', err)
    }
  }

}

