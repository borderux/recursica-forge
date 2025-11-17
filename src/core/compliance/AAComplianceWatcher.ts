import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { findAaCompliantColor } from '../resolvers/colorSteppingForAa'
import { updateCssVar } from '../css/updateCssVar'
import { readCssVar } from '../css/readCssVar'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import {
  resolveCssVarToHex,
  stepUntilAACompliant,
  hexToCssVarRef
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
    const [fr, fg, fb] = toRgb(fgHex.replace('#',''))
    const [br, bgc, bb] = toRgb(bgHex.replace('#',''))
    const rr = Math.round(a * fr + (1 - a) * br)
    const rg = Math.round(a * fg + (1 - a) * bgc)
    const rb = Math.round(a * fb + (1 - a) * bb)
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`
  } catch { return fgHex }
}

// Helper to get opacity value from CSS var
function getOpacityValue(opacityVar: string, tokenIndex: Map<string, any>): number {
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
function parseCoreTokenRef(name: 'interactive' | 'alert' | 'warning' | 'success', theme: any): { family: string; level: string } | null {
  try {
    const root: any = theme?.brand ? theme.brand : theme
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = root?.themes || root
    const core: any =
      themes?.light?.palettes?.['core']?.['$value'] || themes?.light?.palettes?.['core'] ||
      themes?.light?.palettes?.['core-colors']?.['$value'] || themes?.light?.palettes?.['core-colors'] || 
      root?.light?.palettes?.['core']?.['$value'] || root?.light?.palettes?.['core'] ||
      root?.light?.palettes?.['core-colors']?.['$value'] || root?.light?.palettes?.['core-colors'] || 
      root?.light?.palettes?.core?.['$value'] || root?.light?.palettes?.core || {}
    const v: any = core?.[name]
    const s = typeof v === 'string' ? v : typeof (v?.['$value']) === 'string' ? String(v['$value']) : ''
    if (!s) return null
    const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s
    const m = /^tokens\.color\.([a-z0-9_-]+)\.(\d{2,4}|050)$/i.exec(inner)
    if (m) return { family: m[1], level: m[2] }
  } catch {}
  return null
}

/**
 * Reactive AA Compliance Watcher
 * 
 * Watches CSS variables for changes and automatically updates dependent colors
 * to maintain AA compliance. This replaces manual AA compliance calls.
 */
export class AAComplianceWatcher {
  private tokenIndex: Map<string, any>
  private tokens: JsonLike
  private theme: JsonLike
  private watchedVars: Set<string> = new Set()
  private observer: MutationObserver | null = null
  private checkTimeout: number | null = null
  private lastValues: Map<string, string> = new Map()
  private paletteFamilyChangedHandler: ((ev: CustomEvent) => void) | null = null
  private paletteDeletedHandler: ((ev: CustomEvent) => void) | null = null
  private isFixing: boolean = false

  constructor(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
    this.setupWatcher()
    // Run startup validation after a short delay to ensure CSS vars are set
    setTimeout(() => {
      this.validateAllCompliance()
    }, 100)
  }

  private setupWatcher() {
    // Watch for CSS variable changes using MutationObserver
    this.observer = new MutationObserver(() => {
      this.checkForChanges()
    })

    // Observe changes to document.documentElement.style
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: false
    })

    // Also poll computed styles periodically (for changes not caught by MutationObserver)
    this.startPolling()
    
    // Listen for palette family changes and deletions
    this.paletteFamilyChangedHandler = this.handlePaletteFamilyChanged.bind(this) as any
    this.paletteDeletedHandler = this.handlePaletteDeleted.bind(this) as any
    window.addEventListener('paletteFamilyChanged', this.paletteFamilyChangedHandler)
    window.addEventListener('paletteDeleted', this.paletteDeletedHandler)
  }
  
  private handlePaletteDeleted(ev: CustomEvent) {
    const detail = ev.detail
    if (!detail || !detail.key) return
    
    const paletteKey = detail.key
    // Find layers that reference this palette
    const affectedLayers = this.findLayersUsingPalette(paletteKey)
    
    // Only update if the deleted palette was being used
    if (affectedLayers.length > 0) {
      affectedLayers.forEach(({ type, key }) => {
        if (type === 'regular') {
          this.updateLayerElementColors(key)
        } else {
          this.updateAlternativeLayerElementColors(key)
        }
      })
    }
  }
  
  private handlePaletteFamilyChanged(ev: CustomEvent) {
    const detail = ev.detail
    if (!detail || !detail.key) return
    
    const paletteKey = detail.key
    // Find layers that reference this palette
    const affectedLayers = this.findLayersUsingPalette(paletteKey)
    
    // Update only affected layers
    affectedLayers.forEach(({ type, key }) => {
      if (type === 'regular') {
        this.updateLayerElementColors(key)
      } else {
        this.updateAlternativeLayerElementColors(key)
      }
    })
  }
  
  /**
   * Finds which layers (0-3 and alt) reference a given palette key
   */
  private findLayersUsingPalette(paletteKey: string): Array<{ type: 'regular' | 'alt'; key: number | string }> {
    const affected: Array<{ type: 'regular' | 'alt'; key: number | string }> = []
    
    // Check regular layers 0-3
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceVar = `--recursica-brand-light-layer-layer-${layer}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      
      if (surfaceValue && surfaceValue.includes(`palettes-${paletteKey}`)) {
        affected.push({ type: 'regular', key: layer })
      }
    }
    
    // Check alternative layers
    const altLayers = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
    for (const altKey of altLayers) {
      const surfaceVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      
      if (surfaceValue && surfaceValue.includes(`palettes-${paletteKey}`)) {
        affected.push({ type: 'alt', key: altKey })
      }
    }
    
    return affected
  }

  private startPolling() {
    // Poll every 100ms to catch changes
    const poll = () => {
      this.checkForChanges()
      this.checkTimeout = window.setTimeout(poll, 100)
    }
    poll()
  }

  private checkForChanges() {
    // Debounce rapid changes
    if (this.checkTimeout !== null) {
      clearTimeout(this.checkTimeout)
    }
    this.checkTimeout = window.setTimeout(() => {
      this.performChecks()
    }, 50)
  }

  private performChecks() {
    // Check palette on-tone vars
    this.checkPaletteOnToneVars()
    
    // Check layer element colors
    this.checkLayerElementColors()
    
    // Check core colors and update alternative layers
    this.checkCoreColors()
  }

  /**
   * Watch a palette tone variable and update its on-tone when it changes
   */
  watchPaletteOnTone(paletteKey: string, level: string, mode: 'light' | 'dark' = 'light') {
    const toneVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-on-tone`
    
    this.watchedVars.add(toneVar)
    this.watchedVars.add(onToneVar)
    
    // Initial check
    this.updatePaletteOnTone(paletteKey, level, mode)
  }

  private checkPaletteOnToneVars() {
    // Check all watched palette tone vars
    for (const varName of this.watchedVars) {
      if (varName.includes('-tone') && !varName.includes('-on-tone')) {
        const match = varName.match(/--recursica-brand-(light|dark)-palettes-([a-z0-9-]+)-(\d+|primary)-tone/)
        if (match) {
          const [, mode, paletteKey, level] = match
          const currentValue = readCssVar(varName)
          const lastValue = this.lastValues.get(varName)
          
          if (currentValue !== lastValue) {
            this.lastValues.set(varName, currentValue)
            this.updatePaletteOnTone(paletteKey, level, mode as 'light' | 'dark')
          }
        }
      }
    }
  }

  private updatePaletteOnTone(paletteKey: string, level: string, mode: 'light' | 'dark') {
    const toneVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-on-tone`
    
    const toneValue = readCssVar(toneVar)
    
    if (!toneValue) return
    
    const toneHex = resolveCssVarToHex(toneValue, this.tokenIndex)
    if (!toneHex) return
    
    // Use pickAAOnTone logic with strict AA compliance
    const black = '#000000'
    const white = '#ffffff'
    const cBlack = contrastRatio(toneHex, black)
    const cWhite = contrastRatio(toneHex, white)
    const AA = 4.5
    
    let chosen: 'black' | 'white'
    // Strict: both must meet AA, prefer higher contrast
    if (cBlack >= AA && cWhite >= AA) {
      chosen = cBlack >= cWhite ? 'black' : 'white'
    } else if (cBlack >= AA) {
      chosen = 'black'
    } else if (cWhite >= AA) {
      chosen = 'white'
    } else {
      // Neither meets AA - this is a problem, but choose the better one
      // Log a warning that the tone color itself may need adjustment
      console.warn(`[AA Compliance] Palette ${paletteKey}-${level}: Neither black nor white meets AA contrast (black: ${cBlack.toFixed(2)}, white: ${cWhite.toFixed(2)}). Tone color may need adjustment.`)
      chosen = cBlack >= cWhite ? 'black' : 'white'
    }
    
    const onToneValue = chosen === 'white'
      ? `var(--recursica-brand-${mode}-palettes-core-white)`
      : `var(--recursica-brand-${mode}-palettes-core-black)`
    
    updateCssVar(onToneVar, onToneValue)
  }

  /**
   * Watch a layer's surface color and update its element colors when it changes
   */
  watchLayerSurface(layerNumber: number) {
    const surfaceVar = `--recursica-brand-light-layer-layer-${layerNumber}-property-surface`
    this.watchedVars.add(surfaceVar)
    
    // Initialize last value to track changes
    const currentValue = readCssVar(surfaceVar)
    if (currentValue) {
      this.lastValues.set(surfaceVar, currentValue)
    }
    
    // Initial check
    this.updateLayerElementColors(layerNumber)
  }

  /**
   * Watch an alternative layer's surface color
   */
  watchAlternativeLayerSurface(alternativeKey: string) {
    const surfaceVar = `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-surface`
    this.watchedVars.add(surfaceVar)
    
    // Initialize last value to track changes
    const currentValue = readCssVar(surfaceVar)
    if (currentValue) {
      this.lastValues.set(surfaceVar, currentValue)
    }
    
    // Initial check
    this.updateAlternativeLayerElementColors(alternativeKey)
  }

  /**
   * Watch core colors (alert, warning, success, interactive) and update alternative layers when they change
   */
  watchCoreColors() {
    const coreColors = ['alert', 'warning', 'success', 'interactive']
    coreColors.forEach((colorName) => {
      const coreColorVar = `--recursica-brand-light-palettes-core-${colorName}`
      this.watchedVars.add(coreColorVar)
    })
  }

  private checkCoreColors() {
    const coreColors = ['alert', 'warning', 'success', 'interactive']
    
    coreColors.forEach((colorName) => {
      const coreColorVar = `--recursica-brand-light-palettes-core-${colorName}`
      const currentValue = readCssVar(coreColorVar)
      const lastValue = this.lastValues.get(coreColorVar)
      
      if (currentValue !== lastValue) {
        this.lastValues.set(coreColorVar, currentValue)
        
        // Core color changes affect ALL layers (0-3 and alt)
        this.updateAllLayers()
      }
    })
  }

  private checkLayerElementColors() {
    // Check all watched layer surface vars
    for (const varName of this.watchedVars) {
      if (varName.includes('-property-surface')) {
        const currentValue = readCssVar(varName)
        const lastValue = this.lastValues.get(varName)
        
        // If no last value, initialize it and run update (for initial setup)
        // If value changed, update
        if (lastValue === undefined || currentValue !== lastValue) {
          if (currentValue) {
            this.lastValues.set(varName, currentValue)
          }
          
          // Determine if it's a regular layer or alternative layer
          const layerMatch = varName.match(/--recursica-brand-light-layer-layer-(\d+)-property-surface/)
          const altMatch = varName.match(/--recursica-brand-light-layer-layer-alternative-([a-z-]+)-property-surface/)
          
          if (layerMatch) {
            const layerNumber = parseInt(layerMatch[1], 10)
            this.updateLayerElementColors(layerNumber)
          } else if (altMatch) {
            const alternativeKey = altMatch[1]
            this.updateAlternativeLayerElementColors(alternativeKey)
          }
        }
      }
    }
  }

  private updateLayerElementColors(layerNumber: number) {
    const surfaceCssVar = `--recursica-brand-light-layer-layer-${layerNumber}-property-surface`
    const surfaceValue = readCssVar(surfaceCssVar)
    
    if (!surfaceValue) return
    
    const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
    if (!surfaceHex) return
    
    const brandBase = `--recursica-brand-light-layer-layer-${layerNumber}-property-`
    
    // Update each element type
    const elements = [
      {
        name: 'text-color',
        colorVar: `${brandBase}element-text-color`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: null
      },
      {
        name: 'interactive-tone',
        colorVar: `${brandBase}element-interactive-tone`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-tone-hover',
        colorVar: `${brandBase}element-interactive-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-on-tone',
        colorVar: `${brandBase}element-interactive-on-tone`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-on-tone-hover',
        colorVar: `${brandBase}element-interactive-on-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      // Legacy support: keep old 'interactive-color' for backward compatibility
      {
        name: 'interactive-color',
        colorVar: `${brandBase}element-interactive-color`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'alert',
        colorVar: `${brandBase}element-text-alert`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef('alert', this.theme)
      },
      {
        name: 'warning',
        colorVar: `${brandBase}element-text-warning`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef('warning', this.theme)
      },
      {
        name: 'success',
        colorVar: `${brandBase}element-text-success`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef('success', this.theme)
      }
    ]
    
    elements.forEach((element) => {
      this.updateElementColor(element.name, surfaceHex, element.colorVar, element.opacityVar, element.coreToken)
    })
  }

  private updateAlternativeLayerElementColors(alternativeKey: string) {
    const surfaceCssVar = `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-surface`
    const surfaceValue = readCssVar(surfaceCssVar)
    
    if (!surfaceValue) return
    
    const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
    if (!surfaceHex) return
    
    const brandBase = `--recursica-brand-light-layer-layer-alternative-${alternativeKey}-property-`
    
    // Update each element type (same as regular layers)
    const elements = [
      {
        name: 'text-color',
        colorVar: `${brandBase}element-text-color`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: null
      },
      {
        name: 'interactive-tone',
        colorVar: `${brandBase}element-interactive-tone`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-tone-hover',
        colorVar: `${brandBase}element-interactive-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-on-tone',
        colorVar: `${brandBase}element-interactive-on-tone`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      {
        name: 'interactive-on-tone-hover',
        colorVar: `${brandBase}element-interactive-on-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      },
      // Legacy support: keep old 'interactive-color' for backward compatibility
      {
        name: 'interactive-color',
        colorVar: `${brandBase}element-interactive-color`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme)
      }
    ]
    
    // Only add status colors for status alternative layers (alert, warning, success)
    if (alternativeKey === 'alert' || alternativeKey === 'warning' || alternativeKey === 'success') {
      elements.push({
        name: alternativeKey,
        colorVar: `${brandBase}element-text-${alternativeKey}`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef(alternativeKey, this.theme)
      })
    }
    
    elements.forEach((element) => {
      this.updateElementColor(element.name, surfaceHex, element.colorVar, element.opacityVar, element.coreToken)
    })
  }

  private updateElementColor(
    elementName: string,
    surfaceHex: string,
    currentColorCssVar: string,
    opacityCssVar: string,
    coreToken: { family: string; level: string } | null
  ): void {
    const opacityValue = readCssVar(opacityCssVar)
    const opacity = getOpacityValue(opacityValue, this.tokenIndex)
    
    if (elementName === 'text-color') {
      const aaCompliantColor = findAaCompliantColor(surfaceHex, null, opacity, this.tokens)
      if (aaCompliantColor) {
        updateCssVar(currentColorCssVar, aaCompliantColor, this.tokens)
      }
      return
    } else if (elementName === 'interactive-tone') {
      // Use stepping logic for interactive tone colors (background)
      const coreInteractiveVar = 'var(--recursica-brand-light-palettes-core-interactive-default-tone)'
      const coreInteractiveHex = resolveCssVarToHex(coreInteractiveVar, this.tokenIndex) || 
                                  resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive)', this.tokenIndex)
      
      if (coreInteractiveHex) {
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(coreInteractiveHex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      }
      return
    } else if (elementName === 'interactive-tone-hover') {
      // Use stepping logic for interactive tone hover colors (background hover)
      const coreInteractiveVar = 'var(--recursica-brand-light-palettes-core-interactive-hover-tone)'
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
      const interactiveToneVar = currentColorCssVar.replace('element-interactive-on-tone', 'element-interactive-tone')
      const interactiveToneValue = readCssVar(interactiveToneVar)
      const interactiveToneHex = interactiveToneValue 
        ? resolveCssVarToHex(interactiveToneValue, this.tokenIndex)
        : resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive-default-tone)', this.tokenIndex)
      
      if (interactiveToneHex) {
        // Text should contrast with the interactive tone, not the surface
        const coreOnToneVar = 'var(--recursica-brand-light-palettes-core-interactive-default-on-tone)'
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
      const interactiveToneHoverVar = currentColorCssVar.replace('element-interactive-on-tone-hover', 'element-interactive-tone-hover')
      const interactiveToneHoverValue = readCssVar(interactiveToneHoverVar)
      const interactiveToneHoverHex = interactiveToneHoverValue
        ? resolveCssVarToHex(interactiveToneHoverValue, this.tokenIndex)
        : resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive-hover-tone)', this.tokenIndex)
      
      if (interactiveToneHoverHex) {
        // Text should contrast with the interactive hover tone, not the surface
        const coreOnToneVar = 'var(--recursica-brand-light-palettes-core-interactive-hover-on-tone)'
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
      const coreInteractiveVar = 'var(--recursica-brand-light-palettes-core-interactive-default-tone)'
      const coreInteractiveHex = resolveCssVarToHex(coreInteractiveVar, this.tokenIndex) || 
                                  resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive)', this.tokenIndex)
      
      if (coreInteractiveHex) {
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(coreInteractiveHex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      }
      return
    }
    
    // For status colors (alert, warning, success), use stepping logic like interactive colors
    if (coreToken) {
      // Get the core color hex from the token index
      const normalizedLevel = coreToken.level === '000' ? '050' : coreToken.level
      const coreColorHex = this.tokenIndex.get(`color/${coreToken.family}/${normalizedLevel}`)
      
      if (typeof coreColorHex === 'string') {
        const hex = coreColorHex.startsWith('#') ? coreColorHex.toLowerCase() : `#${coreColorHex.toLowerCase()}`
        // Step until AA compliant
        const steppedHex = stepUntilAACompliant(hex, surfaceHex, 'darker', this.tokens)
        const cssVarRef = hexToCssVarRef(steppedHex, this.tokens)
        updateCssVar(currentColorCssVar, cssVarRef, this.tokens)
      } else {
        // Fallback to findAaCompliantColor if token not found
        const aaCompliantColor = findAaCompliantColor(surfaceHex, coreToken, opacity, this.tokens)
        if (aaCompliantColor) {
          updateCssVar(currentColorCssVar, aaCompliantColor, this.tokens)
        }
      }
    }
  }

  /**
   * Update tokens and theme (call when they change)
   */
  updateTokensAndTheme(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
    // Re-check all watched vars
    this.performChecks()
  }

  /**
   * Update all layers (0-3 and alt) - used when core colors change
   */
  updateAllLayers() {
    // Update regular layers 0-3
    for (let layer = 0; layer <= 3; layer++) {
      this.updateLayerElementColors(layer)
    }
    
    // Update alternative layers
    const alternativeLayers = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
    alternativeLayers.forEach((layerKey) => {
      this.updateAlternativeLayerElementColors(layerKey)
    })
  }

  /**
   * Force AA compliance check for all alternative layers (call after reset)
   */
  checkAllAlternativeLayers() {
    this.updateAllLayers()
  }

  /**
   * Validate all color combinations for AA compliance on startup
   */
  validateAllCompliance(): void {
    const issues: Array<{ type: string; message: string; severity: 'error' | 'warning' }> = []
    const AA = 4.5
    
    // Validate all layer element colors
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceVar = `--recursica-brand-light-layer-layer-${layer}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      
      if (!surfaceValue) continue
      
      const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
      if (!surfaceHex) continue
      
      const brandBase = `--recursica-brand-light-layer-layer-${layer}-property-`
      
      // Check text color
      const textColorVar = `${brandBase}element-text-color`
      const textColorValue = readCssVar(textColorVar)
      if (textColorValue) {
        const textColorHex = resolveCssVarToHex(textColorValue, this.tokenIndex)
        if (textColorHex) {
          const ratio = contrastRatio(surfaceHex, textColorHex)
          if (ratio < AA) {
            issues.push({
              type: 'layer-text',
              message: `Layer ${layer}: Text color contrast ratio ${ratio.toFixed(2)} < ${AA}`,
              severity: 'error'
            })
          }
        }
      }
      
      // Check interactive colors
      // Check interactive-tone and interactive-color against surface
      const interactiveToneVar = `${brandBase}element-interactive-tone`
      const interactiveColorVar = `${brandBase}element-interactive-color`
      
      const interactiveToneValue = readCssVar(interactiveToneVar)
      const interactiveColorValue = readCssVar(interactiveColorVar)
      
      if (interactiveToneValue) {
        const interactiveToneHex = resolveCssVarToHex(interactiveToneValue, this.tokenIndex)
        if (interactiveToneHex) {
          const ratio = contrastRatio(surfaceHex, interactiveToneHex)
          if (ratio < AA) {
            issues.push({
              type: 'layer-interactive',
              message: `Layer ${layer}: Interactive color contrast ratio ${ratio.toFixed(2)} < ${AA} for ${interactiveToneVar}`,
              severity: 'error'
            })
          }
        }
      }
      
      if (interactiveColorValue) {
        const interactiveColorHex = resolveCssVarToHex(interactiveColorValue, this.tokenIndex)
        if (interactiveColorHex) {
          const ratio = contrastRatio(surfaceHex, interactiveColorHex)
          if (ratio < AA) {
            issues.push({
              type: 'layer-interactive',
              message: `Layer ${layer}: Interactive color contrast ratio ${ratio.toFixed(2)} < ${AA} for ${interactiveColorVar}`,
              severity: 'error'
            })
          }
        }
      }
      
      // Check interactive-on-tone against interactive-tone (not surface)
      const interactiveOnToneVar = `${brandBase}element-interactive-on-tone`
      const interactiveOnToneValue = readCssVar(interactiveOnToneVar)
      if (interactiveOnToneValue && interactiveToneValue) {
        const interactiveOnToneHex = resolveCssVarToHex(interactiveOnToneValue, this.tokenIndex)
        const interactiveToneHex = resolveCssVarToHex(interactiveToneValue, this.tokenIndex)
        if (interactiveOnToneHex && interactiveToneHex) {
          const ratio = contrastRatio(interactiveToneHex, interactiveOnToneHex)
          if (ratio < AA) {
            issues.push({
              type: 'layer-interactive',
              message: `Layer ${layer}: Interactive on-tone contrast ratio ${ratio.toFixed(2)} < ${AA} for ${interactiveOnToneVar}`,
              severity: 'error'
            })
          }
        }
      }
    }
    
    // Validate alternative layers
    const altLayers = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
    altLayers.forEach((altKey) => {
      const surfaceVar = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-surface`
      const surfaceValue = readCssVar(surfaceVar)
      
      if (!surfaceValue) return
      
      const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
      if (!surfaceHex) return
      
      const brandBase = `--recursica-brand-light-layer-layer-alternative-${altKey}-property-`
      
      // Check text color
      const textColorVar = `${brandBase}element-text-color`
      const textColorValue = readCssVar(textColorVar)
      if (textColorValue) {
        const textColorHex = resolveCssVarToHex(textColorValue, this.tokenIndex)
        if (textColorHex) {
          const ratio = contrastRatio(surfaceHex, textColorHex)
          if (ratio < AA) {
            issues.push({
              type: 'alt-layer-text',
              message: `Alternative layer ${altKey}: Text color contrast ratio ${ratio.toFixed(2)} < ${AA}`,
              severity: 'error'
            })
          }
        }
      }
      
      // Check interactive colors
      const interactiveVar = `${brandBase}element-interactive-color`
      const interactiveValue = readCssVar(interactiveVar)
      if (interactiveValue) {
        const interactiveHex = resolveCssVarToHex(interactiveValue, this.tokenIndex)
        if (interactiveHex) {
          const ratio = contrastRatio(surfaceHex, interactiveHex)
          if (ratio < AA) {
            issues.push({
              type: 'alt-layer-interactive',
              message: `Alternative layer ${altKey}: Interactive color contrast ratio ${ratio.toFixed(2)} < ${AA}`,
              severity: 'error'
            })
          }
        }
      }
    })
    
    // Validate palette on-tone combinations
    try {
      const root: any = (this.theme as any)?.brand ? (this.theme as any).brand : this.theme
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || {}
      const levels = ['900', '800', '700', '600', '500', '400', '300', '200', '100', '050']
      
      Object.keys(lightPal).forEach((paletteKey) => {
        if (paletteKey === 'core' || paletteKey === 'core-colors' || paletteKey === 'neutral') return
        
        levels.forEach((level) => {
          const toneVar = `--recursica-brand-light-palettes-${paletteKey}-${level}-tone`
          const onToneVar = `--recursica-brand-light-palettes-${paletteKey}-${level}-on-tone`
          
          const toneValue = readCssVar(toneVar)
          const onToneValue = readCssVar(onToneVar)
          
          if (toneValue && onToneValue) {
            const toneHex = resolveCssVarToHex(toneValue, this.tokenIndex)
            const onToneHex = resolveCssVarToHex(onToneValue, this.tokenIndex)
            
            if (toneHex && onToneHex) {
              const ratio = contrastRatio(toneHex, onToneHex)
              if (ratio < AA) {
                issues.push({
                  type: 'palette-on-tone',
                  message: `Palette ${paletteKey}-${level}: On-tone contrast ratio ${ratio.toFixed(2)} < ${AA}`,
                  severity: 'error'
                })
              }
            }
          }
        })
      })
    } catch (err) {
      // Silently fail palette validation if structure is unexpected
    }
    
    // Log issues
    if (issues.length > 0) {
      const errors = issues.filter(i => i.severity === 'error')
      const warnings = issues.filter(i => i.severity === 'warning')
      
      if (errors.length > 0) {
        console.error(`[AA Compliance] Found ${errors.length} AA compliance errors:`, errors)
      }
      if (warnings.length > 0) {
        console.warn(`[AA Compliance] Found ${warnings.length} AA compliance warnings:`, warnings)
      }
      
      // Auto-fix errors by triggering updates (only if not already fixing to prevent loops)
      if (errors.length > 0 && !this.isFixing) {
        this.isFixing = true
        console.log('[AA Compliance] Attempting to auto-fix compliance issues...')
        this.updateAllLayers()
        // Re-check palette on-tones - proactively fix all palettes
        this.checkPaletteOnToneVars()
        // Also proactively update all palette on-tones to ensure they're correct
        try {
          const root: any = (this.theme as any)?.brand ? (this.theme as any).brand : this.theme
          const themes = root?.themes || root
          const lightPal: any = themes?.light?.palettes || {}
          const levels = ['900', '800', '700', '600', '500', '400', '300', '200', '100', '050']
          Object.keys(lightPal).forEach((paletteKey) => {
            if (paletteKey === 'core' || paletteKey === 'core-colors' || paletteKey === 'neutral') return
            levels.forEach((level) => {
              this.updatePaletteOnTone(paletteKey, level, 'light')
            })
          })
        } catch {}
        
        // Reset fixing flag after a delay to allow CSS vars to update
        setTimeout(() => {
          this.isFixing = false
        }, 500)
      }
    } else {
      console.log('[AA Compliance] All color combinations meet AA standards ✓')
    }
  }

  /**
   * Cleanup watcher
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.checkTimeout !== null) {
      clearTimeout(this.checkTimeout)
      this.checkTimeout = null
    }
    if (this.paletteFamilyChangedHandler) {
      window.removeEventListener('paletteFamilyChanged', this.paletteFamilyChangedHandler)
    }
    if (this.paletteDeletedHandler) {
      window.removeEventListener('paletteDeleted', this.paletteDeletedHandler)
    }
    this.watchedVars.clear()
    this.lastValues.clear()
  }
}

