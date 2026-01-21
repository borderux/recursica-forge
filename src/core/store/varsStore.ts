import type { JsonLike } from '../resolvers/tokens'
import { buildTokenIndex } from '../resolvers/tokens'
import { buildPaletteVars } from '../resolvers/palettes'
import { buildLayerVars } from '../resolvers/layers'
import { buildTypographyVars, type TypographyChoices } from '../resolvers/typography'
import { buildUIKitVars } from '../resolvers/uikit'
import { buildDimensionVars } from '../resolvers/dimensions'
import { applyCssVars, type CssVarMap } from '../css/apply'
import { findTokenByHex, tokenToCssVar } from '../css/tokenRefs'
import { suppressCssVarEvents } from '../css/updateCssVar'
import { computeBundleVersion } from './versioning'
import { readCssVar } from '../css/readCssVar'
import { resolveTokenReferenceToCssVar, parseTokenReference, extractBraceContent, type TokenReferenceContext } from '../utils/tokenReferenceParser'
import tokensImport from '../../vars/Tokens.json'
import themeImport from '../../vars/Brand.json'
import uikitImport from '../../vars/UIKit.json'
// Note: clearCustomFonts is imported dynamically to avoid circular dependencies
// Note: Override system removed - tokens are now the single source of truth
// Note: populateFontUrlMapFromTokens is imported dynamically to avoid circular dependencies

