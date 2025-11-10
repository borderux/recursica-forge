import type { JsonLike } from './tokens'
import { buildTokenIndex } from './tokens'

export function buildLayerVars(tokens: JsonLike, theme: JsonLike, overrides?: Record<string, any>): Record<string, string> {
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const layersLight: any = troot?.light?.layer || {}

  // --- Contrast helpers (duplicated locally to avoid cross-module imports) ---
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    try {
      let h = (hex || '').trim()
      if (!h) return null
      if (!h.startsWith('#')) h = `#${h}`
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
      if (!m) return null
      return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    } catch { return null }
  }
  const relativeLuminance = (hex?: string): number => {
    const rgb = hex ? hexToRgb(hex) : null
    if (!rgb) return 0
    const srgb = [rgb.r, rgb.g, rgb.b].map((c) => c / 255)
    const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as number[]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }
  const contrastRatio = (hex1?: string, hex2?: string): number => {
    if (!hex1 || !hex2) return 0
    const L1 = relativeLuminance(hex1)
    const L2 = relativeLuminance(hex2)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }
  const ensureAAOrWhite = (surfaceHex?: string, colorHex?: string): string | undefined => {
    if (!surfaceHex || !colorHex) return colorHex
    const AA = 4.5
    return contrastRatio(surfaceHex, colorHex) >= AA ? colorHex : '#ffffff'
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
  const applyForLayer = (spec: any, prefix: string) => {
    const base = `--layer-layer-${prefix}-property-`
    const surf = resolveRef(spec?.property?.surface)
    const pad = resolveRef(spec?.property?.padding)
    const bcol = resolveRef(spec?.property?.['border-color'])
    const bth = resolveRef(spec?.property?.['border-thickness'])
    const brad = resolveRef(spec?.property?.['border-radius'])
    if (surf != null) result[`${base}surface`] = String(surf)
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
    // Base text color: ensure AA by flipping to white if black (or chosen) fails
    const surfaceHex = typeof surf === 'string' ? String(surf) : undefined
    const baseTextHex = typeof tcolor === 'string' ? String(tcolor) : undefined
    if (surfaceHex) {
      const safeText = ensureAAOrWhite(surfaceHex, baseTextHex || '#000000')
      if (safeText) result[`${textBase}color`] = safeText
    } else if (tcolor != null) {
      result[`${textBase}color`] = String(tcolor)
    }
    if (th != null) result[`${textBase}high-emphasis`] = String(th)
    if (tl != null) result[`${textBase}low-emphasis`] = String(tl)
    // Status colors: prefer spec, else core colors; if contrast fails vs surface, switch to white
    const coreAlert = resolveRef('{brand.light.palettes.core-colors.alert}')
    const coreWarn = resolveRef('{brand.light.palettes.core-colors.warning}')
    const coreSuccess = resolveRef('{brand.light.palettes.core-colors.success}')
    const alertHex = typeof (talert ?? coreAlert) === 'string' ? String(talert ?? coreAlert) : undefined
    const warnHex = typeof (twarn ?? coreWarn) === 'string' ? String(twarn ?? coreWarn) : undefined
    const successHex = typeof (tsuccess ?? coreSuccess) === 'string' ? String(tsuccess ?? coreSuccess) : undefined
    const safeAlert = surfaceHex ? ensureAAOrWhite(surfaceHex, alertHex) : alertHex
    const safeWarn = surfaceHex ? ensureAAOrWhite(surfaceHex, warnHex) : warnHex
    const safeSuccess = surfaceHex ? ensureAAOrWhite(surfaceHex, successHex) : successHex
    if (safeAlert) result[`${textBase}alert`] = safeAlert
    if (safeWarn) result[`${textBase}warning`] = safeWarn
    if (safeSuccess) result[`${textBase}success`] = safeSuccess

    const interBase = `--layer-layer-${prefix}-property-element-interactive-`
    const icolor = resolveRef(spec?.element?.interactive?.color)
    const ih = resolveRef(spec?.element?.interactive?.['high-emphasis'])
    const ihover = resolveRef(spec?.element?.interactive?.['hover-color'])
    // Interactive color: use core interactive if not specified; ensure AA vs surface or switch to white
    const coreInteractive = resolveRef('{brand.light.palettes.core-colors.interactive}')
    const interactiveHex = typeof (icolor ?? coreInteractive) === 'string' ? String(icolor ?? coreInteractive) : undefined
    const safeInteractive = surfaceHex ? ensureAAOrWhite(surfaceHex, interactiveHex) : interactiveHex
    if (safeInteractive) result[`${interBase}color`] = safeInteractive
    if (ih != null) result[`${interBase}high-emphasis`] = String(ih)
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

  return result
}


