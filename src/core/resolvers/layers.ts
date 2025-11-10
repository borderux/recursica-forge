import type { JsonLike } from './tokens'
import { contrastRatio, pickAAOnTone } from '../../modules/theme/contrastUtil'
import { buildTokenIndex } from './tokens'

export function buildLayerVars(tokens: JsonLike, theme: JsonLike, overrides?: Record<string, any>): Record<string, string> {
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const layersLight: any = troot?.light?.layer || {}

  const AA = 4.5
  const mapBWHexToVar = (hex: string): string => {
    const h = (hex || '').toLowerCase()
    return h === '#ffffff' ? 'var(--palette-white)' : 'var(--palette-black)'
  }
  const buildPaletteVar = (paletteKey: string, level: string, type: 'tone' | 'on-tone' | 'high-emphasis' | 'low-emphasis'): string => {
    const levelPart = level === 'primary' ? 'primary' : level
    return `--palette-${paletteKey}-${levelPart}-${type}`
  }
  const parsePaletteToneRef = (input: any): { paletteKey: string; level: string } | null => {
    try {
      const s = typeof input === 'string' ? input.trim() : ''
      if (!s) return null
      if (s.startsWith('{') && s.endsWith('}')) {
        const inner = s.slice(1, -1).trim()
        const m = /^brand\.light\.palettes\.([a-z0-9\-]+)\.([0-9]{3}|050|primary)\.color\.tone$/i.exec(inner)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
      if (/^var\(\s*--palette-[a-z0-9\-]+-(?:[0-9]{3}|050|primary)-tone\s*\)$/i.test(s)) {
        const m = /^var\(\s*--palette-([a-z0-9\-]+)-([0-9]{3}|050|primary)-tone\s*\)$/i.exec(s)
        if (m) return { paletteKey: m[1], level: m[2] }
      }
    } catch {}
    return null
  }
  const readCssVar = (name: string): string | undefined => {
    try {
      const v = (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim()
      return v || undefined
    } catch {
      return undefined
    }
  }
  const ensureAARefOrWhiteRef = (surfaceHex?: string, colorHex?: string): string | undefined => {
    if (!surfaceHex || !colorHex) return colorHex
    return contrastRatio(surfaceHex, colorHex) >= AA ? undefined /* signal: keep original reference */ : 'var(--palette-white)'
  }
  const ensureAARefOrBWRef = (surfaceHex?: string, colorHex?: string): string | undefined => {
    if (!surfaceHex || !colorHex) return colorHex
    if (contrastRatio(surfaceHex, colorHex) >= AA) return undefined /* signal: keep original reference */
    const fallback = pickAAOnTone(surfaceHex) // '#000000' or '#ffffff'
    return mapBWHexToVar(fallback)
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
  const applyForLayer = (spec: any, prefix: string) => {
    const base = `--layer-layer-${prefix}-property-`
    const surfRaw = spec?.property?.surface
    const surfPalette = parsePaletteToneRef(surfRaw)
    const surf = resolveRef(surfRaw)
    const pad = resolveRef(spec?.property?.padding)
    const bcol = resolveRef(spec?.property?.['border-color'])
    const bth = resolveRef(spec?.property?.['border-thickness'])
    const brad = resolveRef(spec?.property?.['border-radius'])
    if (surfPalette) {
      const toneVar = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')
      result[`${base}surface`] = `var(${toneVar})`
    } else if (surf != null) {
      result[`${base}surface`] = String(surf)
      // Track layers whose surface does not reference a palette tone
      missingPaletteSurfaces.push(String(prefix))
    }
    if (pad != null) result[`${base}padding`] = toCssValue(pad, 'px')!
    if (bcol != null) result[`${base}border-color`] = String(bcol)
    if (bth != null) result[`${base}border-thickness`] = toCssValue(bth, 'px')!
    if (brad != null) result[`${base}border-radius`] = toCssValue(brad, 'px')!

    const textBase = `--layer-layer-${prefix}-property-element-text-`
    const tcolor = resolveRef(spec?.element?.text?.color)
    const th = resolveRef(spec?.element?.text?.['high-emphasis'])
    const tl = resolveRef(spec?.element?.text?.['low-emphasis'])
    const talert = resolveRef(spec?.element?.text?.alert)
    const twarn = resolveRef(spec?.element?.text?.warning)
    const tsuccess = resolveRef(spec?.element?.text?.success)
    // Base text color: choose surface palette on-tone where possible
    const surfaceHex = typeof surf === 'string' ? String(surf) : undefined
    if (surfPalette) {
      const onToneVar = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone')
      result[`${textBase}color`] = `var(${onToneVar})`
    } else if (tcolor != null) {
      result[`${textBase}color`] = String(tcolor)
    } else if (surfaceHex) {
      result[`${textBase}color`] = mapBWHexToVar(pickAAOnTone(surfaceHex))
    }
    // Emphasis opacities: derive from palette step when surface is a palette tone; otherwise keep provided
    if (surfPalette) {
      const hiVar = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'high-emphasis')
      const loVar = buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'low-emphasis')
      result[`${textBase}high-emphasis`] = `var(${hiVar})`
      result[`${textBase}low-emphasis`] = `var(${loVar})`
    } else {
      if (th != null) result[`${textBase}high-emphasis`] = String(th)
      if (tl != null) result[`${textBase}low-emphasis`] = String(tl)
    }
    // Status colors: prefer core color reference; if fails AA vs surface, switch to surface on-tone (or BW if no palette surface)
    const coreAlert = resolveRef('{brand.light.palettes.core-colors.alert}')
    const coreWarn = resolveRef('{brand.light.palettes.core-colors.warning}')
    const coreSuccess = resolveRef('{brand.light.palettes.core-colors.success}')
    const alertHex = typeof (talert ?? coreAlert) === 'string' ? String(talert ?? coreAlert) : undefined
    const warnHex = typeof (twarn ?? coreWarn) === 'string' ? String(twarn ?? coreWarn) : undefined
    const successHex = typeof (tsuccess ?? coreSuccess) === 'string' ? String(tsuccess ?? coreSuccess) : undefined
    if (surfaceHex || surfPalette) {
      const bgHex =
        surfPalette
          ? (readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')) || surfaceHex || '')
          : (surfaceHex || '')
      const onToneVar = surfPalette ? buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone') : undefined
      const alertRef = bgHex && alertHex && contrastRatio(bgHex, alertHex) >= AA
        ? 'var(--palette-alert)'
        : (onToneVar ? `var(${onToneVar})` : mapBWHexToVar(pickAAOnTone(bgHex)))
      const warnRef = bgHex && warnHex && contrastRatio(bgHex, warnHex) >= AA
        ? 'var(--palette-warning)'
        : (onToneVar ? `var(${onToneVar})` : mapBWHexToVar(pickAAOnTone(bgHex)))
      const successRef = bgHex && successHex && contrastRatio(bgHex, successHex) >= AA
        ? 'var(--palette-success)'
        : (onToneVar ? `var(${onToneVar})` : mapBWHexToVar(pickAAOnTone(bgHex)))
      result[`${textBase}alert`] = alertRef
      result[`${textBase}warning`] = warnRef
      result[`${textBase}success`] = successRef
    } else {
      if (alertHex) result[`${textBase}alert`] = String(talert ?? coreAlert)
      if (warnHex) result[`${textBase}warning`] = String(twarn ?? coreWarn)
      if (successHex) result[`${textBase}success`] = String(tsuccess ?? coreSuccess)
    }

    const interBase = `--layer-layer-${prefix}-property-element-interactive-`
    const icolor = resolveRef(spec?.element?.interactive?.color)
    const ih = resolveRef(spec?.element?.interactive?.['high-emphasis'])
    const ihover = resolveRef(spec?.element?.interactive?.['hover-color'])
    // Interactive color: always reference core interactive var if AA passes; otherwise reference black/white var based on AA outcome
    // Prefer current palette var value for interactive hex so AA re-checks when palette changes
    const interactiveHex = readCssVar('--palette-interactive') || ((): string | undefined => {
      const coreInteractive = resolveRef('{brand.light.palettes.core-colors.interactive}')
      return typeof coreInteractive === 'string' ? String(coreInteractive) : undefined
    })()
    if ((surfaceHex || surfPalette) && interactiveHex) {
      const bgHex =
        surfPalette
          ? (readCssVar(buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'tone')) || surfaceHex || '')
          : (surfaceHex || '')
      const onToneVar = surfPalette ? buildPaletteVar(surfPalette.paletteKey, surfPalette.level, 'on-tone') : undefined
      const interRef = bgHex && contrastRatio(bgHex, interactiveHex) >= AA
        ? 'var(--palette-interactive)'
        : (onToneVar ? `var(${onToneVar})` : mapBWHexToVar(pickAAOnTone(bgHex)))
      result[`${interBase}color`] = interRef
    } else {
      // Fallback: keep reference to core var so it updates when palette changes
      result[`${interBase}color`] = 'var(--palette-interactive)'
    }
    // Default interactive high-emphasis to text high-emphasis if not provided
    if (ih != null) {
      result[`${interBase}high-emphasis`] = String(ih)
    } else {
      result[`${interBase}high-emphasis`] = `var(${textBase}high-emphasis)`
    }
    if (ihover != null) result[`${interBase}hover-color`] = String(ihover)
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


