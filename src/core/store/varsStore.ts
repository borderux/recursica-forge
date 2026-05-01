import type { JsonLike } from '../resolvers/tokens'
import { tokenColors, tokenColor, tokenColorFamilyName, tokenOpacity, tokenFont, tokenSize, token, unwrapVar } from '../css/cssVarBuilder'
import { buildTokenIndex } from '../resolvers/tokens'
import { buildPaletteVars } from '../resolvers/palettes'
import { buildLayerVars } from '../resolvers/layers'
import { buildTypographyVars, type TypographyChoices } from '../resolvers/typography'
import { buildUIKitVars } from '../resolvers/uikit'
import { buildDimensionVars } from '../resolvers/dimensions'
import { applyCssVars, type CssVarMap, clearAllCssVars } from '../css/apply'
import { updateScopedCss, setThemeAttribute } from '../css/scopedCssEngine'
import { findTokenByHex, tokenToCssVar } from '../css/tokenRefs'
import { suppressCssVarEvents, clearPendingCssVars, updateCssVars } from '../css/updateCssVar'
import { computeBundleVersion } from './versioning'
import { readCssVar, readCssVarResolved } from '../css/readCssVar'
import { resolveTokenReferenceToCssVar, parseTokenReference, extractBraceContent, type TokenReferenceContext } from '../utils/tokenReferenceParser'
import { AAComplianceWatcher } from '../compliance/AAComplianceWatcher'
import { updateCoreColorOnTonesForCompliance, updateCoreColorInteractiveOnToneForCompliance } from '../compliance/coreColorAaCompliance'
import { resolveCssVarToHex } from '../compliance/layerColorStepping'
import { clearElevationColorMirror } from '../elevation/elevationModeScope'
import { getComplianceService } from '../compliance/ComplianceService'
import { clearStoredFonts, saveStoredFonts, getDefaultFonts, deriveFontsFromJson, populateWindowFontUrlMap } from './fontStore'
import { buildStructuralMetadata, type StructuralMetadata } from './structuralMetadata'
import { clearGlobalRefPreference } from '../css/globalRefInterceptor'

import tokensImport from '../../../recursica_tokens.json'
import themeImport from '../../../recursica_brand.json'
import uikitImport from '../../../recursica_ui-kit.json'
// Note: Override system removed - tokens are now the single source of truth

