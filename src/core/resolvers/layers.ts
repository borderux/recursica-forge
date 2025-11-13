import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'

export function buildLayerVars(tokens: JsonLike, theme: JsonLike, overrides?: Record<string, any>): Record<string, string> {
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const layersLight: any = troot?.light?.layer || {}

  const mapBWHexToVar = (hex: string): string => {
    const h = (hex || '').toLowerCase()
    return h === '#ffffff' ? 'var(--recursica-brand-light-palettes-core-white)' : 'var(--recursica-brand-light-palettes-core-black)'
  }
  const LEVELS = ['900','800','700','600','500','400','300','200','100','050']
  const PALETTE_KEYS = ['neutral','palette-1','palette-2','palette-3','palette-4']
  const buildPaletteVar = (paletteKey: string, level: string, type: 'tone' | 'on-tone' | 'high-emphasis' | 'low-emphasis'): string => {
    const levelPart = level === 'primary' ? 'primary' : level
    return `--recursica-brand-light-palettes-${paletteKey}-${levelPart}-${type}`
  }
  // Simplified: just return the requested var name (no CSS var reading during resolution)
  const buildPaletteVarRef = (
    paletteKey: string,
    level: string,
    type: 'tone' | 'on-tone' | 'high-emphasis' | 'low-emphasis'
  ): string => {
    return `var(${buildPaletteVar(paletteKey, level, type)})`
  }
  const parsePaletteToneRef = (input: any): { paletteKey: string; level: string } | null => {
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
      if (s.startsWith('{') && s.endsWith('}')) {
        const inner = s.slice(1, -1).trim()
        const m = /^(?:brand|theme)\.light\.palettes\.([a-z0-9\-]+)\.([0-9]{3}|000|050|primary|default)\.color\.tone$/i.exec(inner)
        if (m) {
          const paletteKey = m[1]
          const lvl = m[2].toLowerCase()
          // Normalize 'default' to 'primary' so downstream CSS var names are valid
          const level = (lvl === 'default') ? 'primary' : lvl
          return { paletteKey, level }
        }
      }
      // Legacy palette var format
      if (/^var\(\s*--palette-[a-z0-9\-]+-(?:[0-9]{3}|000|050|primary)-tone\s*\)$/i.test(s)) {
        const m = /^var\(\s*--palette-([a-z0-9\-]+)-([0-9]{3}|000|050|primary)-tone\s*\)$/i.exec(s)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
      // Brand-scoped palette var format (with or without recursica- prefix)
      if (/^var\(\s*--(?:recursica-)?brand-(?:light|dark)-palettes-[a-z0-9\-]+-(?:[0-9]{3}|000|050|primary)-tone\s*\)$/i.test(s)) {
        const m = /^var\(\s*--(?:recursica-)?brand-(?:light|dark)-palettes-([a-z0-9\-]+)-([0-9]{3}|000|050|primary)-tone\s*\)$/i.exec(s)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
    } catch {}
    return null
  }
  const parseCoreTokenRef = (name: 'interactive' | 'alert' | 'warning' | 'success'): { family: string; level: string } | null => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const core: any =
        root?.light?.palettes?.['core']?.['$value'] || root?.light?.palettes?.['core'] ||
        root?.light?.palettes?.['core-colors']?.['$value'] || root?.light?.palettes?.['core-colors'] || {}
      const v: any = core?.[name]
      const s = typeof v === 'string' ? v : typeof (v?.['$value']) === 'string' ? String(v['$value']) : ''
      if (!s) return null
      const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s
      // tokens.color.<family>.<level>
      const m = /^tokens\.color\.([a-z0-9_-]+)\.(\d{2,4}|050)$/i.exec(inner)
      if (m) return { family: m[1], level: m[2] }
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
        return `--recursica-brand-light-palettes-core-${label}`
      }
      // {brand|theme}.{light|dark}.palettes.core.<key> (also accept legacy core-colors)
      const m = /^(?:brand|theme)\.(?:light|dark)\.palettes\.(?:core|core-colors)\.(black|white|interactive|alert|warning|success)$/i.exec(
        s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s
      )
      if (m) return `--recursica-brand-light-palettes-core-${m[1].toLowerCase()}`
    } catch {}
    return null
  }
  // AA compliance calculations removed - will be handled reactively in Phase 3
  const readCssVar = (name: string): string | undefined => {
    try {
      const v = (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim()
      return v || undefined
    } catch {
      return undefined
    }
  }
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
  const resolveRef = (input: any, depth = 0): any => {
    if (depth > 8) return undefined
    if (input == null) return undefined
    if (typeof input === 'number') return input
    if (typeof input === 'object') return resolveRef((input as any).$value ?? (input as any).value ?? input, depth + 1)
    const s = String(input).trim()
    if (!s) return undefined
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1).trim()
      if (/^(tokens|token)\./i.test(inner)) {
        const path = inner.replace(/^(tokens|token)\./i, '').replace(/[.]/g, '/').replace(/\/+/, '/').trim()
        const ov = overrides && Object.prototype.hasOwnProperty.call(overrides, path) ? (overrides as any)[path] : undefined
        return resolveRef(ov ?? getTokenValue(path), depth + 1)
      }
      if (/^theme\./i.test(inner)) {
        // Allow references like {theme.light.palettes.black} and handle nested $value objects
        const full = `brand.${inner.replace(/^theme\./i, '')}`
        const parts = full.split('.').filter(Boolean)
        let node: any = (theme as any)
        for (const p of parts) {
          if (!node) break
          let next = (node as any)[p]
          // If the property is inside a $value object (common for grouped tokens), traverse into $value
          if (next == null && node && typeof node === 'object' && (node as any)['$value'] && typeof (node as any)['$value'] === 'object') {
            next = (node as any)['$value'][p]
          }
          node = next
        }
        return resolveRef(node, depth + 1)
      }
      if (/^brand\./i.test(inner)) {
        const parts = inner.split('.').filter(Boolean)
        let node: any = (theme as any)
        for (const p of parts) {
          if (!node) break
          let next = (node as any)[p]
          if (next == null && node && typeof node === 'object' && (node as any)['$value'] && typeof (node as any)['$value'] === 'object') {
            next = (node as any)['$value'][p]
          }
          node = next
        }
        return resolveRef(node, depth + 1)
      }
      return undefined
    }
    return s
  }

  const result: Record<string, string> = {}
  const missingPaletteSurfaces: string[] = []
  // Coerce any input (brace ref/var/hex) into a palette/core var reference if possible; otherwise null
  const coerceToVarRef = (rawInput: any): string | null => {
    try {
      // Palette tone reference e.g. {brand.light.palettes.neutral.100.color.tone} or var(--palette-neutral-100-tone)
      const pal = parsePaletteToneRef(rawInput)
      if (pal) return `var(${buildPaletteVar(pal.paletteKey, pal.level, 'tone')})`
      // Core palette reference e.g. {brand.light.palettes.core-colors.alert}
      const coreVar = parseCoreVarName(rawInput)
      if (coreVar) return `var(${coreVar})`
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
      if (/^var\(\s*--tokens-size-[a-z0-9\-_]+\s*\)\s*$/i.test(s)) {
        const mv = /^var\(\s*(--tokens-size-[a-z0-9\-_]+)\s*\)\s*$/i.exec(s)
        if (mv) return mv[1].replace(/^--tokens-size-/, '')
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
      if (/^var\(\s*--tokens-opacity-[a-z0-9\-_]+\s*\)\s*$/i.test(s)) {
        const mv = /^var\(\s*(--tokens-opacity-[a-z0-9\-_]+)\s*\)\s*$/i.exec(s)
        if (mv) return mv[1].replace(/^--tokens-opacity-/, '')
      }
    } catch {}
    return null
  }
  const applyForLayer = (spec: any, prefix: string) => {
    const brandBase = `--brand-light-layer-layer-${prefix}-property-`
    let surfRaw = spec?.property?.surface
    // If alternative layer has no explicit surface, synthesize from core palette for correct AA evaluation
    const altMatch = typeof prefix === 'string' ? /^alternative\-(.+)$/.exec(prefix) : null
    if (!surfRaw && altMatch) {
      const key = altMatch[1]
      if (key === 'alert') surfRaw = 'var(--recursica-brand-light-palettes-core-alert, var(--palette-alert))'
      else if (key === 'warning') surfRaw = 'var(--recursica-brand-light-palettes-core-warning, var(--palette-warning))'
      else if (key === 'success') surfRaw = 'var(--recursica-brand-light-palettes-core-success, var(--palette-success))'
      else if (key === 'high-contrast') surfRaw = 'var(--recursica-brand-light-palettes-core-black)'
      else if (key === 'primary-color') surfRaw = 'var(--recursica-brand-light-palettes-palette-1-primary-tone)'
    }
    const surfPalette = parsePaletteToneRef(surfRaw)
    const surf = resolveRef(surfRaw)
    const padRaw = spec?.property?.padding
    const padSizeKey = parseSizeTokenRef(padRaw)
    const pad = resolveRef(padRaw)
    // Preserve only var references for border color; avoid emitting hex
    const bcolVarRef = coerceToVarRef(spec?.property?.['border-color'])
    const bthRaw = spec?.property?.['border-thickness']
    const bthSizeKey = parseSizeTokenRef(bthRaw)
    const bth = resolveRef(bthRaw)
    const bradRaw = spec?.property?.['border-radius']
    const bradSizeKey = parseSizeTokenRef(bradRaw)
    const brad = resolveRef(bradRaw)
    const isAlt = typeof prefix === 'string' && /^alternative-/.test(prefix)
    if (surfPalette) {
      // Use palette tone var directly (no CSS var reading during resolution)
      const toneVarName = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')
      result[`${brandBase}surface`] = `var(${toneVarName})`
    } else {
      const surfVarRef = coerceToVarRef(surfRaw)
      if (surfVarRef) {
        result[`${brandBase}surface`] = surfVarRef
      } else if (surf != null && typeof surf === 'string' && !isAlt) {
        // If surface is a hex string, record as missing palette (should be in JSON)
        if (/^#?[0-9a-f]{6}$/i.test(surf.trim())) {
          missingPaletteSurfaces.push(String(prefix))
        }
      } else if (!isAlt && surf != null) {
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
      const mapped = pickSizeTokenByNumeric(bth)
      if (mapped) result[`${brandBase}border-thickness`] = `var(--recursica-tokens-size-${mapped})`
      else {
        const v = toCssValue(bth, 'px')!; result[`${brandBase}border-thickness`] = v
      }
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

    const brandTextBase = `--brand-light-layer-layer-${prefix}-property-element-text-`
    const brandTextRefBase = `--recursica-brand-light-layer-layer-${prefix}-property-element-text-`
    const tcolorRaw = spec?.element?.text?.color
    // Only allow var references for text color overrides; otherwise derive from surface
    const tcolorVarRef = coerceToVarRef(tcolorRaw)
    const talert = resolveRef(spec?.element?.text?.alert)
    const twarn = resolveRef(spec?.element?.text?.warning)
    const tsuccess = resolveRef(spec?.element?.text?.success)
    // Base text color: choose surface palette on-tone where possible
    const surfaceHex = typeof surf === 'string' ? String(surf) : undefined
    if (surfPalette) {
      // Map on-tone to brand core black/white by dereferencing the palette on-tone var
      const onToneVarName = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone')
      const deref = readCssVar(onToneVarName)
      // If deref is a hex value, convert it to a token var reference if possible
      if (deref && typeof deref === 'string') {
        const hex = deref.trim()
        if (/^#?[0-9a-f]{6}$/i.test(hex)) {
          const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
          if (h === '#ffffff' || h === '#000000') {
            result[`${brandTextBase}color`] = mapBWHexToVar(h)
          } else {
            // Fall back to on-tone var (token-by-hex lookup removed - should be in JSON)
            result[`${brandTextBase}color`] = `var(${onToneVarName})`
          }
        } else {
          // Not a hex value, use as-is or fall back to on-tone var
          result[`${brandTextBase}color`] = deref || `var(${onToneVarName})`
        }
      } else {
        // No deref value, use on-tone var
        result[`${brandTextBase}color`] = `var(${onToneVarName})`
      }
    } else if (tcolorVarRef) {
      result[`${brandTextBase}color`] = tcolorVarRef
    } else if (surfaceHex) {
      // Default to black - AA compliance will be handled reactively in Phase 3
      result[`${brandTextBase}color`] = 'var(--recursica-brand-light-palettes-core-black)'
    }
    // Emphasis opacities: always reference brand-level text emphasis (theme opacity)
    result[`${brandTextBase}high-emphasis`] = 'var(--recursica-brand-light-text-emphasis-high)'
    result[`${brandTextBase}low-emphasis`] = 'var(--recursica-brand-light-text-emphasis-low)'
    // Status colors: core color → step within its token family → fallback to surface on-tone (AA with opacity considered)
    const coreAlert = resolveRef('{brand.light.palettes.core.alert}') ?? resolveRef('{brand.light.palettes.core-colors.alert}')
    const coreWarn = resolveRef('{brand.light.palettes.core.warning}') ?? resolveRef('{brand.light.palettes.core-colors.warning}')
    const coreSuccess = resolveRef('{brand.light.palettes.core.success}') ?? resolveRef('{brand.light.palettes.core-colors.success}')
    const alertHex = typeof (talert ?? coreAlert) === 'string' ? String(talert ?? coreAlert) : undefined
    const warnHex = typeof (twarn ?? coreWarn) === 'string' ? String(twarn ?? coreWarn) : undefined
    const successHex = typeof (tsuccess ?? coreSuccess) === 'string' ? String(tsuccess ?? coreSuccess) : undefined
    if (surfaceHex || surfPalette) {
      const bgHex = surfPalette
        ? (readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')) || surfaceHex || '')
        : (readIfCssVarOrHex(surfaceHex) || '')
      const textHighOpacity = (() => {
        if (surfPalette) {
          const hi = readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'high-emphasis'))
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
        if (r.coreToken) {
          // Use core token directly - AA compliance will be handled reactively in Phase 3
          finalRef = `var(--recursica-brand-light-palettes-core-${r.name})`
        }
        if (!finalRef) {
          const onToneVar = surfPalette ? buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone') : undefined
          if (onToneVar) {
            const deref = readCssVar(onToneVar)
            // If deref is a hex value, convert it to a token var reference if possible
            if (deref && typeof deref === 'string') {
              const hex = deref.trim()
              if (/^#?[0-9a-f]{6}$/i.test(hex)) {
                const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
                if (h === '#ffffff' || h === '#000000') {
                  finalRef = mapBWHexToVar(h)
                } else {
                  // Fall back to on-tone var (token-by-hex lookup removed - should be in JSON)
                  finalRef = `var(${onToneVar})`
                }
              } else {
                // Not a hex value, use as-is or fall back to on-tone var
                finalRef = deref || `var(${onToneVar})`
              }
            } else {
              // No deref value, use on-tone var
              finalRef = `var(${onToneVar})`
            }
          } else {
            // Default to black - AA compliance will be handled reactively in Phase 3
            finalRef = 'var(--recursica-brand-light-palettes-core-black)'
          }
        }
        result[brandKey] = finalRef
      })
    } else {
      // If no surface hex is available, still avoid emitting hex; prefer tokens or brand core vars
      const aTok = parseCoreTokenRef('alert')
      const wTok = parseCoreTokenRef('warning')
      const sTok = parseCoreTokenRef('success')
      if (aTok) result[`${brandTextBase}alert`] = `var(--recursica-tokens-color-${aTok.family}-${aTok.level})`
      else result[`${brandTextBase}alert`] = 'var(--recursica-brand-light-palettes-core-alert, var(--palette-alert))'
      if (wTok) result[`${brandTextBase}warning`] = `var(--recursica-tokens-color-${wTok.family}-${wTok.level})`
      else result[`${brandTextBase}warning`] = 'var(--recursica-brand-light-palettes-core-warning, var(--palette-warning))'
      if (sTok) result[`${brandTextBase}success`] = `var(--recursica-tokens-color-${sTok.family}-${sTok.level})`
      else result[`${brandTextBase}success`] = 'var(--recursica-brand-light-palettes-core-success, var(--palette-success))'
    }

    const brandInterBase = `--brand-light-layer-layer-${prefix}-property-element-interactive-`
    const icolorVar = coerceToVarRef(spec?.element?.interactive?.color)
    const ihRaw = spec?.element?.interactive?.['high-emphasis']
    const ih = resolveRef(ihRaw)
    const ihoverRaw = spec?.element?.interactive?.['hover-color']
    const ihover = resolveRef(ihoverRaw)
    // Interactive color: core token palette tone → step within its palette → fallback to surface on-tone (AA considers opacity)
    const interactiveHex = readCssVar('--recursica-brand-light-palettes-core-interactive') || readCssVar('--palette-interactive') || ((): string | undefined => {
      const coreInteractive = resolveRef('{brand.light.palettes.core.interactive}') ?? resolveRef('{brand.light.palettes.core-colors.interactive}')
      return typeof coreInteractive === 'string' ? String(coreInteractive) : undefined
    })()
    if (icolorVar) {
      // Explicit override from spec takes precedence
      result[`${brandInterBase}color`] = icolorVar
    } else if ((surfaceHex || surfPalette) && interactiveHex) {
      const bgHex = surfPalette
        ? (readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')) || surfaceHex || '')
        : (readIfCssVarOrHex(surfaceHex) || '')
      const interToken = parseCoreTokenRef('interactive')
      const interHighOpacity = (() => {
        const fromSpec = (() => {
          const v = ih
          const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN)
          return Number.isFinite(n) ? (n <= 1 ? n : n / 100) : undefined
        })()
        if (fromSpec != null) return fromSpec
        if (surfPalette) {
          const hi = readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'high-emphasis'))
          const n = typeof hi === 'string' ? Number(hi) : NaN
          return Number.isFinite(n) ? (n <= 1 ? n : n / 100) : 1
        }
        return 1
      })()
      let finalRef: string | undefined
      let chosenLevel: string | undefined
      if (interToken) {
        // Use core token directly - AA compliance will be handled reactively in Phase 3
        finalRef = 'var(--recursica-brand-light-palettes-core-interactive)'
        chosenLevel = interToken.level
        // Hover: use same token (AA compliance will be handled reactively in Phase 3)
        if (chosenLevel) {
          result[`${brandInterBase}hover-color`] = `var(--recursica-tokens-color-${interToken.family}-${chosenLevel})`
        }
      }
      if (!finalRef) {
        const onToneVar = surfPalette ? buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone') : undefined
        if (onToneVar) {
          const deref = readCssVar(onToneVar)
          // If deref is a hex value, convert it to a token var reference if possible
          if (deref && typeof deref === 'string') {
            const hex = deref.trim()
            if (/^#?[0-9a-f]{6}$/i.test(hex)) {
              const h = hex.startsWith('#') ? hex.toLowerCase() : `#${hex.toLowerCase()}`
              if (h === '#ffffff' || h === '#000000') {
                finalRef = mapBWHexToVar(h)
                } else {
                  // Fall back to on-tone var (token-by-hex lookup removed - should be in JSON)
                  finalRef = `var(${onToneVar})`
                }
            } else {
              // Not a hex value, use as-is or fall back to on-tone var
              finalRef = deref || `var(${onToneVar})`
            }
          } else {
            // No deref value, use on-tone var
            finalRef = `var(${onToneVar})`
          }
        } else {
          // Default to black - AA compliance will be handled reactively in Phase 3
          finalRef = 'var(--recursica-brand-light-palettes-core-black)'
        }
      }
      result[`${brandInterBase}color`] = finalRef
    } else {
      // Fallback: keep reference to core var so it updates when palette changes
      const interToken = parseCoreTokenRef('interactive')
      if (interToken) {
        const pk = findPaletteKeyForFamilyLevel(interToken.family, interToken.level)
        if (pk) {
          const v = `var(${buildPaletteVar(pk, interToken.level, 'tone')})`
          result[`${brandInterBase}color`] = v
        } else {
          const v = 'var(--recursica-brand-light-palettes-core-interactive, var(--palette-interactive))'
          result[`${brandInterBase}color`] = v
        }
      } else {
        const v = 'var(--recursica-brand-light-palettes-core-interactive, var(--palette-interactive))'
        result[`${brandInterBase}color`] = v
      }
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
      const vref = coerceToVarRef(ihoverRaw) || String(ihover ?? '')
      if (vref) result[`${brandInterBase}hover-color`] = vref
    }
  }

  ;['0','1','2','3'].forEach((lvl) => {
    const key = `layer-${lvl}`
    if (layersLight && Object.prototype.hasOwnProperty.call(layersLight, key)) applyForLayer(layersLight[key], lvl)
  })

  const alts: any = layersLight?.['layer-alternative'] || {}
  Object.keys(alts).forEach((altKey) => {
    applyForLayer(alts[altKey], `alternative-${altKey}`)
  })

  // Report layers missing palette surface references
  if (missingPaletteSurfaces.length > 0) {
    try {
      // eslint-disable-next-line no-console
      console.warn('[layers] Surfaces missing palette tone refs:', missingPaletteSurfaces)
      window.dispatchEvent(new CustomEvent('missingLayerPaletteRefs', { detail: { layers: missingPaletteSurfaces.slice() } }))
    } catch {}
  }

  return result
}



