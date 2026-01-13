import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'
import { readCssVar } from '../css/readCssVar'
import { resolveTokenReferenceToValue, resolveTokenReferenceToCssVar, extractBraceContent, parseTokenReference, type TokenReferenceContext } from '../utils/tokenReferenceParser'

export function buildLayerVars(tokens: JsonLike, theme: JsonLike, mode: 'light' | 'dark' = 'light', overrides?: Record<string, any>, paletteVars?: Record<string, string>): Record<string, string> {
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
  const themes = troot?.themes || troot
  const layersData: any = themes?.[mode]?.layers || themes?.[mode]?.layer || {}

  const mapBWHexToVar = (hex: string): string => {
    const h = (hex || '').toLowerCase()
    return h === '#ffffff' ? `var(--recursica-brand-themes-${mode}-palettes-core-white)` : `var(--recursica-brand-themes-${mode}-palettes-core-black)`
  }
  const LEVELS = ['900','800','700','600','500','400','300','200','100','050']
  const PALETTE_KEYS = ['neutral','palette-1','palette-2','palette-3','palette-4']
  const buildPaletteVar = (paletteKey: string, level: string, type: 'tone' | 'on-tone' | 'high-emphasis' | 'low-emphasis'): string => {
    const levelPart = level === 'primary' ? 'primary' : level
    return `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${levelPart}-${type}`
  }
  // Simplified: just return the requested var name (no CSS var reading during resolution)
  const buildPaletteVarRef = (
    paletteKey: string,
    level: string,
    type: 'tone' | 'on-tone' | 'high-emphasis' | 'low-emphasis'
  ): string => {
    return `var(${buildPaletteVar(paletteKey, level, type)})`
  }
  const parsePaletteToneRef = (input: any): { paletteKey: string; level: string; type?: 'tone' | 'on-tone'; refMode?: 'light' | 'dark' } | null => {
    try {
      const raw = ((): any => {
        if (typeof input === 'string') return input
        if (input && typeof input === 'object') {
          if (typeof (input as any)['$value'] === 'string') return (input as any)['$value']
          if (typeof (input as any)['value'] === 'string') return (input as any)['value']
        }
        return ''
      })()
      const s = typeof raw === 'string' ? raw.trim() : ''
      if (!s) return null
      
      // Use centralized parser for brace references
      if (s.startsWith('{') && s.endsWith('}')) {
        const parsed = parseTokenReference(s, context)
        if (parsed && parsed.type === 'brand') {
          const pathParts = parsed.path
          // Check if it's a palette reference: palettes.{paletteKey}.{level}.color.{tone|on-tone}
          if (pathParts.length >= 4 && pathParts[0] === 'palettes') {
            const paletteKey = pathParts[1]
            const levelStr = pathParts[2].toLowerCase()
            const level = (levelStr === 'default') ? 'primary' : levelStr
            if (pathParts[3] === 'color' && pathParts.length >= 5) {
              const type = (pathParts[4] === 'on-tone' ? 'on-tone' : 'tone') as 'tone' | 'on-tone'
              return { paletteKey, level, type, refMode: parsed.mode || mode }
            } else if (pathParts.length === 3) {
              // Just palettes.{paletteKey}.{level} - assume tone
              return { paletteKey, level, type: 'tone', refMode: parsed.mode || mode }
            }
          }
        }
      }
      
      // Legacy palette var format
      if (/^var\(\s*--palette-[a-z0-9\-]+-(?:[0-9]{3,4}|000|050|primary)-tone\s*\)$/i.test(s)) {
        const m = /^var\(\s*--palette-([a-z0-9\-]+)-([0-9]{3,4}|000|050|primary)-tone\s*\)$/i.exec(s)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
      // Brand-scoped palette var format (with or without recursica- prefix, with or without themes)
      if (/^var\(\s*--(?:recursica-)?brand-(?:themes-)?(?:light|dark)-palettes-[a-z0-9\-]+-(?:[0-9]{3,4}|000|050|primary)-tone\s*\)$/i.test(s)) {
        const m = /^var\(\s*--(?:recursica-)?brand-(?:themes-)?(?:light|dark)-palettes-([a-z0-9\-]+)-([0-9]{3,4}|000|050|primary)-tone\s*\)$/i.exec(s)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
    } catch {}
    return null
  }
  const parseCoreTokenRef = (name: 'interactive' | 'alert' | 'warning' | 'success' | 'black' | 'white'): { family: string; level: string } | null => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const core: any =
        themes?.[mode]?.palettes?.['core']?.['$value'] || themes?.[mode]?.palettes?.['core'] ||
        themes?.[mode]?.palettes?.['core-colors']?.['$value'] || themes?.[mode]?.palettes?.['core-colors'] || themes?.[mode]?.palettes?.core?.['$value'] || themes?.[mode]?.palettes?.core || {}
      const v: any = core?.[name]
      const s = typeof v === 'string' ? v : typeof (v?.['$value']) === 'string' ? String(v['$value']) : ''
      if (!s) return null
      // Use centralized parser
      const parsed = parseTokenReference(s, context)
      if (parsed && parsed.type === 'token' && parsed.path.length >= 3 && parsed.path[0] === 'color') {
        return { family: parsed.path[1], level: parsed.path[2] }
      }
    } catch {}
    return null
  }
  const getTokenHex = (family: string, level: string): string | undefined => {
    const hex = tokenIndex.get(`color/${family}/${level}`)
    return typeof hex === 'string' ? hex : undefined
  }
  // Simplified: just use direct mapping (no CSS var reading during resolution)
  const findPaletteKeyForFamilyLevel = (family: string, level: string): string | null => {
    const map: Record<string, string> = { gray: 'neutral', salmon: 'palette-1', mandarin: 'palette-2', cornflower: 'palette-3', greensheen: 'palette-4' }
    return map[family] || null
  }
  const parseCoreVarName = (input: any): string | null => {
    try {
      const raw = ((): any => {
        if (typeof input === 'string') return input
        if (input && typeof input === 'object') {
          if (typeof (input as any)['$value'] === 'string') return (input as any)['$value']
          if (typeof (input as any)['value'] === 'string') return (input as any)['value']
        }
        return ''
      })()
      const s = typeof raw === 'string' ? raw.trim() : ''
      if (!s) return null
      // Direct var(--palette-*) → map to recursica brand core var
      const mVar = /^var\(\s*(--palette-(black|white|interactive|alert|warning|success))\s*\)\s*$/i.exec(s)
      if (mVar) {
        const label = (mVar[2] || '').toLowerCase()
        return `--recursica-brand-themes-${mode}-palettes-core-${label}`
      }
      // Use centralized parser for brace references
      if (s.startsWith('{') && s.endsWith('}')) {
        const parsed = parseTokenReference(s, context)
        if (parsed && parsed.type === 'brand') {
          const pathParts = parsed.path
          // Check if it's a core color reference: palettes.core-colors.{color} or palettes.core.{color} or palettes.{color}
          if (pathParts.length >= 2 && pathParts[0] === 'palettes') {
            let color: string | undefined
            if (pathParts.length >= 3 && (pathParts[1] === 'core-colors' || pathParts[1] === 'core')) {
              color = pathParts[2]
            } else if (pathParts.length === 2 && (pathParts[1] === 'black' || pathParts[1] === 'white')) {
              color = pathParts[1]
            }
            if (color && ['black', 'white', 'interactive', 'alert', 'warning', 'success'].includes(color.toLowerCase())) {
              const refMode = parsed.mode || mode
              return `--recursica-brand-themes-${refMode}-palettes-core-${color.toLowerCase()}`
            }
          }
        }
      }
    } catch {}
    return null
  }
  // AA compliance calculations removed - will be handled reactively in Phase 3
  // readCssVar is now imported from centralized utility
  const readIfCssVarOrHex = (s?: string): string | undefined => {
    if (!s) return undefined
    const m = /^\s*var\(\s*(--[a-z0-9\-_]+)\s*\)\s*$/i.exec(s)
    if (m) return readCssVar(m[1])
    return s
  }

  const getTokenValue = (path: string): any => tokenIndex.get(path)
  const toCssValue = (v: any, unitIfNumber?: string): string | undefined => {
    if (v == null) return undefined
    if (typeof v === 'object') {
      if (Object.prototype.hasOwnProperty.call(v as any, 'value')) {
        const val: any = (v as any).value
        const unit: any = (v as any).unit
        if (typeof val === 'number') return unit ? `${val}${unit}` : (unitIfNumber ? `${val}${unitIfNumber}` : String(val))
        return unit ? `${val}${unit}` : String(val)
      }
    }
    if (typeof v === 'number') return unitIfNumber ? `${v}${unitIfNumber}` : String(v)
    if (typeof v === 'string' && unitIfNumber && /^-?\d+(\.\d+)?$/.test(v.trim())) return `${v}${unitIfNumber}`
    return String(v)
  }
  const context: TokenReferenceContext = {
    currentMode: mode,
    tokenIndex,
    theme
  }
  
  const resolveRef = (input: any, depth = 0): any => {
    if (depth > 8) return undefined
    if (input == null) return undefined
    if (typeof input === 'number') return input
    if (typeof input === 'object') return resolveRef((input as any).$value ?? (input as any).value ?? input, depth + 1)
    
    // Check for token reference and resolve to value
    const resolved = resolveTokenReferenceToValue(input, context, depth)
    if (resolved !== undefined && resolved !== input) {
      // Handle overrides for token references
      if (typeof input === 'string' && input.trim().startsWith('{')) {
        const parsed = parseTokenReference(input, context)
        if (parsed && parsed.type === 'token') {
          const path = parsed.path.join('/')
          const ov = overrides && Object.prototype.hasOwnProperty.call(overrides, path) ? (overrides as any)[path] : undefined
          if (ov !== undefined) return resolveRef(ov, depth + 1)
        }
      }
      return resolveRef(resolved, depth + 1)
    }
    
    const s = String(input).trim()
    return s || undefined
  }

  const result: Record<string, string> = {}
  const missingPaletteSurfaces: string[] = []
  // Coerce any input (brace ref/var/hex) into a palette/core var reference if possible; otherwise null
  const coerceToVarRef = (rawInput: any): string | null => {
    try {
      // Try to resolve to CSS var using centralized parser
      const cssVar = resolveTokenReferenceToCssVar(rawInput, context)
      if (cssVar) return cssVar
      
      // Already a CSS var
      if (typeof rawInput === 'string' && /^\s*var\(--/.test(rawInput)) return String(rawInput).trim()
      
      // Resolve to get potential var reference
      const resolved = resolveRef(rawInput)
      if (typeof resolved === 'string') {
        const asVar = /^\s*var\(--/.test(resolved) ? resolved.trim() : null
        if (asVar) return asVar
        // If resolved to hex, map black/white to core vars
        const hex = resolved.trim()
        if (/^#?[0-9a-f]{6}$/i.test(hex)) {
          const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
          if (h === '#ffffff' || h === '#000000') return mapBWHexToVar(h)
          // Other hex values should be in JSON as token references
        }
      }
    } catch {}
    return null
  }
  const parseSizeTokenRef = (input: any): string | null => {
    try {
      const raw = ((): any => {
        if (typeof input === 'string') return input
        if (input && typeof input === 'object') {
          if (typeof (input as any)['$value'] === 'string') return (input as any)['$value']
          if (typeof (input as any)['value'] === 'string') return (input as any)['value']
        }
        return ''
      })()
      const s = typeof raw === 'string' ? raw.trim() : ''
      if (!s) return null
      const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
      const m = /^(?:tokens|token)\.size\.([a-z0-9\-_]+)$/i.exec(inner)
      if (m) return m[1]
      // Support both old format (--tokens-size-*) and new format (--recursica-tokens-size-*)
      if (/^var\(\s*(--recursica-)?tokens-size-[a-z0-9\-_]+\s*\)\s*$/i.test(s)) {
        const mv = /^var\(\s*((?:--recursica-)?tokens-size-[a-z0-9\-_]+)\s*\)\s*$/i.exec(s)
        if (mv) return mv[1].replace(/^--(recursica-)?tokens-size-/, '')
      }
    } catch {}
    return null
  }
  const parseOpacityTokenRef = (input: any): string | null => {
    try {
      const raw = ((): any => {
        if (typeof input === 'string') return input
        if (input && typeof input === 'object') {
          if (typeof (input as any)['$value'] === 'string') return (input as any)['$value']
          if (typeof (input as any)['value'] === 'string') return (input as any)['value']
        }
        return ''
      })()
      const s = typeof raw === 'string' ? raw.trim() : ''
      if (!s) return null
      const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
      const m = /^(?:tokens|token)\.opacity\.([a-z0-9\-_]+)$/i.exec(inner)
      if (m) return m[1]
      // Support both old format (--tokens-opacity-*) and new format (--recursica-tokens-opacity-*)
      if (/^var\(\s*(--recursica-)?tokens-opacity-[a-z0-9\-_]+\s*\)\s*$/i.test(s)) {
        const mv = /^var\(\s*((?:--recursica-)?tokens-opacity-[a-z0-9\-_]+)\s*\)\s*$/i.exec(s)
        if (mv) return mv[1].replace(/^--(recursica-)?tokens-opacity-/, '')
      }
    } catch {}
    return null
  }
  const applyForLayer = (spec: any, prefix: string) => {
    const brandBase = `--recursica-brand-themes-${mode}-layer-layer-${prefix}-property-`
    // Extract surface value - handle both direct values and $value wrapper
    let surfRaw = spec?.properties?.surface
    if (surfRaw && typeof surfRaw === 'object' && typeof (surfRaw as any)['$value'] === 'string') {
      surfRaw = (surfRaw as any)['$value']
    }
    const surfPalette = parsePaletteToneRef(surfRaw)
    const surf = resolveRef(surfRaw)
    const padRaw = spec?.properties?.padding
    const padSizeKey = parseSizeTokenRef(padRaw)
    const pad = resolveRef(padRaw)
    // Preserve only var references for border color; avoid emitting hex
    // Extract border color value - handle both direct values and $value wrapper
    let bcolRaw = spec?.properties?.['border-color']
    if (bcolRaw && typeof bcolRaw === 'object' && typeof (bcolRaw as any)['$value'] === 'string') {
      bcolRaw = (bcolRaw as any)['$value']
    }
    const bcolVarRef = coerceToVarRef(bcolRaw)
    const bthRaw = spec?.properties?.['border-thickness']
    const bthSizeKey = parseSizeTokenRef(bthRaw)
    const bth = resolveRef(bthRaw)
    const bradRaw = spec?.properties?.['border-radius']
    const bradSizeKey = parseSizeTokenRef(bradRaw)
    const brad = resolveRef(bradRaw)
    if (surfPalette) {
      // Use palette tone var directly (no CSS var reading during resolution)
      const toneVarName = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')
      result[`${brandBase}surface`] = `var(${toneVarName})`
    } else {
      const surfVarRef = coerceToVarRef(surfRaw)
      if (surfVarRef) {
        result[`${brandBase}surface`] = surfVarRef
      } else if (surf != null && typeof surf === 'string') {
        // If surface is a hex string, record as missing palette (should be in JSON)
        if (/^#?[0-9a-f]{6}$/i.test(surf.trim())) {
          missingPaletteSurfaces.push(String(prefix))
        }
      } else if (surf != null) {
        // Record missing palette surface for visibility
        missingPaletteSurfaces.push(String(prefix))
      }
    }
    // Helper: attempt to map numeric size (e.g., 0, '0', '0px') to a size token suffix
    const pickSizeTokenByNumeric = (val: any): string | null => {
      try {
        const toNum = (x: any): number | null => {
          if (x == null) return null
          if (typeof x === 'number') return x
          const s = String(x).trim()
          if (!s) return null
          const m = /^-?\d+(\.\d+)?(px)?$/.exec(s)
          if (!m) return null
          return Number.parseFloat(s.replace(/px$/i, ''))
        }
        const n = toNum(val)
        if (n == null || Number.isNaN(n)) return null
        const sizeSrc: any = (tokens as any)?.tokens?.size || {}
        let bestKey: string | null = null
        let bestDelta = Number.POSITIVE_INFINITY
        Object.keys(sizeSrc).forEach((short) => {
          if (short.startsWith('$')) return
          const got = tokenIndex.get(`size/${short}`)
          const num = typeof got === 'number' ? got : Number(got && (got as any).value != null ? (got as any).value : got)
          if (Number.isFinite(num)) {
            const delta = Math.abs(num - n)
            if (delta < bestDelta) { bestDelta = delta; bestKey = short }
          }
        })
        // choose nearest available size token (no exact match required)
        if (bestKey != null) return bestKey
      } catch {}
      return null
    }
    if (padSizeKey) {
      result[`${brandBase}padding`] = `var(--recursica-tokens-size-${padSizeKey})`
    } else if (pad != null) {
      const mapped = pickSizeTokenByNumeric(pad)
      if (mapped) result[`${brandBase}padding`] = `var(--recursica-tokens-size-${mapped})`
      else {
        const v = toCssValue(pad, 'px')!; result[`${brandBase}padding`] = v
      }
    }
    if (bcolVarRef) { result[`${brandBase}border-color`] = bcolVarRef }
    if (bthSizeKey) {
      result[`${brandBase}border-thickness`] = `var(--recursica-tokens-size-${bthSizeKey})`
    } else if (bth != null) {
      // Border thickness should always use direct pixel values, not tokens
      const v = toCssValue(bth, 'px')!; result[`${brandBase}border-thickness`] = v
    }
    if (bradSizeKey) {
      result[`${brandBase}border-radius`] = `var(--recursica-tokens-size-${bradSizeKey})`
    } else if (brad != null) {
      const mapped = pickSizeTokenByNumeric(brad)
      if (mapped) result[`${brandBase}border-radius`] = `var(--recursica-tokens-size-${mapped})`
      else {
        const v = toCssValue(brad, 'px')!; result[`${brandBase}border-radius`] = v
      }
    }

    const brandTextBase = `--recursica-brand-themes-${mode}-layer-layer-${prefix}-property-element-text-`
    const brandTextRefBase = `--recursica-brand-themes-${mode}-layer-layer-${prefix}-property-element-text-`
    // Extract text color value - handle both direct values and $value wrapper
    let tcolorRaw = spec?.elements?.text?.color
    if (tcolorRaw && typeof tcolorRaw === 'object' && typeof (tcolorRaw as any)['$value'] === 'string') {
      tcolorRaw = (tcolorRaw as any)['$value']
    }
    // Check if it's a palette reference first, before calling coerceToVarRef
    // This ensures we always use the correct palette variable even if coerceToVarRef fails
    const tcolorPalette = parsePaletteToneRef(tcolorRaw)
    const talert = resolveRef(spec?.elements?.text?.alert)
    const twarn = resolveRef(spec?.elements?.text?.warning)
    const tsuccess = resolveRef(spec?.elements?.text?.success)
    // Base text color: use explicit text color if set, otherwise derive from surface palette on-tone
    const surfaceHex = typeof surf === 'string' ? String(surf) : undefined
    if (tcolorPalette) {
      // It's a palette reference - always use the correct palette variable
      // Use refMode from the reference if specified, otherwise use current mode
      const useMode = tcolorPalette.refMode ?? mode
      const levelPart = tcolorPalette.level === 'primary' ? 'primary' : tcolorPalette.level
      const paletteVarName = `--recursica-brand-themes-${useMode}-palettes-${tcolorPalette.paletteKey}-${levelPart}-${tcolorPalette.type || 'on-tone'}`
      // Always use the var() reference directly - don't try to dereference from paletteVars
      // The palette variable will resolve correctly when CSS vars are applied
      result[`${brandTextBase}color`] = `var(${paletteVarName})`
    } else {
      // Not a palette reference, try coerceToVarRef
      const tcolorVarRef = coerceToVarRef(tcolorRaw)
      if (tcolorVarRef) {
        result[`${brandTextBase}color`] = tcolorVarRef
      }
    }
    // If text color wasn't set above, derive from surface palette on-tone
    if (!result[`${brandTextBase}color`] && surfPalette) {
      // Map on-tone to brand core black/white by dereferencing the palette on-tone var
      const onToneVarName = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone')
      // Try to get the value from paletteVars first (during initialization), then fall back to reading from DOM
      // paletteVars contains the actual CSS variable values (like "var(--recursica-brand-light-palettes-core-black)")
      // IMPORTANT: paletteVars keys are the CSS variable names WITHOUT the '--' prefix in some cases, but actually they ARE the full CSS variable names
      let onToneValue: string | undefined = paletteVars?.[onToneVarName]
      
      if (!onToneValue) {
        // Fall back to reading from DOM (for runtime updates after initialization)
        onToneValue = readCssVar(onToneVarName)
      }
      // If we found a value, use it directly (it's already a var() reference or hex)
      if (onToneValue && typeof onToneValue === 'string') {
        const trimmed = onToneValue.trim()
        // If it's already a var() reference, use it directly
        if (/^var\s*\(/.test(trimmed)) {
          result[`${brandTextBase}color`] = trimmed
        } else if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
          // It's a hex value, convert to core color var if black/white
          const h = trimmed.startsWith('#') ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`
          if (h === '#ffffff' || h === '#000000') {
            result[`${brandTextBase}color`] = mapBWHexToVar(h)
          } else {
            // Fall back to on-tone var reference
            result[`${brandTextBase}color`] = `var(${onToneVarName})`
          }
        } else {
          // Not a hex value and not a var(), use as-is or fall back to on-tone var
          result[`${brandTextBase}color`] = trimmed || `var(${onToneVarName})`
        }
      } else {
        // No value found in paletteVars or DOM, use on-tone var reference directly
        // This ensures the CSS variable is set even if we can't resolve it yet
        result[`${brandTextBase}color`] = `var(${onToneVarName})`
      }
    }
    // Final fallback: if text color still wasn't set, default to black
    if (!result[`${brandTextBase}color`] && surfaceHex) {
      // Default to black - AA compliance will be handled reactively in Phase 3
      result[`${brandTextBase}color`] = `var(--recursica-brand-themes-${mode}-palettes-core-black)`
    }
    // Emphasis opacities: always reference brand-level text emphasis (theme opacity)
    result[`${brandTextBase}high-emphasis`] = `var(--recursica-brand-themes-${mode}-text-emphasis-high)`
    result[`${brandTextBase}low-emphasis`] = `var(--recursica-brand-themes-${mode}-text-emphasis-low)`
    // Status colors: core color → step within its token family → fallback to surface on-tone (AA with opacity considered)
    // Support both old format (brand.light.*) and new format (brand.themes.light.*)
    const coreAlert = resolveRef(`{brand.themes.${mode}.palettes.core-colors.alert}`) ?? resolveRef(`{brand.${mode}.palettes.core-colors.alert}`) ?? resolveRef(`{brand.${mode}.palettes.core.alert}`)
    const coreWarn = resolveRef(`{brand.themes.${mode}.palettes.core-colors.warning}`) ?? resolveRef(`{brand.${mode}.palettes.core-colors.warning}`) ?? resolveRef(`{brand.${mode}.palettes.core.warning}`)
    const coreSuccess = resolveRef(`{brand.themes.${mode}.palettes.core-colors.success}`) ?? resolveRef(`{brand.${mode}.palettes.core-colors.success}`) ?? resolveRef(`{brand.${mode}.palettes.core.success}`)
    const alertHex = typeof (talert ?? coreAlert) === 'string' ? String(talert ?? coreAlert) : undefined
    const warnHex = typeof (twarn ?? coreWarn) === 'string' ? String(twarn ?? coreWarn) : undefined
    const successHex = typeof (tsuccess ?? coreSuccess) === 'string' ? String(tsuccess ?? coreSuccess) : undefined
    if (surfaceHex || surfPalette) {
      const bgHex = surfPalette
        ? (paletteVars?.[buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')] || readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')) || surfaceHex || '')
        : (readIfCssVarOrHex(surfaceHex) || '')
      const textHighOpacity = (() => {
        if (surfPalette) {
          const hiVarName = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'high-emphasis')
          const hi = paletteVars?.[hiVarName] || readCssVar(hiVarName)
          const n = typeof hi === 'string' ? Number(hi) : NaN
          return Number.isFinite(n) ? (n <= 1 ? n : n / 100) : 1
        }
        return 1
      })()
      type Role = { name: 'alert' | 'warning' | 'success'; coreHex?: string; coreToken?: { family: string; level: string } }
      const roles: Role[] = [
        { name: 'alert', coreHex: alertHex, coreToken: parseCoreTokenRef('alert') || undefined },
        { name: 'warning', coreHex: warnHex, coreToken: parseCoreTokenRef('warning') || undefined },
        { name: 'success', coreHex: successHex, coreToken: parseCoreTokenRef('success') || undefined },
      ]
      roles.forEach((r) => {
        const brandKey = `${brandTextBase}${r.name}`
        let finalRef: string | undefined
        
        // Always use the core palette CSS variable for alert/warning/success
        // These are generated by buildPaletteVars and should always be available
        // The core palette variable references the tone value directly
        finalRef = `var(--recursica-brand-themes-${mode}-palettes-core-${r.name})`
        
        result[brandKey] = finalRef
      })
    } else {
      // If no surface hex is available, still avoid emitting hex; prefer tokens or brand core vars
      const aTok = parseCoreTokenRef('alert')
      const wTok = parseCoreTokenRef('warning')
      const sTok = parseCoreTokenRef('success')
      if (aTok) result[`${brandTextBase}alert`] = `var(--recursica-tokens-color-${aTok.family}-${aTok.level})`
      else result[`${brandTextBase}alert`] = `var(--recursica-brand-themes-${mode}-palettes-core-alert, var(--palette-alert))`
      if (wTok) result[`${brandTextBase}warning`] = `var(--recursica-tokens-color-${wTok.family}-${wTok.level})`
      else result[`${brandTextBase}warning`] = `var(--recursica-brand-themes-${mode}-palettes-core-warning, var(--palette-warning))`
      if (sTok) result[`${brandTextBase}success`] = `var(--recursica-tokens-color-${sTok.family}-${sTok.level})`
      else result[`${brandTextBase}success`] = `var(--recursica-brand-themes-${mode}-palettes-core-success, var(--palette-success))`
    }

    const brandInterBase = `--recursica-brand-themes-${mode}-layer-layer-${prefix}-property-element-interactive-`
    
    // Helper to extract value from $value wrapper or direct value
    const extractValue = (val: any): any => {
      if (val && typeof val === 'object' && typeof (val as any)['$value'] === 'string') {
        return (val as any)['$value']
      }
      return val
    }
    
    // Extract all interactive color values - handle both direct values and $value wrapper
    // New structure: tone, tone-hover, on-tone, on-tone-hover
    const itoneRaw = extractValue(spec?.elements?.interactive?.tone)
    const itoneHoverRaw = extractValue(spec?.elements?.interactive?.['tone-hover'])
    const ionToneRaw = extractValue(spec?.elements?.interactive?.['on-tone'])
    const ionToneHoverRaw = extractValue(spec?.elements?.interactive?.['on-tone-hover'])
    
    // Legacy support: check for old property names
    const ibgRaw = extractValue(spec?.elements?.interactive?.background)
    const ibgHoverRaw = extractValue(spec?.elements?.interactive?.['background-hover'])
    const itextRaw = extractValue(spec?.elements?.interactive?.text)
    const itextHoverRaw = extractValue(spec?.elements?.interactive?.['text-hover'])
    
    // Legacy support: check for old 'color' property
    let icolorRaw = extractValue(spec?.elements?.interactive?.color)
    const icolorVar = coerceToVarRef(icolorRaw)
    
    const ihRaw = spec?.elements?.interactive?.['high-emphasis']
    const ih = resolveRef(ihRaw)
    const ihoverRaw = spec?.elements?.interactive?.['hover-color']
    const ihover = resolveRef(ihoverRaw)
    
    // Resolve all interactive properties - prefer new names, fall back to old names
    const itoneVar = coerceToVarRef(itoneRaw) || coerceToVarRef(ibgRaw)
    const itoneHoverVar = coerceToVarRef(itoneHoverRaw) || coerceToVarRef(ibgHoverRaw)
    const ionToneVar = coerceToVarRef(ionToneRaw) || coerceToVarRef(itextRaw)
    const ionToneHoverVar = coerceToVarRef(ionToneHoverRaw) || coerceToVarRef(itextHoverRaw)
    
    // Helper to get default reference for interactive properties
    const getDefaultInteractiveRef = (property: 'tone' | 'tone-hover' | 'on-tone' | 'on-tone-hover'): string => {
      if (property === 'tone') {
        return `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`
      } else if (property === 'tone-hover') {
        return `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone)`
      } else if (property === 'on-tone') {
        return `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`
      } else if (property === 'on-tone-hover') {
        return `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone)`
      }
      return `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`
    }
    
    // Set tone colors (background)
    if (itoneVar) {
      result[`${brandInterBase}tone`] = itoneVar
    } else {
      // Use default from core palette - AA compliance will be handled reactively
      result[`${brandInterBase}tone`] = getDefaultInteractiveRef('tone')
    }
    
    if (itoneHoverVar) {
      result[`${brandInterBase}tone-hover`] = itoneHoverVar
    } else {
      // Use default from core palette - AA compliance will be handled reactively
      result[`${brandInterBase}tone-hover`] = getDefaultInteractiveRef('tone-hover')
    }
    
    // Set on-tone colors (text)
    if (ionToneVar) {
      result[`${brandInterBase}on-tone`] = ionToneVar
    } else {
      // Use default from core palette - AA compliance will be handled reactively
      result[`${brandInterBase}on-tone`] = getDefaultInteractiveRef('on-tone')
    }
    
    if (ionToneHoverVar) {
      result[`${brandInterBase}on-tone-hover`] = ionToneHoverVar
    } else {
      // Use default from core palette - AA compliance will be handled reactively
      result[`${brandInterBase}on-tone-hover`] = getDefaultInteractiveRef('on-tone-hover')
    }
    
    // Legacy support: if old 'color' property exists, use it for backward compatibility
    if (icolorVar) {
      // Map old 'color' to tone for backward compatibility
      result[`${brandInterBase}color`] = icolorVar
      // Also set as tone if not already set
      if (!itoneVar) {
        result[`${brandInterBase}tone`] = icolorVar
      }
    } else {
      // Backward compatibility: set element-interactive-color to element-interactive-tone if color not explicitly defined
      // This ensures element-interactive-color always exists for legacy code
      result[`${brandInterBase}color`] = result[`${brandInterBase}tone`] || getDefaultInteractiveRef('tone')
    }
    // Default interactive high-emphasis to text high-emphasis if not provided; prefer opacity tokens
    if (ihRaw) {
      const tok = parseOpacityTokenRef(ihRaw)
      if (tok) {
        result[`${brandInterBase}high-emphasis`] = `var(--recursica-tokens-opacity-${tok})`
      } else if (ih != null) {
        const v = String(ih).trim()
        const num = Number(v)
        if (Number.isFinite(num)) {
          const normalized = num <= 1 ? num : num / 100
          result[`${brandInterBase}high-emphasis`] = `var(--recursica-tokens-opacity-solid, ${String(Math.max(0, Math.min(1, normalized)))})`
        } else {
          result[`${brandInterBase}high-emphasis`] = v
        }
      }
    } else {
      const v = `var(${brandTextRefBase}high-emphasis)`
      result[`${brandInterBase}high-emphasis`] = v
    }
    if (ihoverRaw != null) {
      const vref = coerceToVarRef(ihoverRaw)
      if (vref) {
        result[`${brandInterBase}hover-color`] = vref
      } else {
        // If coerceToVarRef failed, use default interactive hover tone instead of direct hex
        result[`${brandInterBase}hover-color`] = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-tone)`
      }
    }
    
    // Generate layer-specific interactive on-tone variables for UIKit references
    // These reference the core palette on-tone variables
    result[`${brandInterBase}default-on-tone`] = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`
    result[`${brandInterBase}hover-on-tone`] = `var(--recursica-brand-themes-${mode}-palettes-core-interactive-hover-on-tone)`
  }

  ;['0','1','2','3','4'].forEach((lvl) => {
    const key = `layer-${lvl}`
    if (layersData && Object.prototype.hasOwnProperty.call(layersData, key)) applyForLayer(layersData[key], lvl)
  })

  // Add backwards compatibility aliases for old format (without themes in path)
  // Old format: --recursica-brand-light-layer-layer-0-property-...
  // New format: --recursica-brand-themes-light-layer-layer-0-property-...
  Object.keys(result).forEach((newVarName) => {
    if (newVarName.startsWith(`--recursica-brand-themes-${mode}-layer-layer-`)) {
      const oldVarName = newVarName.replace(`--recursica-brand-themes-${mode}-`, `--recursica-brand-${mode}-`)
      // Only add alias if it doesn't already exist (to avoid overwriting)
      if (!result[oldVarName]) {
        result[oldVarName] = result[newVarName]
      }
    }
  })

  // Report layers missing palette surface references (silently via event only)
  if (missingPaletteSurfaces.length > 0) {
    try {
      window.dispatchEvent(new CustomEvent('missingLayerPaletteRefs', { detail: { layers: missingPaletteSurfaces.slice() } }))
    } catch {}
  }

  return result
}



