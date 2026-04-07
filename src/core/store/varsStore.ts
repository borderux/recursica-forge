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
import { suppressCssVarEvents, clearPendingCssVars } from '../css/updateCssVar'
import { computeBundleVersion } from './versioning'
import { readCssVar, readCssVarResolved } from '../css/readCssVar'
import { resolveTokenReferenceToCssVar, parseTokenReference, extractBraceContent, type TokenReferenceContext } from '../utils/tokenReferenceParser'
import { AAComplianceWatcher } from '../compliance/AAComplianceWatcher'
import { updateCoreColorOnTonesForCompliance, updateCoreColorInteractiveOnToneForCompliance } from '../compliance/coreColorAaCompliance'
import { resolveCssVarToHex } from '../compliance/layerColorStepping'
import { getComplianceService } from '../compliance/ComplianceService'
import { snapshotDefaults, restoreDelta, reapplyDelta, installBeforeUnloadHandler, clearDelta, trackChanges } from './cssDelta'
import { clearStoredFonts } from './fontStore'
import { syncDeltaToJson } from './deltaToJson'
import { buildStructuralMetadata, type StructuralMetadata } from './structuralMetadata'

import tokensImport from '../../../recursica_tokens.json'
import themeImport from '../../../recursica_brand.json'
import uikitImport from '../../../recursica_ui-kit.json'
// Note: Override system removed - tokens are now the single source of truth

