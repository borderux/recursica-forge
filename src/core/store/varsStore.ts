import type { JsonLike } from '../resolvers/tokens'
import { buildPaletteVars } from '../resolvers/palettes'
import { buildLayerVars } from '../resolvers/layers'
import { buildTypographyVars, type TypographyChoices } from '../resolvers/typography'
import { buildUIKitVars } from '../resolvers/uikit'
import { buildDimensionVars } from '../resolvers/dimensions'
import { applyCssVars, type CssVarMap, clearAllCssVars } from '../css/apply'
import { findTokenByHex } from '../css/tokenRefs'
import { computeBundleVersion } from './versioning'
import { readCssVar } from '../css/readCssVar'
import tokensImport from '../../vars/Tokens.json'
import themeImport from '../../vars/Brand.json'
import uikitImport from '../../vars/UIKit.json'
// Note: Override system removed - tokens are now the single source of truth

type PaletteStore = {
  opacity: Record<'disabled' | 'overlay' | 'text-high' | 'text-low', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ElevationControl = { blurToken: string; spreadToken: string; offsetXToken: string; offsetYToken: string }
export type ElevationState = {
  controls: Record<string, ElevationControl>
  colorTokens: Record<string, string>
  alphaTokens: Record<string, string>
  paletteSelections: Record<string, { paletteKey: string; level: string }>
  baseXDirection: 'left' | 'right'
  baseYDirection: 'up' | 'down'
  directions: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }>
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
  tokens: 'rf:tokens',
  theme: 'rf:theme',
  uikit: 'rf:uikit',
  palettes: 'rf:palettes',
  elevation: 'rf:elevation',
}

function isLocalStorageAvailable(): boolean {
  try { if (typeof window === 'undefined' || !window.localStorage) return false; const k = '__ls__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true } catch { return false }
}

function readLSJson<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
function writeLSJson<T>(key: string, value: T) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

function toTitleCase(label: string): string { return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim() }

function migratePaletteLocalKeys(): PaletteStore {
  const opacityRaw = readLSJson<Record<string, { token: string; value: number }>>('palette-opacity-bindings', {} as any)
  const normalizeOpacityBindings = (src?: Record<string, { token: string; value: number }>): PaletteStore['opacity'] => {
    const def: PaletteStore['opacity'] = {
      disabled: { token: 'opacity/faint', value: 0.5 },
      overlay: { token: 'opacity/veiled', value: 0.5 },
      'text-high': { token: 'opacity/solid', value: 1 },
      'text-low': { token: 'opacity/veiled', value: 0.5 },
    }
    const out: PaletteStore['opacity'] = { ...def }
    try {
      Object.entries(src || {}).forEach(([k, v]) => {
        if (!v || typeof v !== 'object') return
        if ((k === 'disabled' || k === 'overlay' || k === 'text-high' || k === 'text-low') && typeof v.token === 'string') {
          const num = typeof v.value === 'number' ? v.value : Number(v.value)
          out[k] = { token: v.token, value: Number.isFinite(num) ? num : def[k].value }
        }
      })
    } catch {}
    return out
  }
  const opacity = normalizeOpacityBindings(opacityRaw)
  const dynamic = readLSJson<Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>>('dynamic-palettes', [
    { key: 'neutral', title: 'Neutral (Grayscale)', defaultLevel: 200 },
    { key: 'palette-1', title: 'Palette 1', defaultLevel: 500 },
    { key: 'palette-2', title: 'Palette 2', defaultLevel: 500 },
  ])
  const primaryLevels: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || ''
      if (k.startsWith('palette-primary-level:')) {
        // Format is now: palette-primary-level:${paletteKey}:${mode}
        const parts = k.split(':')
        if (parts.length >= 2) {
          const key = parts[1] || ''
          const v = JSON.parse(localStorage.getItem(k) || 'null')
          if (typeof v === 'string') primaryLevels[key] = v
        }
      }
    }
  } catch {}
  return { opacity, dynamic, primaryLevels }
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

class VarsStore {
  private state: VarsState
  private listeners: Set<Listener> = new Set()
  private lsAvailable = isLocalStorageAvailable()
  private aaWatcher: import('../compliance/AAComplianceWatcher').AAComplianceWatcher | null = null

  constructor() {
    const tokensRaw = this.lsAvailable ? readLSJson(STORAGE_KEYS.tokens, tokensImport as any) : (tokensImport as any)
    // Sort font token objects once during initialization to maintain consistent order
    const tokens = sortFontTokenObjects(tokensRaw)
    const themeRaw = this.lsAvailable ? readLSJson(STORAGE_KEYS.theme, themeImport as any) : (themeImport as any)
    const theme = (themeRaw as any)?.brand ? themeRaw : ({ brand: themeRaw } as any)
    const uikit = this.lsAvailable ? readLSJson(STORAGE_KEYS.uikit, uikitImport as any) : (uikitImport as any)
    const palettes = this.lsAvailable ? readLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys()) : migratePaletteLocalKeys()
    const elevation = this.initElevationState(theme as any)
    this.state = { tokens, theme, uikit, palettes, elevation, version: 0 }

    // Versioning and seeding when bundle changes
    if (this.lsAvailable) {
      const bundleVersion = computeBundleVersion(tokensImport, themeImport, uikitImport)
      const storedVersion = localStorage.getItem(STORAGE_KEYS.version)
      if (storedVersion !== bundleVersion) {
        writeLSJson(STORAGE_KEYS.tokens, tokensImport)
        const normalizedTheme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
        writeLSJson(STORAGE_KEYS.theme, normalizedTheme)
        writeLSJson(STORAGE_KEYS.uikit, uikitImport)
        writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
        try {
          const colors: any = (tokensImport as any)?.tokens?.color || {}
          const names: Record<string, string> = {}
          Object.keys(colors).forEach((fam) => { if (fam !== 'translucent') names[fam] = toTitleCase(fam) })
          writeLSJson('family-friendly-names', names)
        } catch {}
        localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
        // Sort font token objects when resetting to maintain consistent order
        const sortedTokens = sortFontTokenObjects(tokensImport as any)
        this.state = { tokens: sortedTokens, theme: normalizedTheme as any, uikit: uikitImport as any, palettes: migratePaletteLocalKeys(), elevation: this.initElevationState(normalizedTheme as any), version: (this.state?.version || 0) + 1 }
      }
      // Ensure keys exist
      if (!localStorage.getItem(STORAGE_KEYS.tokens)) writeLSJson(STORAGE_KEYS.tokens, this.state.tokens)
      if (!localStorage.getItem(STORAGE_KEYS.theme)) writeLSJson(STORAGE_KEYS.theme, this.state.theme)
      if (!localStorage.getItem(STORAGE_KEYS.uikit)) writeLSJson(STORAGE_KEYS.uikit, this.state.uikit)
      if (!localStorage.getItem(STORAGE_KEYS.palettes)) writeLSJson(STORAGE_KEYS.palettes, this.state.palettes)
      if (!localStorage.getItem(STORAGE_KEYS.elevation)) writeLSJson(STORAGE_KEYS.elevation, this.state.elevation)
    }

