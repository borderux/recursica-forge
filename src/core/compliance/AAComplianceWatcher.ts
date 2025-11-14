import { buildTokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { findAaCompliantColor } from '../resolvers/colorSteppingForAa'
import { contrastRatio } from '../../modules/theme/contrastUtil'
import { updateCssVar } from '../css/updateCssVar'
import { readCssVar } from '../css/readCssVar'

// Helper to resolve CSS var to hex (recursively)
function resolveCssVarToHex(cssVar: string, tokenIndex: Map<string, any>, depth = 0): string | null {
  if (depth > 10) return null
  try {
    const trimmed = cssVar.trim()
    if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
      const h = trimmed.toLowerCase()
      return h.startsWith('#') ? h : `#${h}`
    }
    
    const varMatch = trimmed.match(/var\s*\(\s*(--[^)]+)\s*\)/)
    if (varMatch) {
      const varName = varMatch[1]
      const value = readCssVar(varName)
      if (value) {
        return resolveCssVarToHex(value, tokenIndex, depth + 1)
      }
    }
    
    const tokenMatch = trimmed.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
    if (tokenMatch) {
      const [, family, level] = tokenMatch
      const normalizedLevel = level === '000' ? '050' : level
      const hex = tokenIndex.get(`color/${family}/${normalizedLevel}`)
      if (typeof hex === 'string') {
        const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
        return h
      }
    }
    
    const paletteMatch = trimmed.match(/--recursica-brand-light-palettes-([a-z0-9-]+)-(\d+|primary)-(tone|on-tone)/)
    if (paletteMatch) {
      const [, paletteKey, level, type] = paletteMatch
      const paletteVarName = `--recursica-brand-light-palettes-${paletteKey}-${level}-${type}`
      const paletteValue = readCssVar(paletteVarName)
      if (paletteValue) {
        return resolveCssVarToHex(paletteValue, tokenIndex, depth + 1)
      }
    }
  } catch {}
  return null
}

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
    const core: any =
      root?.light?.palettes?.['core']?.['$value'] || root?.light?.palettes?.['core'] ||
      root?.light?.palettes?.['core-colors']?.['$value'] || root?.light?.palettes?.['core-colors'] || root?.light?.palettes?.core?.['$value'] || root?.light?.palettes?.core || {}
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

  constructor(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
    this.setupWatcher()
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
    
    // Use pickAAOnTone logic
    const black = '#000000'
    const white = '#ffffff'
    const cBlack = contrastRatio(toneHex, black)
    const cWhite = contrastRatio(toneHex, white)
    const AA = 4.5
    
    let chosen: 'black' | 'white'
    if (cBlack >= AA && cWhite >= AA) {
      chosen = cBlack >= cWhite ? 'black' : 'white'
    } else if (cBlack >= AA) {
      chosen = 'black'
    } else if (cWhite >= AA) {
      chosen = 'white'
    } else {
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
    const alternativeLayers = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
    
    coreColors.forEach((colorName) => {
      const coreColorVar = `--recursica-brand-light-palettes-core-${colorName}`
      const currentValue = readCssVar(coreColorVar)
      const lastValue = this.lastValues.get(coreColorVar)
      
      if (currentValue !== lastValue) {
        this.lastValues.set(coreColorVar, currentValue)
        
        // Determine which alternative layers need to be updated
        const layersToUpdate = new Set<string>()
        
        if (colorName === 'alert' || colorName === 'warning' || colorName === 'success') {
          // Status colors affect their corresponding alternative layer
          // (surface color changes, and status text elements may need re-evaluation)
          layersToUpdate.add(colorName)
        }
        
        if (colorName === 'interactive') {
          // Interactive color affects all alternative layers (for interactive elements)
          alternativeLayers.forEach((layer) => layersToUpdate.add(layer))
        }
        
        // Update all affected alternative layers
        layersToUpdate.forEach((layerKey) => {
          this.updateAlternativeLayerElementColors(layerKey)
        })
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
    } else if (elementName === 'interactive-color') {
      const coreInteractiveHex = resolveCssVarToHex('var(--recursica-brand-light-palettes-core-interactive)', this.tokenIndex)
      if (coreInteractiveHex) {
        const finalColorHex = blendHexOverBg(coreInteractiveHex, surfaceHex, opacity) || coreInteractiveHex
        const contrast = contrastRatio(surfaceHex, finalColorHex)
        if (contrast >= 4.5) {
          updateCssVar(currentColorCssVar, 'var(--recursica-brand-light-palettes-core-interactive)')
          return
        }
      }
    }
    
    if (coreToken) {
      const aaCompliantColor = findAaCompliantColor(surfaceHex, coreToken, opacity, this.tokens)
      if (aaCompliantColor) {
        updateCssVar(currentColorCssVar, aaCompliantColor, this.tokens)
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
   * Force AA compliance check for all alternative layers (call after reset)
   */
  checkAllAlternativeLayers() {
    const alternativeLayers = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
    alternativeLayers.forEach((layerKey) => {
      this.updateAlternativeLayerElementColors(layerKey)
    })
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
    this.watchedVars.clear()
    this.lastValues.clear()
  }
}