type PaletteStore = {
  opacity: Record<'disabled' | 'overlay' | 'text-high' | 'text-low', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ElevationControl = { blur: number; spread: number; offsetX: number; offsetY: number; opacity: number }
export type ElevationState = {
  controls: Record<'light' | 'dark', Record<string, ElevationControl>>
  colorTokens: Record<string, string>
  alphaTokens: Record<'light' | 'dark', Record<string, string>>
  blurTokens: Record<string, string>
  spreadTokens: Record<string, string>
  offsetXTokens: Record<string, string>
  offsetYTokens: Record<string, string>
  paletteSelections: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>>
  baseXDirection: 'left' | 'right'
  baseYDirection: 'up' | 'down'
  directions: Record<'light' | 'dark', Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>>
  shadowColorControl: { colorToken: string; alphaToken: string }
}

export type VarsState = {
  tokens: JsonLike
  theme: JsonLike
  uikit: JsonLike
  palettes: PaletteStore
  elevation: ElevationState
  version: number
}

const STORAGE_KEYS = {
  version: 'recursica_version',
  elevationPaletteSelections: 'recursica_elevation_selections',
  importedTokens: 'recursica_tokens_imported',
  editedTokens: 'recursica_tokens_edited',
  importedBrand: 'recursica_brand_imported',
  editedBrand: 'recursica_brand_edited',
  importedUikit: 'recursica_uikit_imported',
  editedUikit: 'recursica_uikit_edited',
} as const

/** Exported for use by cssDelta and deltaToJson modules — the single source of truth for this key. */


function isLocalStorageAvailable(): boolean {
  try { if (typeof window === 'undefined' || !window.localStorage) return false; const k = '__ls__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true } catch { return false }
}


function toTitleCase(label: string): string { return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim() }

function defaultPaletteStore(): PaletteStore {
  return {
    opacity: {
      disabled: { token: 'opacity/faint', value: 0.5 },
      overlay: { token: 'opacity/veiled', value: 0.5 },
      'text-high': { token: 'opacity/solid', value: 1 },
      'text-low': { token: 'opacity/veiled', value: 0.5 },
    },
    dynamic: [
      { key: 'neutral', title: 'Neutral', defaultLevel: 200 },
      { key: 'palette-1', title: 'Palette 1', defaultLevel: 500 },
      { key: 'palette-2', title: 'Palette 500', defaultLevel: 500 },
    ],
    primaryLevels: {}
  }
}

/**
 * Derive the dynamic palette list by scanning the theme JSON.
 * Since the JSON is the single source of truth, we just look at the keys present.
 */
function deriveDynamicPalettes(themeState?: any): PaletteStore['dynamic'] {
  const base = defaultPaletteStore().dynamic

  let lightPalettes: any = null
  if (themeState) {
    const brandRoot: any = themeState?.brand ? themeState.brand : themeState
    const themes: any = brandRoot?.themes || brandRoot
    lightPalettes = themes?.light?.palettes
  }

  if (!lightPalettes) {
    return base
  }

  const result: PaletteStore['dynamic'] = []
  
  // First add base palettes if they exist in JSON
  for (const b of base) {
    if (lightPalettes[b.key]) {
      const paletteObj = lightPalettes[b.key]
      const hasSteps = Object.keys(paletteObj).some(k => !isNaN(parseInt(k, 10)))
      if (hasSteps) {
        result.push(b)
      }
    }
  }

  // Then add any extra palettes (palette-3, etc)
  const keys = Object.keys(lightPalettes)
  for (const key of keys) {
    if (key === 'neutral' || key === 'palette-1' || key === 'palette-2') continue
    const m = key.match(/^palette-(\d+)$/)
    if (m) {
      const paletteObj = lightPalettes[key]
      const hasSteps = Object.keys(paletteObj).some(k => !isNaN(parseInt(k, 10)))
      if (hasSteps) {
        result.push({
          key,
          title: `Palette ${m[1]}`,
          defaultLevel: 500
        })
      }
    }
  }

  // Sort extras numerically
  const extras = result.filter(r => r.key !== 'neutral' && r.key !== 'palette-1' && r.key !== 'palette-2')
  extras.sort((a, b) => {
    const numA = parseInt(a.key.split('-')[1] || '0', 10)
    const numB = parseInt(b.key.split('-')[1] || '0', 10)
    return numA - numB
  })

  return [
    ...result.filter(r => r.key === 'neutral' || r.key === 'palette-1' || r.key === 'palette-2'),
    ...extras
  ]
}

type Listener = () => void

/**
 * Sort font token objects by semantic order to maintain consistent order.
 * JavaScript objects maintain insertion order, so we create new objects with sorted keys.
 */
function sortFontTokenObjects(tokens: JsonLike): JsonLike {
  const sorted = JSON.parse(JSON.stringify(tokens)) as JsonLike
  const tokensRoot: any = (sorted as any)?.tokens || {}

  if (tokensRoot.font) {
    const font = tokensRoot.font

    // Define semantic ordering for each font category
    // Note: 2xs is smaller than xs, so it comes first
    const sizeOrder = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']
    const weightOrder = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
    const letterSpacingOrder = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest']
    const lineHeightOrder = ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest']

    const sortCategory = (category: string, order: string[]) => {
      if (font[category] && typeof font[category] === 'object') {
        const categoryObj = font[category] as Record<string, any>
        const keys = Object.keys(categoryObj)

        // Create a case-insensitive lookup map for the order array
        const orderMap = new Map<string, number>()
        order.forEach((orderedKey, idx) => {
          orderMap.set(orderedKey.toLowerCase(), idx)
        })

        // Sort keys: first by order array, then alphabetically for any not in order
        const sortedKeys = keys.sort((a, b) => {
          const aLower = a.toLowerCase()
          const bLower = b.toLowerCase()
          const aIdx = orderMap.get(aLower)
          const bIdx = orderMap.get(bLower)

          // Both in order array - use their positions
          if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx
          // Only a in order - a comes first
          if (aIdx !== undefined) return -1
          // Only b in order - b comes first
          if (bIdx !== undefined) return 1
          // Neither in order - sort alphabetically (case-insensitive)
          return aLower.localeCompare(bLower)
        })

        const sortedObj: Record<string, any> = {}
        sortedKeys.forEach((key) => {
          sortedObj[key] = categoryObj[key]
        })
        font[category] = sortedObj
      }
    }

    sortCategory('size', sizeOrder)
    sortCategory('weight', weightOrder)
    sortCategory('letter-spacing', letterSpacingOrder)
    sortCategory('line-height', lineHeightOrder)
    // For family and typeface, use alphabetical sorting
    if (font.family && typeof font.family === 'object') {
      const categoryObj = font.family as Record<string, any>
      const sortedKeys = Object.keys(categoryObj).sort()
      const sortedObj: Record<string, any> = {}
      sortedKeys.forEach((key) => {
        sortedObj[key] = categoryObj[key]
      })
      font.family = sortedObj
    }
    if (font.typeface && typeof font.typeface === 'object') {
      const categoryObj = font.typeface as Record<string, any>
      const sortedKeys = Object.keys(categoryObj).sort()
      const sortedObj: Record<string, any> = {}
      sortedKeys.forEach((key) => {
        sortedObj[key] = categoryObj[key]
      })
      font.typeface = sortedObj
    }
  }

  return sorted
}

/** Returns true if the uikit JSON contains any custom variants (tagged with com.recursica.custom). */
function hasCustomVariants(uikit: any): boolean {
  const components = uikit?.['ui-kit']?.components ?? uikit?.components ?? {}
  for (const comp of Object.values(components) as any[]) {
    const variantsRoot = comp?.variants ?? {}
    for (const axisObj of Object.values(variantsRoot) as any[]) {
      if (!axisObj || typeof axisObj !== 'object') continue
      for (const variant of Object.values(axisObj) as any[]) {
        if (variant?.$extensions?.['com.recursica.custom'] === true) return true
      }
    }
  }
  return false
}

// Utility to deep copy
function cloneJSON<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

class VarsStore {
  private state: VarsState
  private listeners: Set<Listener> = new Set()
  private lsAvailable = isLocalStorageAvailable()
  public aaWatcher: AAComplianceWatcher | null = null
  private isRecomputing: boolean = false
  private paletteVarsChangedTimeout: ReturnType<typeof setTimeout> | null = null
  private hasRunInitialReset: boolean = false
  private complianceScanTimeout: ReturnType<typeof setTimeout> | null = null
  /** Read-only structural metadata (what keys/palettes/layers exist) */
  public structure: StructuralMetadata | null = null
  /** The allVars map produced by the most recent recomputeAndApplyAll (for snapshotting) */
  private lastComputedVars: Record<string, string> = {}
  /** Exposes the pre-delta computed vars for clean CSS snapshotting (no stale delta pollution). */
  public getComputedCssVars(): Record<string, string> { return { ...this.lastComputedVars } }
  /**
   * Deep-cloned copy of the original uikit JSON taken at init time, before any in-place
   * mutations from updateUIKitValue. Used by handleReset to build CSS vars from the truly
   * pristine file structure regardless of what user changes have accumulated in state.
   */
  private readonly pristineUikit: JsonLike = JSON.parse(JSON.stringify(uikitImport))
  private readonly pristineBrand: JsonLike = JSON.parse(JSON.stringify(themeImport))

  constructor() {
    let tokensRaw = cloneJSON(tokensImport) as any
    let themeImportRaw = cloneJSON(themeImport) as any
    let uikitRaw = cloneJSON(uikitImport) as any

    if (this.lsAvailable) {
      try {
        // Migrate old _original keys to _imported keys (one-time rename)
        const migrations: [string, string][] = [
          ['recursica_tokens_original', STORAGE_KEYS.importedTokens],
          ['recursica_brand_original', STORAGE_KEYS.importedBrand],
          ['recursica_uikit_original', STORAGE_KEYS.importedUikit],
        ]
        for (const [oldKey, newKey] of migrations) {
          const old = localStorage.getItem(oldKey)
          if (old && !localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, old)
          }
          localStorage.removeItem(oldKey)
        }
      } catch {}

      try {
        // Load state from localStorage: edited → imported → bundled app JSON.
        // Edited keys are created by writeState as the user modifies data.
        // Imported keys are set during an explicit import and serve as the baseline.
        const initKey = (editedKey: string, importedKey: string, fallbackJson: any) => {
          const edited = localStorage.getItem(editedKey)
          if (edited) return JSON.parse(edited)

          const imported = localStorage.getItem(importedKey)
          if (imported) return JSON.parse(imported)

          return JSON.parse(JSON.stringify(fallbackJson))
        }

        tokensRaw = initKey(STORAGE_KEYS.editedTokens, STORAGE_KEYS.importedTokens, tokensRaw)
        themeImportRaw = initKey(STORAGE_KEYS.editedBrand, STORAGE_KEYS.importedBrand, themeImportRaw)
        uikitRaw = initKey(STORAGE_KEYS.editedUikit, STORAGE_KEYS.importedUikit, uikitRaw)
      } catch (err) {
        console.error("Failed to initialize storage keys", err)
      }
    }

    tokensRaw = cloneJSON(tokensRaw)
    // Sort font token objects once during initialization to maintain consistent order
    const tokens = sortFontTokenObjects(tokensRaw) || tokensRaw || {}
    themeImportRaw = cloneJSON(themeImportRaw)
    const theme = themeImportRaw?.brand ? themeImportRaw : { brand: themeImportRaw }
    const uikit = cloneJSON(uikitRaw)
    const palettes = defaultPaletteStore()

    // Ensure tokens is defined before passing to initElevationState
    // initElevationState will create elevation tokens and add them to the tokens object
    const elevation = this.initElevationState(theme as any, tokens || {})
    // Ensure tokens structure is properly set (initElevationState modifies tokens in place)
    if (!(tokens as any).tokens) (tokens as any).tokens = {}
    this.state = { tokens, theme, uikit, palettes, elevation, version: 0 }

    // Bundle version check: clear caches when source JSON files change
    if (this.lsAvailable) {
      const bundleVersion = computeBundleVersion(tokensImport, themeImport, uikitImport)
      const storedVersion = localStorage.getItem(STORAGE_KEYS.version)
      if (storedVersion !== bundleVersion) {
        localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
      }
    }

    // Populate fontUrlMap synchronously before recomputeAndApplyAll tries to load fonts
    // This ensures custom font URLs from token extensions are available
    // We populate it directly here to avoid async import timing issues
    try {
      if (typeof window !== 'undefined') {
        // Populate fontUrlMap directly by reading from tokens synchronously
        // This duplicates logic from fontUtils but ensures it runs before recomputeAndApplyAll
        const fontRoot = (this.state.tokens as any)?.tokens?.font || (this.state.tokens as any)?.font || {}
        const typefaces = fontRoot.typefaces || fontRoot.typeface || {}

        // Store URLs in window.__fontUrlMap so ensureFontLoaded can look them up
        // synchronously before fontUtils' async module-level fontUrlMap is populated.
        if (!(window as any).__fontUrlMap) {
          (window as any).__fontUrlMap = new Map<string, string>()
        }
        const urlMap = (window as any).__fontUrlMap as Map<string, string>

        Object.entries(typefaces).forEach(([key, rec]: [string, any]) => {
          try {
            let val = ''
            const rawValue = rec?.$value
            if (Array.isArray(rawValue) && rawValue.length > 0) {
              val = typeof rawValue[0] === 'string' ? rawValue[0].trim() : ''
            } else if (typeof rawValue === 'string') {
              val = rawValue.trim()
            }

            if (val) {
              const cleanVal = val.replace(/^["']|["']$/g, '')
              // Access com.google.fonts as a single key, not nested properties
              const googleFontsExt = rec?.$extensions?.['com.google.fonts'] || rec?.$extensions?.com?.google?.fonts
              const url = googleFontsExt?.url
              if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
                urlMap.set(cleanVal, url)
                if (val !== cleanVal) {
                  urlMap.set(val, url)
                }
              }
            }
          } catch (err) {
            // Skip individual font if there's an error
          }
        })
      }
    } catch (err) {
      // If font URL map population fails, fonts will still load with default URLs
    }

    // Initialize AA compliance watcher BEFORE recomputeAndApplyAll,
    // since the pipeline stage uses it synchronously.
    this.aaWatcher = new AAComplianceWatcher(this.state.tokens, this.state.theme)

    // Build structural metadata once from the JSON files (immutable)
    this.structure = buildStructuralMetadata(this.state.tokens, this.state.theme, this.state.uikit)

    // Migrate font typefaces to two-tier structure (named slug entries + sequence aliases)
    // before the first recompute so the in-memory tokens are correct from startup.
    // Use silent=true so this does not trigger an extra recomputeAndApplyAll.
    this.syncFontsToTokens(true)

    // Initial CSS apply (includes AA compliance pipeline stage)
    this.recomputeAndApplyAll()

    // Derive dynamic palette list from state.theme
    const derivedDynamic = deriveDynamicPalettes(this.state.theme)
    this.state.palettes = { ...this.state.palettes, dynamic: derivedDynamic }

    // Connect compliance service to token/theme getters
    const complianceService = getComplianceService()
    complianceService.connect(
      () => this.state.tokens,
      () => this.state.theme,
      (theme: JsonLike) => this.writeState({ theme }) // persist only — writeState never triggers recompute
    )

    // Compliance is read-only — it only flags issues, never modifies CSS vars or JSON.
    // A debounced compliance scan runs automatically after recomputeAndApplyAll() and writeCssVarsDirect().
  }

  // initAAWatcher is no longer needed — aaWatcher is created in constructor
  // and compliance runs synchronously inside recomputeAndApplyAll().

  getState(): VarsState { return this.state }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private emit() { this.listeners.forEach((l) => l()) }


  /**
   * Pure persistence: updates in-memory state and emits to React subscribers.
   * Persists changes directly to the "Edited" JSON local storage keys.
   * NEVER triggers recomputeAndApplyAll — callers that need full regen must call it explicitly.
   */
  writeState(next: Partial<VarsState>) {
    this.state = { ...this.state, ...next }

    if (this.lsAvailable) {
      try {
        if (next.tokens) localStorage.setItem(STORAGE_KEYS.editedTokens, JSON.stringify(this.state.tokens))
        if (next.theme) localStorage.setItem(STORAGE_KEYS.editedBrand, JSON.stringify(this.state.theme))
        if (next.uikit) localStorage.setItem(STORAGE_KEYS.editedUikit, JSON.stringify(this.state.uikit))
      } catch (err) {
        console.error("Failed to persist state to local storage", err)
      }
    }

    // Update AA watcher if tokens or theme changed
    if (this.aaWatcher && (next.tokens || next.theme)) {
      this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
    }

    this.emit()
  }

  /**
   * Write CSS vars directly to DOM and sync them to JSON.
   * Used by compliance fixes (Fix / Fix All) and palette default updates.
   * Triggers recomputeAndApplyAll to rebuild both modes' vars from updated JSON,
   * ensuring cross-mode regressions are caught immediately by the compliance scan.
   */
  public writeCssVarsDirect(cssVarUpdates: Record<string, string>) {
    // Write CSS vars to DOM inline style and automatically sync to JSON via updateCssVar pipeline
    updateCssVars(cssVarUpdates, this.state.tokens, false)

    // Rebuild all CSS vars from the updated JSON so both modes' vars are in sync.
    // This prevents "new" issues from appearing only on mode switch — the recompute
    // ensures the AA pipeline (fixPaletteOnTones, fixCoreColorOnTones) runs against
    // the updated JSON immediately, and scheduleComplianceScan at the end of
    // recomputeAndApplyAll catches any cross-mode regressions right away.
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
    }
  }

  /**
   * Schedule a debounced compliance scan (500ms).
   * Called after any change that could affect compliance (color changes, fixes, etc.).
   * The scan is read-only — it only flags issues, never modifies CSS vars or JSON.
   */
  public scheduleComplianceScan() {
    if (this.complianceScanTimeout) {
      clearTimeout(this.complianceScanTimeout)
    }
    this.complianceScanTimeout = setTimeout(() => {
      try {
        getComplianceService().runFullScan()
      } catch { }
      this.complianceScanTimeout = null
    }, 500)
  }

  public bumpVersion() { this.state = { ...this.state, version: (this.state.version || 0) + 1 }; this.emit() }

  public deleteScale(scaleKeyToDelete: string) {
    const deletedNumStr = scaleKeyToDelete.match(/^scale-(\d+)$/)?.[1]
    if (!deletedNumStr) return
    const deletedNum = parseInt(deletedNumStr, 10)

    let stateStr = JSON.stringify(this.state)
    const stateObj = JSON.parse(stateStr)

    const colorsRoot = stateObj.tokens?.tokens?.colors || {}
    if (!colorsRoot[scaleKeyToDelete]) return

    delete colorsRoot[scaleKeyToDelete]

    // Clear from DOM immediately
    if (typeof document !== 'undefined') {
      const style = document.documentElement.style
      const toRemove = []
      for (let i = 0; i < style.length; i++) {
        if (style[i].includes(`_colors_${scaleKeyToDelete}_`)) toRemove.push(style[i])
      }
      toRemove.forEach(p => style.removeProperty(p))
    }

    let finalStateStr = JSON.stringify({
      ...stateObj,
      tokens: { ...stateObj.tokens, tokens: { ...stateObj.tokens?.tokens, colors: colorsRoot } }
    })

    // Renumber remaining scales to close the gap
    const remainingScales = Object.keys(colorsRoot)
      .filter(k => k.startsWith('scale-'))
      .map(k => parseInt(k.replace('scale-', ''), 10))
      .sort((a, b) => a - b)
    
    let expectedNum = 1
    for (const currentNum of remainingScales) {
      if (currentNum > expectedNum) {
        const oldKey = `scale-${String(currentNum).padStart(2, '0')}`
        const newKey = `scale-${String(expectedNum).padStart(2, '0')}`
        
        // Update JSON references
        finalStateStr = finalStateStr.replace(new RegExp(`\\{tokens\\.colors\\.${oldKey}\\.`, 'g'), `{tokens.colors.${newKey}.`)
        // Update CSS variables string
        finalStateStr = finalStateStr.replace(new RegExp(`_colors_${oldKey}_`, 'g'), `_colors_${newKey}_`)
        // Update object keys
        finalStateStr = finalStateStr.replace(new RegExp(`"${oldKey}"`, 'g'), `"${newKey}"`)
        
        // Clear old CSS vars from DOM
        if (typeof document !== 'undefined') {
          const style = document.documentElement.style
          const toRemove = []
          for (let i = 0; i < style.length; i++) {
            if (style[i].includes(`_colors_${oldKey}_`)) toRemove.push(style[i])
          }
          toRemove.forEach(p => style.removeProperty(p))
        }
      }
      expectedNum++
    }

    this.writeState(JSON.parse(finalStateStr))
    this.recomputeAndApplyAll()
  }

  public deletePalette(paletteKeyToDelete: string, fallbackPaletteKey: string) {
    const deletedNumStr = paletteKeyToDelete.match(/^palette-(\d+)$/)?.[1]
    if (!deletedNumStr) return
    const deletedNum = parseInt(deletedNumStr, 10)

    // 1. Replace all references to the deleted palette with the fallback palette
    let stateStr = JSON.stringify(this.state)
    stateStr = stateStr.replace(new RegExp(`\\{brand\\.palettes\\.${paletteKeyToDelete}\\.`, 'g'), `{brand.palettes.${fallbackPaletteKey}.`)
    stateStr = stateStr.replace(new RegExp(`\\{brand\\.themes\\.(light|dark)\\.palettes\\.${paletteKeyToDelete}\\.`, 'g'), `{brand.themes.$1.palettes.${fallbackPaletteKey}.`)
    stateStr = stateStr.replace(new RegExp(`_palettes_${paletteKeyToDelete}_`, 'g'), `_palettes_${fallbackPaletteKey}_`)

    // Clear from DOM immediately
    if (typeof document !== 'undefined') {
      const style = document.documentElement.style
      const toRemove = []
      for (let i = 0; i < style.length; i++) {
        if (style[i].includes(`_palettes_${paletteKeyToDelete}_`)) toRemove.push(style[i])
      }
      toRemove.forEach(p => style.removeProperty(p))
    }

    const stateObj = JSON.parse(stateStr)
    if (stateObj.palettes && stateObj.palettes.dynamic) {
      stateObj.palettes.dynamic = stateObj.palettes.dynamic.filter((p: any) => p.key !== paletteKeyToDelete)
    }

    const themes = stateObj.theme?.brand?.themes || stateObj.theme?.themes || stateObj.theme

    for (const mode of ['light', 'dark']) {
      const palettes = themes?.[mode]?.palettes
      if (!palettes) continue
      delete palettes[paletteKeyToDelete]
    }

    let finalStateStr = JSON.stringify(stateObj)

    // Renumber remaining palettes
    const remainingPalettes = (stateObj.palettes?.dynamic || [])
      .map((p: any) => parseInt(p.key.replace('palette-', ''), 10))
      .filter((n: number) => !isNaN(n))
      .sort((a: number, b: number) => a - b)

    let expectedNum = 1
    for (const currentNum of remainingPalettes) {
      if (currentNum > expectedNum) {
        const oldKey = `palette-${currentNum}`
        const newKey = `palette-${expectedNum}`

        // Update references in JSON string
        finalStateStr = finalStateStr.replace(new RegExp(`\\{brand\\.palettes\\.${oldKey}\\.`, 'g'), `{brand.palettes.${newKey}.`)
        finalStateStr = finalStateStr.replace(new RegExp(`\\{brand\\.themes\\.(light|dark)\\.palettes\\.${oldKey}\\.`, 'g'), `{brand.themes.$1.palettes.${newKey}.`)
        finalStateStr = finalStateStr.replace(new RegExp(`_palettes_${oldKey}_`, 'g'), `_palettes_${newKey}_`)
        finalStateStr = finalStateStr.replace(new RegExp(`"${oldKey}"`, 'g'), `"${newKey}"`)

        // Clear old CSS vars from DOM
        if (typeof document !== 'undefined') {
          const style = document.documentElement.style
          const toRemove = []
          for (let i = 0; i < style.length; i++) {
            if (style[i].includes(`_palettes_${oldKey}_`)) toRemove.push(style[i])
          }
          toRemove.forEach(p => style.removeProperty(p))
        }
      }
      expectedNum++
    }

    this.writeState(JSON.parse(finalStateStr))
    this.recomputeAndApplyAll()
  }

  setTokens(next: JsonLike) {
    this.writeState({ tokens: next })
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
    }
  }
  /**
   * Update tokens JSON in-memory WITHOUT triggering recomputeAndApplyAll.
   * Use when the CSS var is already set via updateCssVar and you only need JSON sync.
   */
  setTokensSilent(next: JsonLike) { this.writeState({ tokens: next }) }
  setTheme(next: JsonLike) {
    this.writeState({ theme: next })
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
    }
  }
  /**
   * Update theme JSON in-memory WITHOUT triggering recomputeAndApplyAll.
   * Use when the CSS var is already set via updateCssVar and you only need JSON sync.
   * This prevents the recompute from overwriting other CSS var changes (e.g. interactive color reset bug).
   */
  setThemeSilent(next: JsonLike) { this.writeState({ theme: next }) }
  /**
   * Get a deep clone of the current theme JSON from the store.
   * Always use this instead of cloning React state (themeJson) to ensure
   * compliance fixes from writeCssVarsDirect() are included.
   */

  hasUserImportedFiles(): boolean {
    if (!this.lsAvailable) return false;
    return localStorage.getItem('recursica_has_imported') === 'true';
  }

  public getLatestThemeCopy(): any {
    return JSON.parse(JSON.stringify(this.state.theme))
  }
  public syncFontsToTokens(silent = false) {
    if (typeof localStorage !== 'undefined') {
      const storedFontsRaw = localStorage.getItem('recursica_fonts')
      if (!storedFontsRaw) return
      const storedFonts = JSON.parse(storedFontsRaw)
      if (!Array.isArray(storedFonts)) return

      const ORDER_SET = new Set(['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'])

      // ── Tokens: rebuild typefaces + families ────────────────────────────────
      const tokens = JSON.parse(JSON.stringify(this.state.tokens))
      const fontRoot = tokens?.tokens?.font || tokens?.font || {}
      if (!fontRoot.typefaces) fontRoot.typefaces = {}
      if (!fontRoot.families) fontRoot.families = {}
      const typefaces = fontRoot.typefaces
      const families = fontRoot.families

      // Build lookup from slug → existing named entry to preserve metadata (variants, $type, $extensions)
      const existingBySlug: Record<string, any> = {}
      Object.keys(typefaces).filter(k => !k.startsWith('$') && !ORDER_SET.has(k)).forEach(k => {
        existingBySlug[k] = JSON.parse(JSON.stringify(typefaces[k]))
      })
      // Also handle legacy structure: ORDER keys directly on typefaces carrying real values
      Object.keys(typefaces).filter(k => ORDER_SET.has(k)).forEach(seqKey => {
        const entry = typefaces[seqKey]
        if (!entry) return
        const rawValue = entry.$value
        if (typeof rawValue === 'string' && rawValue.startsWith('{')) return
        let familyName = ''
        if (Array.isArray(rawValue) && rawValue.length > 0) {
          familyName = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '').split(',')[0].trim() : ''
        } else if (typeof rawValue === 'string') {
          familyName = rawValue.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
        }
        if (familyName) {
          const slug = familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          if (!existingBySlug[slug]) existingBySlug[slug] = JSON.parse(JSON.stringify(entry))
        }
      })

      // Clear all font entries, keep only $ metadata
      Object.keys(typefaces).forEach(k => { if (!k.startsWith('$')) delete typefaces[k] })
      Object.keys(families).forEach(k => { if (!k.startsWith('$')) delete families[k] })

      // ── Brand: rebuild fonts (primary/secondary/tertiary aliases) ────────────
      const theme = JSON.parse(JSON.stringify(this.state.theme))
      const brandRoot = (theme as any)?.brand || theme
      const levelsGroup: any = { $type: 'fontFamily' }

      storedFonts.forEach(font => {
        if (!font.id || !font.family) return
        const slug = font.slug ||
          font.family.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const cleanFamily = font.family.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
        const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily

        // Preserve existing generic fallback from the token's array $value if not on font.category
        const existing = existingBySlug[slug] || {}
        const existingGeneric = Array.isArray(existing.$value) && existing.$value.length > 1
          ? existing.$value[existing.$value.length - 1]
          : null
        const generic = font.category || existingGeneric || 'sans-serif'

        // DTCG fontFamily $value: array [familyName, genericFallback]
        const dtcgValue = [cleanFamily, generic]
        // CSS font-family string for direct CSS var output
        const cssFontStack = `${quotedName}, ${generic}`

        // Write named font entry to tokens.typefaces (preserving all existing metadata)
        const namedEntry: any = { $type: 'fontFamily', ...existing, $value: dtcgValue }
        if (font.url) {
          namedEntry.$extensions = {
            ...(existing.$extensions || {}),
            'com.google.fonts': { ...(existing.$extensions?.['com.google.fonts'] || {}), url: font.url }
          }
        } else if (existing.$extensions) {
          namedEntry.$extensions = existing.$extensions
        }
        typefaces[slug] = namedEntry
        levelsGroup[font.id] = { $type: 'fontFamily', $value: `{tokens.font.typefaces.${slug}}` }
        // families: CSS string $value (direct CSS output, no variants metadata)
        families[slug] = { $type: 'fontFamily', $value: cssFontStack }
        if (font.url) families[slug].$extensions = { 'com.google.fonts': { url: font.url } }
      })

      brandRoot.fonts = levelsGroup

      // Commit both states atomically
      if (silent) {
        this.writeState({ tokens, theme })
      } else {
        this.writeState({ tokens, theme })
        if (!this.isRecomputing) this.recomputeAndApplyAll()
      }
    }
  }



  /** Returns the pristine, unmodified uikit JSON (deep-cloned at init time). */
  getPristineUikit(): JsonLike { return this.pristineUikit }
  getPristineBrand(): JsonLike { return this.pristineBrand }

  /**
   * Atomically import all three JSON stores (tokens, brand, uikit) and
   * trigger a single recomputeAndApplyAll.
   *
   * This avoids the race condition where sequential setTokens → importTheme →
   * setUiKit each trigger recomputeAndApplyAll individually, causing
   * intermediate UIKit CSS vars (computed from a mix of old/new data) to be
   * incorrectly preserved by the DOM preservation logic.
   */
  bulkImport(files: { tokens?: JsonLike; brand?: JsonLike; uikit?: JsonLike }) {
    // Update all stores without triggering individual recomputes
    if (files.tokens) {
      this.writeState({ tokens: files.tokens })
    }

    if (files.brand) {
      // Rebuild elevation state from the imported brand JSON
      const brand: any = (files.brand as any)?.brand || files.brand
      const themes = brand?.themes || brand

      const newPaletteSelections: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>> = { light: {}, dark: {} }
      const newColorTokens: Record<string, string> = {}

      for (const mode of ['light', 'dark'] as const) {
        const els: any = themes?.[mode]?.elevations || {}
        for (let i = 1; i <= 4; i++) {
          const key = `elevation-${i}`
          const colorRef = els[key]?.$value?.color?.$value
          if (typeof colorRef === 'string') {
            const palMatch = colorRef.match(/palettes\.([a-z0-9-]+)\.(\d+)\.color\.tone/)
            if (palMatch) {
              newPaletteSelections[mode][key] = { paletteKey: palMatch[1], level: palMatch[2] }
            } else {
              const tokMatch = colorRef.match(/tokens\.colors\.(scale-\d{2})\.(\d+)/)
              if (tokMatch) {
                newColorTokens[key] = `colors/${tokMatch[1]}/${tokMatch[2]}`
              }
            }
          }
        }
      }

      const elevation: ElevationState = {
        ...this.state.elevation,
        controls: { light: {}, dark: {} },
        directions: { light: {}, dark: {} },
        paletteSelections: newPaletteSelections,
        colorTokens: newColorTokens,
        alphaTokens: { light: {}, dark: {} },
      }

      this.writeState({ theme: files.brand, elevation })
    }

    if (files.uikit) {
      this.writeState({ uikit: files.uikit })
    }

    // Rebuild recursica_fonts from the imported data so syncFontsToTokens (called inside
    // recomputeAndApplyAll below) uses the correct typefaces and sequence assignments
    // from the imported JSON rather than whatever was previously in localStorage.
    const importedFonts = deriveFontsFromJson(
      files.tokens ?? this.state.tokens,
      files.brand ?? this.state.theme
    )
    if (importedFonts.length > 0) {
      saveStoredFonts(importedFonts)
      populateWindowFontUrlMap(importedFonts)
    }
    // Wipe all CSS variables from the DOM to ensure complete replacement
    clearAllCssVars()

    // Single recompute with all stores updated
    this.recomputeAndApplyAll()

    // Save to localStorage: set imported snapshot and clear edited keys.
    // Edited keys will be re-created by writeState as the user makes changes,
    // which allows detectDirtyData to correctly identify modifications since import.
    if (this.lsAvailable) {
      try { localStorage.setItem('recursica_has_imported', 'true') } catch {}

      if (files.tokens) {
        try { 
          localStorage.setItem(STORAGE_KEYS.importedTokens, JSON.stringify(files.tokens))
          localStorage.removeItem(STORAGE_KEYS.editedTokens)
        } catch { }
      }
      if (files.brand) {
        try { 
          localStorage.setItem(STORAGE_KEYS.importedBrand, JSON.stringify(files.brand))
          localStorage.removeItem(STORAGE_KEYS.editedBrand)
        } catch { }
      }
      if (files.uikit) {
        try { 
          localStorage.setItem(STORAGE_KEYS.importedUikit, JSON.stringify(files.uikit))
          localStorage.removeItem(STORAGE_KEYS.editedUikit)
        } catch { }
      }
    }

    // Notify FontFamiliesTokens to rebuild rows and load imported font files
    if (files.tokens || files.brand) {
      try {
        window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: {}, reset: true } }))
        window.dispatchEvent(new CustomEvent('fontsImported', {}))
      } catch { }
    }
  }

  setUiKit(next: JsonLike) {
    this.writeState({ uikit: next })
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
    }
  }
  /**
   * Force-reloads the page with a cache-bust to pick up fresh JSON files.
   * Since tokens/theme/uikit always load from imports, a simple reload
   * with cache invalidation is sufficient.
   */
  async reloadFromFile() {
    if (typeof window === 'undefined') return
    try {
      if (this.lsAvailable) {
        localStorage.removeItem(STORAGE_KEYS.version)
      }
      // Cache-bust reload
      const url = new URL(window.location.href)
      url.searchParams.set('_cb', String(Date.now()))
      window.location.href = url.toString()
    } catch {
      window.location.reload()
    }
  }
  /** Update UIKit without triggering recomputeAndApplyAll. Use when CSS var was already set via updateCssVar (e.g. toolbar color picker). */
  setUiKitSilent(next: JsonLike) { this.writeState({ uikit: next }) }

  /**
   * Stub. Previously replayed delta to json. Not needed anymore.
   */
  public syncUiKitDelta(): void {
    // No-op
  }
  setPalettes(next: PaletteStore) {
    this.writeState({ palettes: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }
  setElevation(next: ElevationState) {
    this.writeState({ elevation: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }
  updateElevation(mutator: (prev: ElevationState) => ElevationState) {
    const next = mutator(this.state.elevation)
    this.writeState({ elevation: next })

    // Sync paletteSelections back to theme.brand so exportBrandJson captures current color choices.
    // Each mode's selections are written only to that mode's brand JSON elevations node.
    try {
      const theme = this.state.theme as any
      const brand = theme?.brand || theme
      const themes = brand?.themes || brand
      if (themes) {
        for (const m of ['light', 'dark'] as const) {
          const modeSelections = next.paletteSelections[m] || {}
          for (const [elevKey, sel] of Object.entries(modeSelections)) {
            const { paletteKey, level } = sel
            const elevNode = themes?.[m]?.elevations?.[elevKey]
            if (elevNode?.['$value']) {
              if (!elevNode['$value'].color) elevNode['$value'].color = {}
              elevNode['$value'].color.$type = 'color'
              elevNode['$value'].color.$value = `{brand.themes.${m}.palettes.${paletteKey}.${level}.color.tone}`
            }
          }
        }
      }
    } catch { /* non-fatal — export will use last good state */ }

    // Persist paletteSelections so they survive a browser refresh
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(STORAGE_KEYS.elevationPaletteSelections, JSON.stringify(next.paletteSelections))
      } catch { /* storage full */ }
    }
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }

  /**
   * Update a single CSS variable for a specific token.
   * Only updates the CSS var(s) affected by this token, not all CSS vars.
   */
  private updateSingleTokenCssVar(tokenName: string) {
    const parts = tokenName.split('/').filter(Boolean)
    if (parts.length === 0) return

    const [category, ...rest] = parts
    const varsToUpdate: Record<string, string> = {}
    const tokensRoot: any = (this.state.tokens as any)?.tokens || {}

    try {
      if (category === 'font' && rest.length >= 2) {
        const [kind, key] = rest
        // Map singular to plural for font categories
        const pluralMap: Record<string, string> = {
          'size': 'sizes',
          'sizes': 'sizes',
          'weight': 'weights',
          'weights': 'weights',
          'letter-spacing': 'letter-spacings',
          'letter-spacings': 'letter-spacings',
          'line-height': 'line-heights',
          'line-heights': 'line-heights',
          'typeface': 'typefaces',
          'typefaces': 'typefaces',
          'cases': 'cases',
          'decorations': 'decorations'
        }
        const pluralKind = pluralMap[kind] || kind
        // Read the updated value from state - try plural first, then singular for backwards compatibility
        const tokenValue = tokensRoot?.font?.[pluralKind]?.[key]?.$value || tokensRoot?.font?.[kind]?.[key]?.$value
        if (tokenValue == null) return

        // Update ONLY the direct font token CSS var
        // Do NOT rebuild all typography vars - they will be updated on next full recompute
        const formatFontValue = (val: any, category: string): string | undefined => {
          if (category === 'size' || category === 'sizes') {
            if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
              const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
              const unit = (val as any).unit || 'px'
              return Number.isFinite(num) ? `${num}${unit}` : undefined
            }
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}px` : undefined
          } else if (category === 'letter-spacing' || category === 'letter-spacings') {
            if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
              const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
              const unit = (val as any).unit || 'rem'
              return Number.isFinite(num) ? `${num}${unit}` : undefined
            }
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}rem` : undefined
          } else if (category === 'line-height' || category === 'line-heights') {
            if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
              const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
              const unit = (val as any).unit || 'rem'
              return Number.isFinite(num) ? `${num}${unit}` : undefined
            }
            return String(val)
          } else if (category === 'weight' || category === 'weights') {
            return String(val)
          } else if (category === 'family' || category === 'typeface' || category === 'typefaces' || category === 'cases' || category === 'decorations') {
            return String(val)
          }
          return undefined
        }

        const formattedValue = formatFontValue(tokenValue, kind)
        if (formattedValue) {
          // Use plural form for CSS var name
          varsToUpdate[tokenFont(pluralKind, key)] = formattedValue
        }
        // Note: Typography vars that reference this token will update automatically
        // via CSS var() references, so we don't need to rebuild them here
      } else if (category === 'size' || category === 'sizes') {
        const [key] = rest
        const tokenValue = tokensRoot?.sizes?.[key]?.$value
        if (tokenValue == null) return

        const toPxString = (v: any): string | undefined => {
          if (v == null) return undefined
          if (typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) {
            const val: any = (v as any).value
            const unit: any = (v as any).unit
            if (typeof val === 'number') return unit ? `${val}${unit}` : `${val}px`
            return typeof val === 'string' ? val : undefined
          }
          if (typeof v === 'number') return `${v}px`
          if (typeof v === 'string') {
            return /^-?\d+(\.\d+)?$/.test(v.trim()) ? `${v.trim()}px` : v.trim()
          }
          return undefined
        }
        const px = toPxString(tokenValue)
        if (px) varsToUpdate[tokenSize(key)] = px
      } else if (category === 'opacity' && rest.length >= 1) {
        const [key] = rest
        const tokenValue = tokensRoot?.opacities?.[key]?.$value
        if (tokenValue == null) return

        const normalize = (v: any): string | undefined => {
          try {
            const n = typeof v === 'number' ? v : Number(v)
            if (!Number.isFinite(n)) return undefined
            const val = n <= 1 ? n : n / 100
            return String(Math.max(0, Math.min(1, val)))
          } catch { return undefined }
        }
        const norm = normalize(tokenValue)
        if (norm) {
          varsToUpdate[tokenOpacity(key)] = norm
          varsToUpdate[token('opacity', key)] = norm
        }
      } else if (category === 'colors' && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // Preserve 000 and 1000 as-is, pad others to 3 digits
        const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(level).padStart(3, '0')

        let tokenValue: any = null
        let scaleKey: string | null = null

        if (scaleOrFamily.startsWith('scale-')) {
          // Direct scale reference: colors/scale-01/100
          scaleKey = scaleOrFamily
          tokenValue = tokensRoot?.colors?.[scaleKey]?.[level]?.$value
        } else {
          // Alias-based reference: colors/cornflower/100
          // Find the scale that has this alias
          scaleKey = Object.keys(tokensRoot?.colors || {}).find(key => {
            const scale = tokensRoot?.colors?.[key]
            return scale && typeof scale === 'object' && scale.alias === scaleOrFamily
          }) || null
          if (scaleKey) {
            tokenValue = tokensRoot?.colors?.[scaleKey]?.[level]?.$value
          }
        }

        if (tokenValue != null && scaleKey) {
          // Generate CSS vars for scale name only (no alias-based vars)
          const scaleCssVarKey = tokenColors(scaleKey, normalizedLevel)
          varsToUpdate[scaleCssVarKey] = String(tokenValue)
        }
      }

      // Apply only the affected CSS variables (with validation)
      // Ensure we only update the specific CSS variable(s) for this token
      if (Object.keys(varsToUpdate).length > 0) {
        // Only apply the CSS variables that were added for this specific token
        // This prevents accidentally updating other CSS variables
        applyCssVars(varsToUpdate, this.state.tokens)
      }
    } catch { }
  }

  /**
   * Update a single token value directly in the tokens state.
   * Token name format: "color/family/level", "size/key", "opacity/key", "font/size/key", etc.
   */
  updateToken(tokenName: string, value: string | number) {
    const parts = tokenName.split('/').filter(Boolean)
    if (parts.length === 0) return

    // Deep clone tokens to avoid mutation
    const nextTokens = JSON.parse(JSON.stringify(this.state.tokens)) as JsonLike
    const tokensRoot: any = (nextTokens as any)?.tokens || {}

    try {
      const [category, ...rest] = parts

      if (category === 'colors' && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        if (!tokensRoot.colors) tokensRoot.colors = {}
        // Check if it's a scale-XX key or an alias (family name)
        if (scaleOrFamily.startsWith('scale-')) {
          // Direct scale reference: colors/scale-01/100
          if (!tokensRoot.colors[scaleOrFamily]) tokensRoot.colors[scaleOrFamily] = {}
          if (!tokensRoot.colors[scaleOrFamily][level]) tokensRoot.colors[scaleOrFamily][level] = {}
          tokensRoot.colors[scaleOrFamily][level].$value = String(value)
        } else {
          // Alias-based reference: colors/cornflower/100
          // Find the scale that has this alias
          const scaleKey = Object.keys(tokensRoot.colors || {}).find(key => {
            const scale = tokensRoot.colors?.[key]
            return scale && typeof scale === 'object' && scale.alias === scaleOrFamily
          })
          if (scaleKey) {
            if (!tokensRoot.colors[scaleKey][level]) tokensRoot.colors[scaleKey][level] = {}
            tokensRoot.colors[scaleKey][level].$value = String(value)
          } else {
            // Scale not found, create it (shouldn't happen normally)
          }
        }
      } else if (category === 'size' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.sizes) tokensRoot.sizes = {}
        if (!tokensRoot.sizes[key]) tokensRoot.sizes[key] = {}
        const existingSize = tokensRoot.sizes[key]?.$value
        if (existingSize && typeof existingSize === 'object' && Object.prototype.hasOwnProperty.call(existingSize, 'value')) {
          tokensRoot.sizes[key].$value = { value: typeof value === 'number' ? value : Number(value), unit: (existingSize as any).unit || 'px' }
        } else {
          tokensRoot.sizes[key].$value = typeof value === 'number' ? value : String(value)
        }
      } else if (category === 'opacity' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.opacities) tokensRoot.opacities = {}
        if (!tokensRoot.opacities[key]) tokensRoot.opacities[key] = {}
        tokensRoot.opacities[key].$value = typeof value === 'number' ? value : String(value)
      } else if (category === 'font' && rest.length >= 2) {
        const [kind, key] = rest
        if (!tokensRoot.font) tokensRoot.font = {}
        // Map singular to plural for font categories
        const pluralMap: Record<string, string> = {
          'size': 'sizes',
          'sizes': 'sizes',
          'weight': 'weights',
          'weights': 'weights',
          'letter-spacing': 'letter-spacings',
          'letter-spacings': 'letter-spacings',
          'line-height': 'line-heights',
          'line-heights': 'line-heights',
          'typeface': 'typefaces',
          'typefaces': 'typefaces',
          'cases': 'cases',
          'decorations': 'decorations'
        }
        const pluralKind = pluralMap[kind] || kind
        if (pluralKind === 'sizes' || pluralKind === 'weights' || pluralKind === 'letter-spacings' || pluralKind === 'line-heights') {
          if (!tokensRoot.font[pluralKind]) tokensRoot.font[pluralKind] = {}
          if (!tokensRoot.font[pluralKind][key]) tokensRoot.font[pluralKind][key] = {}
          const existing = tokensRoot.font[pluralKind]?.[key]?.$value
          if (existing && typeof existing === 'object' && Object.prototype.hasOwnProperty.call(existing, 'value')) {
            // Preserve {value, unit} dimension object format for all font token categories that use it
            const unit = (existing as any).unit || (pluralKind === 'sizes' ? 'px' : 'rem')
            tokensRoot.font[pluralKind][key].$value = { value: typeof value === 'number' ? value : Number(value), unit }
          } else {
            tokensRoot.font[pluralKind][key].$value = typeof value === 'number' ? value : String(value)
          }
        } else if (pluralKind === 'typefaces' || pluralKind === 'cases' || pluralKind === 'decorations') {
          if (!tokensRoot.font[pluralKind]) tokensRoot.font[pluralKind] = {}
          tokensRoot.font[pluralKind][key] = typeof value === 'object' ? value : { $value: String(value) }
        }
      } else if (category === 'shadow' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.shadow) tokensRoot.shadow = {}
        if (!tokensRoot.shadow[key]) tokensRoot.shadow[key] = {}
        tokensRoot.shadow[key].$value = String(value)
      } else if (category === 'effect' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.effect) tokensRoot.effect = {}
        if (!tokensRoot.effect[key]) tokensRoot.effect[key] = {}
        tokensRoot.effect[key].$value = String(value)
      }

      // Ensure tokens structure exists
      if (!(nextTokens as any).tokens) {
        (nextTokens as any).tokens = tokensRoot
      }

      // Sort font token objects to maintain consistent order
      const sortedTokens = sortFontTokenObjects(nextTokens)

      this.writeState({ tokens: sortedTokens })

      // Update only the affected CSS variable(s)
      this.updateSingleTokenCssVar(tokenName)

      // Trigger AA compliance checks when color tokens change
      if ((category === 'color' || category === 'colors') && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // For new format, extract family from alias if it's a scale-XX key
        let family = scaleOrFamily
        let scaleKey = scaleOrFamily
        if (category === 'colors' && scaleOrFamily.startsWith('scale-')) {
          scaleKey = scaleOrFamily
          // Find the alias for this scale
          const scale = tokensRoot.colors?.[scaleOrFamily]
          if (scale && typeof scale === 'object' && scale.alias) {
            family = scale.alias
          }
        } else {
          // It's an alias - find the scale key
          const foundScaleKey = Object.keys(tokensRoot.colors || {}).find(key => {
            const scale = tokensRoot.colors?.[key]
            return scale && typeof scale === 'object' && scale.alias === scaleOrFamily
          })
          if (foundScaleKey) {
            scaleKey = foundScaleKey
          }
        }

        // Check if this token is used by any core color
        const isCoreColorToken = this.isCoreColorToken(family, level)
        if (isCoreColorToken) {
          // Core color changed — schedule a read-only compliance scan
          this.scheduleComplianceScan()
        }

        // Check if this color token is used by any palette
        const palettesUsingColor = this.findPalettesUsingColor(scaleKey, family)
        if (palettesUsingColor.length > 0) {
          // Color token used in palette(s) — schedule a read-only compliance scan
          this.scheduleComplianceScan()
        }
      } else if (category === 'opacity' && rest.length >= 1) {
        const [key] = rest
        // Check if this opacity token is used for high/low emphasis in theme JSON
        const isEmphasisOpacity = this.isEmphasisOpacityToken(key)
        if (isEmphasisOpacity) {
          // Emphasis opacity changed — schedule a read-only compliance scan
          // In the new architecture, compliance never modifies vars
          this.scheduleComplianceScan()
        }
      }
    } catch { }
  }

  resetAll(toOriginal: boolean = false) {
    // Clear all CSS variables, persisted delta, stored font overrides, and deleted scales
    clearAllCssVars()
    clearStoredFonts()
    // Immediately restore recursica_fonts to the canonical defaults so syncFontsToTokens
    // (called inside recomputeAndApplyAll below) does not return early and correctly
    // emits font CSS vars for the default font set.  Added fonts and sequence changes
    // are both wiped because we derive from the static JSON, not from any user session state.
    saveStoredFonts(getDefaultFonts())
    try { localStorage.removeItem(STORAGE_KEYS.elevationPaletteSelections) } catch { }
    clearElevationColorMirror()

    // Clear global ref preference so users are prompted again after a reset
    clearGlobalRefPreference()

    // Clear session storage for randomizer states
    try {
      sessionStorage.removeItem('randomizer_diffs')
      sessionStorage.removeItem('randomizer_ratios')
    } catch { }

    let nextTokensRaw: any = tokensImport
    let nextThemeRaw: any = themeImport
    let nextUikitRaw: any = this.pristineUikit

    if (toOriginal) {
      // Reset to app defaults — clear ALL localStorage keys (imported + edited)
      if (this.lsAvailable) {
        try {
          localStorage.removeItem(STORAGE_KEYS.editedTokens)
          localStorage.removeItem(STORAGE_KEYS.editedBrand)
          localStorage.removeItem(STORAGE_KEYS.editedUikit)
          localStorage.removeItem(STORAGE_KEYS.importedTokens)
          localStorage.removeItem(STORAGE_KEYS.importedBrand)
          localStorage.removeItem(STORAGE_KEYS.importedUikit)
          localStorage.removeItem('recursica_has_imported')
        } catch {}
      }
    } else {
      // Reset to imported state — read imported keys, then clear edited keys
      if (this.lsAvailable) {
        try {
          const t = localStorage.getItem(STORAGE_KEYS.importedTokens)
          if (t) nextTokensRaw = JSON.parse(t)
          const b = localStorage.getItem(STORAGE_KEYS.importedBrand)
          if (b) nextThemeRaw = JSON.parse(b)
          const u = localStorage.getItem(STORAGE_KEYS.importedUikit)
          if (u) nextUikitRaw = JSON.parse(u)
        } catch {}

        // Clear edited keys so next reload picks up the imported snapshot
        try {
          localStorage.removeItem(STORAGE_KEYS.editedTokens)
          localStorage.removeItem(STORAGE_KEYS.editedBrand)
          localStorage.removeItem(STORAGE_KEYS.editedUikit)
        } catch {}
      }
    }

    // Reset state from deep-cloned state
    // This ensures we have fresh objects that haven't been mutated in-memory
    const tokens = JSON.parse(JSON.stringify(nextTokensRaw))
    const sortedTokens = sortFontTokenObjects(tokens as any)
    const normalizedTheme = JSON.parse(JSON.stringify(nextThemeRaw?.brand ? nextThemeRaw : { brand: nextThemeRaw }))
    const uikit = JSON.parse(JSON.stringify(nextUikitRaw))

    // Reset localStorage to original values
    if (this.lsAvailable) {
      // Dispatch event to notify components of the reset
      try { window.dispatchEvent(new CustomEvent('familyNamesChanged', {})) } catch { }

      // Dispatch events to notify palette components of reset
      try {
        for (const modeKey of ['light', 'dark']) {
          window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
            detail: { allPalettes: true, mode: modeKey, reset: true }
          }))
        }
      } catch { }
    }

    // Initialize elevation state (this will create elevation tokens in sortedTokens)
    const elevation = this.initElevationState(normalizedTheme as any, sortedTokens)

    // Reset state
    this.state = {
      tokens: sortedTokens,
      theme: normalizedTheme as any,
      uikit: uikit as any,
      palettes: defaultPaletteStore(),
      elevation,
      version: (this.state?.version || 0) + 1
    }

    // Ensure the DOM theme attribute is reset atomically before recomputation
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-mode', 'light')
      document.documentElement.setAttribute('data-recursica-theme', 'light')
      try { localStorage.setItem('recursica_theme_mode', 'light') } catch { }
    }

    // Recompute and apply all CSS variables from clean state
    // Reset the recomputing flag first since we're doing a full reset
    this.isRecomputing = false
    this.recomputeAndApplyAll()

    // Notify all listeners that state has been reset
    this.emit()

    // Dispatch events to notify components of the reset
    try {
      window.dispatchEvent(new CustomEvent('themeReset', {}))
      
      // Unconditionally trigger CSS variable update flush across the app
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { reset: true } }))
      
      window.dispatchEvent(new CustomEvent('paletteVarsChanged', {}))

      // Notify font components to rebuild rows from the now-cleared recursica_fonts
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: {}, reset: true } }))

      // Dispatch palettePrimaryLevelChanged events for all palettes in both modes
      // This ensures all PaletteGrid components re-read primary levels from theme JSON
      // Get palette keys from the reset state
      const root: any = normalizedTheme?.brand ? normalizedTheme.brand : normalizedTheme
      const themes = root?.themes || root
      const allPaletteKeys = new Set<string>()

      for (const modeKey of ['light', 'dark']) {
        const palettes = themes?.[modeKey]?.palettes || {}
        Object.keys(palettes).forEach(key => {
          if (key !== 'core' && key !== 'core-colors') {
            allPaletteKeys.add(key)
          }
        })
      }

      // Dispatch events for all palettes in both modes
      for (const modeKey of ['light', 'dark']) {
        for (const paletteKey of allPaletteKeys) {
          try {
            window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
              detail: { paletteKey, mode: modeKey, reset: true }
            }))
          } catch { }
        }
        // Also dispatch a general "all palettes" event for this mode
        try {
          window.dispatchEvent(new CustomEvent('palettePrimaryLevelChanged', {
            detail: { allPalettes: true, mode: modeKey, reset: true }
          }))
        } catch { }
      }
    } catch { }
  }

  private initElevationState(theme: any, tokens?: any, forceRebuildFromTheme = false): ElevationState {
    // Always build from theme JSON — CSS var values persist via the delta system.
    let controls: Record<'light' | 'dark', Record<string, ElevationControl>> = { light: {}, dark: {} }
    let colorTokens: Record<string, string> = {}
    let alphaTokens: Record<'light' | 'dark', Record<string, string>> = { light: {}, dark: {} }
    let paletteSelections: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>> = { light: {}, dark: {} }
    let baseXDirection: 'left' | 'right' = 'right'
    let baseYDirection: 'up' | 'down' = 'down'
    let directions: Record<'light' | 'dark', Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>> = { light: {}, dark: {} }
    let shadowColorControl: { colorToken: string; alphaToken: string } = { colorToken: '', alphaToken: '' }

    {
      // Build defaults from theme for both modes
      const brand: any = (theme as any)?.brand || (theme as any)
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = brand?.themes || brand
      const toNumeric = (ref?: any): number => {
        // Handle new structure: { $value: { value: number, unit: "px" }, $type: "number" }
        if (ref && typeof ref === 'object' && '$value' in ref) {
          const val = ref.$value
          if (val && typeof val === 'object' && 'value' in val) {
            return typeof val.value === 'number' ? val.value : Number(val.value) || 0
          }
          // Fallback: try to parse as number directly
          if (typeof val === 'number') return val
          if (typeof val === 'string') {
            const num = Number(val)
            return Number.isFinite(num) ? num : 0
          }
        }
        // Handle old structure: direct number or string
        if (typeof ref === 'number') return ref
        if (typeof ref === 'string') {
          const num = Number(ref)
          return Number.isFinite(num) ? num : 0
        }
        return 0
      }

      // Initialize controls for both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const modeElevations: any = themes?.[mode]?.elevations || {}
        controls[mode] = {}
        for (let i = 0; i <= 4; i++) {
          const node: any = modeElevations[`elevation-${i}`]?.['$value'] || {}
          const blurRaw = node?.blur
          const spreadRaw = node?.spread
          const xRaw = node?.x
          const yRaw = node?.y
          const blur = toNumeric(blurRaw)
          const spread = toNumeric(spreadRaw)
          const offsetX = toNumeric(xRaw)
          const offsetY = toNumeric(yRaw)
          const opacityRaw = node?.opacity
          // Parse opacity: brand JSON stores as percentage { value: 84, unit: 'percentage' } or 0-1 number
          let opacityNorm = 0.84 // sensible default
          if (opacityRaw && typeof opacityRaw === 'object' && '$value' in opacityRaw) {
            const ov = opacityRaw.$value
            if (ov && typeof ov === 'object' && 'value' in ov) {
              const raw = typeof ov.value === 'number' ? ov.value : Number(ov.value)
              opacityNorm = ov.unit === 'percentage' ? raw / 100 : raw
            } else if (typeof ov === 'number') {
              opacityNorm = ov > 1 ? ov / 100 : ov
            }
          } else if (typeof opacityRaw === 'number') {
            opacityNorm = opacityRaw > 1 ? opacityRaw / 100 : opacityRaw
          }
          controls[mode][`elevation-${i}`] = {
            blur,
            spread,
            offsetX,
            offsetY,
            opacity: Number(opacityNorm.toFixed(4)),
          }
        }
      }


      const parsePaletteSelection = (s?: string): { paletteKey: string; level: string } | null => {
        if (!s) return null
        // Only parse if we have tokens available
        const tokensToUse = tokens || this.state?.tokens
        if (!tokensToUse) return null
        const context: TokenReferenceContext = {
          currentMode: 'light',
          tokenIndex: buildTokenIndex(tokensToUse),
          theme: theme
        }
        const parsed = parseTokenReference(s, context)
        if (parsed && parsed.type === 'brand') {
          const pathStr = parsed.path.join('.')
          // Target format: palettes.neutral.500.color.tone
          const paletteFlexMatch = /^palettes?\.([a-z0-9-]+)\.([a-z0-9-]+)\.color\.(tone|on-tone)$/i.exec(pathStr)
          
          if (paletteFlexMatch) {
            const paletteKey = paletteFlexMatch[1]
            let level = paletteFlexMatch[2]
            
            // If level is 'default', try to resolve it from the theme
            if (level === 'default' || !level) {
              try {
                // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
                const brandRoot = (theme as any)?.brand || theme
                const themes = brandRoot?.themes || brandRoot
                const defaultRef = themes?.light?.palettes?.[paletteKey]?.default
                if (defaultRef) {
                  let defaultValue: any
                  if (typeof defaultRef === 'object' && defaultRef.$value) {
                    defaultValue = defaultRef.$value
                  } else if (typeof defaultRef === 'string') {
                    defaultValue = defaultRef
                  }

                  if (defaultValue && typeof defaultValue === 'string') {
                    const defaultParsed = parseTokenReference(defaultValue, context)
                    if (defaultParsed && defaultParsed.type === 'brand') {
                      const defaultPathParts = defaultParsed.path
                      // Check if it's a palette reference: palettes.{paletteKey}.{level}
                      if (defaultPathParts.length >= 2 && defaultPathParts[0] === 'palettes' && defaultPathParts[1] === paletteKey) {
                        level = defaultPathParts[2] || 'primary'
                      }
                    } else {
                      // Try to extract level number from end of path
                      const defaultInner = extractBraceContent(defaultValue)
                      if (defaultInner) {
                        const levelMatch = /\.(\d+)$/.exec(defaultInner)
                        if (levelMatch) {
                          level = levelMatch[1]
                        }
                      }
                    }
                  }
                }
                // If we couldn't resolve default, use 'primary' as fallback
                if (level === 'default' || !level) {
                  level = 'primary'
                }
              } catch {
                level = 'primary'
              }
            }
            if (level === 'primary') {
              // Try to get primary level from palette
              try {
                // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
                const brandRoot = (theme as any)?.brand || theme
                const themes = brandRoot?.themes || brandRoot
                const primaryLevel = themes?.light?.palettes?.[paletteKey]?.['primary-level']?.$value
                if (typeof primaryLevel === 'string') {
                  level = primaryLevel
                } else {
                  // Default to 500 if no primary level specified
                  level = '500'
                }
              } catch {
                level = '500'
              }
            }
            return { paletteKey, level }
          }
        }
        return null
      }
      // Get light mode elevations for shadow color control and palette selections (these are mode-independent settings)
      const lightElevations: any = themes?.light?.elevations || {}
      const elev1: any = lightElevations?.['elevation-1']?.['$value'] || {}
      shadowColorControl = { colorToken: '', alphaToken: '' }

      // Initialize palette selections from brand.json for each elevation, per mode
      const initialPaletteSelections: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>> = { light: {}, dark: {} }
      for (const m of ['light', 'dark'] as const) {
        const modeElevations: any = themes?.[m]?.elevations || {}
        for (let i = 0; i <= 4; i++) {
          const elev: any = modeElevations?.[`elevation-${i}`]?.['$value'] || {}
          const colorRef = elev?.color?.['$value'] ?? elev?.color
          const paletteSel = parsePaletteSelection(colorRef)
          if (paletteSel) {
            initialPaletteSelections[m][`elevation-${i}`] = paletteSel
          }
        }
      }
      const baseX = Number((elev1?.['x-direction']?.['$value'] ?? 1))
      const baseY = Number((elev1?.['y-direction']?.['$value'] ?? 1))
      baseXDirection = baseX >= 0 ? 'right' : 'left'
      baseYDirection = baseY >= 0 ? 'down' : 'up'

      // Initialize directions per mode from theme
      for (const mode of ['light', 'dark'] as const) {
        const modeElevations: any = themes?.[mode]?.elevations || {}
        const modeElev1: any = modeElevations?.['elevation-1']?.['$value'] || {}
        const modeBaseX = Number((modeElev1?.['x-direction']?.['$value'] ?? baseX))
        const modeBaseY = Number((modeElev1?.['y-direction']?.['$value'] ?? baseY))
        const modeXDir = modeBaseX >= 0 ? 'right' : 'left'
        const modeYDir = modeBaseY >= 0 ? 'down' : 'up'
        directions[mode] = {}
        for (let i = 1; i <= 4; i += 1) {
          directions[mode][`elevation-${i}`] = { x: modeXDir, y: modeYDir }
        }
      }
      paletteSelections = { light: { ...initialPaletteSelections.light }, dark: { ...initialPaletteSelections.dark } }
      // Overlay user-customized palette selections persisted from previous sessions
      if (isLocalStorageAvailable()) {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.elevationPaletteSelections)
          if (saved) {
            const parsed: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>> = JSON.parse(saved)
            if (parsed && typeof parsed === 'object') {
              if (parsed.light && typeof parsed.light === 'object') Object.assign(paletteSelections.light, parsed.light)
              if (parsed.dark && typeof parsed.dark === 'object') Object.assign(paletteSelections.dark, parsed.dark)
            }
          }
        } catch { /* corrupt storage — ignore */ }
      }
    }

    // Initialize token references if not already set
    const blurTokens: Record<string, string> = {}
    const spreadTokens: Record<string, string> = {}
    const offsetXTokens: Record<string, string> = {}
    const offsetYTokens: Record<string, string> = {}
    for (let i = 0; i <= 4; i++) {
      const k = `elevation-${i}`
      blurTokens[k] = `size/elevation-${i}-blur`
      spreadTokens[k] = `size/elevation-${i}-spread`
      offsetXTokens[k] = `size/elevation-${i}-offset-x`
      offsetYTokens[k] = `size/elevation-${i}-offset-y`
    }

    // Build the elevation state from computed values (always from theme JSON)
    const finalState: ElevationState = {
      controls,
      colorTokens,
      alphaTokens,
      blurTokens,
      spreadTokens,
      offsetXTokens,
      offsetYTokens,
      paletteSelections,
      baseXDirection,
      baseYDirection,
      directions,
      shadowColorControl
    }

    // Ensure mode-specific structures exist
    if (!finalState.alphaTokens.light) finalState.alphaTokens.light = {}
    if (!finalState.alphaTokens.dark) finalState.alphaTokens.dark = {}
    if (!finalState.directions.light) finalState.directions.light = {}
    if (!finalState.directions.dark) finalState.directions.dark = {}

    // Ensure token references are set
    // Use finalState tokens if available, otherwise use initialized defaults
    if (finalState.blurTokens) Object.assign(blurTokens, finalState.blurTokens)
    if (finalState.spreadTokens) Object.assign(spreadTokens, finalState.spreadTokens)
    if (finalState.offsetXTokens) Object.assign(offsetXTokens, finalState.offsetXTokens)
    if (finalState.offsetYTokens) Object.assign(offsetYTokens, finalState.offsetYTokens)

    // Get or create tokens structure
    if (!tokens) tokens = {}
    if (!(tokens as any).tokens) (tokens as any).tokens = {}

    // Ensure size tokens structure exists (use plural 'sizes' to match updateToken)
    if (!(tokens as any).tokens.sizes) (tokens as any).tokens.sizes = {}
    const sizeTokens = (tokens as any).tokens.sizes

    // Use controls from finalState
    const finalControls = finalState.controls || {}
    const baseCtrl = (finalControls as Record<string, any>)['elevation-0']

    for (let i = 0; i <= 4; i++) {
      const k = `elevation-${i}`
      const ctrl = (finalControls as Record<string, any>)[k] || baseCtrl

      // Set token references for elevation state tracking
      const blurTokenName = `size/elevation-${i}-blur`
      const spreadTokenName = `size/elevation-${i}-spread`
      const offsetXTokenName = `size/elevation-${i}-offset-x`
      const offsetYTokenName = `size/elevation-${i}-offset-y`

      if (!blurTokens[k]) blurTokens[k] = blurTokenName
      if (!spreadTokens[k]) spreadTokens[k] = spreadTokenName
      if (!offsetXTokens[k]) offsetXTokens[k] = offsetXTokenName
      if (!offsetYTokens[k]) offsetYTokens[k] = offsetYTokenName

      // Create elevation tokens in the tokens structure if they don't exist
      // These tokens are needed for CSS variable generation (referenced as --recursica_tokens_size_elevation_X-blur, etc.)
      if (ctrl) {
        const blurKey = `elevation-${i}-blur`
        const spreadKey = `elevation-${i}-spread`
        const offsetXKey = `elevation-${i}-offset-x`
        const offsetYKey = `elevation-${i}-offset-y`

        if (!sizeTokens[blurKey]) {
          sizeTokens[blurKey] = { $type: 'number', $value: ctrl.blur || 0 }
        }
        if (!sizeTokens[spreadKey]) {
          sizeTokens[spreadKey] = { $type: 'number', $value: ctrl.spread || 0 }
        }
        if (!sizeTokens[offsetXKey]) {
          sizeTokens[offsetXKey] = { $type: 'number', $value: ctrl.offsetX || 0 }
        }
        if (!sizeTokens[offsetYKey]) {
          sizeTokens[offsetYKey] = { $type: 'number', $value: ctrl.offsetY || 0 }
        }
      }
    }

    return { ...finalState, blurTokens, spreadTokens, offsetXTokens, offsetYTokens }
  }

  private readTypeChoices(): TypographyChoices {
    try { const raw = localStorage.getItem('recursica_type_token_choices'); return raw ? JSON.parse(raw) : {} } catch { return {} }
  }

  private getCurrentMode(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('recursica_theme_mode') as 'light' | 'dark' | null
      return saved ?? 'light'
    } catch {
      return 'light'
    }
  }

  public switchMode(mode: 'light' | 'dark') {
    try {
      localStorage.setItem('recursica_theme_mode', mode)
    } catch { }
    // Skip if already recomputing to prevent infinite loops
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
      // Compliance scan runs automatically via scheduleComplianceScan at end of recomputeAndApplyAll
    }
  }

  public recomputeAndApplyAll() {

    // Prevent recursive calls - if already recomputing, skip to avoid infinite loops
    if (this.isRecomputing) {
      return
    }
    this.isRecomputing = true
    
    if (typeof document !== 'undefined') {
      const domTheme = document.documentElement.getAttribute('data-recursica-theme')
      const currentMode = this.getCurrentMode()
      console.debug(`[recomputeAndApplyAll] DOM theme: ${domTheme}, Current Mode: ${currentMode}`)
    }

    // Clear overlay CSS variables from DOM before recomputing to ensure new values from theme JSON are used
    if (typeof document !== 'undefined') {
      const overlayVars = [
        '--recursica_brand_themes_light_states_overlay_color',
        '--recursica_brand_themes_light_states_overlay_opacity',
        '--recursica_brand_themes_dark_states_overlay_color',
        '--recursica_brand_themes_dark_states_overlay_opacity'
      ]
      overlayVars.forEach((cssVar) => {
        document.documentElement.style.removeProperty(cssVar)
      })
    }

    // Suppress cssVarsUpdated events during bulk update to prevent infinite loops
    suppressCssVarEvents(true)

    // Build complete CSS variable map from current state
    // Note: Tokens are now the single source of truth - no overrides needed
    const currentMode = this.getCurrentMode()
    const allVars: Record<string, string> = {}
    // Declare uikitVars outside try block so it's accessible in finally block
    let uikitVars: Record<string, string> = {}
    // Track which UIKit vars actually changed to avoid unnecessary re-renders
    const changedUikitVars = new Set<string>()
    let actuallyChangedVars: string[] = []

    try {

      // Tokens: expose size tokens as CSS vars under --recursica_tokens_sizes_<key>
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}

        // Elevation tokens should NOT be in tokens - they belong in brand.json
        // CSS variables for elevations are generated directly from brand.json elevations

        // Use sizes (plural) - the store now uses plural consistently
        const sizesRoot: any = tokensRoot?.sizes || {}

        if (!sizesRoot || typeof sizesRoot !== 'object' || Array.isArray(sizesRoot) || Object.keys(sizesRoot).length === 0) {
        } else {
          const vars: Record<string, string> = {}
          const toPxString = (v: any): string | undefined => {
            if (v == null) return undefined
            if (typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) {
              const val: any = (v as any).value
              const unit: any = (v as any).unit
              if (typeof val === 'number') return unit ? `${val}${unit}` : `${val}px`
              return typeof val === 'string' ? val : undefined
            }
            if (typeof v === 'number') return `${v}px`
            if (typeof v === 'string') {
              // if numeric string, append px; else assume it already has a unit
              return /^-?\d+(\.\d+)?$/.test(v.trim()) ? `${v.trim()}px` : v.trim()
            }
            return undefined
          }
          const elevationTokensFound: string[] = []
          Object.keys(sizesRoot).forEach((short) => {
            if (short.startsWith('$')) return
            const sizeObj = sizesRoot[short]
            if (!sizeObj || typeof sizeObj !== 'object') return
            const val = sizeObj.$value
            const px = toPxString(val)
            if (typeof px === 'string' && px) {
              vars[tokenSize(short)] = px
              if (short.includes('elevation')) {
                elevationTokensFound.push(short)
              }
            }
          })
          Object.assign(allVars, vars)
        }
      } catch { }
      // Tokens: expose opacity tokens as CSS vars under --recursica_tokens_opacities_<key> (normalized 0..1)
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}

        // Elevation opacity tokens should NOT be in tokens - they belong in brand.json
        // CSS variables for elevations are generated directly from brand.json elevations

        // Use opacities (plural) - the store now uses plural consistently
        const finalOpacityRoot: any = tokensRoot?.opacities || {}

        if (!finalOpacityRoot || typeof finalOpacityRoot !== 'object' || Array.isArray(finalOpacityRoot) || Object.keys(finalOpacityRoot).length === 0) {
          // Skip if opacityRoot is not a valid object or is empty
        } else {
          const vars: Record<string, string> = {}
          const normalize = (v: any): string | undefined => {
            try {
              const n = typeof v === 'number' ? v : (typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) ? Number((v as any).value) : Number(v)
              if (!Number.isFinite(n)) return undefined
              const val = n <= 1 ? n : n / 100
              return String(Math.max(0, Math.min(1, val)))
            } catch { return undefined }
          }
          Object.keys(finalOpacityRoot).forEach((short) => {
            if (short.startsWith('$')) return
            const opacityObj = finalOpacityRoot[short]
            if (!opacityObj || typeof opacityObj !== 'object') return
            const v = opacityObj.$value
            const norm = normalize(v)
            if (typeof norm === 'string') {
              vars[tokenOpacity(short)] = norm
            }
          })
          Object.assign(allVars, vars)
        }
      } catch { }
      // Tokens: expose color tokens as CSS vars under --recursica_tokens_colors_<scale>_<level>
      // New structure: tokens.colors.scale-XX.XXX with alias property
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
        const colorsRoot: any = tokensRoot?.colors
        const vars: Record<string, string> = {}
        const processedKeys = new Set<string>()

        // Process new scale structure (scale-01, scale-02, etc.)
        if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
          Object.keys(colorsRoot).forEach((scaleKey) => {
            if (!scaleKey || typeof scaleKey !== 'string' || !scaleKey.startsWith('scale-')) return
            const scale = colorsRoot[scaleKey]
            if (!scale || typeof scale !== 'object' || Array.isArray(scale)) return

            const alias = scale.alias // Get the alias (e.g., "cornflower", "gray")

            // Emit family-name CSS var for the display name
            if (typeof alias === 'string' && alias) {
              const displayName = alias.charAt(0).toUpperCase() + alias.slice(1)
              vars[tokenColorFamilyName(scaleKey)] = displayName
            }

            Object.keys(scale).forEach((lvl) => {
              // Skip the alias property
              if (lvl === 'alias') return
              // Accept levels that are: 2-4 digits, or exactly '000' or '050'
              if (!/^(\d{2,4}|000|050)$/.test(lvl)) return

              const levelObj = scale[lvl]
              if (!levelObj || typeof levelObj !== 'object') return

              // Preserve 000 and 1000 as-is, pad others to 3 digits
              const normalizedLevel = lvl === '000' ? '000' : lvl === '1000' ? '1000' : String(lvl).padStart(3, '0')

              // Generate CSS vars for scale name only (no alias-based vars)
              const scaleCssVarKey = tokenColors(scaleKey, normalizedLevel)

              // Read directly from token value
              const val = levelObj.$value
              if (typeof val === 'string' && val) {
                vars[scaleCssVarKey] = String(val)
                processedKeys.add(scaleCssVarKey)
              }
            })
          })
        }



        Object.assign(allVars, vars)
      } catch { }
      // Tokens: expose font cases and decorations as CSS vars under --recursica_tokens_font_cases_<key> and --recursica_tokens_font_decorations_<key>
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
        const fontRoot: any = tokensRoot?.font || {}

        // Generate font cases CSS variables
        const casesRoot: any = fontRoot?.cases || {}
        if (casesRoot && typeof casesRoot === 'object' && !Array.isArray(casesRoot)) {
          const vars: Record<string, string> = {}
          Object.keys(casesRoot).forEach((caseKey) => {
            if (caseKey.startsWith('$')) return
            const caseObj = casesRoot[caseKey]
            if (!caseObj || typeof caseObj !== 'object') return
            const val = caseObj.$value
            // Font cases can be null (for "original") or a string value
            if (val === null || val === undefined) {
              vars[tokenFont('cases', caseKey)] = 'none'
            } else if (typeof val === 'string') {
              vars[tokenFont('cases', caseKey)] = val
            }
          })
          Object.assign(allVars, vars)
        }

        // Generate font decorations CSS variables
        const decorationsRoot: any = fontRoot?.decorations || {}
        if (decorationsRoot && typeof decorationsRoot === 'object' && !Array.isArray(decorationsRoot)) {
          const vars: Record<string, string> = {}
          Object.keys(decorationsRoot).forEach((decorationKey) => {
            if (decorationKey.startsWith('$')) return
            const decorationObj = decorationsRoot[decorationKey]
            if (!decorationObj || typeof decorationObj !== 'object') return
            const val = decorationObj.$value
            // Font decorations can be null (for "none") or a string value
            if (val === null || val === undefined) {
              vars[tokenFont('decorations', decorationKey)] = 'none'
            } else if (typeof val === 'string') {
              vars[tokenFont('decorations', decorationKey)] = val
            }
          })
          Object.assign(allVars, vars)
        }
      } catch { }
      // Tokens: expose ALL font token categories as CSS vars
      // This ensures font CSS variables are available on every page, not just the font tokens page
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
        const fontRoot: any = tokensRoot?.font || {}
        const vars: Record<string, string> = {}

        // Read font typefaces exclusively from recursica_fonts local storage
        let storedFonts: any[] = []
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('recursica_fonts')
            if (raw) storedFonts = JSON.parse(raw)
          }
        } catch { }

        // Font typefaces (e.g., --recursica_tokens_font_typefaces_primary)
        // First, CLEAR all existing font typeface CSS vars from the DOM to remove stale deleted ones
        if (typeof document !== 'undefined') {
          const docStyle = document.documentElement.style
          const propsToRemove: string[] = []
          for (let i = 0; i < docStyle.length; i++) {
            const prop = docStyle[i]
            if (prop && (prop.startsWith(tokenFont('typefaces', '')) || prop.startsWith(tokenFont('families', '')))) {
              propsToRemove.push(prop)
            }
          }
          propsToRemove.forEach(prop => docStyle.removeProperty(prop))
        }

        if (Array.isArray(storedFonts) && storedFonts.length > 0) {
          const ORDER_LEVELS = new Set(['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'])
          storedFonts.forEach(font => {
            if (font.id && font.family) {
              let cleanFamily = font.family.trim().replace(/^["']|["']$/g, '')
              if (cleanFamily.includes(',')) cleanFamily = cleanFamily.split(',')[0].trim()
              const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily
              const fontStack = `${quotedName}, ${font.category || 'sans-serif'}`
              const slug = font.slug ||
                cleanFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
              // Named slug entries carry the actual font stack (raw CSS value)
              vars[tokenFont('typefaces', slug)] = fontStack
              vars[tokenFont('families', slug)] = fontStack
              // brand.fonts.{id} → var(--recursica_tokens_font_typefaces_{slug})
              // Brand vars must reference token vars, not raw values
              if (ORDER_LEVELS.has(font.id)) {
                vars[`--recursica_brand_fonts_${font.id}`] = `var(${tokenFont('typefaces', slug)})`
              }
            }
          })
        } else {
          // No recursica_fonts in localStorage (fresh load / cache cleared):
          // Emit brand.fonts CSS vars by resolving each brand.fonts.{level} alias
          // through the token store → tokens.font.typefaces.{slug}.$value
          const brandRoot: any = (this.state.theme as any)?.brand || this.state.theme
          const brandFonts: any = brandRoot?.fonts || {}
          const typefaces: any = tokensRoot?.font?.typefaces || {}
          const ORDER_LEVELS = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']
          ORDER_LEVELS.forEach(level => {
            const brandFontEntry = brandFonts[level]
            if (!brandFontEntry?.$value) return
            // Resolve alias: {tokens.font.typefaces.lexend} → slug → token entry
            const aliasMatch = String(brandFontEntry.$value).match(/\{tokens\.font\.typefaces\.([^}]+)\}/)
            if (!aliasMatch) return
            const slug = aliasMatch[1]
            const typefaceEntry = typefaces[slug]
            if (!typefaceEntry) return
            const raw = typefaceEntry.$value
            let family = ''
            let category = 'sans-serif'
            if (Array.isArray(raw) && raw.length > 0) {
              family = typeof raw[0] === 'string' ? raw[0].trim().replace(/^["']|["']$/g, '') : ''
              if (raw[1] === 'serif' || raw[1] === 'monospace') category = raw[1]
            } else if (typeof raw === 'string') {
              family = raw.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
            }
            if (!family) return
            const quotedName = family.includes(' ') ? `"${family}"` : family
            const fontStack = `${quotedName}, ${category}`
            // Token vars hold the raw font stack
            vars[tokenFont('typefaces', slug)] = fontStack
            vars[tokenFont('families', slug)] = fontStack
            // Brand vars reference the token vars
            vars[`--recursica_brand_fonts_${level}`] = `var(${tokenFont('typefaces', slug)})`
          })
        }

        // Font weights (e.g., --recursica_tokens_font_weights_regular)
        const weights: any = fontRoot?.weights || fontRoot?.weight || {}
        if (weights && typeof weights === 'object') {
          Object.keys(weights).forEach(key => {
            if (key.startsWith('$')) return
            const rec = weights[key]
            const val = rec?.$value !== undefined ? rec.$value : rec
            if (val !== undefined && val !== null) {
              vars[tokenFont('weights', key)] = String(val)
            }
          })
        }

        // Font sizes (e.g., --recursica_tokens_font_sizes_md)
        const sizes: any = fontRoot?.sizes || fontRoot?.size || {}
        if (sizes && typeof sizes === 'object') {
          Object.keys(sizes).forEach(key => {
            if (key.startsWith('$')) return
            const rec = sizes[key]
            const val = rec?.$value
            if (val !== undefined && val !== null) {
              // Handle {value, unit} dimension objects (DTCG format)
              if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
                const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
                const unit = (val as any).unit || 'px'
                if (Number.isFinite(num)) vars[tokenFont('sizes', key)] = `${num}${unit}`
              } else {
                const num = typeof val === 'number' ? val : Number(val)
                if (Number.isFinite(num)) {
                  vars[tokenFont('sizes', key)] = `${num}px`
                } else if (typeof val === 'string') {
                  vars[tokenFont('sizes', key)] = val
                }
              }
            }
          })
        }

        // Font letter-spacings (e.g., --recursica_tokens_font_letter-spacings_default)
        const letterSpacings: any = fontRoot?.['letter-spacings'] || fontRoot?.['letter-spacing'] || {}
        if (letterSpacings && typeof letterSpacings === 'object') {
          Object.keys(letterSpacings).forEach(key => {
            if (key.startsWith('$')) return
            const rec = letterSpacings[key]
            const val = rec?.$value
            if (val !== undefined && val !== null) {
              if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
                const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
                const unit = (val as any).unit || 'rem'
                if (Number.isFinite(num)) vars[tokenFont('letter-spacings', key)] = `${num}${unit}`
              } else {
                const num = typeof val === 'number' ? val : Number(val)
                if (Number.isFinite(num)) {
                  vars[tokenFont('letter-spacings', key)] = `${num}rem`
                } else if (typeof val === 'string') {
                  vars[tokenFont('letter-spacings', key)] = val
                }
              }
            }
          })
        }

        // Font line-heights (e.g., --recursica_tokens_font_line-heights_normal)
        const lineHeights: any = fontRoot?.['line-heights'] || fontRoot?.['line-height'] || {}
        if (lineHeights && typeof lineHeights === 'object') {
          Object.keys(lineHeights).forEach(key => {
            if (key.startsWith('$')) return
            const rec = lineHeights[key]
            const val = rec?.$value
            if (val !== undefined && val !== null) {
              if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'value')) {
                const num = typeof (val as any).value === 'number' ? (val as any).value : Number((val as any).value)
                const unit = (val as any).unit || 'rem'
                if (Number.isFinite(num)) vars[tokenFont('line-heights', key)] = `${num}${unit}`
              } else {
                vars[tokenFont('line-heights', key)] = String(val)
              }
            }
          })
        }

        // Font styles (e.g., --recursica_tokens_font_styles_normal)
        const styles: any = fontRoot?.styles || fontRoot?.style || {}
        if (styles && typeof styles === 'object') {
          Object.keys(styles).forEach(key => {
            if (key.startsWith('$')) return
            const rec = styles[key]
            const val = rec?.$value
            if (typeof val === 'string' && val.trim()) {
              vars[tokenFont('styles', key)] = val.trim()
            }
          })
        }

        Object.assign(allVars, vars)
      } catch { }
      // Core palette colors (black/white/alert/warning/success/interactive) - read directly from theme JSON
      // Generate for both light and dark modes
      try {
        const root: any = (this.state.theme as any)?.brand ? (this.state.theme as any).brand : this.state.theme
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root



        const normalizeLevel = (lvl?: string): string | undefined => {
          if (!lvl) return undefined
          const s = String(lvl).padStart(3, '0')
          // Preserve 000 and 1000 as-is - don't normalize them
          if (s === '000') return '000'
          if (s === '1000') return '1000'
          const allowed = new Set(['900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000', '1000'])
          return allowed.has(s) ? s : undefined
        }

        // Process both light and dark modes
        for (const mode of ['light', 'dark'] as const) {
          // Get core-colors object - it may have $value wrapper or be direct
          const coreColorsObj: any = themes?.[mode]?.palettes?.['core-colors'] || themes?.[mode]?.palettes?.core
          // Extract the actual colors object (handle both $value wrapper and direct structure)
          const core: any = coreColorsObj?.$value || coreColorsObj || {}

          // Map core color names to CSS variable names
          // Use --recursica_brand_themes_ format to match palettes.ts resolver
          const coreColorMap: Record<string, string> = {
            black: `--recursica_brand_themes_${mode}_palettes_core-colors_black`,
            white: `--recursica_brand_themes_${mode}_palettes_core-colors_white`,
            alert: `--recursica_brand_themes_${mode}_palettes_core-colors_alert`,
            warning: `--recursica_brand_themes_${mode}_palettes_core-colors_warning`,
            success: `--recursica_brand_themes_${mode}_palettes_core-colors_success`,
            interactive: `--recursica_brand_themes_${mode}_palettes_core-colors_interactive`,
          }

          // Default fallbacks if theme JSON doesn't have the value
          const defaults: Record<string, string> = {
            black: mode === 'light' ? 'color/gray/1000' : 'color/gray/000',
            white: mode === 'light' ? 'color/gray/000' : 'color/gray/1000',
            alert: mode === 'light' ? 'color/mandy/600' : 'color/mandy/400',
            warning: mode === 'light' ? 'color/mandarin/600' : 'color/mandarin/400',
            success: mode === 'light' ? 'color/greensheen/600' : 'color/greensheen/400',
            interactive: mode === 'light' ? 'color/mandy/500' : 'color/mandy/400',
          }

          const colors: Record<string, string> = {}

          // Helper function to resolve a token reference using centralized parser
          const resolveTokenRef = (value: any): string | null => {
            const context: TokenReferenceContext = {
              currentMode: mode,
              tokenIndex: buildTokenIndex(this.state.tokens),
              theme: this.state.theme
            }
            return resolveTokenReferenceToCssVar(value, context)
          }

          // Process each core color
          Object.entries(coreColorMap).forEach(([colorName, cssVar]) => {
            // Get the value from theme JSON - core should now be the direct colors object
            const coreValue: any = core[colorName]
            let tokenRef: string | null = null

            // Special handling for interactive (nested structure)
            if (colorName === 'interactive' && coreValue && typeof coreValue === 'object' && !coreValue.$value) {
              // Handle flat structure: interactive.tone, interactive.on-tone
              const tone = coreValue.tone?.$value || coreValue.tone || coreValue.default?.tone?.$value || coreValue.default?.tone
              const onTone = coreValue['on-tone']?.$value || coreValue['on-tone'] || coreValue.default?.['on-tone']?.$value || coreValue.default?.['on-tone']

              // Main interactive var (backward compatibility) maps to tone
              if (tone) {
                tokenRef = resolveTokenRef(tone)
              }

              // Generate CSS vars for the flat structure
              if (tone) {
                const toneRef = resolveTokenRef(tone)
                if (toneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core-colors_interactive_tone`] = toneRef
                }
              }
              if (onTone) {
                const onToneRef = resolveTokenRef(onTone)
                if (onToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core-colors_interactive_on-tone`] = onToneRef
                }
              }
            } else if (coreValue && typeof coreValue === 'object' && !coreValue.$value) {
              // Handle new structure: each core color has tone, on-tone, and interactive
              const tone = coreValue.tone?.$value || coreValue.tone
              const onTone = coreValue['on-tone']?.$value || coreValue['on-tone']
              const interactive = coreValue.interactive?.$value || coreValue.interactive

              // Main tone var (backward compatibility)
              if (tone) {
                tokenRef = resolveTokenRef(tone)
              }

              // Generate additional CSS vars for new structure
              // Use --recursica_brand_themes_ format to match palettes.ts resolver
              if (tone) {
                const toneRef = resolveTokenRef(tone)
                if (toneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core-colors_${colorName}_tone`] = toneRef
                }
              }
              if (onTone) {
                const onToneRef = resolveTokenRef(onTone)
                if (onToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core-colors_${colorName}_on-tone`] = onToneRef
                }
              }
              if (interactive) {
                const interactiveRef = resolveTokenRef(interactive)
                if (interactiveRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core-colors_${colorName}_interactive`] = interactiveRef
                }
              }
            } else {
              // Handle simple string values for backward compatibility
              tokenRef = resolveTokenRef(coreValue)
            }

            // Fallback to default if parsing failed
            if (!tokenRef) {
              const defaultToken = defaults[colorName]
              if (defaultToken) {
                const parts = defaultToken.split('/')
                if (parts.length === 3 && parts[0] === 'color') {
                  const family = parts[1]
                  const level = normalizeLevel(parts[2])
                  if (family && level) {
                    tokenRef = `var(--recursica_tokens_color_${family}-${level})`
                  }
                }
              }
            }

            // Last resort fallback
            if (!tokenRef) {
              tokenRef = 'var(--recursica_tokens_color_gray_500)'
            }

            colors[cssVar] = tokenRef
          })

          Object.assign(allVars, colors)
        }
      } catch { }
      // Palettes - generate for both modes
      const paletteVarsLight = buildPaletteVars(this.state.tokens, this.state.theme, 'Light')
      const paletteVarsDark = buildPaletteVars(this.state.tokens, this.state.theme, 'Dark')
      const allPaletteVars = { ...paletteVarsLight, ...paletteVarsDark }

      Object.assign(allVars, allPaletteVars)

      // Layers (from Brand) - generate for both modes
      const layerVarsLight = buildLayerVars(this.state.tokens, this.state.theme, 'light', undefined, allPaletteVars)
      const layerVarsDark = buildLayerVars(this.state.tokens, this.state.theme, 'dark', undefined, allPaletteVars)
      const layerVars = { ...layerVarsLight, ...layerVarsDark }

      Object.assign(allVars, layerVars)
      // Dimensions - generate for both modes (dimensions are mode-agnostic but vars are generated for both)
      try {
        const dimensionVarsLight = buildDimensionVars(this.state.tokens, this.state.theme, 'light')
        const dimensionVarsDark = buildDimensionVars(this.state.tokens, this.state.theme, 'dark')
        Object.assign(allVars, dimensionVarsLight)
        Object.assign(allVars, dimensionVarsDark)
      } catch { }

      // ─── Compliance is read-only ───
      // Compliance no longer modifies vars in the pipeline.

      // UIKit components - generate for all modes during bootstrap
      try {
        const uikitVarsLight = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit, 'light')
        const uikitVarsDark = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit, 'dark')
        uikitVars = { ...uikitVarsLight, ...uikitVarsDark }

        const currentMode = this.getCurrentMode()
        const currentModePrefix = `--recursica_ui-kit_themes_${currentMode}_`
        const nonThemedPrefix = '--recursica_ui-kit_'
        const currentModeVars = currentMode === 'light' ? uikitVarsLight : uikitVarsDark
        for (const [themedKey, value] of Object.entries(currentModeVars)) {
          if (themedKey.startsWith(currentModePrefix)) {
            const nonThemedKey = nonThemedPrefix + themedKey.slice(currentModePrefix.length)
            uikitVars[nonThemedKey] = value
          }
        }

        if (typeof document !== 'undefined') {
          const preservedVars: Record<string, string> = {}

          const isModeIndependent = (cssVar: string): boolean => {
            return !cssVar.includes('_properties_colors_')
          }

          const getOppositeModeVar = (cssVar: string): string => {
            if (cssVar.includes('_themes_light_')) {
              return cssVar.replace('_themes_light_', '_themes_dark_')
            } else if (cssVar.includes('_themes_dark_')) {
              return cssVar.replace('_themes_dark_', '_themes_light_')
            }
            return cssVar
          }

          for (const [cssVar, generatedValue] of Object.entries(uikitVars)) {
            if (!isModeIndependent(cssVar)) {
              continue
            }

            const inlineValueRaw = document.documentElement.style.getPropertyValue(cssVar)
            const inlineValue = inlineValueRaw ? inlineValueRaw.trim() : ''

            if (inlineValue && inlineValue !== generatedValue?.trim()) {
              preservedVars[cssVar] = inlineValue
              const oppositeModeVar = getOppositeModeVar(cssVar)
              preservedVars[oppositeModeVar] = inlineValue
            }
          }
          Object.assign(uikitVars, preservedVars)
        }

        if (typeof document !== 'undefined') {
          for (const [cssVar, generatedValue] of Object.entries(uikitVars)) {
            const generatedValueTrimmed = generatedValue ? generatedValue.trim() : ''
            const inlineValueRaw = document.documentElement.style.getPropertyValue(cssVar)
            const inlineValue = inlineValueRaw ? inlineValueRaw.trim() : ''

            if (inlineValue && inlineValue.startsWith('{') && inlineValue.includes('brand.themes')) {
              if (generatedValueTrimmed.startsWith('{') || !generatedValueTrimmed.startsWith('var(')) {
                delete uikitVars[cssVar]
                continue
              }
            }

            if (generatedValueTrimmed !== inlineValue) {
              changedUikitVars.add(cssVar)
            }
          }
        }

        Object.assign(allVars, uikitVars)
      } catch { }
      // Typography
      const typeChoices = this.readTypeChoices()
      const { vars: typeVars, familiesToLoad } = buildTypographyVars(this.state.tokens, this.state.theme, undefined, typeChoices)

      Object.assign(allVars, typeVars)

      // Re-apply recursica_fonts font stacks AFTER typography merge, keyed by SLUG (not font.id).
      try {
        let fontsForOverride: any[] = []
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('recursica_fonts')
            if (raw) fontsForOverride = JSON.parse(raw)
          }
        } catch { }
        if (Array.isArray(fontsForOverride) && fontsForOverride.length > 0) {
          fontsForOverride.forEach((font: any) => {
            if (font.id && font.family) {
              let cleanFamily = font.family.trim().replace(/^["']|["']$/g, '')
              if (cleanFamily.includes(',')) cleanFamily = cleanFamily.split(',')[0].trim()
              const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily
              const fontStack = `${quotedName}, ${font.category || 'sans-serif'}`
              // Use slug as key (matches how tokens are written), NOT font.id (sequence name)
              const slug = font.slug ||
                cleanFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
              allVars[tokenFont('typefaces', slug)] = fontStack
              allVars[tokenFont('families', slug)] = fontStack
              // Brand vars must reference token vars
              const ORDER_LEVELS = new Set(['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'])
              if (ORDER_LEVELS.has(font.id)) {
                allVars[`--recursica_brand_fonts_${font.id}`] = `var(${tokenFont('typefaces', slug)})`
              }
            }
          })
        }
      } catch { }

      // Load fonts
      const actualFamiliesToLoad: string[] = []
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('recursica_fonts') : null
        const storedForLoad: any[] = raw ? JSON.parse(raw) : []
        storedForLoad.forEach((font: any) => {
          if (font.family) {
            const clean = font.family.trim().replace(/^["']|["']$/g, '').split(',')[0].trim()
            if (clean) actualFamiliesToLoad.push(clean)
          }
        })
      } catch { }
      const familiesToLoadResolved = actualFamiliesToLoad.length > 0 ? actualFamiliesToLoad : familiesToLoad.filter(f => !f.startsWith('var('))

      if (familiesToLoadResolved.length > 0 && typeof window !== 'undefined') {
        Promise.all(familiesToLoadResolved.map(async (family) => {
          try {
            const trimmed = String(family).trim()
            if (!trimmed) return
            const { ensureFontLoaded } = await import('../../modules/type/fontUtils')
            await ensureFontLoaded(trimmed).catch(() => {})
          } catch { }
        })).catch(() => {})
      }

      // Elevation CSS variables (apply for levels 0..4) - generate for both modes
      const elevationsWithControls = new Set<string>()
      for (const mode of ['light', 'dark'] as const) {
        for (let i = 0; i <= 4; i++) {
          const k = `elevation-${i}`
          if (this.state.elevation.controls[mode]?.[k]) {
            elevationsWithControls.add(k)
          }
        }
      }

      for (const mode of ['light', 'dark'] as const) {
        try {
          const tokenIndex = {
            get: (path: string): any => {
              const parts = path.split('/')
              const root: any = (this.state.tokens as any)?.tokens || {}
              if ((parts[0] === 'size' || parts[0] === 'sizes') && parts[1]) {
                return root?.sizes?.[parts[1]]?.$value || root?.size?.[parts[1]]?.$value
              }
              if ((parts[0] === 'opacity' || parts[0] === 'opacities') && parts[1]) {
                return root?.opacities?.[parts[1]]?.$value || root?.opacity?.[parts[1]]?.$value
              }
              if ((parts[0] === 'color' || parts[0] === 'colors') && parts[1] && parts[2]) {
                if (parts[0] === 'colors' && parts[1]?.startsWith('scale-')) {
                  return root?.colors?.[parts[1]]?.[parts[2]]?.$value
                }
                return root?.colors?.[parts[1]]?.[parts[2]]?.$value
              }
              return undefined
            }
          }
          const toNumber = (v: any): number => {
            if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) return Number((v as any).value)
            return Number(v)
          }
          const toNumeric = (ref?: any): number => {
            if (ref && typeof ref === 'object' && '$value' in ref) {
              const val = ref.$value
              if (val && typeof val === 'object' && 'value' in val) {
                return typeof val.value === 'number' ? val.value : Number(val.value) || 0
              }
              if (typeof val === 'number') return val
              if (typeof val === 'string') {
                const num = Number(val)
                return Number.isFinite(num) ? num : 0
              }
            }
            if (typeof ref === 'number') return ref
            if (typeof ref === 'string') {
              const num = Number(ref)
              return Number.isFinite(num) ? num : 0
            }
            return 0
          }

          const shadowColorForLevel = (level: number, paletteVars?: Record<string, string>): string => {
            const key = `elevation-${level}`
            const ctrlForLevel = this.state.elevation.controls[mode]?.[key]
            const opNorm = ctrlForLevel?.opacity ?? 0.84
            const alphaRef = opNorm.toFixed(4)
            const colorMixWithOpacityVar = (colorVarRef: string, alphaVarRef: string): string =>
              `color-mix(in srgb, ${colorVarRef} calc(${alphaVarRef} * 100%), transparent)`

            const sel = this.state.elevation.paletteSelections[mode]?.[key]
            if (sel) {
              const paletteVarName = `--recursica_brand_themes_${mode}_palettes_${sel.paletteKey}_${sel.level}_color_tone`
              const paletteVarRef = paletteVars?.[paletteVarName] ? paletteVars[paletteVarName] : `var(${paletteVarName})`
              return colorMixWithOpacityVar(paletteVarRef, alphaRef)
            }
            const tok = this.state.elevation.colorTokens[key]
            if (!tok) return 'transparent'
            const colorVarRef = tokenToCssVar(tok, this.state.tokens) || `var(--recursica_tokens_${tok.replace(/\//g, '_')})`
            return colorMixWithOpacityVar(colorVarRef, alphaRef)
          }
          const dirForLevel = (level: number): { x: 'left' | 'right'; y: 'up' | 'down' } => {
            const key = `elevation-${level}`
            const modeDirections = this.state.elevation.directions[mode] || {}
            const dir = modeDirections[key] || { x: this.state.elevation.baseXDirection, y: this.state.elevation.baseYDirection }
            return dir
          }
          
          const brand: any = (this.state.theme as any)?.brand || (this.state.theme as any)
          const themes = brand?.themes || brand
          const modeElevations: any = themes?.[mode]?.elevations || {}
          const baseElevationNode: any = modeElevations?.['elevation-0']?.['$value'] || {}

          const vars: Record<string, string> = {}
          const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
          if (!tokensRoot.sizes) tokensRoot.sizes = {}
          const sizeTokens = tokensRoot.sizes

          for (let i = 0; i <= 4; i += 1) {
            const k = `elevation-${i}`
            const elevNode: any = modeElevations?.[k]?.['$value'] || baseElevationNode
            if (!elevNode || Object.keys(elevNode).length === 0) continue

            const control = this.state.elevation.controls[mode]?.[k]
            let blurValue = control ? control.blur : toNumeric(elevNode?.blur)
            let spreadValue = control ? control.spread : toNumeric(elevNode?.spread)
            let xValue = control ? control.offsetX : toNumeric(elevNode?.x)
            let yValue = control ? control.offsetY : toNumeric(elevNode?.y)

            const dir = dirForLevel(i)
            const brandScope = `--brand_themes_${mode}_elevations_elevation-${i}`
            const prefixedScope = `--recursica_${brandScope.slice(2)}`

            const hasControlsInAnyMode = elevationsWithControls.has(k)
            if (!hasControlsInAnyMode && mode === 'dark') {
              sizeTokens[`elevation-${i}-blur`] = { $type: 'number', $value: blurValue }
              sizeTokens[`elevation-${i}-spread`] = { $type: 'number', $value: spreadValue }
              sizeTokens[`elevation-${i}-offset-x`] = { $type: 'number', $value: xValue }
              sizeTokens[`elevation-${i}-offset-y`] = { $type: 'number', $value: yValue }

              vars[tokenSize(`elevation-${i}-blur`)] = `${blurValue}px`
              vars[token('size', `elevation-${i}-blur`)] = `${blurValue}px`
              vars[tokenSize(`elevation-${i}-spread`)] = `${spreadValue}px`
              vars[token('size', `elevation-${i}-spread`)] = `${spreadValue}px`
              vars[tokenSize(`elevation-${i}-offset-x`)] = `${xValue}px`
              vars[token('size', `elevation-${i}-offset-x`)] = `${xValue}px`
              vars[tokenSize(`elevation-${i}-offset-y`)] = `${yValue}px`
              vars[token('size', `elevation-${i}-offset-y`)] = `${yValue}px`
            }

            const ctrl = this.state.elevation.controls[mode]?.[k]
            const opacityNorm = ctrl?.opacity ?? 0.84
            const alphaVarRef = opacityNorm.toFixed(4)
            const colorMixWithOpacityVar = (colorVarRef: string, alphaVarRef: string): string =>
              `color-mix(in srgb, ${colorVarRef} calc(${alphaVarRef} * 100%), transparent)`

            const statePaletteSel = this.state.elevation.paletteSelections[mode]?.[k]
            if (statePaletteSel) {
              const paletteVarName = `--recursica_brand_themes_${mode}_palettes_${statePaletteSel.paletteKey}_${statePaletteSel.level}_color_tone`
              const paletteVarRef = allPaletteVars[paletteVarName] ? allPaletteVars[paletteVarName] : `var(${paletteVarName})`
              vars[`${prefixedScope}_shadow-color`] = colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
            } else {
              vars[`${prefixedScope}_shadow-color`] = shadowColorForLevel(i, allPaletteVars)
            }

            vars[`${prefixedScope}_blur`] = `${blurValue}px`
            vars[`${prefixedScope}_spread`] = `${spreadValue}px`
            vars[`${prefixedScope}_x-axis`] = `${dir.x === 'right' ? xValue : -xValue}px`
            vars[`${prefixedScope}_y-axis`] = `${dir.y === 'down' ? yValue : -yValue}px`
          }
          Object.assign(allVars, vars)
        } catch (e) {
          throw e
        }
      }

      // Compute layer element colors (text, interactive, status) based on layer surfaces.
      if (this.aaWatcher) {
        this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
        this.aaWatcher.fixLayerElementColorsInMap(allVars)
      }

      applyCssVars(allVars, this.state.tokens)
      
      actuallyChangedVars = Object.keys(allVars).filter(k => this.lastComputedVars[k] !== allVars[k])
      this.lastComputedVars = { ...allVars }

      if (typeof document !== 'undefined') {
        updateScopedCss(allVars)
        setThemeAttribute(currentMode === 'dark' ? 'dark' : 'light')
      }
    } finally {
      // Re-enable events and fire a single batched event after bulk update completes
      suppressCssVarEvents(false)
      // Always reset the flag, even if an error occurred
      this.isRecomputing = false
      // Explicitly dispatch cssVarsUpdated event to ensure components are notified
      // Use requestAnimationFrame to ensure DOM updates are complete
      // Only dispatch vars that actually changed (not preserved) to prevent unnecessary re-renders
      // CRITICAL: Filter out UIKit vars - they're silent and don't need component re-renders
      const mergedChangedVars = new Set([...changedUikitVars, ...actuallyChangedVars])
      const nonUIKitChangedVars = Array.from(mergedChangedVars).filter(v =>
        !v.startsWith('--recursica_ui-kit_components_') &&
        !v.startsWith('--recursica_ui-kit_globals_')
      )
      if (nonUIKitChangedVars.length > 0) {
        requestAnimationFrame(() => {
          try {
            // Only include non-UIKit CSS variables that actually changed
            // UIKit vars are silent and don't need component re-renders
            const changedVarsArray = nonUIKitChangedVars
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: changedVarsArray }
            }))
          } catch (e) {
            // Ignore errors if window is not available (SSR)
          }
        })
      }

      // Schedule debounced compliance scan after CSS vars are fully updated
      this.scheduleComplianceScan()
    }
  }

  /**
   * Check if an opacity token is used for high/low emphasis in theme JSON
   */
  private isEmphasisOpacityToken(opacityKey: string): boolean {
    try {
      const root: any = this.state.theme?.brand ? this.state.theme.brand : this.state.theme
      const themes = root?.themes || root

      // Check both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const textEmphasis = themes?.[mode]?.['text-emphasis']
        if (!textEmphasis) continue

        // Check high and low emphasis
        const highRef = textEmphasis?.high?.$value || textEmphasis?.high
        const lowRef = textEmphasis?.low?.$value || textEmphasis?.low
        const highEmphasis = textEmphasis?.['high-emphasis']?.$value || textEmphasis?.['high-emphasis']
        const lowEmphasis = textEmphasis?.['low-emphasis']?.$value || textEmphasis?.['low-emphasis']

        // Check if any of these references use this opacity token
        const checkRef = (ref: any): boolean => {
          if (typeof ref !== 'string') return false
          // Check for {tokens.opacity.key} or {tokens.opacities.key}
          return ref.includes(`opacity.${opacityKey}`) || ref.includes(`opacities.${opacityKey}`)
        }

        if (checkRef(highRef) || checkRef(lowRef) || checkRef(highEmphasis) || checkRef(lowEmphasis)) {
          return true
        }
      }
    } catch { }
    return false
  }

  /**
   * Find all palettes that use a given color family/scale
   * Returns array of { paletteKey, mode } pairs
   */
  private findPalettesUsingColor(scaleKey: string, familyAlias: string): Array<{ paletteKey: string; mode: 'light' | 'dark' }> {
    const result: Array<{ paletteKey: string; mode: 'light' | 'dark' }> = []
    try {
      const root: any = this.state.theme?.brand ? this.state.theme.brand : this.state.theme
      const themes = root?.themes || root
      const tokenIndex = buildTokenIndex(this.state.tokens)

      // Check both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const pal: any = themes?.[mode]?.palettes || {}
        const levels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']

        Object.keys(pal).forEach((paletteKey) => {
          if (paletteKey === 'core' || paletteKey === 'core-colors') return

          // Check a few levels to see if this palette uses the color family
          for (const level of levels.slice(0, 4)) { // Check first 4 levels
            const toneRef = pal[paletteKey]?.[level]?.color?.tone?.$value ||
              pal[paletteKey]?.[level]?.color?.tone
            if (typeof toneRef === 'string') {
              const context: TokenReferenceContext = {
                currentMode: mode,
                tokenIndex,
                theme: this.state.theme
              }
              const parsed = parseTokenReference(toneRef, context)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 2) {
                // Check if it matches the scale key or alias
                if (parsed.path[0] === 'colors' && parsed.path.length >= 2) {
                  const refScaleOrAlias = parsed.path[1]
                  if (refScaleOrAlias === scaleKey || refScaleOrAlias === familyAlias) {
                    // This palette uses this color - add it if not already added
                    if (!result.find(r => r.paletteKey === paletteKey && r.mode === mode)) {
                      result.push({ paletteKey, mode })
                    }
                    break // Found it, move to next palette
                  }
                } else if (parsed.path[0] === 'color' && parsed.path.length >= 2) {
                  const refFamily = parsed.path[1]
                  if (refFamily === familyAlias) {
                    // This palette uses this color - add it if not already added
                    if (!result.find(r => r.paletteKey === paletteKey && r.mode === mode)) {
                      result.push({ paletteKey, mode })
                    }
                    break // Found it, move to next palette
                  }
                }
              }
            }
          }
        })
      }
    } catch { }
    return result
  }

  private isCoreColorToken(family: string, level: string): boolean {
    try {
      const root: any = this.state.theme?.brand ? this.state.theme.brand : this.state.theme
      const themes = root?.themes || root

      // Check both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const coreColors = themes?.[mode]?.palettes?.['core-colors']?.$value || themes?.[mode]?.palettes?.['core-colors']
        if (!coreColors) continue

        const coreColorKeys = ['black', 'white', 'alert', 'warning', 'success', 'interactive']
        for (const colorKey of coreColorKeys) {
          const colorDef = coreColors[colorKey]
          if (!colorDef) continue

          // Check tone reference using centralized parser
          const toneRef = colorDef.tone?.$value || colorDef.tone
          if (toneRef) {
            const context: TokenReferenceContext = {
              currentMode: mode,
              tokenIndex: buildTokenIndex(this.state.tokens),
              theme: this.state.theme
            }
            const parsed = parseTokenReference(toneRef, context)
            if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color' && parsed.path[1] === family && parsed.path[2] === level) {
              return true
            }
          }

          // Check interactive default/hover tone references
          if (colorKey === 'interactive') {
            const defaultToneRef = colorDef.default?.tone?.$value || colorDef.default?.tone
            const hoverToneRef = colorDef.hover?.tone?.$value || colorDef.hover?.tone
            const context: TokenReferenceContext = {
              currentMode: mode,
              tokenIndex: buildTokenIndex(this.state.tokens),
              theme: this.state.theme
            }
            if (defaultToneRef) {
              const parsed = parseTokenReference(defaultToneRef, context)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color' && parsed.path[1] === family && parsed.path[2] === level) {
                return true
              }
            }
            if (hoverToneRef) {
              const parsed = parseTokenReference(hoverToneRef, context)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color' && parsed.path[1] === family && parsed.path[2] === level) {
                return true
              }
            }
          }
        }
      }
    } catch { }
    return false
  }

  public updateCoreColorOnTonesForAA() {
    try {
      const currentMode = this.getCurrentMode()
      const mode = currentMode === 'dark' ? 'dark' : 'light'

      // Get all core colors and update their on-tones
      const coreColors = ['black', 'white', 'alert', 'warning', 'success']

      for (const colorName of coreColors) {
        // Get the tone hex for this core color
        const toneCssVar = `--recursica_brand_themes_${mode}_palettes_core-colors_${colorName}_tone`
        const tokenIndex = buildTokenIndex(this.state.tokens)
        const toneValue = readCssVarResolved(toneCssVar) || readCssVar(toneCssVar)
        const toneHex = toneValue
          ? (resolveCssVarToHex(toneValue, tokenIndex) || '#000000')
          : '#000000'

        if (toneHex && toneHex !== '#000000') {
          // Update high/low emphasis on-tones with alternating pattern
          // CSS vars only, never JSON - pass no-op callback
          updateCoreColorOnTonesForCompliance(
            colorName as 'black' | 'white' | 'alert' | 'warning' | 'success',
            toneHex,
            this.state.tokens,
            this.state.theme,
            () => { }, // No-op - never update JSON during AA compliance
            mode
          )

          // Update interactive on-tone with alternating pattern on interactive scale
          // CSS vars only, never JSON - pass no-op callback
          updateCoreColorInteractiveOnToneForCompliance(
            colorName as 'black' | 'white' | 'alert' | 'warning' | 'success',
            toneHex,
            this.state.tokens,
            this.state.theme,
            () => { }, // No-op - never update JSON during AA compliance
            mode
          )
        }
      }
    } catch { }
  }

  /**
   * DEPRECATED: Never update JSON after initial load
   * JSON is read-only after app load - all updates are CSS vars only
   * This method is kept for reference but should never be called
   * Export will read CSS vars and convert to JSON
   */
  private updateThemeJsonFromOnToneCssVars() {
    // NO-OP: JSON should never be updated after initial load
    // All AA compliance updates are CSS vars only
    return
  }
}

let singleton: VarsStore | null = null
export function getVarsStore(): VarsStore { if (!singleton) singleton = new VarsStore(); return singleton }