    // Initial CSS apply (Light mode palettes + layers + typography)
    this.recomputeAndApplyAll()

    // Initialize AA compliance watcher
    this.initAAWatcher()

    // React to type choice changes and palette changes (centralized)
    const onTypeChoices = () => { this.bumpVersion(); this.recomputeAndApplyAll() }
    const onPaletteVarsChanged = () => { this.bumpVersion(); this.recomputeAndApplyAll() }
    const onPaletteFamilyChanged = () => { this.bumpVersion(); this.recomputeAndApplyAll() }
    window.addEventListener('typeChoicesChanged', onTypeChoices as any)
    // Recompute layers and dependent CSS whenever palette CSS vars or families change
    window.addEventListener('paletteVarsChanged', onPaletteVarsChanged as any)
    window.addEventListener('paletteFamilyChanged', onPaletteFamilyChanged as any)
  }

  private initAAWatcher() {
    // Import and initialize AA compliance watcher
    import('../compliance/AAComplianceWatcher').then(({ AAComplianceWatcher }) => {
      this.aaWatcher = new AAComplianceWatcher(this.state.tokens, this.state.theme)
      
      // Watch all palette on-tone vars for both light and dark modes
      try {
        const root: any = (this.state.theme as any)?.brand ? (this.state.theme as any).brand : this.state.theme
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root
        const levels = ['900','800','700','600','500','400','300','200','100','050']
        // Watch both light and dark modes
        for (const mode of ['light', 'dark'] as const) {
          const pal: any = themes?.[mode]?.palettes || {}
          Object.keys(pal).forEach((paletteKey) => {
            if (paletteKey === 'core' || paletteKey === 'core-colors') return
            levels.forEach((level) => {
              this.aaWatcher?.watchPaletteOnTone(paletteKey, level, mode)
            })
          })
        }
      } catch {}
      
      // Watch all layer surfaces
      for (let i = 0; i <= 4; i++) {
        this.aaWatcher?.watchLayerSurface(i)
      }
      
      // Watch alternative layer surfaces (all alternative layers from Brand.json)
      const altKeys = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
      altKeys.forEach((key) => {
        this.aaWatcher?.watchAlternativeLayerSurface(key)
      })
      
      // Watch core colors (alert, warning, success, interactive) to update alternative layers
      this.aaWatcher?.watchCoreColors()
      
      // Run startup validation after CSS vars are applied
      // The watcher will run its own validation, but we also ensure it runs after a delay
      setTimeout(() => {
        if (this.aaWatcher) {
          // Force a full compliance check
          this.aaWatcher.updateAllLayers()
        }
      }, 200)
    })
  }

  getState(): VarsState { return this.state }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private emit() { this.listeners.forEach((l) => l()) }
  
  /**
   * Trigger AA compliance checks for all alternative layers (call when navigating to layers page)
   */
  checkAlternativeLayersAA() {
    if (this.aaWatcher) {
      this.aaWatcher.checkAllAlternativeLayers()
    }
  }

  private writeState(next: Partial<VarsState>, skipRecompute = false) {
    this.state = { ...this.state, ...next }
    if (this.lsAvailable) {
      if (next.tokens) writeLSJson(STORAGE_KEYS.tokens, this.state.tokens)
      if (next.theme) writeLSJson(STORAGE_KEYS.theme, this.state.theme)
      if (next.uikit) writeLSJson(STORAGE_KEYS.uikit, this.state.uikit)
      if (next.palettes) writeLSJson(STORAGE_KEYS.palettes, this.state.palettes)
      if (next.elevation) writeLSJson(STORAGE_KEYS.elevation, this.state.elevation)
    }
    
    // Update AA watcher if tokens or theme changed
    if (this.aaWatcher && (next.tokens || next.theme)) {
      this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
    }
    
    this.emit()
    if (!skipRecompute) {
      this.recomputeAndApplyAll()
    }
  }

  private bumpVersion() { this.state = { ...this.state, version: (this.state.version || 0) + 1 }; this.emit() }

  setTokens(next: JsonLike) { this.writeState({ tokens: next }) }
  setTheme(next: JsonLike) { this.writeState({ theme: next }) }
  setUiKit(next: JsonLike) { this.writeState({ uikit: next }) }
  setPalettes(next: PaletteStore) { this.writeState({ palettes: next }) }
  setElevation(next: ElevationState) { this.writeState({ elevation: next }) }
  updateElevation(mutator: (prev: ElevationState) => ElevationState) { this.writeState({ elevation: mutator(this.state.elevation) }) }

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
        // Read the updated value from state
        const tokenValue = tokensRoot?.font?.[kind]?.[key]?.$value
        if (tokenValue == null) return

        // Update ONLY the direct font token CSS var
        // Do NOT rebuild all typography vars - they will be updated on next full recompute
        const formatFontValue = (val: any, category: string): string | undefined => {
          if (category === 'size') {
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}px` : undefined
          } else if (category === 'letter-spacing') {
            const num = typeof val === 'number' ? val : Number(val)
            return Number.isFinite(num) ? `${num}em` : undefined
          } else if (category === 'weight' || category === 'line-height') {
            return String(val)
          } else if (category === 'family' || category === 'typeface') {
            return String(val)
          }
          return undefined
        }
        
        const formattedValue = formatFontValue(tokenValue, kind)
        if (formattedValue) {
          varsToUpdate[`--tokens-font-${kind}-${key}`] = formattedValue
        }
        // Note: Typography vars that reference this token will update automatically
        // via CSS var() references, so we don't need to rebuild them here
      } else if (category === 'size' && rest.length >= 1) {
        const [key] = rest
        const tokenValue = tokensRoot?.size?.[key]?.$value
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
        if (px) varsToUpdate[`--tokens-size-${key}`] = px
      } else if (category === 'opacity' && rest.length >= 1) {
        const [key] = rest
        const tokenValue = tokensRoot?.opacity?.[key]?.$value
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
        if (norm) varsToUpdate[`--tokens-opacity-${key}`] = norm
      } else if (category === 'color' && rest.length >= 2) {
        const [family, level] = rest
        const tokenValue = tokensRoot?.color?.[family]?.[level]?.$value
        if (tokenValue == null) return
        
        const cssVarKey = `--tokens-color-${family}-${String(level).padStart(3, '0')}`
        varsToUpdate[cssVarKey] = String(tokenValue)
      }

      // Apply only the affected CSS variables (with validation)
      // Ensure we only update the specific CSS variable(s) for this token
      if (Object.keys(varsToUpdate).length > 0) {
        // Only apply the CSS variables that were added for this specific token
        // This prevents accidentally updating other CSS variables
        applyCssVars(varsToUpdate, this.state.tokens)
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
      
      if (category === 'color' && rest.length >= 2) {
        const [family, level] = rest
        if (!tokensRoot.color) tokensRoot.color = {}
        if (!tokensRoot.color[family]) tokensRoot.color[family] = {}
        if (!tokensRoot.color[family][level]) tokensRoot.color[family][level] = {}
        tokensRoot.color[family][level].$value = String(value)
      } else if (category === 'size' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.size) tokensRoot.size = {}
        if (!tokensRoot.size[key]) tokensRoot.size[key] = {}
        tokensRoot.size[key].$value = typeof value === 'number' ? value : String(value)
      } else if (category === 'opacity' && rest.length >= 1) {
        const [key] = rest
        if (!tokensRoot.opacity) tokensRoot.opacity = {}
        if (!tokensRoot.opacity[key]) tokensRoot.opacity[key] = {}
        tokensRoot.opacity[key].$value = typeof value === 'number' ? value : String(value)
      } else if (category === 'font' && rest.length >= 2) {
        const [kind, key] = rest
        if (!tokensRoot.font) tokensRoot.font = {}
        if (kind === 'size' || kind === 'weight' || kind === 'letter-spacing' || kind === 'line-height') {
          if (!tokensRoot.font[kind]) tokensRoot.font[kind] = {}
          if (!tokensRoot.font[kind][key]) tokensRoot.font[kind][key] = {}
          tokensRoot.font[kind][key].$value = typeof value === 'number' ? value : String(value)
        } else if (kind === 'family' || kind === 'typeface') {
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
      
      // Update state without triggering full recompute
      this.writeState({ tokens: sortedTokens }, true)
      
      // Update only the affected CSS variable(s)
      this.updateSingleTokenCssVar(tokenName)
    } catch (error) {
      console.error('Failed to update token:', tokenName, error)
    }
  }

  resetAll() {
    // Clear all CSS variables from DOM first
    clearAllCssVars()
    
    const normalizedTheme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
    // Sort font token objects when resetting to maintain consistent order
    const sortedTokens = sortFontTokenObjects(tokensImport as any)
    if (this.lsAvailable) {
      writeLSJson(STORAGE_KEYS.tokens, sortedTokens)
      writeLSJson(STORAGE_KEYS.theme, normalizedTheme)
      writeLSJson(STORAGE_KEYS.uikit, uikitImport)
      writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
      // Ensure elevation storage is cleared so stale values aren't reapplied by the UI
      try { localStorage.removeItem(STORAGE_KEYS.elevation) } catch {}
      try {
        const colors: any = (tokensImport as any)?.tokens?.color || {}
        const names: Record<string, string> = {}
        Object.keys(colors).forEach((fam) => { if (fam !== 'translucent') names[fam] = toTitleCase(fam) })
        writeLSJson('family-friendly-names', names)
      } catch {}
      localStorage.setItem(STORAGE_KEYS.version, computeBundleVersion(tokensImport, themeImport, uikitImport))
    }
    // Remove legacy palette primary level keys
    try {
      const toRemove: string[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i) || ''
        if (k.startsWith('palette-primary-level:')) toRemove.push(k)
      }
      toRemove.forEach((k) => { try { localStorage.removeItem(k) } catch {} })
    } catch {}
    // Clear elevation-related keys so pages reseed from JSON
    try {
      ['elevation-controls','shadow-color-control','elevation-color-tokens','elevation-alpha-tokens','elevation-palette-selections','elevation-directions','offset-x-direction','offset-y-direction']
        .forEach((k) => { try { localStorage.removeItem(k) } catch {} })
    } catch {}
    this.state = { tokens: sortedTokens, theme: normalizedTheme as any, uikit: uikitImport as any, palettes: migratePaletteLocalKeys(), elevation: this.initElevationState(normalizedTheme as any), version: (this.state.version || 0) + 1 }
    // Persist freshly initialized elevation defaults so future reads are consistent
    if (this.lsAvailable) {
      try { writeLSJson(STORAGE_KEYS.elevation, this.state.elevation) } catch {}
    }
    this.emit()
    this.recomputeAndApplyAll()
    // Update AA watcher with new tokens/theme and check alternative layers
    if (this.aaWatcher) {
      this.aaWatcher.updateTokensAndTheme(sortedTokens, normalizedTheme as any)
      // Force check all alternative layers after reset
      this.aaWatcher.checkAllAlternativeLayers()
    }
    // Notify legacy listeners so UI components can force refresh where needed
    try { window.dispatchEvent(new CustomEvent('paletteReset')) } catch {}
  }

  private initElevationState(theme: any): ElevationState {
    // Try consolidated key first
    if (this.lsAvailable) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.elevation)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    // Build defaults from theme
    const brand: any = (theme as any)?.brand || (theme as any)
    // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
    const themes = brand?.themes || brand
    const light: any = themes?.light?.elevations || {}
    const toSize = (ref?: any): string => {
      const s: string | undefined = typeof ref === 'string' ? ref : (ref?.['$value'] as any)
      if (!s) return 'size/none'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'size') {
        const key = parts.slice(2).join('.')
        return `size/${key}`
      }
      return 'size/none'
    }
    const controls: Record<string, ElevationControl> = {}
    for (let i = 0; i <= 4; i++) {
      const node: any = light[`elevation-${i}`]?.['$value'] || {}
      controls[`elevation-${i}`] = {
        blurToken: toSize(node?.blur?.['$value'] ?? node?.blur),
        spreadToken: toSize(node?.spread?.['$value'] ?? node?.spread),
        offsetXToken: toSize(node?.x?.['$value'] ?? node?.x),
        offsetYToken: toSize(node?.y?.['$value'] ?? node?.y),
      }
    }
    const parseOpacity = (s?: string) => {
      if (!s) return 'opacity/veiled'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'opacity' && parts[2]) return `opacity/${parts[2]}`
      return 'opacity/veiled'
    }
    const parseColorToken = (s?: string) => {
      if (!s) return 'color/gray/900'
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      const parts = inner.split('.')
      if ((parts[0] || '').toLowerCase() === 'tokens' && parts[1] === 'color' && parts[2] && parts[3]) return `color/${parts[2]}/${parts[3]}`
      return 'color/gray/900'
    }
    const parsePaletteSelection = (s?: string): { paletteKey: string; level: string } | null => {
      if (!s) return null
      const inner = s.startsWith('{') ? s.slice(1, -1) : s
      // Match: brand.light.palettes.{paletteKey}.{level}.color.tone
      // or: brand.light.palettes.{paletteKey}.default.color.tone (where default might reference another level)
      const match = /^(?:brand|theme)\.(?:light|dark)\.palettes\.([a-z0-9-]+)\.(?:(\d+|default|primary))/.exec(inner)
      if (match) {
        const paletteKey = match[1]
        let level = match[2]
        // If level is 'default', try to resolve it from the theme
        if (level === 'default') {
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
              
              if (defaultValue && typeof defaultValue === 'string' && defaultValue.startsWith('{')) {
                const defaultInner = defaultValue.slice(1, -1)
                // Match: theme.light.palettes.{paletteKey}.{level}
                const defaultMatch = /^(?:brand|theme)\.(?:light|dark)\.palettes\.([a-z0-9-]+)\.(\d+)/.exec(defaultInner)
                if (defaultMatch && defaultMatch[1] === paletteKey) {
                  level = defaultMatch[2]
                } else {
                  // Try to extract level number from end of path
                  const directLevelMatch = /\.(\d+)$/.exec(defaultInner)
                  if (directLevelMatch) {
                    level = directLevelMatch[1]
                  }
                }
              }
            }
            // If we couldn't resolve default, use 'primary' as fallback
            if (level === 'default') {
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
      return null
    }
    const elev1: any = light?.['elevation-1']?.['$value'] || {}
    const shadowColorControl = { colorToken: parseColorToken(elev1?.color?.['$value'] ?? elev1?.color), alphaToken: parseOpacity(elev1?.opacity?.['$value'] ?? elev1?.opacity) }
    
    // Initialize palette selections from brand.json for each elevation
    const initialPaletteSelections: Record<string, { paletteKey: string; level: string }> = {}
    for (let i = 0; i <= 4; i++) {
      const elev: any = light?.[`elevation-${i}`]?.['$value'] || {}
      const colorRef = elev?.color?.['$value'] ?? elev?.color
      const paletteSel = parsePaletteSelection(colorRef)
      if (paletteSel) {
        initialPaletteSelections[`elevation-${i}`] = paletteSel
      }
    }
    const baseX = Number((elev1?.['x-direction']?.['$value'] ?? 1))
    const baseY = Number((elev1?.['y-direction']?.['$value'] ?? 1))
    const baseXDirection: 'left' | 'right' = baseX >= 0 ? 'right' : 'left'
    const baseYDirection: 'up' | 'down' = baseY >= 0 ? 'down' : 'up'
    const directions: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
    for (let i = 1; i <= 4; i += 1) directions[`elevation-${i}`] = { x: baseXDirection, y: baseYDirection }
    // Migrate legacy keys
    let colorTokens: Record<string, string> = {}
    let alphaTokens: Record<string, string> = {}
    let paletteSelections: Record<string, { paletteKey: string; level: string }> = { ...initialPaletteSelections }
    if (this.lsAvailable) {
      try { const raw = localStorage.getItem('elevation-color-tokens'); if (raw) colorTokens = JSON.parse(raw) } catch {}
      try { const raw = localStorage.getItem('elevation-alpha-tokens'); if (raw) alphaTokens = JSON.parse(raw) } catch {}
      try { 
        const raw = localStorage.getItem('elevation-palette-selections')
        if (raw) {
          // Merge localStorage selections with initial selections (localStorage takes precedence)
          const savedSelections = JSON.parse(raw)
          paletteSelections = { ...initialPaletteSelections, ...savedSelections }
        }
      } catch {}
      try { const raw = localStorage.getItem('elevation-directions'); if (raw) Object.assign(directions, JSON.parse(raw)) } catch {}
      try { const raw = localStorage.getItem('offset-x-direction'); if (raw === 'left' || raw === 'right') (baseXDirection as any) = raw } catch {}
      try { const raw = localStorage.getItem('offset-y-direction'); if (raw === 'up' || raw === 'down') (baseYDirection as any) = raw } catch {}
    }
    return { controls, colorTokens, alphaTokens, paletteSelections, baseXDirection, baseYDirection, directions, shadowColorControl }
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
    } catch {}
    this.recomputeAndApplyAll()
  }

  private recomputeAndApplyAll() {
    // Build complete CSS variable map from current state
    // Note: Tokens are now the single source of truth - no overrides needed
    const currentMode = this.getCurrentMode()
    const allVars: Record<string, string> = {}
    
    // Tokens: expose size tokens as CSS vars under --tokens-size-<key>
    try {
      const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
      const sizesRoot: any = tokensRoot?.size || {}
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
      Object.keys(sizesRoot).forEach((short) => {
        if (short.startsWith('$')) return
        const val = sizesRoot[short]?.$value
        const px = toPxString(val)
        if (typeof px === 'string' && px) vars[`--tokens-size-${short}`] = px
      })
      Object.assign(allVars, vars)
    } catch {}
    // Tokens: expose opacity tokens as CSS vars under --tokens-opacity-<key> (normalized 0..1)
    try {
      const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
      const opacityRoot: any = tokensRoot?.opacity || {}
      const vars: Record<string, string> = {}
      const normalize = (v: any): string | undefined => {
        try {
          const n = typeof v === 'number' ? v : (typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) ? Number((v as any).value) : Number(v)
          if (!Number.isFinite(n)) return undefined
          const val = n <= 1 ? n : n / 100
          return String(Math.max(0, Math.min(1, val)))
        } catch { return undefined }
      }
      Object.keys(opacityRoot).forEach((short) => {
        if (short.startsWith('$')) return
        const v = opacityRoot[short]?.$value
        const norm = normalize(v)
        if (typeof norm === 'string') vars[`--tokens-opacity-${short}`] = norm
      })
      Object.assign(allVars, vars)
    } catch {}
    // Tokens: expose color tokens as CSS vars under --tokens-color-<family>-<level>
    try {
      const tokensRoot: any = (this.state.tokens as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.color || {}
      const vars: Record<string, string> = {}
      const processedKeys = new Set<string>()
      Object.keys(colorsRoot).forEach((family) => {
        if (!family || family === 'translucent') return
        const levels = colorsRoot[family] || {}
        Object.keys(levels).forEach((lvl) => {
          if (!/^\d{2,4}|000|050$/.test(lvl)) return
          const tokenName = `color/${family}/${lvl}`
          const cssVarKey = `--tokens-color-${family}-${String(lvl).padStart(3, '0')}`
          // Read directly from token value
          const val = levels[lvl]?.$value
          if (typeof val === 'string' && val) {
            vars[cssVarKey] = String(val)
            processedKeys.add(cssVarKey)
          }
        })
      })
      // Custom color scales are now stored directly in tokens, so they're already included above
      Object.assign(allVars, vars)
    } catch {}
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
        const allowed = new Set(['900','800','700','600','500','400','300','200','100','050','000','1000'])
        return allowed.has(s) ? s : undefined
      }
      
      // Process both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        // Get core-colors object - it may have $value wrapper or be direct
        const coreColorsObj: any = themes?.[mode]?.palettes?.['core-colors'] || themes?.[mode]?.palettes?.core
        // Extract the actual colors object (handle both $value wrapper and direct structure)
        const core: any = coreColorsObj?.$value || coreColorsObj || {}
        
        // Map core color names to CSS variable names
        const coreColorMap: Record<string, string> = {
          black: `--recursica-brand-${mode}-palettes-core-black`,
          white: `--recursica-brand-${mode}-palettes-core-white`,
          alert: `--recursica-brand-${mode}-palettes-core-alert`,
          warning: `--recursica-brand-${mode}-palettes-core-warning`,
          success: `--recursica-brand-${mode}-palettes-core-success`,
          interactive: `--recursica-brand-${mode}-palettes-core-interactive`,
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
        
        // Helper function to resolve a token reference
        const resolveTokenRef = (value: any): string | null => {
          if (typeof value === 'string') {
            const trimmed = value.trim()
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const inner = trimmed.slice(1, -1).trim()
              // Match pattern: tokens.color.<family>.<level>
              const match = /^tokens\.color\.([a-z0-9_-]+)\.(\d{2,4}|000|050|1000)$/i.exec(inner)
              if (match) {
                const family = match[1]
                const level = normalizeLevel(match[2])
                if (family && level) {
                  return `var(--recursica-tokens-color-${family}-${level})`
                }
              }
              // Match pattern: brand.themes.{mode}.palettes.white or brand.themes.{mode}.palettes.black
              const brandMatch = new RegExp(`^brand\\.themes\\.(light|dark)\\.palettes\\.(white|black)$`, 'i').exec(inner)
              if (brandMatch) {
                const modeMatch = brandMatch[1].toLowerCase()
                const color = brandMatch[2].toLowerCase()
                return `var(--recursica-brand-${modeMatch}-palettes-core-${color})`
              }
            }
          }
          return null
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
                colors[`--recursica-brand-${mode}-palettes-core-interactive-default-tone`] = defaultToneRef
              }
            }
            if (defaultOnTone) {
              const defaultOnToneRef = resolveTokenRef(defaultOnTone)
              if (defaultOnToneRef) {
                colors[`--recursica-brand-${mode}-palettes-core-interactive-default-on-tone`] = defaultOnToneRef
              }
            }
            if (hoverTone) {
              const hoverToneRef = resolveTokenRef(hoverTone)
              if (hoverToneRef) {
                colors[`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`] = hoverToneRef
              }
            }
            if (hoverOnTone) {
              const hoverOnToneRef = resolveTokenRef(hoverOnTone)
              if (hoverOnToneRef) {
                colors[`--recursica-brand-${mode}-palettes-core-interactive-hover-on-tone`] = hoverOnToneRef
              }
            }
          } else {
            // Handle simple string values for other core colors
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
                  tokenRef = `var(--recursica-tokens-color-${family}-${level})`
                }
              }
            }
          }
          
          // Last resort fallback
          if (!tokenRef) {
            console.warn(`Could not resolve token reference for ${cssVar}, using gray-500 as fallback`)
            tokenRef = 'var(--recursica-tokens-color-gray-500)'
          }
          
          colors[cssVar] = tokenRef
        })
        
        // Preserve existing core color CSS variables if they exist in DOM (user customizations)
        // This ensures user changes to core colors persist across mode switches and page navigation
        Object.entries(coreColorMap).forEach(([colorName, cssVar]) => {
          const existingValue = readCssVar(cssVar)
          const generatedValue = colors[cssVar]
          
          // Preserve if it exists in DOM and is different from generated (user customization)
          // OR if it exists but wasn't generated (customization not in theme JSON)
          if (existingValue && existingValue.startsWith('var(')) {
            if (!generatedValue || existingValue !== generatedValue) {
              colors[cssVar] = existingValue
            }
          }
        })
        
        // Also preserve interactive sub-properties if they exist
        if (core['interactive'] && typeof core['interactive'] === 'object') {
          const interactiveSubVars = [
            `--recursica-brand-${mode}-palettes-core-interactive-default-tone`,
            `--recursica-brand-${mode}-palettes-core-interactive-default-on-tone`,
            `--recursica-brand-${mode}-palettes-core-interactive-hover-tone`,
            `--recursica-brand-${mode}-palettes-core-interactive-hover-on-tone`,
          ]
          
          interactiveSubVars.forEach((cssVar) => {
            const existingValue = readCssVar(cssVar)
            const generatedValue = colors[cssVar]
            
            // Preserve if it exists in DOM and is different from generated (user customization)
            if (existingValue && existingValue.startsWith('var(') && generatedValue && existingValue !== generatedValue) {
              colors[cssVar] = existingValue
            } else if (existingValue && existingValue.startsWith('var(') && !generatedValue) {
              // Preserve if it exists but wasn't generated (customization not in theme JSON)
              colors[cssVar] = existingValue
            }
          })
        }
        
        Object.assign(allVars, colors)
      }
    } catch {}
    // Palettes - generate for both modes
    const paletteVarsLight = buildPaletteVars(this.state.tokens, this.state.theme, 'Light')
    const paletteVarsDark = buildPaletteVars(this.state.tokens, this.state.theme, 'Dark')
    Object.assign(allVars, paletteVarsLight)
    Object.assign(allVars, paletteVarsDark)
    // Combine palette vars for passing to buildLayerVars (so it can look up on-tone values during initialization)
    const allPaletteVars = { ...paletteVarsLight, ...paletteVarsDark }
    // Layers (from Brand) - generate for both modes
    const layerVarsLight = buildLayerVars(this.state.tokens, this.state.theme, 'light', undefined, allPaletteVars)
    const layerVarsDark = buildLayerVars(this.state.tokens, this.state.theme, 'dark', undefined, allPaletteVars)
    const layerVars = { ...layerVarsLight, ...layerVarsDark }
    
    // Ensure primary-color alternative layer surface is always set (fixes refresh/reset issue)
    // Check what palette-1 vars were actually generated and use the best available one
    // Do this for both modes
    for (const modeLoop of ['light', 'dark'] as const) {
      const primaryColorSurfaceKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-primary-color-property-surface`
      if (!layerVars[primaryColorSurfaceKey]) {
        // Check palette vars that were just generated (they're in allVars now)
        // Try primary-tone first, then common levels (500, 400, 600)
        const candidates = [
          `--recursica-brand-${modeLoop}-palettes-palette-1-primary-tone`,
          `--recursica-brand-${modeLoop}-palettes-palette-1-500-tone`,
          `--recursica-brand-${modeLoop}-palettes-palette-1-400-tone`,
          `--recursica-brand-${modeLoop}-palettes-palette-1-600-tone`
        ]
        
        let foundVar: string | null = null
        for (const candidate of candidates) {
          if (allVars[candidate] || readCssVar(candidate)) {
            foundVar = candidate
            break
          }
        }
        
        if (foundVar) {
          layerVars[primaryColorSurfaceKey] = `var(${foundVar})`
        } else {
          // Last resort: use primary-tone reference (will resolve when palette vars are generated)
          layerVars[primaryColorSurfaceKey] = `var(--recursica-brand-${modeLoop}-palettes-palette-1-primary-tone)`
        }
      }
    }
    
    // Preserve existing palette CSS variables for layer colors (surface and border-color)
    // Also preserve AA compliance updates for text and interactive colors
    // Check all layers (0-4) and alternative layers for both modes
    try {
      for (const modeLoop of ['light', 'dark'] as const) {
        for (let i = 0; i <= 4; i++) {
          const prefixedBase = `--recursica-brand-${modeLoop}-layer-layer-${i}-property-`
          
          // Check surface color
          const existingSurface = readCssVar(`${prefixedBase}surface`)
          if (existingSurface && existingSurface.startsWith('var(') && existingSurface.includes('palettes')) {
            layerVars[`--recursica-brand-${modeLoop}-layer-layer-${i}-property-surface`] = existingSurface
          }
          
          // Check border color (only for non-zero layers)
          if (i > 0) {
            const existingBorderColor = readCssVar(`${prefixedBase}border-color`)
            if (existingBorderColor && existingBorderColor.startsWith('var(') && existingBorderColor.includes('palettes')) {
              layerVars[`--recursica-brand-${modeLoop}-layer-layer-${i}-property-border-color`] = existingBorderColor
            }
          }
          
          // Preserve AA compliance updates for text and interactive colors
          // These are set by AAComplianceWatcher and should not be overwritten
          const textColorBase = `${prefixedBase}element-text-`
          const interColorBase = `${prefixedBase}element-interactive-`
          
          // Text color - only preserve if it exists AND wasn't just generated (to avoid overwriting on init/reset)
          // Check if this variable was already generated by buildLayerVars
          const textColorKey = `--recursica-brand-${modeLoop}-layer-layer-${i}-property-element-text-color`
          const existingTextColor = readCssVar(`${textColorBase}color`)
          // IMPORTANT: Only preserve if:
          // 1. layerVars doesn't already have this key (meaning buildLayerVars generated it)
          // 2. The existing value is different from what was just generated (meaning AAComplianceWatcher updated it)
          // This ensures we always use the value from buildLayerVars on init/mode switch, not stale DOM values
          // But we preserve AA compliance updates that were made after initial generation
          const generatedValue = layerVars[textColorKey]
          if (existingTextColor && existingTextColor.startsWith('var(') && generatedValue && existingTextColor !== generatedValue) {
            // Only preserve if it's different from generated (AA compliance update)
            layerVars[textColorKey] = existingTextColor
          }
          
          // Interactive color - only preserve if it's different from generated (AA compliance update)
          const interColorKey = `--recursica-brand-${modeLoop}-layer-layer-${i}-property-element-interactive-color`
          const existingInterColor = readCssVar(`${interColorBase}color`)
          const generatedInterColor = layerVars[interColorKey]
          if (existingInterColor && existingInterColor.startsWith('var(') && generatedInterColor && existingInterColor !== generatedInterColor) {
            // Only preserve if it's different from generated (AA compliance update)
            layerVars[interColorKey] = existingInterColor
          }
          
          // Status colors (alert, warning, success) - only preserve if different from generated (AA compliance update)
          const statusColors = ['alert', 'warning', 'success']
          statusColors.forEach((status) => {
            const statusColorKey = `--recursica-brand-${modeLoop}-layer-layer-${i}-property-element-text-${status}`
            const existingStatusColor = readCssVar(`${textColorBase}${status}`)
            const generatedStatusColor = layerVars[statusColorKey]
            if (existingStatusColor && existingStatusColor.startsWith('var(') && generatedStatusColor && existingStatusColor !== generatedStatusColor) {
              // Only preserve if it's different from generated (AA compliance update)
              layerVars[statusColorKey] = existingStatusColor
            }
          })
        }
        
        // Also check alternative layers - preserve ALL variables, not just surface
        const altKeys = ['alert', 'warning', 'success', 'high-contrast', 'primary-color']
        for (const altKey of altKeys) {
          const prefixedBase = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-`
          
          // Preserve surface variable - but prefer generated value over existing DOM value
          const surfaceKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-surface`
          const existingSurface = readCssVar(`${prefixedBase}surface`)
          const generatedSurface = layerVars[surfaceKey]
          
          // For primary-color, always use the palette-1-primary-tone reference directly
          // This ensures it always reflects the current primary tone selection, regardless of what was generated or exists
          if (altKey === 'primary-color') {
            layerVars[surfaceKey] = `var(--recursica-brand-${modeLoop}-palettes-palette-1-primary-tone)`
          } else if (generatedSurface) {
            // Use generated value (from buildLayerVars) - this is the source of truth from JSON
            // ALWAYS use generated value if it exists, even if it differs from existing DOM value
            layerVars[surfaceKey] = generatedSurface
          } else if (existingSurface && existingSurface.startsWith('var(') && existingSurface.includes('palettes')) {
            // Fallback: use existing DOM value only if no generated value exists
            layerVars[surfaceKey] = existingSurface
          }
          
          // Preserve element text colors (similar to standard layers)
          const textColorBase = `${prefixedBase}element-text-`
          const textColorKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-element-text-color`
          const existingTextColor = readCssVar(`${textColorBase}color`)
          const generatedTextColor = layerVars[textColorKey]
          // Preserve if it exists and is different from generated (AA compliance update), OR if it exists but wasn't generated
          if (existingTextColor && existingTextColor.startsWith('var(')) {
            if (!generatedTextColor || existingTextColor !== generatedTextColor) {
              layerVars[textColorKey] = existingTextColor
            }
          }
          
          // Preserve element interactive colors
          const interColorBase = `${prefixedBase}element-interactive-`
          const interColorKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-element-interactive-color`
          const existingInterColor = readCssVar(`${interColorBase}color`)
          const generatedInterColor = layerVars[interColorKey]
          // Preserve if it exists and is different from generated (AA compliance update), OR if it exists but wasn't generated
          if (existingInterColor && existingInterColor.startsWith('var(')) {
            if (!generatedInterColor || existingInterColor !== generatedInterColor) {
              layerVars[interColorKey] = existingInterColor
            }
          }
          
          // Preserve other interactive properties (tone, on-tone, etc.)
          const interactiveProps = ['tone', 'tone-hover', 'on-tone', 'on-tone-hover', 'high-emphasis']
          interactiveProps.forEach((prop) => {
            const propKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-element-interactive-${prop}`
            const existingProp = readCssVar(`${interColorBase}${prop}`)
            const generatedProp = layerVars[propKey]
            if (existingProp && existingProp.startsWith('var(')) {
              if (!generatedProp || existingProp !== generatedProp) {
                layerVars[propKey] = existingProp
              }
            }
          })
          
          // Preserve text emphasis opacities
          const emphasisProps = ['high-emphasis', 'low-emphasis']
          emphasisProps.forEach((prop) => {
            const propKey = `--recursica-brand-${modeLoop}-layer-layer-alternative-${altKey}-property-element-text-${prop}`
            const existingProp = readCssVar(`${textColorBase}${prop}`)
            const generatedProp = layerVars[propKey]
            if (existingProp && existingProp.startsWith('var(')) {
              if (!generatedProp || existingProp !== generatedProp) {
                layerVars[propKey] = existingProp
              }
            }
          })
        }
      }
    } catch {}
    
    Object.assign(allVars, layerVars)
    // Dimensions - generate for both modes (dimensions are mode-agnostic but vars are generated for both)
    try {
      const dimensionVarsLight = buildDimensionVars(this.state.tokens, this.state.theme, 'light')
      const dimensionVarsDark = buildDimensionVars(this.state.tokens, this.state.theme, 'dark')
      Object.assign(allVars, dimensionVarsLight)
      Object.assign(allVars, dimensionVarsDark)
    } catch {}
    // UIKit components
    try {
      const uikitVars = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit)
      Object.assign(allVars, uikitVars)
    } catch {}
    // Typography
    const { vars: typeVars, familiesToLoad } = buildTypographyVars(this.state.tokens, this.state.theme, undefined, this.readTypeChoices())
    Object.assign(allVars, typeVars)
    // Ensure web fonts load lazily
    familiesToLoad.forEach((family) => {
      try {
        const trimmed = String(family).trim()
        if (!trimmed) return
        const id = `gf-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        if (document.getElementById(id)) return
        const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(trimmed).replace(/%20/g, '+')}:wght@100..900&display=swap`
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      } catch {}
    })

    // Elevation CSS variables (apply for levels 0..4)
    try {
      const tokenIndex = {
        get: (path: string): any => {
          const parts = path.split('/')
          const root: any = (this.state.tokens as any)?.tokens || {}
          // Read directly from tokens - no overrides
          if (parts[0] === 'size' && parts[1]) return root?.size?.[parts[1]]?.$value
          if (parts[0] === 'opacity' && parts[1]) return root?.opacity?.[parts[1]]?.$value
          if (parts[0] === 'color' && parts[1] && parts[2]) return root?.color?.[parts[1]]?.[parts[2]]?.$value
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
          const src: any = (this.state.tokens as any)?.tokens?.size || {}
          const list: Array<{ name: string; value: number }> = []
          Object.keys(src).forEach((short) => {
            const raw = src[short]?.$value
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
      const familyForPalette: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
      const shadowColorForLevel = (level: number, paletteVars?: Record<string, string>): string => {
        const key = `elevation-${level}`
        const sel = this.state.elevation.paletteSelections[key]
        if (sel) {
          // Use palette CSS variable instead of token CSS variable
          const paletteVarName = `--recursica-brand-${currentMode}-palettes-${sel.paletteKey}-${sel.level}-tone`
          // Check if palette var exists in paletteVars (during initialization) or use var() reference
          const paletteVarRef = paletteVars?.[paletteVarName] ? paletteVars[paletteVarName] : `var(${paletteVarName})`
          const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
          const alphaVarRef = `var(--recursica-tokens-${alphaTok.replace(/\//g, '-')})`
          return colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
        }
        const tok = this.state.elevation.colorTokens[key] || this.state.elevation.shadowColorControl.colorToken
        const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
        const alphaVarRef = `var(--recursica-tokens-${alphaTok.replace(/\//g, '-')})`
        const colorVarRef = `var(--recursica-tokens-${tok.replace(/\//g, '-')})`
        return colorMixWithOpacityVar(colorVarRef, alphaVarRef)
      }
      const dirForLevel = (level: number): { x: 'left' | 'right'; y: 'up' | 'down' } => {
        const key = `elevation-${level}`
        return this.state.elevation.directions[key] || { x: this.state.elevation.baseXDirection, y: this.state.elevation.baseYDirection }
      }
      const vars: Record<string, string> = {}
      const baseCtrl = this.state.elevation.controls['elevation-0']
      for (let i = 0; i <= 4; i += 1) {
        const k = `elevation-${i}`
        const ctrl = this.state.elevation.controls[k]
        if (!ctrl) continue
        const blurTok = (() => {
          if (i > 0 && scaleBlur && ctrl.blurToken === baseCtrl?.blurToken) return nextSizeTokenName(ctrl.blurToken, i)
          return ctrl.blurToken
        })()
        const spreadTok = (() => {
          if (i > 0 && scaleSpread && ctrl.spreadToken === baseCtrl?.spreadToken) return nextSizeTokenName(ctrl.spreadToken, i)
          return ctrl.spreadToken
        })()
        const xTok = (() => {
          if (i > 0 && scaleX && ctrl.offsetXToken === baseCtrl?.offsetXToken) return nextSizeTokenName(ctrl.offsetXToken, i)
          return ctrl.offsetXToken
        })()
        const yTok = (() => {
          if (i > 0 && scaleY && ctrl.offsetYToken === baseCtrl?.offsetYToken) return nextSizeTokenName(ctrl.offsetYToken, i)
          return ctrl.offsetYToken
        })()
        const dir = dirForLevel(i)
        const sxExpr = dir.x === 'right' ? `var(--recursica-tokens-${xTok.replace(/\//g, '-')})` : `calc(var(--recursica-tokens-${xTok.replace(/\//g, '-')}) * -1)`
        const syExpr = dir.y === 'down' ? `var(--recursica-tokens-${yTok.replace(/\//g, '-')})` : `calc(var(--recursica-tokens-${yTok.replace(/\//g, '-')}) * -1)`
        const brandScope = `--brand-${currentMode}-elevations-elevation-${i}`
        const prefixedScope = `--recursica-${brandScope.slice(2)}`
        
        // Check if there's already a palette CSS variable set (preserve user selections)
        const existingColor = readCssVar(`${prefixedScope}-shadow-color`)
        const alphaTok = this.state.elevation.alphaTokens[k] || this.state.elevation.shadowColorControl.alphaToken
        const alphaVarRef = `var(--recursica-tokens-${alphaTok.replace(/\//g, '-')})`
        
        // Check if existing color contains a palette reference (could be var() or color-mix())
        const hasPaletteRef = existingColor && (
          (existingColor.startsWith('var(') && existingColor.includes('palettes')) ||
          (existingColor.includes('color-mix') && existingColor.includes('palettes'))
        )
        
        if (hasPaletteRef) {
          // Extract the palette var reference from existingColor
          let paletteVarRef: string | null = null
          
          // If it's a direct var() reference to a palette
          const varMatch = existingColor.match(/var\((--recursica-brand-(?:light|dark)-palettes-[^)]+)\)/)
          if (varMatch) {
            paletteVarRef = `var(${varMatch[1]})`
          } else {
            // If it's a color-mix, extract the palette var from it
            const colorMixMatch = existingColor.match(/color-mix\([^,]+,\s*(var\(--recursica-brand-(?:light|dark)-palettes-[^)]+\))/)
            if (colorMixMatch) {
              paletteVarRef = colorMixMatch[1]
            }
          }
          
          if (paletteVarRef) {
            // Preserve palette CSS variable and apply current opacity
            vars[`${brandScope}-shadow-color`] = colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
          } else {
            // Fallback: use existing color as-is (shouldn't happen, but just in case)
            vars[`${brandScope}-shadow-color`] = existingColor
          }
        } else {
          // Calculate color from state
          const color = shadowColorForLevel(i, allPaletteVars)
          vars[`${brandScope}-shadow-color`] = String(color)
        }
        vars[`${brandScope}-blur`] = `var(--recursica-tokens-${blurTok.replace(/\//g, '-')})`
        vars[`${brandScope}-spread`] = `var(--recursica-tokens-${spreadTok.replace(/\//g, '-')})`
        vars[`${brandScope}-x-axis`] = sxExpr
        vars[`${brandScope}-y-axis`] = syExpr
      }
      Object.assign(allVars, vars)
    } catch {}
    
    // Apply all CSS variables at once (with validation)
    applyCssVars(allVars, this.state.tokens)
  }
}

let singleton: VarsStore | null = null
export function getVarsStore(): VarsStore { if (!singleton) singleton = new VarsStore(); return singleton }


