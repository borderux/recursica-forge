import { buildTokenIndex, type TokenIndex } from '../resolvers/tokens'
import type { JsonLike } from '../resolvers/tokens'
import { findAaCompliantColor } from '../resolvers/colorSteppingForAa'
import { updateCssVar } from '../css/updateCssVar'
import { readCssVar } from '../css/readCssVar'
import { contrastRatio } from '../../modules/theme/contrastUtil'
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
  private tokenIndex: TokenIndex
  private tokens: JsonLike
  private theme: JsonLike
  private watchedVars: Set<string> = new Set()
  private observer: MutationObserver | null = null
  private checkTimeout: number | null = null
  private lastValues: Map<string, string> = new Map()
  private paletteFamilyChangedHandler: ((ev: CustomEvent) => void) | null = null
  private paletteDeletedHandler: ((ev: CustomEvent) => void) | null = null
  private isFixing: boolean = false
  private isUpdating: boolean = false // Prevent loops when AA compliance updates CSS vars
  private isDisabled: boolean = false // Allow temporary disabling (e.g., during randomization)

  constructor(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
    this.setupWatcher()
    // Don't run validation on init - let JSON values be set first
    // Only run checks when user makes explicit changes
  }

  /**
   * Get the current theme mode by checking which CSS variables are active
   * Checks for the presence of dark mode variables to determine current mode
   */
  private getCurrentMode(): 'light' | 'dark' {
    // Check if dark mode layer-0 surface exists and has a value
    const darkLayer0Surface = readCssVar('--recursica-brand-themes-dark-layer-layer-0-property-surface')
    const lightLayer0Surface = readCssVar('--recursica-brand-themes-light-layer-layer-0-property-surface')
    
    // If dark mode has a value, check if it's different from light (meaning dark mode is active)
    // For now, we'll check both modes, but typically the active mode will have non-empty values
    // A more reliable way would be to check a data attribute or use ThemeModeContext, but for now
    // we'll default to checking both modes when needed
    
    // Default to light if we can't determine, but methods should check both modes
    return 'light'
  }

  private setupWatcher() {
    // Guard against Node.js test environments where window may not exist
    if (typeof window === 'undefined') {
      return
    }
    
    // Don't watch DOM mutations - only respond to explicit user actions
    // Listen for palette family changes and deletions
    this.paletteFamilyChangedHandler = this.handlePaletteFamilyChanged.bind(this)
    this.paletteDeletedHandler = this.handlePaletteDeleted.bind(this)
    window.addEventListener('paletteFamilyChanged', this.paletteFamilyChangedHandler as EventListener)
    window.addEventListener('paletteDeleted', this.paletteDeletedHandler as EventListener)
    
    // Listen for explicit events that should trigger AA compliance checks
    // Only trigger on user-initiated changes, not automatic updates
    window.addEventListener('paletteVarsChanged', () => {
      if (!this.isUpdating) {
        this.checkForChanges()
      }
    })
    window.addEventListener('tokenOverridesChanged', () => {
      if (!this.isUpdating) {
        this.checkForChanges()
      }
    })
    
    // Listen for CSS variable updates - specifically check for surface color changes
    window.addEventListener('cssVarsUpdated', ((ev: CustomEvent) => {
      if (ev.detail?.cssVars) {
        // Check if any of the updated CSS vars are layer surface colors
        const surfaceVars = (ev.detail.cssVars as string[]).filter((varName: string) => 
          varName.includes('-property-surface')
        )
        if (surfaceVars.length > 0) {
          // Immediately update element colors for affected layers (even if isUpdating is true)
          // This ensures surface changes always trigger element color updates
          surfaceVars.forEach((varName: string) => {
            const layerMatch = varName.match(/--recursica-brand-themes-(light|dark)-layer-layer-(\d+)-property-surface/)
            if (layerMatch) {
              const mode = layerMatch[1] as 'light' | 'dark'
              const layerNumber = parseInt(layerMatch[2], 10)
              // Update last value to prevent duplicate updates
              const currentValue = readCssVar(varName)
              if (currentValue) {
                this.lastValues.set(varName, currentValue)
              }
              // Immediately update element colors for this layer
              // Use a small delay to ensure surface value is fully updated
              // Skip if disabled (e.g., during randomization)
              if (!this.isDisabled) {
                setTimeout(() => {
                  this.updateLayerElementColors(layerNumber, mode)
                }, 0)
              }
            }
          })
        } else if (!this.isUpdating) {
          // For non-surface changes, use the debounced check
          this.checkForChanges()
        }
      }
    }) as EventListener)
  }
  
  private handlePaletteDeleted(ev: CustomEvent) {
    const detail = ev.detail
    if (!detail || !detail.key) return
    
    const paletteKey = detail.key
    // Find layers that reference this palette
    const affectedLayers = this.findLayersUsingPalette(paletteKey)
    
    // Only update if the deleted palette was being used
    if (affectedLayers.length > 0) {
      affectedLayers.forEach(({ type, key, mode }) => {
        if (type === 'regular') {
          this.updateLayerElementColors(key as number, mode)
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
    affectedLayers.forEach(({ type, key, mode }) => {
      if (type === 'regular') {
        this.updateLayerElementColors(key as number, mode)
      }
    })
  }
  
  /**
   * Finds which layers (0-3) reference a given palette key
   * Checks both light and dark modes
   */
  private findLayersUsingPalette(paletteKey: string): Array<{ type: 'regular'; key: number; mode: 'light' | 'dark' }> {
    const affected: Array<{ type: 'regular'; key: number; mode: 'light' | 'dark' }> = []
    
    // Check regular layers 0-3 for both modes
    for (const mode of ['light', 'dark'] as const) {
      for (let layer = 0; layer <= 3; layer++) {
        const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${layer}-property-surface`
        const surfaceValue = readCssVar(surfaceVar)
        
        if (surfaceValue && surfaceValue.includes(`palettes-${paletteKey}`)) {
          affected.push({ type: 'regular', key: layer, mode })
        }
      }
    }
    
    return affected
  }

  private checkForChanges() {
    // Skip if disabled (e.g., during randomization)
    if (this.isDisabled) return
    // Debounce rapid changes - only check when actually triggered by events
    if (this.checkTimeout !== null) {
      clearTimeout(this.checkTimeout)
    }
    this.checkTimeout = window.setTimeout(() => {
      this.performChecks()
    }, 50)
  }

  /**
   * Temporarily disable the AA compliance watcher (e.g., during randomization)
   */
  public disable(): void {
    this.isDisabled = true
  }

  /**
   * Re-enable the AA compliance watcher
   */
  public enable(): void {
    this.isDisabled = false
  }

  private performChecks() {
    // Skip if disabled (e.g., during randomization)
    if (this.isDisabled) return
    // Prevent loops - if we're already updating, skip
    if (this.isUpdating) return
    
    this.isUpdating = true
    try {
      // Check palette on-tone vars
      this.checkPaletteOnToneVars()
      
      // Check layer element colors
      this.checkLayerElementColors()
      
      // Check core colors
      this.checkCoreColors()
      
      // Check component-level asterisk colors
      this.checkComponentAsteriskColors()
    } finally {
      // Reset flag after a short delay to allow CSS var updates to complete
      setTimeout(() => {
        this.isUpdating = false
      }, 100)
    }
  }

  /**
   * Watch a palette tone variable and update its on-tone when it changes
   */
  watchPaletteOnTone(paletteKey: string, level: string, mode: 'light' | 'dark' = 'light') {
    const toneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`
    
    this.watchedVars.add(toneVar)
    this.watchedVars.add(onToneVar)
    
    // Record initial value but don't update - let JSON values be set first
    const initialValue = readCssVar(toneVar)
    if (initialValue !== undefined) {
      this.lastValues.set(toneVar, initialValue)
    }
  }

  private checkPaletteOnToneVars() {
    // Only check watched palette tone vars that have actually changed (user action)
    // Don't update on initialization - let JSON values be set first
    for (const varName of this.watchedVars) {
      if (varName.includes('-tone') && !varName.includes('-on-tone')) {
        const match = varName.match(/--recursica-brand-themes-(light|dark)-palettes-([a-z0-9-]+)-(\d+|primary)-tone/)
        if (match) {
          const [, mode, paletteKey, level] = match
          const currentValue = readCssVar(varName)
          const lastValue = this.lastValues.get(varName)
          
          // Only update if the value actually changed (user action), not on first initialization
          if (currentValue !== lastValue && lastValue !== undefined && currentValue && paletteKey && level) {
            this.lastValues.set(varName, currentValue)
            this.updatePaletteOnTone(paletteKey, level, mode as 'light' | 'dark')
          } else if (lastValue === undefined && currentValue) {
            // First time seeing this var - just record it, don't update
            this.lastValues.set(varName, currentValue)
          }
        }
      }
    }
  }

  private updatePaletteOnTone(paletteKey: string, level: string, mode: 'light' | 'dark') {
    const toneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`
    
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
      ? `var(--recursica-brand-themes-${mode}-palettes-core-white)`
      : `var(--recursica-brand-themes-${mode}-palettes-core-black)`
    
    // Pass tokens to updateCssVar for validation
    updateCssVar(onToneVar, onToneValue, this.tokens)
  }

  /**
   * Watch a layer's surface color and update its element colors when it changes
   * Watches both light and dark modes
   */
  watchLayerSurface(layerNumber: number) {
    // Watch both light and dark modes
    for (const mode of ['light', 'dark'] as const) {
      // Use the correct format with "themes" in the path
      const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${layerNumber}-property-surface`
      this.watchedVars.add(surfaceVar)
      
      // Initialize last value to track changes
      const currentValue = readCssVar(surfaceVar)
      if (currentValue) {
        this.lastValues.set(surfaceVar, currentValue)
      }
      
      // Initial check
      this.updateLayerElementColors(layerNumber, mode)
    }
  }

  /**
   * Watch core colors (alert, warning, success, interactive)
   * Watches both light and dark modes
   */
  watchCoreColors() {
    const coreColors = ['alert', 'warning', 'success', 'interactive']
    // Watch both light and dark modes
    for (const mode of ['light', 'dark'] as const) {
      coreColors.forEach((colorName) => {
        const coreColorVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}`
        this.watchedVars.add(coreColorVar)
      })
    }
  }

  private checkCoreColors() {
    const coreColors = ['alert', 'warning', 'success', 'interactive']
    
    // Check both light and dark modes
    for (const mode of ['light', 'dark'] as const) {
      coreColors.forEach((colorName) => {
        const coreColorVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}`
        const currentValue = readCssVar(coreColorVar)
        const lastValue = this.lastValues.get(coreColorVar)
        
        if (currentValue !== lastValue && currentValue) {
          this.lastValues.set(coreColorVar, currentValue)
          
          // Core color changes affect ALL layers (0-3) for this mode
          this.updateAllLayers(mode)
          
          // If alert color changed, update component-level asterisk colors
          if (colorName === 'alert') {
            this.updateComponentAsteriskColors(mode)
          }
        }
      })
    }
  }
  
  /**
   * Check and update component-level asterisk colors for all layers
   * Called when user changes asterisk color or alert core color changes
   */
  private checkComponentAsteriskColors() {
    // Watch asterisk color for all layers (0-3) in both modes
    for (const mode of ['light', 'dark'] as const) {
      for (let layer = 0; layer <= 3; layer++) {
        const asteriskColorVar = `--recursica-ui-kit-components-label-properties-colors-layer-${layer}-asterisk`
        const currentValue = readCssVar(asteriskColorVar)
        const lastValue = this.lastValues.get(asteriskColorVar)
        
        // If user changed the asterisk color for any layer, update all layers
        if (currentValue !== lastValue && lastValue !== undefined && currentValue) {
          this.lastValues.set(asteriskColorVar, currentValue)
          // Update all layers to maintain consistency and AA compliance
          this.updateAllComponentAsteriskColors(mode, currentValue)
          break // Only update once per mode
        } else if (lastValue === undefined && currentValue) {
          // First time seeing this var - just record it
          this.lastValues.set(asteriskColorVar, currentValue)
        }
      }
    }
  }
  
  /**
   * Update all component-level asterisk colors (layers 0-3) based on a changed color
   * Steps through the palette to maintain AA compliance with each layer's background
   */
  private updateAllComponentAsteriskColors(mode: 'light' | 'dark', changedColorValue: string) {
    // Get the hex value of the changed color
    const changedColorHex = resolveCssVarToHex(changedColorValue, this.tokenIndex)
    if (!changedColorHex) return
    
    // Find the color family and level from the changed color
    const colorInfo = findColorFamilyAndLevel(changedColorHex, this.tokens)
    if (!colorInfo) return
    
    // Update asterisk color for each layer (0-3)
    for (let layer = 0; layer <= 3; layer++) {
      const surfaceCssVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-surface`
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
        // Record the new value
        this.lastValues.set(asteriskColorVar, cssVarRef)
      }
    }
  }
  
  /**
   * Update component-level asterisk colors for all layers (0-3)
   * Steps through the palette to maintain AA compliance with each layer's background
   */
  private updateComponentAsteriskColors(mode: 'light' | 'dark' = 'light') {
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
      const surfaceCssVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-surface`
      const surfaceValue = readCssVar(surfaceCssVar)
      
      if (!surfaceValue) continue
      
      const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
      if (!surfaceHex) continue
      
      // Get the component-level asterisk color CSS var
      const asteriskColorVar = `--recursica-ui-kit-components-label-properties-colors-layer-${layer}-asterisk`
      
      // Get opacity for text high emphasis
      const opacityVar = `--recursica-brand-${mode}-layer-layer-${layer}-property-element-text-high-emphasis`
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
          
          // Extract mode and layer number from var name
          // Pattern: --recursica-brand-themes-{mode}-layer-layer-{number}-property-surface
          const layerMatch = varName.match(/--recursica-brand-themes-(light|dark)-layer-layer-(\d+)-property-surface/)
          
          if (layerMatch) {
            const mode = layerMatch[1] as 'light' | 'dark'
            const layerNumber = parseInt(layerMatch[2], 10)
            this.updateLayerElementColors(layerNumber, mode)
          }
        }
      }
    }
  }

  private updateLayerElementColors(layerNumber: number, mode: 'light' | 'dark' = 'light') {
    // Use the correct format with "themes" in the path
    const surfaceCssVar = `--recursica-brand-themes-${mode}-layer-layer-${layerNumber}-property-surface`
    const surfaceValue = readCssVar(surfaceCssVar)
    
    if (!surfaceValue) return
    
    const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
    if (!surfaceHex) return
    
    const brandBase = `--recursica-brand-themes-${mode}-layer-layer-${layerNumber}-property-`
    
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
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-tone-hover',
        colorVar: `${brandBase}element-interactive-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-on-tone',
        colorVar: `${brandBase}element-interactive-on-tone`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'interactive-on-tone-hover',
        colorVar: `${brandBase}element-interactive-on-tone-hover`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      // Legacy support: keep old 'interactive-color' for backward compatibility
      {
        name: 'interactive-color',
        colorVar: `${brandBase}element-interactive-color`,
        opacityVar: `${brandBase}element-interactive-high-emphasis`,
        coreToken: parseCoreTokenRef('interactive', this.theme, mode)
      },
      {
        name: 'alert',
        colorVar: `${brandBase}element-text-alert`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef('alert', this.theme, mode)
      },
      {
        name: 'warning',
        colorVar: `${brandBase}element-text-warning`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
        coreToken: parseCoreTokenRef('warning', this.theme, mode)
      },
      {
        name: 'success',
        colorVar: `${brandBase}element-text-success`,
        opacityVar: `${brandBase}element-text-high-emphasis`,
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
      const interactiveToneVar = currentColorCssVar.replace('element-interactive-on-tone', 'element-interactive-tone')
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
      const interactiveToneHoverVar = currentColorCssVar.replace('element-interactive-on-tone-hover', 'element-interactive-tone-hover')
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
   */
  updateTokensAndTheme(tokens: JsonLike, theme: JsonLike) {
    this.tokens = tokens
    this.theme = theme
    this.tokenIndex = buildTokenIndex(tokens)
    // Re-check all watched vars
    this.performChecks()
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
      const levels = ['1000','900','800','700','600','500','400','300','200','100','050','000']
      
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

  /**
   * Validate all color combinations for AA compliance on startup
   */
  validateAllCompliance(): void {
    const issues: Array<{ type: string; message: string; severity: 'error' | 'warning' }> = []
    const AA = 4.5
    
    // Validate all layer element colors for both light and dark modes
    for (const mode of ['light', 'dark'] as const) {
      for (let layer = 0; layer <= 3; layer++) {
        const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${layer}-property-surface`
        const surfaceValue = readCssVar(surfaceVar)
        
        if (!surfaceValue) continue
        
        const surfaceHex = resolveCssVarToHex(surfaceValue, this.tokenIndex)
        if (!surfaceHex) continue
        
        const brandBase = `--recursica-brand-${mode}-layer-layer-${layer}-property-`
        
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
                message: `Layer ${layer} (${mode}): Text color contrast ratio ${ratio.toFixed(2)} < ${AA}`,
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
                message: `Layer ${layer} (${mode}): Interactive color contrast ratio ${ratio.toFixed(2)} < ${AA} for ${interactiveToneVar}`,
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
                message: `Layer ${layer} (${mode}): Interactive color contrast ratio ${ratio.toFixed(2)} < ${AA} for ${interactiveColorVar}`,
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
                message: `Layer ${layer} (${mode}): Interactive on-tone contrast ratio ${ratio.toFixed(2)} < ${AA}`,
                severity: 'error'
              })
            }
          }
        }
      }
    }
    
    // Validate palette on-tone combinations
    try {
      const root: any = (this.theme as any)?.brand ? (this.theme as any).brand : this.theme
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || {}
      // Include all standard levels including 1000 and 000
      const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      
      Object.keys(lightPal).forEach((paletteKey) => {
        if (paletteKey === 'core' || paletteKey === 'core-colors' || paletteKey === 'neutral') return
        
        levels.forEach((level) => {
          const toneVar = `--recursica-brand-themes-light-palettes-${paletteKey}-${level}-tone`
          const onToneVar = `--recursica-brand-themes-light-palettes-${paletteKey}-${level}-on-tone`
          
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
      // Only fix when there are actual user changes, not on initialization
      if (errors.length > 0 && !this.isFixing) {
        this.isFixing = true
        this.updateAllLayers()
        // Only check palette on-tones for watched vars that actually changed
        // Don't proactively update all palettes - let JSON values be set first
        this.checkPaletteOnToneVars()
        
        // Reset fixing flag after a delay to allow CSS vars to update
        setTimeout(() => {
          this.isFixing = false
        }, 500)
      }
    }
  }

  /**
   * Cleanup watcher
   */
  destroy() {
    if (this.checkTimeout !== null) {
      clearTimeout(this.checkTimeout)
      this.checkTimeout = null
    }
    // Guard against Node.js test environments where window may not exist
    if (typeof window !== 'undefined') {
      if (this.paletteFamilyChangedHandler) {
        window.removeEventListener('paletteFamilyChanged', this.paletteFamilyChangedHandler as EventListener)
      }
      if (this.paletteDeletedHandler) {
        window.removeEventListener('paletteDeleted', this.paletteDeletedHandler as EventListener)
      }
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.watchedVars.clear()
    this.lastValues.clear()
  }
}