type PaletteStore = {
  opacity: Record<'disabled' | 'overlay' | 'text-high' | 'text-low', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ElevationControl = { blur: number; spread: number; offsetX: number; offsetY: number }
export type ElevationState = {
  controls: Record<'light' | 'dark', Record<string, ElevationControl>>
  colorTokens: Record<string, string>
  alphaTokens: Record<'light' | 'dark', Record<string, string>>
  blurTokens: Record<string, string>
  spreadTokens: Record<string, string>
  offsetXTokens: Record<string, string>
  offsetYTokens: Record<string, string>
  paletteSelections: Record<string, { paletteKey: string; level: string }>
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
  version: 'rf:vars:version',
  uikit: 'rf:vars:uikit',
  deletedScales: 'rf:deleted-scales',
}

/** Exported for use by cssDelta and deltaToJson modules — the single source of truth for this key. */
export const DELETED_SCALES_KEY = STORAGE_KEYS.deletedScales

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
      { key: 'palette-2', title: 'Palette 2', defaultLevel: 500 },
    ],
    primaryLevels: {}
  }
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
  /**
   * Deep-cloned copy of the original uikit JSON taken at init time, before any in-place
   * mutations from updateUIKitValue. Used by handleReset to build CSS vars from the truly
   * pristine file structure regardless of what user changes have accumulated in state.
   */
  private readonly pristineUikit: JsonLike = JSON.parse(JSON.stringify(uikitImport))

  constructor() {
    // Always start from fresh JSON imports. User changes are restored via the delta
    // serialization system (rf:css-delta) AFTER recomputeAndApplyAll generates defaults.
    // This eliminates the old localStorage JSON dual-write system.
    // Use deep-cloned JSON imports to ensure we don't mutate the singleton imports
    const tokensRaw = JSON.parse(JSON.stringify(tokensImport as any))
    // Sort font token objects once during initialization to maintain consistent order
    const tokens = sortFontTokenObjects(tokensRaw) || tokensRaw || {}
    const themeImportRaw = JSON.parse(JSON.stringify(themeImport as any))
    const theme = themeImportRaw?.brand ? themeImportRaw : { brand: themeImportRaw }
    const uikit = JSON.parse(JSON.stringify(uikitImport as any))
    const palettes = defaultPaletteStore()

    // Strip deleted color scales from tokens before any CSS generation.
    // This ensures scales the user deleted don't reappear on page refresh.
    this.applyDeletedScales(tokens)

    // Ensure tokens is defined before passing to initElevationState
    // initElevationState will create elevation tokens and add them to the tokens object
    const elevation = this.initElevationState(theme as any, tokens || {})
    // Ensure tokens structure is properly set (initElevationState modifies tokens in place)
    if (!(tokens as any).tokens) (tokens as any).tokens = {}
    this.state = { tokens, theme, uikit, palettes, elevation, version: 0 }

    // Bundle version check: when source JSON files change, clear the CSS delta
    // to prevent stale user overrides from applying to a new JSON structure.
    if (this.lsAvailable) {
      const bundleVersion = computeBundleVersion(tokensImport, themeImport, uikitImport)
      const storedVersion = localStorage.getItem(STORAGE_KEYS.version)
      if (storedVersion !== bundleVersion) {
        // Clear CSS delta — stale overrides could reference paths that no longer exist
        clearDelta()
        // Clear any persisted custom uikit — structure may have changed
        localStorage.removeItem(STORAGE_KEYS.uikit)
        localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
      } else {
        // Bundle unchanged — restore any user-persisted custom uikit (contains custom variants)
        const savedUikit = localStorage.getItem(STORAGE_KEYS.uikit)
        if (savedUikit) {
          try {
            this.state.uikit = JSON.parse(savedUikit)
          } catch {
            localStorage.removeItem(STORAGE_KEYS.uikit)
          }
        }
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

        // Store URLs in window object so ensureFontLoaded can access them synchronously
        // This is a workaround until we can make fontUrlMap accessible synchronously
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

    // Initial CSS apply (includes AA compliance pipeline stage)
    this.recomputeAndApplyAll()

    // Delta serialization: snapshot defaults, then restore user changes
    snapshotDefaults(this.lastComputedVars)
    const restoredCount = restoreDelta()
    if (restoredCount > 0) {
      // Sync delta changes back to in-memory JSON so export/compliance see saved modifications
      const { structuralAdditions } = syncDeltaToJson(this.state.tokens, this.state.theme)
      if (structuralAdditions) {
        // New scales were created from delta — recompute to generate their CSS vars
        this.recomputeAndApplyAll()
        // Re-snapshot defaults so the new scale vars are included in the baseline
        snapshotDefaults(this.lastComputedVars)
        // Re-apply the delta on top of the new baseline
        restoreDelta()
      }
      // After restoring delta, schedule a compliance scan since CSS vars may have changed
      this.scheduleComplianceScan()
    }
    installBeforeUnloadHandler()

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
   * localStorage is NO LONGER used for tokens/theme/uikit/palettes/elevation.
   * The delta serialization system (rf:css-delta) handles all user CSS var changes.
   * NEVER triggers recomputeAndApplyAll — callers that need full regen must call it explicitly.
   */
  private writeState(next: Partial<VarsState>) {
    this.state = { ...this.state, ...next }

    // Update AA watcher if tokens or theme changed
    if (this.aaWatcher && (next.tokens || next.theme)) {
      this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
    }

    this.emit()
  }

  /**
   * Write CSS vars directly to DOM + update JSON store.
   * Used by Fix All and targeted compliance fixes.
   * Does NOT trigger recomputeAndApplyAll — writes are terminal.
   * Schedules a debounced compliance scan after writes.
   */
  public writeCssVarsDirect(cssVarUpdates: Record<string, string>, themeUpdate?: JsonLike) {
    // Write CSS vars to DOM inline style
    const root = document.documentElement
    for (const [key, value] of Object.entries(cssVarUpdates)) {
      root.style.setProperty(key, value)
    }

    // Track all changes in the delta serialization system
    trackChanges(cssVarUpdates)

    // Persist theme JSON update if provided
    if (themeUpdate) {
      this.writeState({ theme: themeUpdate })
    }

    // Schedule compliance scan
    this.scheduleComplianceScan()
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

  /**
   * Read the deleted-scales list from localStorage.
   */
  public getDeletedScales(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.deletedScales)
      if (raw) return JSON.parse(raw) as string[]
    } catch { }
    return []
  }

  /**
   * Persist a newly-deleted scale alias to localStorage and remove it from in-memory tokens.
   */
  public persistDeletedScale(alias: string, scaleKey?: string) {
    try {
      const list = this.getDeletedScales()
      if (!list.includes(alias)) list.push(alias)
      localStorage.setItem(STORAGE_KEYS.deletedScales, JSON.stringify(list))
    } catch { }

    // Also strip from in-memory tokens so recomputeAndApplyAll won't regenerate vars
    const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    if (scaleKey && colorsRoot[scaleKey]) {
      delete colorsRoot[scaleKey]
    } else {
      // Find and remove by alias
      for (const [key, scale] of Object.entries(colorsRoot)) {
        if (key.startsWith('scale-') && (scale as any)?.alias === alias) {
          delete colorsRoot[key]
          break
        }
      }
    }
  }

  /**
   * Clear the deleted-scales list (used during resetAll).
   */
  private clearDeletedScales() {
    try { localStorage.removeItem(STORAGE_KEYS.deletedScales) } catch { }
  }

  /**
   * Strip deleted color scales from a tokens object.
   * Called during constructor before any CSS var generation.
   */
  private applyDeletedScales(tokens: any) {
    const deleted = this.getDeletedScales()
    if (deleted.length === 0) return
    const tokensRoot = tokens?.tokens || {}
    const colorsRoot = tokensRoot?.colors || {}
    for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
      if (!scaleKey.startsWith('scale-')) continue
      const alias = (scale as any)?.alias
      if (alias && typeof alias === 'string' && deleted.includes(alias.trim())) {
        delete colorsRoot[scaleKey]
      }
    }
  }

  setTokens(next: JsonLike) {
    this.writeState({ tokens: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }
  /**
   * Update tokens JSON in-memory WITHOUT triggering recomputeAndApplyAll.
   * Use when the CSS var is already set via updateCssVar and you only need JSON sync.
   */
  setTokensSilent(next: JsonLike) { this.writeState({ tokens: next }) }
  setTheme(next: JsonLike) {
    this.writeState({ theme: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
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
  public getLatestThemeCopy(): any {
    return JSON.parse(JSON.stringify(this.state.theme))
  }
  public syncFontsToTokens() {
    try {
      const storedFontsRaw = localStorage.getItem('rf:fonts')
      if (!storedFontsRaw) return
      const storedFonts = JSON.parse(storedFontsRaw)
      if (Array.isArray(storedFonts)) {
        const tokens = JSON.parse(JSON.stringify(this.state.tokens))
        const fontRoot = tokens?.tokens?.font || tokens?.font || {}
        if (!fontRoot.typefaces) fontRoot.typefaces = {}
        if (!fontRoot.families) fontRoot.families = {}
        const typefaces = fontRoot.typefaces
        const families = fontRoot.families

        // Keep $ variables but remove all font instances
        Object.keys(typefaces).forEach(k => { if (!k.startsWith('$')) delete typefaces[k] })
        Object.keys(families).forEach(k => { if (!k.startsWith('$')) delete families[k] })

        storedFonts.forEach(font => {
          if (font.id && font.family) {
            let cleanFamily = font.family.trim().replace(/^["']|["']$/g, '')
            // Strip any stale baked-in category from the family name itself
            if (cleanFamily.includes(',')) cleanFamily = cleanFamily.split(',')[0].trim()
            // Build a proper CSS font-family string
            const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily
            const fontStack = font.category ? `${quotedName}, ${font.category}` : quotedName
            typefaces[font.id] = { $value: fontStack }
            families[font.id] = { $value: fontStack }

            // Restore the extensions for Google Fonts URL
            if (font.url) {
              typefaces[font.id].$extensions = { 'com.google.fonts': { url: font.url } }
              families[font.id].$extensions = { 'com.google.fonts': { url: font.url } }
            }
          }
        })

        this.setTokens(tokens)
      }
    } catch (e) {
      console.warn('Failed to sync fonts to tokens', e)
    }
  }

  /** Returns the pristine, unmodified uikit JSON (deep-cloned at init time). */
  getPristineUikit(): JsonLike { return this.pristineUikit }

  setUiKit(next: JsonLike) {
    this.writeState({ uikit: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
    // Persist uikit to localStorage when it contains custom variants so they
    // survive page refreshes. Normal token edits go through the CSS delta system.
    if (this.lsAvailable) {
      if (hasCustomVariants(next)) {
        try { localStorage.setItem(STORAGE_KEYS.uikit, JSON.stringify(next)) } catch { /* full */ }
      } else {
        localStorage.removeItem(STORAGE_KEYS.uikit)
      }
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
      // Clear delta and version to force fresh init
      clearDelta()
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
  setPalettes(next: PaletteStore) {
    this.writeState({ palettes: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }
  setElevation(next: ElevationState) {
    this.writeState({ elevation: next })
    if (!this.isRecomputing) this.recomputeAndApplyAll()
  }
  updateElevation(mutator: (prev: ElevationState) => ElevationState) {
    this.writeState({ elevation: mutator(this.state.elevation) })
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
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}px` : undefined
          } else if (category === 'letter-spacing' || category === 'letter-spacings') {
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}em` : undefined
          } else if (category === 'weight' || category === 'weights' || category === 'line-height' || category === 'line-heights') {
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
      } else if ((category === 'color' || category === 'colors') && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // Preserve 000 and 1000 as-is, pad others to 3 digits
        const normalizedLevel = level === '000' ? '000' : level === '1000' ? '1000' : String(level).padStart(3, '0')

        // Handle new format: colors/scale-XX/level or colors/family/level
        if (category === 'colors') {
          let tokenValue: any = null
          let scaleKey: string | null = null
          let alias: string | null = null

          if (scaleOrFamily.startsWith('scale-')) {
            // Direct scale reference: colors/scale-01/100
            scaleKey = scaleOrFamily
            tokenValue = tokensRoot?.colors?.[scaleKey]?.[level]?.$value
            const scale = tokensRoot?.colors?.[scaleKey]
            alias = scale?.alias
          } else {
            // Alias-based reference: colors/cornflower/100
            // Find the scale that has this alias
            scaleKey = Object.keys(tokensRoot?.colors || {}).find(key => {
              const scale = tokensRoot?.colors?.[key]
              return scale && typeof scale === 'object' && scale.alias === scaleOrFamily
            }) || null
            if (scaleKey) {
              tokenValue = tokensRoot?.colors?.[scaleKey]?.[level]?.$value
              alias = scaleOrFamily
            }
          }

          if (tokenValue != null && scaleKey) {
            // Generate CSS vars for scale name only (no alias-based vars)
            const scaleCssVarKey = tokenColors(scaleKey, normalizedLevel)
            varsToUpdate[scaleCssVarKey] = String(tokenValue)
          }
        } else {
          // Old format: color/family/level (backwards compatibility)
          const tokenValue = tokensRoot?.color?.[scaleOrFamily]?.[level]?.$value
          if (tokenValue != null) {
            const cssVarKey = tokenColor(scaleOrFamily, normalizedLevel)
            varsToUpdate[cssVarKey] = String(tokenValue)
          }
        }
      }

      // Apply only the affected CSS variables (with validation)
      // Ensure we only update the specific CSS variable(s) for this token
      if (Object.keys(varsToUpdate).length > 0) {
        // Only apply the CSS variables that were added for this specific token
        // This prevents accidentally updating other CSS variables
        applyCssVars(varsToUpdate, this.state.tokens)
        // Track changes in the delta for persistence EXCEPT font typefaces/families,
        // which are managed exclusively by rf:fonts and must never enter the delta.
        // Stale delta entries for these vars cause reapplyDelta() to overwrite the
        // correct reordered mapping after every recomputeAndApplyAll.
        const deltaVars: Record<string, string> = {}
        for (const [k, v] of Object.entries(varsToUpdate)) {
          if (!k.startsWith(tokenFont('typefaces', '')) && !k.startsWith(tokenFont('families', ''))) {
            deltaVars[k] = v
          }
        }
        if (Object.keys(deltaVars).length > 0) trackChanges(deltaVars)
      }
    } catch (error) {
      console.error('Failed to update single token CSS var:', tokenName, error)
    }
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

      if ((category === 'color' || category === 'colors') && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // Handle new format: colors/scale-XX/level or colors/family/level
        if (category === 'colors') {
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
        } else {
          // Old format: color/family/level (backwards compatibility)
          if (!tokensRoot.color) tokensRoot.color = {}
          if (!tokensRoot.color[scaleOrFamily]) tokensRoot.color[scaleOrFamily] = {}
          if (!tokensRoot.color[scaleOrFamily][level]) tokensRoot.color[scaleOrFamily][level] = {}
          tokensRoot.color[scaleOrFamily][level].$value = String(value)
        }
      } else if (category === 'size' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.sizes) tokensRoot.sizes = {}
        if (!tokensRoot.sizes[key]) tokensRoot.sizes[key] = {}
        tokensRoot.sizes[key].$value = typeof value === 'number' ? value : String(value)
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
          tokensRoot.font[pluralKind][key].$value = typeof value === 'number' ? value : String(value)
        } else if (pluralKind === 'typefaces' || pluralKind === 'cases' || pluralKind === 'decorations') {
          if (!tokensRoot.font[pluralKind]) tokensRoot.font[pluralKind] = {}
          tokensRoot.font[pluralKind][key] = typeof value === 'object' ? value : { $value: String(value) }
        } else if (kind === 'family') {
          // Keep 'family' as-is for backwards compatibility
          if (!tokensRoot.font[kind]) tokensRoot.font[kind] = {}
          tokensRoot.font[kind][key] = typeof value === 'object' ? value : { $value: String(value) }
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
    } catch (error) {
      console.error('Failed to update token:', tokenName, error)
    }
  }

  resetAll() {
    // Clear all CSS variables, persisted delta, stored font overrides, and deleted scales
    clearAllCssVars()
    clearDelta()
    clearStoredFonts()
    this.clearDeletedScales()

    // Clear session storage for randomizer states
    try {
      sessionStorage.removeItem('randomizer_diffs')
      sessionStorage.removeItem('randomizer_ratios')
    } catch { }

    // Reset state from deep-cloned original JSON imports
    // This ensures we have fresh objects that haven't been mutated in-memory
    const tokens = JSON.parse(JSON.stringify(tokensImport))
    const sortedTokens = sortFontTokenObjects(tokens as any)
    const normalizedTheme = JSON.parse(JSON.stringify(themeImport?.brand ? themeImport : { brand: themeImport }))
    const uikit = JSON.parse(JSON.stringify(this.pristineUikit))

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

    // Recompute and apply all CSS variables from clean state
    // Reset the recomputing flag first since we're doing a full reset
    this.isRecomputing = false
    this.recomputeAndApplyAll()

    // Snapshot new defaults (clean JSON) so delta system has the correct baseline
    snapshotDefaults(this.lastComputedVars)

    // Compliance scan will run automatically via debounced scheduleComplianceScan
    // triggered at the end of recomputeAndApplyAll().

    // Notify all listeners that state has been reset
    this.emit()

    // Dispatch events to notify components of the reset
    try {
      // Unconditionally trigger CSS variable update flush across the app
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { reset: true } }))
      
      window.dispatchEvent(new CustomEvent('themeReset', {}))
      window.dispatchEvent(new CustomEvent('paletteVarsChanged', {}))

      // Notify font components to rebuild rows from the now-cleared rf:fonts
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
    let paletteSelections: Record<string, { paletteKey: string; level: string }> = {}
    let baseXDirection: 'left' | 'right' = 'right'
    let baseYDirection: 'up' | 'down' = 'down'
    let directions: Record<'light' | 'dark', Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>> = { light: {}, dark: {} }
    let shadowColorControl: { colorToken: string; alphaToken: string } = { colorToken: 'color/gray/900', alphaToken: 'opacity/veiled' }

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
          controls[mode][`elevation-${i}`] = {
            blur,
            spread,
            offsetX,
            offsetY,
          }
        }
      }
      const parseOpacity = (s?: string) => {
        if (!s) return 'opacity/veiled'
        // Only parse if we have tokens available
        const tokensToUse = tokens || this.state?.tokens
        if (!tokensToUse) return 'opacity/veiled'
        const context: TokenReferenceContext = {
          tokenIndex: buildTokenIndex(tokensToUse)
        }
        const parsed = parseTokenReference(s, context)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && (parsed.path[0] === 'opacity' || parsed.path[0] === 'opacities')) {
          return `opacity/${parsed.path[1]}`
        }
        return 'opacity/veiled'
      }
      const parseColorToken = (s?: string) => {
        if (!s) return 'color/gray/900'
        // Only parse if we have tokens available
        const tokensToUse = tokens || this.state?.tokens
        if (!tokensToUse) return 'color/gray/900'
        const context: TokenReferenceContext = {
          tokenIndex: buildTokenIndex(tokensToUse)
        }
        const parsed = parseTokenReference(s, context)
        if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && (parsed.path[0] === 'color' || parsed.path[0] === 'colors')) {
          // Handle both old format (color/family/level) and new format (colors/scale-XX/level)
          if (parsed.path[0] === 'colors' && parsed.path.length >= 3) {
            return `colors/${parsed.path[1]}/${parsed.path[2]}`
          }
          return `color/${parsed.path[1]}/${parsed.path[2]}`
        }
        return 'color/gray/900'
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
          const pathParts = parsed.path
          // Check if it's a palette reference: palettes.{paletteKey}.{level}.color.tone
          if (pathParts.length >= 4 && pathParts[0] === 'palettes' && pathParts[2] === 'color' && pathParts[3] === 'tone') {
            const paletteKey = pathParts[1]
            let level = pathParts.length >= 5 ? pathParts[4] : undefined
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
      shadowColorControl = { colorToken: parseColorToken(elev1?.color?.['$value'] ?? elev1?.color), alphaToken: parseOpacity(elev1?.opacity?.['$value'] ?? elev1?.opacity) }

      // Initialize palette selections from brand.json for each elevation (using light mode as default)
      const initialPaletteSelections: Record<string, { paletteKey: string; level: string }> = {}
      for (let i = 0; i <= 4; i++) {
        const elev: any = lightElevations?.[`elevation-${i}`]?.['$value'] || {}
        const colorRef = elev?.color?.['$value'] ?? elev?.color
        const paletteSel = parsePaletteSelection(colorRef)
        if (paletteSel) {
          initialPaletteSelections[`elevation-${i}`] = paletteSel
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
      paletteSelections = { ...initialPaletteSelections }
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
    try { const raw = localStorage.getItem('type-token-choices'); return raw ? JSON.parse(raw) : {} } catch { return {} }
  }

  private getCurrentMode(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | null
      return saved ?? 'light'
    } catch {
      return 'light'
    }
  }

  public switchMode(mode: 'light' | 'dark') {
    try {
      localStorage.setItem('theme-mode', mode)
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
              // Backwards compatibility: also create singular form
              if (!vars[token('size', short)]) {
                vars[token('size', short)] = px
              }
              if (short.includes('elevation')) {
                elevationTokensFound.push(short)
              }
            }
          })
          Object.assign(allVars, vars)
        }
      } catch (e) {
        console.error('[VarsStore] Error generating size token CSS variables:', e)
      }
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
              // Backwards compatibility: also create singular form
              if (!vars[token('opacity', short)]) {
                vars[token('opacity', short)] = norm
              }
            }
          })
          Object.assign(allVars, vars)
        }
      } catch (e) {
        console.error('[VarsStore] Error generating opacity token CSS variables:', e)
      }
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

        // Backwards compatibility: also process old color structure if it exists
        const oldColorsRoot: any = tokensRoot?.color
        if (oldColorsRoot && typeof oldColorsRoot === 'object' && !Array.isArray(oldColorsRoot)) {
          Object.keys(oldColorsRoot).forEach((family) => {
            if (!family || typeof family !== 'string' || family === 'translucent') return
            const levels = oldColorsRoot[family]
            if (!levels || typeof levels !== 'object' || Array.isArray(levels)) return

            Object.keys(levels).forEach((lvl) => {
              if (!/^(\d{2,4}|000|050)$/.test(lvl)) return
              const normalizedLevel = lvl === '1000' ? '1000' : String(lvl).padStart(3, '0')
              const cssVarKey = tokenColor(family, normalizedLevel)
              if (!processedKeys.has(cssVarKey)) {
                const levelObj = levels[lvl]
                if (levelObj && typeof levelObj === 'object') {
                  const val = levelObj.$value
                  if (typeof val === 'string' && val) {
                    vars[cssVarKey] = String(val)
                    processedKeys.add(cssVarKey)
                  }
                }
              }
            })
          })
        }

        Object.assign(allVars, vars)
      } catch (e) {
        console.error('[VarsStore] Error generating color token CSS variables:', e)
      }
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
      } catch (e) {
        console.error('[VarsStore] Error generating font cases/decorations CSS variables:', e)
      }
      // Tokens: expose ALL font token categories as CSS vars
      // This ensures font CSS variables are available on every page, not just the font tokens page
      try {
        const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
        const fontRoot: any = tokensRoot?.font || {}
        const vars: Record<string, string> = {}

        // Read font typefaces exclusively from rf:fonts local storage
        let storedFonts: any[] = []
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('rf:fonts')
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

        if (Array.isArray(storedFonts)) {
          storedFonts.forEach(font => {
            if (font.id && font.family) {
              let cleanFamily = font.family.trim().replace(/^["']|["']$/g, '')
              // Strip any stale baked-in category from the family name itself
              if (cleanFamily.includes(',')) cleanFamily = cleanFamily.split(',')[0].trim()
              // Build a proper CSS font-family string:
              // - Quote the font name if it contains spaces
              // - Append the generic family keyword (unquoted) if available
              const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily
              const fontStack = font.category ? `${quotedName}, ${font.category}` : quotedName
              vars[tokenFont('typefaces', font.id)] = fontStack
              vars[tokenFont('families', font.id)] = fontStack
            }
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
              const num = typeof val === 'number' ? val : Number(val)
              if (Number.isFinite(num)) {
                vars[tokenFont('sizes', key)] = `${num}px`
              } else if (typeof val === 'string') {
                vars[tokenFont('sizes', key)] = val
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
              const num = typeof val === 'number' ? val : Number(val)
              if (Number.isFinite(num)) {
                vars[tokenFont('letter-spacings', key)] = `${num}em`
              } else if (typeof val === 'string') {
                vars[tokenFont('letter-spacings', key)] = val
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
              vars[tokenFont('line-heights', key)] = String(val)
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
      } catch (e) {
        console.error('[VarsStore] Error generating font token CSS variables:', e)
      }
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
            black: `--recursica_brand_themes_${mode}_palettes_core_black`,
            white: `--recursica_brand_themes_${mode}_palettes_core_white`,
            alert: `--recursica_brand_themes_${mode}_palettes_core_alert`,
            warning: `--recursica_brand_themes_${mode}_palettes_core_warning`,
            success: `--recursica_brand_themes_${mode}_palettes_core_success`,
            interactive: `--recursica_brand_themes_${mode}_palettes_core_interactive`,
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
              // Handle nested structure: interactive.default.tone, interactive.default.on-tone, etc.
              const defaultTone = coreValue.default?.tone?.$value || coreValue.default?.tone
              const defaultOnTone = coreValue.default?.['on-tone']?.$value || coreValue.default?.['on-tone']
              const hoverTone = coreValue.hover?.tone?.$value || coreValue.hover?.tone
              const hoverOnTone = coreValue.hover?.['on-tone']?.$value || coreValue.hover?.['on-tone']

              // Main interactive var (backward compatibility) maps to default tone
              if (defaultTone) {
                tokenRef = resolveTokenRef(defaultTone)
              }

              // Generate additional CSS vars for nested structure
              if (defaultTone) {
                const defaultToneRef = resolveTokenRef(defaultTone)
                if (defaultToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_interactive-default-tone`] = defaultToneRef
                }
              }
              if (defaultOnTone) {
                const defaultOnToneRef = resolveTokenRef(defaultOnTone)
                if (defaultOnToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_interactive-default-on-tone`] = defaultOnToneRef
                }
              }
              if (hoverTone) {
                const hoverToneRef = resolveTokenRef(hoverTone)
                if (hoverToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_interactive-hover-tone`] = hoverToneRef
                }
              }
              if (hoverOnTone) {
                const hoverOnToneRef = resolveTokenRef(hoverOnTone)
                if (hoverOnToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_interactive-hover-on-tone`] = hoverOnToneRef
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
                  colors[`--recursica_brand_themes_${mode}_palettes_core_${colorName}-tone`] = toneRef
                }
              }
              if (onTone) {
                const onToneRef = resolveTokenRef(onTone)
                if (onToneRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_${colorName}-on-tone`] = onToneRef
                }
              }
              if (interactive) {
                const interactiveRef = resolveTokenRef(interactive)
                if (interactiveRef) {
                  colors[`--recursica_brand_themes_${mode}_palettes_core_${colorName}-interactive`] = interactiveRef
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

          // Core color CSS variables are generated from theme JSON - no preservation needed
          // Theme JSON is the single source of truth

          Object.assign(allVars, colors)
        }
      } catch { }
      // Palettes - generate for both modes
      const paletteVarsLight = buildPaletteVars(this.state.tokens, this.state.theme, 'Light')
      const paletteVarsDark = buildPaletteVars(this.state.tokens, this.state.theme, 'Dark')

      // Palette CSS variables are generated from theme JSON - no preservation needed
      // Theme JSON is the single source of truth
      const allPaletteVars = { ...paletteVarsLight, ...paletteVarsDark }

      // Note: Overlay CSS variables are now cleared at the start of recomputeAndApplyAll()
      // so we don't need to preserve them here - they'll be set from the generated values in allPaletteVars
      // This ensures that theme JSON changes (like randomization) are properly reflected in the DOM


      Object.assign(allVars, allPaletteVars)
      // allPaletteVars already defined above with preserved values
      // Layers (from Brand) - generate for both modes
      const layerVarsLight = buildLayerVars(this.state.tokens, this.state.theme, 'light', undefined, allPaletteVars)
      const layerVarsDark = buildLayerVars(this.state.tokens, this.state.theme, 'dark', undefined, allPaletteVars)
      const layerVars = { ...layerVarsLight, ...layerVarsDark }

      // Layer CSS variables are generated from theme JSON - no preservation needed
      // Theme JSON is the single source of truth
      Object.assign(allVars, layerVars)
      // Dimensions - generate for both modes (dimensions are mode-agnostic but vars are generated for both)
      try {
        const dimensionVarsLight = buildDimensionVars(this.state.tokens, this.state.theme, 'light')
        const dimensionVarsDark = buildDimensionVars(this.state.tokens, this.state.theme, 'dark')
        Object.assign(allVars, dimensionVarsLight)
        Object.assign(allVars, dimensionVarsDark)
      } catch (e) {
        console.error('[VarsStore] Error generating dimension variables:', e)
      }

      // ─── Compliance is read-only ───
      // Compliance no longer modifies vars in the pipeline.
      // A debounced compliance scan runs after recomputeAndApplyAll completes
      // to FLAG issues (badge count) without modifying any values.

      // UIKit components - generate for all modes during bootstrap
      // UIKit vars are generated for both light and dark modes based on what modes/themes are in recursica_brand.json
      // After initial bootstrap, UIKit vars are also managed via toolbar
      try {
        // Check if any UIKit vars exist in DOM - if they do, skip regenerating (they're managed via toolbar)
        let shouldGenerateUIKitVars = true
        // We always regenerate UIKit vars from state to ensure updates are reflected
        // The previous optimization preventing this caused updates to be ignored if vars existed

        if (shouldGenerateUIKitVars) {
          // Initial bootstrap - generate UIKit vars for both light and dark modes
          const uikitVarsLight = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit, 'light')
          const uikitVarsDark = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit, 'dark')
          uikitVars = { ...uikitVarsLight, ...uikitVarsDark }

          // Preserve manually set mode-independent UIKit variables when switching modes
          // Mode-independent properties (like padding, border-size, border-radius, elevation) should
          // maintain the same value across both light and dark modes
          if (typeof document !== 'undefined') {
            const preservedVars: Record<string, string> = {}

            // Helper to check if a CSS variable is mode-independent (not a color property)
            const isModeIndependent = (cssVar: string): boolean => {
              // Mode-independent properties are those NOT under colors
              return !cssVar.includes('_properties_colors_')
            }

            // Helper to get the opposite mode's CSS variable name
            const getOppositeModeVar = (cssVar: string): string => {
              if (cssVar.includes('_themes_light_')) {
                return cssVar.replace('_themes_light_', '_themes_dark_')
              } else if (cssVar.includes('_themes_dark_')) {
                return cssVar.replace('_themes_dark_', '_themes_light_')
              }
              return cssVar
            }

            // Check all generated UIKit variables for manually set values
            for (const [cssVar, generatedValue] of Object.entries(uikitVars)) {
              // Only preserve mode-independent properties
              if (!isModeIndependent(cssVar)) {
                continue
              }

              // Check if this variable has a manually set value (inline style)
              const inlineValueRaw = document.documentElement.style.getPropertyValue(cssVar)
              const inlineValue = inlineValueRaw ? inlineValueRaw.trim() : ''

              // If there's a manually set value that differs from generated, preserve it
              if (inlineValue && inlineValue !== generatedValue?.trim()) {
                preservedVars[cssVar] = inlineValue

                // Also preserve for the opposite mode to maintain consistency
                const oppositeModeVar = getOppositeModeVar(cssVar)
                preservedVars[oppositeModeVar] = inlineValue
              }
            }

            // Override generated values with preserved values
            Object.assign(uikitVars, preservedVars)
          }

          // Track which UIKit vars actually changed by comparing generated values with current DOM values
          // IMPORTANT: Don't overwrite UIKit vars that have been manually set via toolbar (token reference format)
          if (typeof document !== 'undefined') {
            for (const [cssVar, generatedValue] of Object.entries(uikitVars)) {
              const generatedValueTrimmed = generatedValue ? generatedValue.trim() : ''
              // Read current value from DOM
              const inlineValueRaw = document.documentElement.style.getPropertyValue(cssVar)
              const inlineValue = inlineValueRaw ? inlineValueRaw.trim() : ''

              // If the current value is a token reference (set by toolbar), don't overwrite it
              // Token references look like: {brand.themes.light.elevations.elevation-X}
              // BUT: if the generated value is a proper var() reference (resolved), always use it
              // over stale unresolved brace notation from previous sessions
              if (inlineValue && inlineValue.startsWith('{') && inlineValue.includes('brand.themes')) {
                // Only preserve if the new value is ALSO brace notation (unresolved)
                // If the new value is resolved (starts with var()), use the resolved value
                if (generatedValueTrimmed.startsWith('{') || !generatedValueTrimmed.startsWith('var(')) {
                  // Keep the toolbar-set value, don't overwrite with generated value
                  delete uikitVars[cssVar]
                  continue
                }
                // Otherwise, resolved value takes precedence over stale brace notation
              }

              // Track if this var will actually change from what's currently in the DOM
              if (generatedValueTrimmed !== inlineValue) {
                changedUikitVars.add(cssVar)
              }
            }
          }

          Object.assign(allVars, uikitVars)
        } else {
          // UIKit vars already exist - skip regenerating them (they're managed via toolbar)
          uikitVars = {}
        }
      } catch { }
      // Typography
      const typeChoices = this.readTypeChoices()
      const { vars: typeVars, familiesToLoad } = buildTypographyVars(this.state.tokens, this.state.theme, undefined, typeChoices)

      // Typography CSS variables are generated from theme JSON and type choices - no preservation needed
      // Theme JSON and type choices are the single source of truth

      Object.assign(allVars, typeVars)

      // Re-apply rf:fonts font stacks AFTER typography merge.
      // The typography resolver reads from the base tokens JSON, which may have
      // stale typeface values. rf:fonts is the source of truth for font assignments,
      // so its values must overwrite whatever the typography resolver produced.
      try {
        let fontsForOverride: any[] = []
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('rf:fonts')
            if (raw) fontsForOverride = JSON.parse(raw)
          }
        } catch { }
        if (Array.isArray(fontsForOverride) && fontsForOverride.length > 0) {
          fontsForOverride.forEach((font: any) => {
            if (font.id && font.family) {
              let cleanFamily = font.family.trim().replace(/^["']|["']$/g, '')
              if (cleanFamily.includes(',')) cleanFamily = cleanFamily.split(',')[0].trim()
              const quotedName = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily
              const fontStack = font.category ? `${quotedName}, ${font.category}` : quotedName
              allVars[tokenFont('typefaces', font.id)] = fontStack
              allVars[tokenFont('families', font.id)] = fontStack
            }
          })
        }
      } catch { }

      // Load fonts asynchronously - don't wait, don't trigger recomputes
      // CSS variables are already set with font names, fonts will apply when loaded
      // Fonts MUST load (async is fine, but they must load)
      if (familiesToLoad.length > 0 && typeof window !== 'undefined') {
        // Load fonts in background without blocking or triggering events
        Promise.all(familiesToLoad.map(async (family) => {
          try {
            const trimmed = String(family).trim()
            if (!trimmed) return
            // Load font (async is fine, but it must load)
            const { ensureFontLoaded } = await import('../../modules/type/fontUtils')
            await ensureFontLoaded(trimmed).catch((error) => {
              console.warn(`Failed to load font "${trimmed}" during recompute:`, error)
            })
          } catch (error) {
            console.warn(`Failed to load font:`, error)
          }
        })).catch((error) => {
          console.warn('Failed to load some fonts during recompute:', error)
        })
      }

      // Elevation CSS variables (apply for levels 0..4) - generate for both modes
      // Track which elevations have custom controls in any mode (to avoid token conflicts)
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
              // Read directly from tokens - no overrides
              // Support both plural and singular forms
              if ((parts[0] === 'size' || parts[0] === 'sizes') && parts[1]) {
                return root?.sizes?.[parts[1]]?.$value || root?.size?.[parts[1]]?.$value
              }
              if ((parts[0] === 'opacity' || parts[0] === 'opacities') && parts[1]) {
                return root?.opacities?.[parts[1]]?.$value || root?.opacity?.[parts[1]]?.$value
              }
              if ((parts[0] === 'color' || parts[0] === 'colors') && parts[1] && parts[2]) {
                // Support both old format (color/family/level) and new format (colors/scale-XX/level)
                if (parts[0] === 'colors' && parts[1]?.startsWith('scale-')) {
                  return root?.colors?.[parts[1]]?.[parts[2]]?.$value
                }
                return root?.color?.[parts[1]]?.[parts[2]]?.$value || root?.colors?.[parts[1]]?.[parts[2]]?.$value
              }
              return undefined
            }
          }
          const toNumber = (v: any): number => {
            if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) return Number((v as any).value)
            return Number(v)
          }
          // Build ordered list of size tokens by numeric value for stepped progression
          const sizeTokenOrder: Array<{ name: string; value: number }> = (() => {
            try {
              const src: any = (this.state.tokens as any)?.tokens?.sizes || (this.state.tokens as any)?.tokens?.size
              if (!src || typeof src !== 'object' || Array.isArray(src)) {
                return []
              }
              const list: Array<{ name: string; value: number }> = []
              Object.keys(src).forEach((short) => {
                if (short.startsWith('$')) return
                const sizeObj = src[short]
                if (!sizeObj || typeof sizeObj !== 'object') return
                const raw = sizeObj.$value
                const val = toNumber(raw)
                if (Number.isFinite(val)) list.push({ name: `size/${short}`, value: val })
              })
              // sort by numeric ascending
              list.sort((a, b) => a.value - b.value)
              return list
            } catch { return [] }
          })()
          const nextSizeTokenName = (baseToken: string, steps: number): string => {
            const idx = sizeTokenOrder.findIndex((t) => t.name === baseToken)
            if (idx === -1) return baseToken
            const nextIdx = Math.min(sizeTokenOrder.length - 1, Math.max(0, idx + Math.max(0, steps)))
            return sizeTokenOrder[nextIdx]?.name ?? baseToken
          }
          // Read scaling preferences (defaults match prior UI)
          const readBool = (k: string, def: boolean) => {
            try {
              const v = localStorage.getItem(k)
              if (v === null) return def
              return v === 'true'
            } catch { return def }
          }
          const scaleBlur = readBool('blur-scale-by-default', true)
          const scaleSpread = readBool('spread-scale-by-default', false)
          const scaleX = readBool('offset-x-scale-by-default', false)
          const scaleY = readBool('offset-y-scale-by-default', false)
          const parseAlphaValue = (v: any): number => {
            const n = toNumber(v)
            if (!Number.isFinite(n)) return 1
            return n <= 1 ? Math.max(0, Math.min(1, n)) : Math.max(0, Math.min(1, n / 100))
          }
          const hexToRgba = (hex: string, a: number): string => {
            try {
              let h = String(hex || '').trim()
              if (!h) return `rgba(0,0,0,${a})`
              if (!h.startsWith('#')) h = `#${h}`
              const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
              if (!m) return h
              const r = parseInt(m[1], 16)
              const g = parseInt(m[2], 16)
              const b = parseInt(m[3], 16)
              return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`
            } catch { return hex }
          }
          const colorMixWithOpacityVar = (colorVarRef: string, alphaVarRef: string): string =>
            // Use modern CSS color-mix so both color and opacity are driven by tokens.
            // Convert 0..1 opacity token to percentage weight for color-mix.
            `color-mix(in srgb, ${colorVarRef} calc(${alphaVarRef} * 100%), transparent)`

          // Helper to read elevation values directly from recursica_brand.json for the current mode
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

          const shadowColorForLevel = (level: number, paletteVars?: Record<string, string>): string => {
            const key = `elevation-${level}`
            const sel = this.state.elevation.paletteSelections[key]
            if (sel) {
              // Use palette CSS variable instead of token CSS variable
              const paletteVarName = `--recursica_brand_themes_${mode}_palettes_${sel.paletteKey}_${sel.level}_color_tone`
              // Check if palette var exists in paletteVars (during initialization) or use var() reference
              const paletteVarRef = paletteVars?.[paletteVarName] ? paletteVars[paletteVarName] : `var(${paletteVarName})`
              const modeAlphaTokens = this.state.elevation.alphaTokens[mode] || {}
              let alphaTok = modeAlphaTokens[key]
              let alphaVarRef = ''
              if (!alphaTok) {
                  const elevNode: any = modeElevations?.[key]?.['$value'] || baseElevationNode
                  const opRaw = elevNode?.opacity
                  if (opRaw && typeof opRaw === 'object' && opRaw.$value !== undefined) {
                      const opVal = toNumeric(opRaw)
                      const norm = opVal <= 1 ? Number(opVal.toFixed(2)) : Number((opVal / 100).toFixed(2))
                      alphaVarRef = String(norm)
                  } else {
                      alphaTok = this.state.elevation.shadowColorControl.alphaToken
                      alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
                  }
              } else {
                  alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
              }
              return colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
            }
            const tok = this.state.elevation.colorTokens[key] || this.state.elevation.shadowColorControl.colorToken
            const modeAlphaTokens = this.state.elevation.alphaTokens[mode] || {}
            let alphaTok = modeAlphaTokens[key]
            let alphaVarRef = ''
            if (!alphaTok) {
                const elevNode: any = modeElevations?.[key]?.['$value'] || baseElevationNode
                const opRaw = elevNode?.opacity
                if (opRaw && typeof opRaw === 'object' && opRaw.$value !== undefined) {
                    const opVal = toNumeric(opRaw)
                    const norm = opVal <= 1 ? Number(opVal.toFixed(2)) : Number((opVal / 100).toFixed(2))
                    alphaVarRef = String(norm)
                } else {
                    alphaTok = this.state.elevation.shadowColorControl.alphaToken
                    alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
                }
            } else {
                alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
            }
            // Use tokenToCssVar to properly convert token names to CSS vars (handles old and new formats)
            // Pass tokens to resolve aliases to scale keys
            const colorVarRef = tokenToCssVar(tok, this.state.tokens) || `var(--recursica_tokens_${tok.replace(/\//g, '-')})`
            return colorMixWithOpacityVar(colorVarRef, alphaVarRef)
          }
          const dirForLevel = (level: number): { x: 'left' | 'right'; y: 'up' | 'down' } => {
            const key = `elevation-${level}`
            const modeDirections = this.state.elevation.directions[mode] || {}
            const dir = modeDirections[key] || { x: this.state.elevation.baseXDirection, y: this.state.elevation.baseYDirection }
            return dir
          }
          // Read elevation values from recursica_brand.json for the current mode
          const brand: any = (this.state.theme as any)?.brand || (this.state.theme as any)
          const themes = brand?.themes || brand
          const modeElevations: any = themes?.[mode]?.elevations || {}
          const baseElevationNode: any = modeElevations?.['elevation-0']?.['$value'] || {}

          const vars: Record<string, string> = {}
          // Update tokens with mode-specific elevation values from recursica_brand.json before generating CSS variables
          // This ensures token references resolve to the correct mode-specific values
          const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
          if (!tokensRoot.sizes) tokensRoot.sizes = {}
          const sizeTokens = tokensRoot.sizes

          // Generate elevation variables for levels 0-4
          // Read values directly from recursica_brand.json for the current mode, update tokens, then reference them
          for (let i = 0; i <= 4; i += 1) {
            const k = `elevation-${i}`
            const elevNode: any = modeElevations?.[k]?.['$value'] || baseElevationNode
            if (!elevNode || Object.keys(elevNode).length === 0) {
              continue
            }

            // Check if user has customized this elevation - if so, use control values instead of recursica_brand.json
            // Read controls for the current mode being processed
            const control = this.state.elevation.controls[mode]?.[k]
            let blurValue: number
            let spreadValue: number
            let xValue: number
            let yValue: number
            let hasCustomControls = false

            if (control) {
              // Use user-customized control values for this mode
              blurValue = control.blur
              spreadValue = control.spread
              xValue = control.offsetX
              yValue = control.offsetY
              hasCustomControls = true
            } else {
              // Read values directly from recursica_brand.json for this mode
              const blurRaw = elevNode?.blur
              const spreadRaw = elevNode?.spread
              const xRaw = elevNode?.x
              const yRaw = elevNode?.y

              blurValue = toNumeric(blurRaw)
              spreadValue = toNumeric(spreadRaw)
              xValue = toNumeric(xRaw)
              yValue = toNumeric(yRaw)
            }

            const dir = dirForLevel(i)
            const sxValue = dir.x === 'right' ? xValue : -xValue
            const syValue = dir.y === 'down' ? yValue : -yValue
            const brandScope = `--brand_themes_${mode}_elevations_elevation-${i}`
            const prefixedScope = `--recursica_${brandScope.slice(2)}`

            // Token names for reference (used as fallback only)
            const blurTokenName = `size/elevation-${i}-blur`
            const spreadTokenName = `size/elevation-${i}-spread`
            const offsetXTokenName = `size/elevation-${i}-offset-x`
            const offsetYTokenName = `size/elevation-${i}-offset-y`

            // Always set CSS variables directly to avoid token conflicts between modes
            // Tokens are shared, so we can't use them for mode-specific values
            // Only update tokens when no controls exist in ANY mode (for backwards compatibility)
            const hasControlsInAnyMode = elevationsWithControls.has(k)
            if (!hasControlsInAnyMode && mode === 'dark') {
              // Update tokens with dark mode defaults (for backwards compatibility)
              // These tokens won't be used for CSS variables, but may be referenced elsewhere
              sizeTokens[`elevation-${i}-blur`] = { $type: 'number', $value: blurValue }
              sizeTokens[`elevation-${i}-spread`] = { $type: 'number', $value: spreadValue }
              sizeTokens[`elevation-${i}-offset-x`] = { $type: 'number', $value: xValue }
              sizeTokens[`elevation-${i}-offset-y`] = { $type: 'number', $value: yValue }
            }

            // Check if there's already a palette CSS variable set (preserve user selections)
            const existingColor = readCssVar(`${prefixedScope}_shadow-color`)
            const modeAlphaTokens = this.state.elevation.alphaTokens[mode] || {}
            let alphaTok = modeAlphaTokens[k]
            let alphaVarRef = ''
            if (!alphaTok) {
                const opRaw = elevNode?.opacity
                if (opRaw && typeof opRaw === 'object' && opRaw.$value !== undefined) {
                    const opVal = toNumeric(opRaw)
                    const norm = opVal <= 1 ? Number(opVal.toFixed(2)) : Number((opVal / 100).toFixed(2))
                    alphaVarRef = String(norm)
                } else {
                    alphaTok = this.state.elevation.shadowColorControl.alphaToken
                    alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
                }
            } else {
                alphaVarRef = tokenToCssVar(alphaTok, this.state.tokens) || `var(--recursica_tokens_opacities_${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
            }

            // Check if existing color contains a palette reference (could be var() or color-mix())
            const hasPaletteRef = existingColor && (
              (existingColor.startsWith('var(') && existingColor.includes('palettes')) ||
              (existingColor.includes('color-mix') && existingColor.includes('palettes'))
            )

            if (hasPaletteRef) {
              // Extract the palette var reference from existingColor
              let paletteVarRef: string | null = null

              // If it's a direct var() reference to a palette
              const unwrapped = unwrapVar(existingColor)
              if (unwrapped && unwrapped.includes('palettes')) {
                paletteVarRef = `var(${unwrapped})`
              } else {
                // If it's a color-mix, extract the palette var from it
                const colorMixVarMatch = existingColor.match(/color-mix\s*\([^,]+,\s*(var\s*\([^)]+\))/)
                if (colorMixVarMatch) {
                  const innerUnwrapped = unwrapVar(colorMixVarMatch[1])
                  if (innerUnwrapped && innerUnwrapped.includes('palettes')) {
                    paletteVarRef = `var(${innerUnwrapped})`
                  }
                }
              }

              if (paletteVarRef) {
                // Preserve palette CSS variable and apply current opacity
                vars[`${prefixedScope}_shadow-color`] = colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
              } else {
                // Fallback: use existing color as-is (shouldn't happen, but just in case)
                vars[`${prefixedScope}_shadow-color`] = existingColor
              }
            } else {
              // Calculate color from state
              const color = shadowColorForLevel(i, allPaletteVars)
              vars[`${prefixedScope}_shadow-color`] = String(color)
            }

            // Always set CSS variables directly with pixel values to avoid token conflicts between modes
            // Tokens are shared, so we can't rely on them for mode-specific values
            // Set CSS variables directly from controls (if they exist) or recursica_brand.json defaults
            vars[`${prefixedScope}_blur`] = `${blurValue}px`
            vars[`${prefixedScope}_spread`] = `${spreadValue}px`

            // Apply direction for offsets
            const finalXValue = dir.x === 'right' ? xValue : -xValue
            const finalYValue = dir.y === 'down' ? yValue : -yValue
            vars[`${prefixedScope}_x-axis`] = `${finalXValue}px`
            vars[`${prefixedScope}_y-axis`] = `${finalYValue}px`
          }
          Object.assign(allVars, vars)
        } catch (e) {
          throw e
        }
      }

      // Apply all CSS variables at once (with validation)
      // Debug: log if critical variables are missing
      if (process.env.NODE_ENV === 'development') {
        const criticalVars = [
          '--recursica_brand_themes_light_layers_layer-0_properties_surface',
          '--recursica_brand_themes_light_elevations_elevation-4_x-axis',
          '--recursica_brand_typography_caption-font-family',
          '--recursica_brand_dimensions_general_sm'
        ]
      }
      {
        // Compute layer element colors (text, interactive, status) based on layer surfaces.
        // This is a rendering step, not a compliance auto-fix — it determines the correct
        // text color for each layer by examining the surface background color.
        if (this.aaWatcher) {
          this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
          this.aaWatcher.fixLayerElementColorsInMap(allVars)
        }

        applyCssVars(allVars, this.state.tokens)
        // Store computed vars for delta snapshotting
        actuallyChangedVars = Object.keys(allVars).filter(k => this.lastComputedVars[k] !== allVars[k])
        this.lastComputedVars = { ...allVars }

        // Re-overlay the in-memory delta so user CSS-var changes survive the recompute.
        // Without this, any change made via updateCssVar() (e.g. interactive color) that
        // hasn't been written back to the JSON state would be overwritten by the freshly
        // generated vars above.
        reapplyDelta()

        // Generate scoped CSS aliases and set theme attribute
        if (typeof document !== 'undefined') {
          updateScopedCss(allVars)
          setThemeAttribute(currentMode === 'dark' ? 'dark' : 'light')
        }
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
    } catch (err) {
      console.error('Error finding palettes using color:', err)
    }
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
        const toneCssVar = `--recursica_brand_themes_${mode}_palettes_core_${colorName}-tone`
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
    } catch (err) {
      console.error('Failed to update core color on-tones:', err)
    }
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