type PaletteStore = {
  opacity: Record<'disabled' | 'overlay' | 'text-high' | 'text-low', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ElevationControl = { blur: number; spread: number; offsetX: number; offsetY: number }
export type ElevationState = {
  controls: Record<string, ElevationControl>
  colorTokens: Record<string, string>
  alphaTokens: Record<string, string>
  blurTokens: Record<string, string>
  spreadTokens: Record<string, string>
  offsetXTokens: Record<string, string>
  offsetYTokens: Record<string, string>
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
    { key: 'neutral', title: 'Neutral', defaultLevel: 200 },
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
  private isRecomputing: boolean = false
  private paletteVarsChangedTimeout: ReturnType<typeof setTimeout> | null = null
  private hasRunInitialReset: boolean = false

  constructor() {
    const tokensRaw = this.lsAvailable ? readLSJson(STORAGE_KEYS.tokens, tokensImport as any) : (tokensImport as any)
    // Sort font token objects once during initialization to maintain consistent order
    const tokens = sortFontTokenObjects(tokensRaw) || tokensRaw || {}
    const themeRaw = this.lsAvailable ? readLSJson(STORAGE_KEYS.theme, themeImport as any) : (themeImport as any)
    const theme = (themeRaw as any)?.brand ? themeRaw : ({ brand: themeRaw } as any)
    const uikit = this.lsAvailable ? readLSJson(STORAGE_KEYS.uikit, uikitImport as any) : (uikitImport as any)
    const palettes = this.lsAvailable ? readLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys()) : migratePaletteLocalKeys()
    // Ensure tokens is defined before passing to initElevationState
    // initElevationState will create elevation tokens and add them to the tokens object
    const elevation = this.initElevationState(theme as any, tokens || {})
    // Ensure tokens structure is properly set (initElevationState modifies tokens in place)
    if (!(tokens as any).tokens) (tokens as any).tokens = {}
    this.state = { tokens, theme, uikit, palettes, elevation, version: 0 }
    
    // Debug: verify elevation tokens are in state

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
          const tokensRoot: any = (tokensImport as any)?.tokens || {}
          const names: Record<string, string> = {}
          
          // Process new colors structure (colors.scale-XX with alias)
          const colorsRoot = tokensRoot?.colors || {}
          if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
            Object.keys(colorsRoot).forEach((scaleKey) => {
              if (!scaleKey.startsWith('scale-')) return
              const scale = colorsRoot[scaleKey]
              if (!scale || typeof scale !== 'object' || Array.isArray(scale)) return
              
              const alias = scale.alias
              if (alias && typeof alias === 'string') {
                names[alias] = toTitleCase(alias)
              }
            })
          }
          
          // Process old color structure for backwards compatibility
          const oldColors = tokensRoot?.color || {}
          Object.keys(oldColors).forEach((fam) => {
            if (fam !== 'translucent') {
              names[fam] = toTitleCase(fam)
            }
          })
          
          writeLSJson('family-friendly-names', names)
        } catch {}
        localStorage.setItem(STORAGE_KEYS.version, bundleVersion)
        // Sort font token objects when resetting to maintain consistent order
        const sortedTokens = sortFontTokenObjects(tokensImport as any)
        this.state = { tokens: sortedTokens, theme: normalizedTheme as any, uikit: uikitImport as any, palettes: migratePaletteLocalKeys(), elevation: this.initElevationState(normalizedTheme as any, sortedTokens), version: (this.state?.version || 0) + 1 }
      }
      // Ensure keys exist
      if (!localStorage.getItem(STORAGE_KEYS.tokens)) writeLSJson(STORAGE_KEYS.tokens, this.state.tokens)
      if (!localStorage.getItem(STORAGE_KEYS.theme)) writeLSJson(STORAGE_KEYS.theme, this.state.theme)
      if (!localStorage.getItem(STORAGE_KEYS.uikit)) writeLSJson(STORAGE_KEYS.uikit, this.state.uikit)
      if (!localStorage.getItem(STORAGE_KEYS.palettes)) writeLSJson(STORAGE_KEYS.palettes, this.state.palettes)
      if (!localStorage.getItem(STORAGE_KEYS.elevation)) writeLSJson(STORAGE_KEYS.elevation, this.state.elevation)
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
    
    // Initial CSS apply (Light mode palettes + layers + typography)
    this.recomputeAndApplyAll()

    // Update core color on-tone values for AA compliance on app load
    this.updateCoreColorOnTonesForAA()

    // Initialize AA compliance watcher
    this.initAAWatcher()

    // React to type choice changes and palette changes (centralized)
    // Debounce palette var changes to prevent infinite loops
    const onTypeChoices = () => {
      // Always trigger recompute, even if one is in progress
      // The recompute will read the latest choices from localStorage
      // Use a small delay to ensure any in-progress recompute completes first
      if (this.isRecomputing) {
        // Wait for current recompute to finish, then recompute again with new choices
        const retry = () => {
          if (!this.isRecomputing) {
            this.bumpVersion()
            this.recomputeAndApplyAll()
          } else {
            setTimeout(retry, 50)
          }
        }
        setTimeout(retry, 50)
        return
      }
      this.bumpVersion()
      this.recomputeAndApplyAll()
    }
    let paletteVarsChangedTimeout: ReturnType<typeof setTimeout> | null = null
    const onPaletteVarsChanged = () => {
      // Skip if already recomputing to prevent infinite loops
      if (this.isRecomputing) return
      
      // Debounce to prevent loops - only recompute if no other recompute is pending
      if (paletteVarsChangedTimeout) {
        clearTimeout(paletteVarsChangedTimeout)
      }
      paletteVarsChangedTimeout = setTimeout(() => {
        // Double-check we're not recomputing (might have started during timeout)
        if (this.isRecomputing) {
          paletteVarsChangedTimeout = null
          return
        }
        // Don't bump version here - recomputeAndApplyAll doesn't change state, only CSS vars
        // Only bump version if state actually changes (tokens, theme, etc.)
        this.recomputeAndApplyAll()
        paletteVarsChangedTimeout = null
      }, 100) // Small delay to batch multiple rapid changes
    }
    const onPaletteFamilyChanged = () => {
      if (this.isRecomputing) return // Prevent recursive calls
      this.bumpVersion()
      this.recomputeAndApplyAll()
    }
    // Note: We no longer listen to font-loaded events to avoid loops
    // CSS variables are set with font names directly, fonts load asynchronously
    window.addEventListener('typeChoicesChanged', onTypeChoices as any)
    // Recompute layers and dependent CSS whenever palette CSS vars or families change
    window.addEventListener('paletteVarsChanged', onPaletteVarsChanged as any)
    window.addEventListener('paletteFamilyChanged', onPaletteFamilyChanged as any)
    
    // Listen for token changes to update core color on-tones
    const onTokenChanged = ((ev: CustomEvent) => {
      // Skip if already recomputing to prevent infinite loops
      if (this.isRecomputing) return
      
      const detail = ev.detail
      if (!detail) return
      const tokenName = detail.name
      if (tokenName && typeof tokenName === 'string' && tokenName.startsWith('color/')) {
        const parts = tokenName.split('/')
        if (parts.length >= 3) {
          const family = parts[1]
          const level = parts[2]
          if (this.isCoreColorToken(family, level)) {
            // Delay to ensure CSS vars are updated first
            setTimeout(() => {
              // Double-check we're not recomputing before updating
              if (!this.isRecomputing) {
                this.updateCoreColorOnTonesForAA()
              }
            }, 100)
          }
        }
      }
    }) as EventListener
    window.addEventListener('tokenOverridesChanged', onTokenChanged)
    
    // Run resetAll once after initialization completes
    // Use setTimeout to ensure all async operations (like initAAWatcher) complete first
    if (!this.hasRunInitialReset) {
      this.hasRunInitialReset = true
      // Wait for AA watcher to be initialized before calling resetAll
      setTimeout(() => {
        // Double-check that AA watcher is ready (it's initialized asynchronously)
        if (this.aaWatcher) {
          this.resetAll()
        } else {
          // If watcher isn't ready yet, wait a bit more and try again
          setTimeout(() => {
            this.resetAll()
          }, 200)
        }
      }, 300) // Initial delay to ensure all initialization is complete
    }
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
        const levels = ['1000','900','800','700','600','500','400','300','200','100','050','000']
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
      
      // Watch core colors (alert, warning, success, interactive)
      this.aaWatcher?.watchCoreColors()
      
      // Don't run startup validation - let JSON values be set first
      // AA compliance checks will only run when user makes explicit changes
    })
  }

  getState(): VarsState { return this.state }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private emit() { this.listeners.forEach((l) => l()) }
  

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
    if (!skipRecompute && !this.isRecomputing) {
      // Skip if already recomputing to prevent infinite loops
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
          varsToUpdate[`--recursica-tokens-font-${pluralKind}-${key}`] = formattedValue
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
        if (px) varsToUpdate[`--recursica-tokens-size-${key}`] = px
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
        if (norm) varsToUpdate[`--recursica-tokens-opacity-${key}`] = norm
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
            // Generate CSS vars for both scale name and alias (if available)
            const scaleCssVarKey = `--recursica-tokens-colors-${scaleKey}-${normalizedLevel}`
            varsToUpdate[scaleCssVarKey] = String(tokenValue)
            
            // Also create alias-based CSS var if alias exists
            if (alias && typeof alias === 'string') {
              const aliasCssVarKey = `--recursica-tokens-colors-${alias}-${normalizedLevel}`
              varsToUpdate[aliasCssVarKey] = String(tokenValue)
            }
          }
        } else {
          // Old format: color/family/level (backwards compatibility)
          const tokenValue = tokensRoot?.color?.[scaleOrFamily]?.[level]?.$value
          if (tokenValue != null) {
            const cssVarKey = `--recursica-tokens-color-${scaleOrFamily}-${normalizedLevel}`
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
      
      // Update state without triggering full recompute
      this.writeState({ tokens: sortedTokens }, true)
      
      // Update only the affected CSS variable(s)
      this.updateSingleTokenCssVar(tokenName)
      
      // Update core color on-tone values if a core color token changed
      if ((category === 'color' || category === 'colors') && rest.length >= 2) {
        const [scaleOrFamily, level] = rest
        // For new format, extract family from alias if it's a scale-XX key
        let family = scaleOrFamily
        if (category === 'colors' && scaleOrFamily.startsWith('scale-')) {
          // Find the alias for this scale
          const scale = tokensRoot.colors?.[scaleOrFamily]
          if (scale && typeof scale === 'object' && scale.alias) {
            family = scale.alias
          }
        }
        // Check if this token is used by any core color
        const isCoreColorToken = this.isCoreColorToken(family, level)
        if (isCoreColorToken) {
          // Delay to ensure CSS vars are updated first
          setTimeout(() => {
            this.updateCoreColorOnTonesForAA()
          }, 100)
        }
      }
    } catch (error) {
      console.error('Failed to update token:', tokenName, error)
    }
  }

  resetAll() {
    // Clear all CSS variables first
    import('../css/apply').then(({ clearAllCssVars }) => {
      clearAllCssVars()
      
      // Reset state from original JSON imports
      const sortedTokens = sortFontTokenObjects(tokensImport as any)
      const normalizedTheme = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
      
      // Reset localStorage to original values
      if (this.lsAvailable) {
        // Clear elevation localStorage to ensure clean reset
        try {
          localStorage.removeItem(STORAGE_KEYS.elevation)
          // Also clear legacy elevation localStorage keys
          localStorage.removeItem('elevation-color-tokens')
          localStorage.removeItem('elevation-alpha-tokens')
          localStorage.removeItem('elevation-palette-selections')
          localStorage.removeItem('elevation-directions')
        } catch {}
        
        writeLSJson(STORAGE_KEYS.tokens, tokensImport)
        writeLSJson(STORAGE_KEYS.theme, normalizedTheme)
        writeLSJson(STORAGE_KEYS.uikit, uikitImport)
        writeLSJson(STORAGE_KEYS.palettes, migratePaletteLocalKeys())
        writeLSJson(STORAGE_KEYS.elevation, this.initElevationState(normalizedTheme as any, sortedTokens))
        
        // Reset family-friendly-names to use aliases from JSON
        try {
          const tokensRoot: any = (tokensImport as any)?.tokens || {}
          const names: Record<string, string> = {}
          
          // Process new colors structure (colors.scale-XX with alias)
          const colorsRoot = tokensRoot?.colors || {}
          if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
            Object.keys(colorsRoot).forEach((scaleKey) => {
              if (!scaleKey.startsWith('scale-')) return
              const scale = colorsRoot[scaleKey]
              if (!scale || typeof scale !== 'object' || Array.isArray(scale)) return
              
              const alias = scale.alias
              if (alias && typeof alias === 'string') {
                names[alias] = toTitleCase(alias)
              }
            })
          }
          
          // Process old color structure for backwards compatibility
          const oldColors = tokensRoot?.color || {}
          Object.keys(oldColors).forEach((fam) => {
            if (fam !== 'translucent') {
              names[fam] = toTitleCase(fam)
            }
          })
          
          writeLSJson('family-friendly-names', names)
          // Dispatch event to notify components of the reset
          try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: names })) } catch {}
          
          // Reset primary levels and selected families for all palettes
          try {
            const allKeys: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (
                key.startsWith('palette-primary-level:') ||
                key.startsWith('palette-grid-family:')
              )) {
                allKeys.push(key)
              }
            }
            allKeys.forEach(key => {
              try { localStorage.removeItem(key) } catch {}
            })
          } catch {}
        } catch {}
      }
      
      // Initialize elevation state (this will create elevation tokens in sortedTokens)
      const elevation = this.initElevationState(normalizedTheme as any, sortedTokens)
      
      // Reset state (elevation tokens are now in sortedTokens from initElevationState)
      this.state = {
        tokens: sortedTokens,
        theme: normalizedTheme as any,
        uikit: uikitImport as any,
        palettes: migratePaletteLocalKeys(),
        elevation,
        version: (this.state?.version || 0) + 1
      }
      
      // Recompute and apply all CSS variables from clean state
      // Reset the recomputing flag first since we're doing a full reset
      this.isRecomputing = false
      this.recomputeAndApplyAll()
      
      // Update AA watcher with new state and force check all palette on-tone variables
      // Use setTimeout to ensure CSS variables are fully applied before checking AA compliance
      if (this.aaWatcher) {
        this.aaWatcher.updateTokensAndTheme(this.state.tokens, this.state.theme)
        // Force check all palette on-tone variables after reset to ensure AA compliance
        // Delay to ensure recomputeAndApplyAll has finished applying CSS vars to DOM
        setTimeout(() => {
          if (this.aaWatcher) {
            this.aaWatcher.checkAllPaletteOnTones()
            // After AA compliance check updates CSS vars, update theme JSON to match
            this.updateThemeJsonFromOnToneCssVars()
            
            // Initialize interactive on-tone values for core colors
            import('../../modules/pickers/interactiveColorUpdater').then(({ updateCoreColorInteractiveOnTones }) => {
              const currentMode = this.getCurrentMode()
              // Get the interactive tone hex
              const interactiveToneVar = `--recursica-brand-themes-${currentMode}-palettes-core-interactive-default-tone`
              const interactiveToneValue = readCssVar(interactiveToneVar)
              if (interactiveToneValue) {
                import('../../core/compliance/layerColorStepping').then(({ resolveCssVarToHex }) => {
                  const tokenIndex = buildTokenIndex(this.state.tokens)
                  const interactiveHex = resolveCssVarToHex(interactiveToneValue, tokenIndex) || '#000000'
                  updateCoreColorInteractiveOnTones(interactiveHex, this.state.tokens, this.state.theme, (theme) => {
                    this.setTheme(theme)
                  }, currentMode)
                }).catch((err) => {
                  console.error('Failed to resolve interactive tone hex:', err)
                })
              }
            }).catch((err) => {
              console.error('Failed to update core color interactive on-tones:', err)
            })
          }
        }, 50)
      }
    })
  }

  private initElevationState(theme: any, tokens?: any): ElevationState {
    let elevationState: ElevationState | null = null
    
    // Try consolidated key first
    if (this.lsAvailable) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.elevation)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Migrate old elevation state that doesn't have token references
          if (!parsed.blurTokens || !parsed.spreadTokens || !parsed.offsetXTokens || !parsed.offsetYTokens) {
            // Initialize token references for existing state
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
            
            parsed.blurTokens = blurTokens
            parsed.spreadTokens = spreadTokens
            parsed.offsetXTokens = offsetXTokens
            parsed.offsetYTokens = offsetYTokens
          }
          elevationState = parsed
        }
      } catch {}
    }
    // If we loaded from localStorage, use those controls; otherwise build from theme
    let controls: Record<string, ElevationControl> = {}
    let colorTokens: Record<string, string> = {}
    let alphaTokens: Record<string, string> = {}
    let paletteSelections: Record<string, { paletteKey: string; level: string }> = {}
    let baseXDirection: 'left' | 'right' = 'right'
    let baseYDirection: 'up' | 'down' = 'down'
    let directions: Record<string, { x: 'left' | 'right'; y: 'up' | 'down' }> = {}
    let shadowColorControl: { colorToken: string; alphaToken: string } = { colorToken: 'color/gray/900', alphaToken: 'opacity/veiled' }
    
    if (!elevationState) {
      // Build defaults from theme
      const brand: any = (theme as any)?.brand || (theme as any)
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = brand?.themes || brand
      const light: any = themes?.light?.elevations || {}
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
      controls = {}
      for (let i = 0; i <= 4; i++) {
        const node: any = light[`elevation-${i}`]?.['$value'] || {}
        controls[`elevation-${i}`] = {
          blur: toNumeric(node?.blur),
          spread: toNumeric(node?.spread),
          offsetX: toNumeric(node?.x),
          offsetY: toNumeric(node?.y),
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
      const elev1: any = light?.['elevation-1']?.['$value'] || {}
      shadowColorControl = { colorToken: parseColorToken(elev1?.color?.['$value'] ?? elev1?.color), alphaToken: parseOpacity(elev1?.opacity?.['$value'] ?? elev1?.opacity) }
      
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
      baseXDirection = baseX >= 0 ? 'right' : 'left'
      baseYDirection = baseY >= 0 ? 'down' : 'up'
      for (let i = 1; i <= 4; i += 1) directions[`elevation-${i}`] = { x: baseXDirection, y: baseYDirection }
      // Migrate legacy keys
      paletteSelections = { ...initialPaletteSelections }
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
    }
    
    // Use elevationState from localStorage if available, otherwise use the one we built
    const finalState = elevationState || { controls, colorTokens, alphaTokens, paletteSelections, baseXDirection, baseYDirection, directions, shadowColorControl }
    
    // Always ensure tokens exist and token references are set (even if loaded from localStorage)
    const blurTokens: Record<string, string> = finalState.blurTokens || {}
    const spreadTokens: Record<string, string> = finalState.spreadTokens || {}
    const offsetXTokens: Record<string, string> = finalState.offsetXTokens || {}
    const offsetYTokens: Record<string, string> = finalState.offsetYTokens || {}
    
    // Get or create tokens structure
    if (!tokens) tokens = {}
    if (!(tokens as any).tokens) (tokens as any).tokens = {}
    
    // Ensure size tokens structure exists (use plural 'sizes' to match updateToken)
    if (!(tokens as any).tokens.sizes) (tokens as any).tokens.sizes = {}
    const sizeTokens = (tokens as any).tokens.sizes
    
    // Use controls from finalState (either from localStorage or newly built)
    const finalControls = finalState.controls || {}
    const baseCtrl = finalControls['elevation-0']
    
    for (let i = 0; i <= 4; i++) {
      const k = `elevation-${i}`
      const ctrl = finalControls[k] || baseCtrl
      
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
      // These tokens are needed for CSS variable generation (referenced as --recursica-tokens-size-elevation-X-blur, etc.)
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
    } catch {}
    // Skip if already recomputing to prevent infinite loops
    if (!this.isRecomputing) {
      this.recomputeAndApplyAll()
    }
  }

  private recomputeAndApplyAll() {
    // Prevent recursive calls - if already recomputing, skip to avoid infinite loops
    if (this.isRecomputing) {
      console.warn('[VarsStore] Skipping recomputeAndApplyAll - already recomputing')
      return
    }
    this.isRecomputing = true
    
    // Suppress cssVarsUpdated events during bulk update to prevent infinite loops
    suppressCssVarEvents(true)
    
    // Build complete CSS variable map from current state
    // Note: Tokens are now the single source of truth - no overrides needed
    const currentMode = this.getCurrentMode()
    const allVars: Record<string, string> = {}
    
    try {
    
    // Tokens: expose size tokens as CSS vars under --recursica-tokens-sizes-<key>
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
            vars[`--recursica-tokens-sizes-${short}`] = px
            // Backwards compatibility: also create singular form
            if (!vars[`--recursica-tokens-size-${short}`]) {
              vars[`--recursica-tokens-size-${short}`] = px
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
    // Tokens: expose opacity tokens as CSS vars under --recursica-tokens-opacities-<key> (normalized 0..1)
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
            vars[`--recursica-tokens-opacities-${short}`] = norm
            // Backwards compatibility: also create singular form
            if (!vars[`--recursica-tokens-opacity-${short}`]) {
              vars[`--recursica-tokens-opacity-${short}`] = norm
            }
          }
        })
        Object.assign(allVars, vars)
      }
    } catch (e) {
      console.error('[VarsStore] Error generating opacity token CSS variables:', e)
    }
    // Tokens: expose color tokens as CSS vars under --recursica-tokens-colors-<scale>-<level>
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
          
          Object.keys(scale).forEach((lvl) => {
            // Skip the alias property
            if (lvl === 'alias') return
            // Accept levels that are: 2-4 digits, or exactly '000' or '050'
            if (!/^(\d{2,4}|000|050)$/.test(lvl)) return
            
            const levelObj = scale[lvl]
            if (!levelObj || typeof levelObj !== 'object') return
            
            // Preserve 000 and 1000 as-is, pad others to 3 digits
            const normalizedLevel = lvl === '000' ? '000' : lvl === '1000' ? '1000' : String(lvl).padStart(3, '0')
            
            // Generate CSS vars for both scale name and alias (if available)
            const scaleCssVarKey = `--recursica-tokens-colors-${scaleKey}-${normalizedLevel}`
            const aliasCssVarKey = alias && typeof alias === 'string' ? `--recursica-tokens-colors-${alias}-${normalizedLevel}` : null
            
            // Read directly from token value
            const val = levelObj.$value
            if (typeof val === 'string' && val) {
              vars[scaleCssVarKey] = String(val)
              processedKeys.add(scaleCssVarKey)
              
              // Also create alias-based CSS var if alias exists
              if (aliasCssVarKey) {
                vars[aliasCssVarKey] = String(val)
                processedKeys.add(aliasCssVarKey)
              }
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
            const cssVarKey = `--recursica-tokens-color-${family}-${normalizedLevel}`
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
        // Use --recursica-brand-themes- format to match palettes.ts resolver
        const coreColorMap: Record<string, string> = {
          black: `--recursica-brand-themes-${mode}-palettes-core-black`,
          white: `--recursica-brand-themes-${mode}-palettes-core-white`,
          alert: `--recursica-brand-themes-${mode}-palettes-core-alert`,
          warning: `--recursica-brand-themes-${mode}-palettes-core-warning`,
          success: `--recursica-brand-themes-${mode}-palettes-core-success`,
          interactive: `--recursica-brand-themes-${mode}-palettes-core-interactive`,
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
            currentMode: currentMode === 'Dark' ? 'dark' : 'light',
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
                colors[`--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`] = defaultToneRef
              }
            }
            if (defaultOnTone) {
              const defaultOnToneRef = resolveTokenRef(defaultOnTone)
              if (defaultOnToneRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`] = defaultOnToneRef
              }
            }
            if (hoverTone) {
              const hoverToneRef = resolveTokenRef(hoverTone)
              if (hoverToneRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`] = hoverToneRef
              }
            }
            if (hoverOnTone) {
              const hoverOnToneRef = resolveTokenRef(hoverOnTone)
              if (hoverOnToneRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone`] = hoverOnToneRef
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
            // Use --recursica-brand-themes- format to match palettes.ts resolver
            if (tone) {
              const toneRef = resolveTokenRef(tone)
              if (toneRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-${colorName}-tone`] = toneRef
              }
            }
            if (onTone) {
              const onToneRef = resolveTokenRef(onTone)
              if (onToneRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-${colorName}-on-tone`] = onToneRef
              }
            }
            if (interactive) {
              const interactiveRef = resolveTokenRef(interactive)
              if (interactiveRef) {
                colors[`--recursica-brand-themes-${mode}-palettes-core-${colorName}-interactive`] = interactiveRef
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
                  tokenRef = `var(--recursica-tokens-color-${family}-${level})`
                }
              }
            }
          }
          
          // Last resort fallback
          if (!tokenRef) {
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
        
        // Preserve individual core color interactive CSS variables (e.g., core-black-interactive, core-white-interactive)
        const coreColorKeys = ['black', 'white', 'alert', 'warning', 'success']
        coreColorKeys.forEach((colorName) => {
          const interactiveVar = `--recursica-brand-themes-${mode}-palettes-core-${colorName}-interactive`
          const existingValue = readCssVar(interactiveVar)
          const generatedValue = colors[interactiveVar]
          
          // Preserve if it exists in DOM and is different from generated (user customization)
          // OR if it exists but wasn't generated (customization not in theme JSON)
          if (existingValue && existingValue.startsWith('var(')) {
            if (!generatedValue || existingValue !== generatedValue) {
              colors[interactiveVar] = existingValue
            }
          }
        })
        
        // Also preserve interactive sub-properties if they exist
        if (core['interactive'] && typeof core['interactive'] === 'object') {
          const interactiveSubVars = [
            `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`,
            `--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`,
            `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone`,
            `--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone`,
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
    
    // Preserve palette on-tone CSS variables that were set directly by the user
    // This prevents recomputes from overwriting user changes
    const allPaletteVars = { ...paletteVarsLight, ...paletteVarsDark }
    Object.keys(allPaletteVars).forEach((cssVar) => {
      // Only check on-tone vars (not tone vars, as those can change)
      if (cssVar.includes('-on-tone')) {
        // Check inline style directly (user overrides are always inline)
        const inlineValue = typeof document !== 'undefined' 
          ? document.documentElement.style.getPropertyValue(cssVar).trim()
          : ''
        const generatedValue = allPaletteVars[cssVar]
        
        // Preserve if there's an inline override and it differs from generated (user customization)
        if (inlineValue !== '' && inlineValue !== generatedValue) {
          allPaletteVars[cssVar] = inlineValue
        }
      }
    })
    
    // Preserve overlay color and opacity CSS variables that were set directly by the user
    // This prevents recomputes from overwriting user changes
    // Overlay vars are generated in buildPaletteVars, so they're already in allPaletteVars
    const overlayVars = [
      '--recursica-brand-themes-light-state-overlay-color',
      '--recursica-brand-themes-light-state-overlay-opacity',
      '--recursica-brand-themes-dark-state-overlay-color',
      '--recursica-brand-themes-dark-state-overlay-opacity'
    ]
    overlayVars.forEach((cssVar) => {
      const inlineValue = typeof document !== 'undefined' 
        ? document.documentElement.style.getPropertyValue(cssVar).trim()
        : ''
      const generatedValue = allPaletteVars[cssVar]
      
      // Preserve if there's an inline override and it differs from generated (user customization)
      if (inlineValue !== '' && inlineValue !== generatedValue) {
        allPaletteVars[cssVar] = inlineValue
      }
    })
    
    Object.assign(allVars, allPaletteVars)
    // allPaletteVars already defined above with preserved values
    // Layers (from Brand) - generate for both modes
    const layerVarsLight = buildLayerVars(this.state.tokens, this.state.theme, 'light', undefined, allPaletteVars)
    const layerVarsDark = buildLayerVars(this.state.tokens, this.state.theme, 'dark', undefined, allPaletteVars)
    const layerVars = { ...layerVarsLight, ...layerVarsDark }
    
    // Preserve existing palette CSS variables for layer colors (surface and border-color)
    // Also preserve AA compliance updates for text and interactive colors
    // Check all layers (0-4) for both modes
    try {
      for (const modeLoop of ['light', 'dark'] as const) {
        for (let i = 0; i <= 4; i++) {
          const prefixedBase = `--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-`
          
          // Check surface color
          const existingSurface = readCssVar(`${prefixedBase}surface`)
          if (existingSurface && existingSurface.startsWith('var(') && existingSurface.includes('palettes')) {
            layerVars[`--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-surface`] = existingSurface
          }
          
          // Check border color (only for non-zero layers)
          if (i > 0) {
            const existingBorderColor = readCssVar(`${prefixedBase}border-color`)
            if (existingBorderColor && existingBorderColor.startsWith('var(') && existingBorderColor.includes('palettes')) {
              layerVars[`--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-border-color`] = existingBorderColor
            }
          }
          
          // Preserve AA compliance updates for text and interactive colors
          // These are set by AAComplianceWatcher and should not be overwritten
          const textColorBase = `${prefixedBase}element-text-`
          const interColorBase = `${prefixedBase}element-interactive-`
          
          // Text color - only preserve if it exists AND wasn't just generated (to avoid overwriting on init/reset)
          // Check if this variable was already generated by buildLayerVars
          const textColorKey = `--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-element-text-color`
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
          const interColorKey = `--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-element-interactive-color`
          const existingInterColor = readCssVar(`${interColorBase}color`)
          const generatedInterColor = layerVars[interColorKey]
          if (existingInterColor && existingInterColor.startsWith('var(') && generatedInterColor && existingInterColor !== generatedInterColor) {
            // Only preserve if it's different from generated (AA compliance update)
            layerVars[interColorKey] = existingInterColor
          }
          
          // Status colors (alert, warning, success) - only preserve if different from generated (AA compliance update)
          const statusColors = ['alert', 'warning', 'success']
          statusColors.forEach((status) => {
            const statusColorKey = `--recursica-brand-themes-${modeLoop}-layer-layer-${i}-property-element-text-${status}`
            const existingStatusColor = readCssVar(`${textColorBase}${status}`)
            const generatedStatusColor = layerVars[statusColorKey]
            if (existingStatusColor && existingStatusColor.startsWith('var(') && generatedStatusColor && existingStatusColor !== generatedStatusColor) {
              // Only preserve if it's different from generated (AA compliance update)
              layerVars[statusColorKey] = existingStatusColor
            }
          })
        }
      }
    } catch (e) {
      console.error('[VarsStore] Error preserving layer variables:', e)
    }
    
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
    // UIKit components
    try {
      const uikitVars = buildUIKitVars(this.state.tokens, this.state.theme, this.state.uikit, currentMode)
      
      // Preserve UIKit CSS variables that were set directly by the user (e.g., via ComponentToolbar)
      // This prevents recomputes from overwriting user changes
      Object.keys(uikitVars).forEach((cssVar) => {
        // Check inline style directly (user overrides are always inline)
        const inlineValue = typeof document !== 'undefined' 
          ? document.documentElement.style.getPropertyValue(cssVar).trim()
          : ''
        const generatedValue = uikitVars[cssVar]
        
        // Preserve if there's an inline override and it differs from generated (user customization)
        // This ensures user changes via ComponentToolbar persist across recomputes
        if (inlineValue !== '' && inlineValue !== generatedValue) {
          uikitVars[cssVar] = inlineValue
        }
      })
      
      Object.assign(allVars, uikitVars)
    } catch {}
    // Typography
    const typeChoices = this.readTypeChoices()
    const { vars: typeVars, familiesToLoad } = buildTypographyVars(this.state.tokens, this.state.theme, undefined, typeChoices)
    
    // Always preserve typography CSS variables that were set DIRECTLY (user customization via UI)
    // This allows direct CSS variable updates (like from TypeStylePanel) to persist across recomputes
    // Direct CSS variable overrides take precedence over generated values from choices/defaults
    Object.keys(typeVars).forEach((cssVar) => {
      // Check inline style directly (direct updates are always inline)
      const inlineValue = typeof document !== 'undefined' 
        ? document.documentElement.style.getPropertyValue(cssVar).trim()
        : ''
      const generatedValue = typeVars[cssVar]
      
      // Preserve if it exists in inline style and is different from generated (user customization)
      // Inline styles take precedence as they represent direct user updates
      if (inlineValue !== '' && inlineValue !== generatedValue) {
        typeVars[cssVar] = inlineValue
      }
    })
    
    Object.assign(allVars, typeVars)
    // Load fonts asynchronously - don't wait, don't trigger recomputes
    // CSS variables are already set with font names, fonts will apply when loaded
    // Fonts MUST load (async is fine, but they must load)
    if (familiesToLoad.length > 0 && typeof window !== 'undefined') {
      // Load fonts in background without blocking or triggering events
      Promise.all(familiesToLoad.map(async (family) => {
        try {
          const trimmed = String(family).trim()
          if (!trimmed) return
          // Dynamically import fontUtils
          const { ensureFontLoaded } = await import('../../modules/type/fontUtils')
          // Load font (async is fine, but it must load)
          await ensureFontLoaded(trimmed).catch((error) => {
            console.warn(`Failed to load font "${trimmed}" during recompute:`, error)
          })
        } catch (error) {
          console.warn(`Failed to import fontUtils or load font:`, error)
        }
      })).catch((error) => {
        console.warn('Failed to load some fonts during recompute:', error)
      })
    }

    // Elevation CSS variables (apply for levels 0..4) - generate for both modes
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
        const familyForPalette: Record<string, string> = { neutral: 'gray', 'palette-1': 'salmon', 'palette-2': 'mandarin', 'palette-3': 'cornflower', 'palette-4': 'greensheen' }
        const shadowColorForLevel = (level: number, paletteVars?: Record<string, string>): string => {
          const key = `elevation-${level}`
          const sel = this.state.elevation.paletteSelections[key]
          if (sel) {
            // Use palette CSS variable instead of token CSS variable
            const paletteVarName = `--recursica-brand-themes-${mode}-palettes-${sel.paletteKey}-${sel.level}-tone`
            // Check if palette var exists in paletteVars (during initialization) or use var() reference
            const paletteVarRef = paletteVars?.[paletteVarName] ? paletteVars[paletteVarName] : `var(${paletteVarName})`
            const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
            // Use tokenToCssVar to properly convert opacity token names to CSS vars
            const alphaVarRef = tokenToCssVar(alphaTok) || `var(--recursica-tokens-opacities-${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
            return colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
          }
          const tok = this.state.elevation.colorTokens[key] || this.state.elevation.shadowColorControl.colorToken
          const alphaTok = this.state.elevation.alphaTokens[key] || this.state.elevation.shadowColorControl.alphaToken
          // Use tokenToCssVar to properly convert opacity token names to CSS vars
          const alphaVarRef = tokenToCssVar(alphaTok) || `var(--recursica-tokens-opacities-${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
          // Use tokenToCssVar to properly convert token names to CSS vars (handles old and new formats)
          const colorVarRef = tokenToCssVar(tok) || `var(--recursica-tokens-${tok.replace(/\//g, '-')})`
          return colorMixWithOpacityVar(colorVarRef, alphaVarRef)
        }
        const dirForLevel = (level: number): { x: 'left' | 'right'; y: 'up' | 'down' } => {
          const key = `elevation-${level}`
          return this.state.elevation.directions[key] || { x: this.state.elevation.baseXDirection, y: this.state.elevation.baseYDirection }
        }
        const vars: Record<string, string> = {}
        const baseCtrl = this.state.elevation.controls['elevation-0']
        // Generate elevation variables for levels 0-4
        // If a control doesn't exist, use elevation-0 as fallback
        for (let i = 0; i <= 4; i += 1) {
          const k = `elevation-${i}`
          const ctrl = this.state.elevation.controls[k] || baseCtrl
          if (!ctrl) {
            // If even baseCtrl doesn't exist, skip this elevation level
            continue
          }
          const blurValue = (() => {
            if (i > 0 && scaleBlur && ctrl.blur === baseCtrl?.blur) {
              // Scale blur proportionally
              return Math.round(ctrl.blur * (1 + (i * 0.2)))
            }
            return ctrl.blur
          })()
          const spreadValue = (() => {
            if (i > 0 && scaleSpread && ctrl.spread === baseCtrl?.spread) {
              return Math.round(ctrl.spread * (1 + (i * 0.2)))
            }
            return ctrl.spread
          })()
          const xValue = (() => {
            if (i > 0 && scaleX && ctrl.offsetX === baseCtrl?.offsetX) {
              return Math.round(ctrl.offsetX * (1 + (i * 0.2)))
            }
            return ctrl.offsetX
          })()
          const yValue = (() => {
            if (i > 0 && scaleY && ctrl.offsetY === baseCtrl?.offsetY) {
              return Math.round(ctrl.offsetY * (1 + (i * 0.2)))
            }
            return ctrl.offsetY
          })()
          const dir = dirForLevel(i)
          const sxValue = dir.x === 'right' ? xValue : -xValue
          const syValue = dir.y === 'down' ? yValue : -yValue
          const brandScope = `--brand-themes-${mode}-elevations-elevation-${i}`
          const prefixedScope = `--recursica-${brandScope.slice(2)}`
          
          // Check if there's already a palette CSS variable set (preserve user selections)
          const existingColor = readCssVar(`${prefixedScope}-shadow-color`)
          const alphaTok = this.state.elevation.alphaTokens[k] || this.state.elevation.shadowColorControl.alphaToken
          // Use tokenToCssVar to properly convert opacity token names to CSS vars
          const alphaVarRef = tokenToCssVar(alphaTok) || `var(--recursica-tokens-opacities-${alphaTok.replace('opacity/', '').replace('opacities/', '')})`
          
          // Check if existing color contains a palette reference (could be var() or color-mix())
          const hasPaletteRef = existingColor && (
            (existingColor.startsWith('var(') && existingColor.includes('palettes')) ||
            (existingColor.includes('color-mix') && existingColor.includes('palettes'))
          )
          
          if (hasPaletteRef) {
            // Extract the palette var reference from existingColor
            let paletteVarRef: string | null = null
            
            // If it's a direct var() reference to a palette
            const varMatch = existingColor.match(/var\((--recursica-brand-themes-(?:light|dark)-palettes-[^)]+)\)/)
            if (varMatch) {
              paletteVarRef = `var(${varMatch[1]})`
            } else {
              // If it's a color-mix, extract the palette var from it
              const colorMixMatch = existingColor.match(/color-mix\([^,]+,\s*(var\(--recursica-brand-themes-(?:light|dark)-palettes-[^)]+\))/)
              if (colorMixMatch) {
                paletteVarRef = colorMixMatch[1]
              }
            }
            
            if (paletteVarRef) {
              // Preserve palette CSS variable and apply current opacity
              vars[`${prefixedScope}-shadow-color`] = colorMixWithOpacityVar(paletteVarRef, alphaVarRef)
            } else {
              // Fallback: use existing color as-is (shouldn't happen, but just in case)
              vars[`${prefixedScope}-shadow-color`] = existingColor
            }
          } else {
            // Calculate color from state
            const color = shadowColorForLevel(i, allPaletteVars)
            vars[`${prefixedScope}-shadow-color`] = String(color)
          }
          
          // Use token references for elevation properties
          const blurTokenName = this.state.elevation.blurTokens[k] || `size/elevation-${i}-blur`
          const spreadTokenName = this.state.elevation.spreadTokens[k] || `size/elevation-${i}-spread`
          const offsetXTokenName = this.state.elevation.offsetXTokens[k] || `size/elevation-${i}-offset-x`
          const offsetYTokenName = this.state.elevation.offsetYTokens[k] || `size/elevation-${i}-offset-y`
          
          // Extract the key part from token names (e.g., "size/elevation-0-blur" -> "elevation-0-blur")
          const getTokenKey = (tokenName: string): string => {
            const parts = tokenName.split('/')
            return parts.length > 1 ? parts.slice(1).join('-') : tokenName.replace(/\//g, '-')
          }
          
          const blurKey = getTokenKey(blurTokenName)
          const spreadKey = getTokenKey(spreadTokenName)
          const offsetXKey = getTokenKey(offsetXTokenName)
          const offsetYKey = getTokenKey(offsetYTokenName)
          
          vars[`${prefixedScope}-blur`] = `var(--recursica-tokens-size-${blurKey})`
          vars[`${prefixedScope}-spread`] = `var(--recursica-tokens-size-${spreadKey})`
          // For x-axis and y-axis, we need to apply direction (signed values)
          // The token stores the absolute offset, but we need to apply direction
          // We'll use calc() to apply the sign based on direction
          const xTokenVar = `var(--recursica-tokens-size-${offsetXKey})`
          const yTokenVar = `var(--recursica-tokens-size-${offsetYKey})`
          vars[`${prefixedScope}-x-axis`] = dir.x === 'right' ? xTokenVar : `calc(-1 * ${xTokenVar})`
          vars[`${prefixedScope}-y-axis`] = dir.y === 'down' ? yTokenVar : `calc(-1 * ${yTokenVar})`
        }
        Object.assign(allVars, vars)
      } catch (e) {
        console.error('[VarsStore] Error generating elevation variables:', e)
      }
    }
    
    // Apply all CSS variables at once (with validation)
    // Debug: log if critical variables are missing
    if (process.env.NODE_ENV === 'development') {
      const criticalVars = [
        '--recursica-brand-themes-light-layer-layer-0-property-surface',
        '--recursica-brand-themes-light-elevations-elevation-4-x-axis',
        '--recursica-brand-typography-caption-font-family',
        '--recursica-brand-dimensions-general-sm'
      ]
    }
    try {
      applyCssVars(allVars, this.state.tokens)
    } catch (e) {
      // Log error but don't let it break the recompute cycle
      console.error('[VarsStore] Error applying CSS variables:', e)
      if (e instanceof Error) {
        console.error('[VarsStore] Error stack:', e.stack)
      }
    }
    } finally {
      // Re-enable events and fire a single batched event after bulk update completes
      suppressCssVarEvents(false)
      // Always reset the flag, even if an error occurred
      this.isRecomputing = false
      // Explicitly dispatch cssVarsUpdated event to ensure components are notified
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        try {
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
            detail: { cssVars: Object.keys(allVars) }
          }))
        } catch (e) {
          // Ignore errors if window is not available (SSR)
        }
      })
    }
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
    } catch {}
    return false
  }

  private updateCoreColorOnTonesForAA() {
    try {
      // Dynamically import to avoid circular dependencies
      Promise.all([
        import('../../modules/pickers/interactiveColorUpdater'),
        import('../../core/css/readCssVar'),
        import('../../core/compliance/layerColorStepping'),
        import('../../core/resolvers/tokens')
      ]).then(([
        { updateCoreColorOnTones, updateCoreColorInteractiveOnTones },
        { readCssVarResolved, readCssVar },
        { resolveCssVarToHex },
        { buildTokenIndex }
      ]) => {
        const currentMode = this.getCurrentMode()
        updateCoreColorOnTones(this.state.tokens, this.state.theme, (theme) => {
          this.setTheme(theme)
        }, currentMode)
        
        // Also update interactive on-tones for core colors
        // Get the interactive tone hex to pass to the function
        const interactiveToneVar = `--recursica-brand-themes-${currentMode}-palettes-core-interactive-default-tone`
        const tokenIndex = buildTokenIndex(this.state.tokens)
        const interactiveToneValue = readCssVarResolved(interactiveToneVar) || readCssVar(interactiveToneVar)
        const interactiveHex = interactiveToneValue 
          ? (resolveCssVarToHex(interactiveToneValue, tokenIndex) || '#000000')
          : '#000000'
        
        // Use setTimeout to ensure CSS vars are updated first
        setTimeout(() => {
          updateCoreColorInteractiveOnTones(interactiveHex, this.state.tokens, this.state.theme, (theme) => {
            this.setTheme(theme)
          }, currentMode)
        }, 50)
      }).catch((err) => {
        console.error('Failed to update core color on-tones:', err)
      })
    } catch (err) {
      console.error('Failed to update core color on-tones:', err)
    }
  }

  /**
   * Updates theme JSON to match the on-tone CSS variables after AA compliance check
   * This ensures the theme JSON reflects the AA-compliant on-tone values
   */
  private updateThemeJsonFromOnToneCssVars() {
    try {
      const themeCopy = JSON.parse(JSON.stringify(this.state.theme))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const themes = root?.themes || root
      const levels = ['1000','900','800','700','600','500','400','300','200','100','050','000']
      let hasChanges = false

      // Check both light and dark modes
      for (const mode of ['light', 'dark'] as const) {
        const pal: any = themes?.[mode]?.palettes || {}
        Object.keys(pal).forEach((paletteKey) => {
          if (paletteKey === 'core' || paletteKey === 'core-colors') return
          
          levels.forEach((level) => {
            const onToneVar = `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-on-tone`
            const onToneValue = readCssVar(onToneVar)
            
            if (onToneValue) {
              // Extract which core color (black or white) is being used
              const isWhite = onToneValue.includes('core-white')
              const isBlack = onToneValue.includes('core-black')
              
              if (isWhite || isBlack) {
                const chosen = isWhite ? 'white' : 'black'
                
                // Ensure the palette structure exists
                if (!themes[mode]) themes[mode] = {}
                if (!themes[mode].palettes) themes[mode].palettes = {}
                if (!themes[mode].palettes[paletteKey]) themes[mode].palettes[paletteKey] = {}
                if (!themes[mode].palettes[paletteKey][level]) themes[mode].palettes[paletteKey][level] = {}
                if (!themes[mode].palettes[paletteKey][level].color) {
                  themes[mode].palettes[paletteKey][level].color = {}
                }
                
                // Update the on-tone reference in theme JSON - use short alias format (no theme path)
                const newOnToneValue = `{brand.palettes.${chosen}}`
                
                const currentOnTone = themes[mode].palettes[paletteKey][level].color?.['on-tone']
                const currentValue = typeof currentOnTone === 'object' && currentOnTone?.$value 
                  ? currentOnTone.$value 
                  : currentOnTone
                
                // Only update if the value has changed
                if (currentValue !== newOnToneValue) {
                  themes[mode].palettes[paletteKey][level].color['on-tone'] = {
                    $value: newOnToneValue
                  }
                  hasChanges = true
                }
              }
            }
          })
        })
      }

      // Only update theme if there were changes
      if (hasChanges) {
        this.setTheme(themeCopy)
      }
    } catch (err) {
      console.error('Failed to update theme JSON from on-tone CSS vars:', err)
    }
  }
}

let singleton: VarsStore | null = null
export function getVarsStore(): VarsStore { if (!singleton) singleton = new VarsStore(); return singleton }


