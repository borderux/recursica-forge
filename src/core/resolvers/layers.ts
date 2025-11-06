import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'

export function buildLayerVars(tokens: JsonLike, theme: JsonLike, overrides?: Record<string, any>): Record<string, string> {
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const layersLight: any = troot?.light?.layer || {}

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
        const full = `brand.${inner.replace(/^theme\./i, '')}`
        const parts = full.split('.').filter(Boolean)
        let node: any = (theme as any)
        for (const p of parts) { if (!node) break; node = node[p] }
        return resolveRef(node, depth + 1)
      }
      if (/^brand\./i.test(inner)) {
        const parts = inner.split('.').filter(Boolean)
        let node: any = (theme as any)
        for (const p of parts) { if (!node) break; node = node[p] }
        return resolveRef(node, depth + 1)
      }
      return undefined
    }
    return s
  }

  const result: Record<string, string> = {}
  const applyForLayer = (id: string, spec: any, prefix: string) => {
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
    if (tcolor != null) result[`${textBase}color`] = String(tcolor)
    if (th != null) result[`${textBase}high-emphasis`] = String(th)
    if (tl != null) result[`${textBase}low-emphasis`] = String(tl)
    if (talert != null) result[`${textBase}alert`] = String(talert)
    if (twarn != null) result[`${textBase}warning`] = String(twarn)
    if (tsuccess != null) result[`${textBase}success`] = String(tsuccess)

    const interBase = `--layer-layer-${prefix}-property-element-interactive-`
    const icolor = resolveRef(spec?.element?.interactive?.color)
    const ih = resolveRef(spec?.element?.interactive?.['high-emphasis'])
    const ihover = resolveRef(spec?.element?.interactive?.['hover-color'])
    if (icolor != null) result[`${interBase}color`] = String(icolor)
    if (ih != null) result[`${interBase}high-emphasis`] = String(ih)
    if (ihover != null) result[`${interBase}hover-color`] = String(ihover)
  }

  ;['0','1','2','3'].forEach((lvl) => {
    const key = `layer-${lvl}`
    if (layersLight && Object.prototype.hasOwnProperty.call(layersLight, key)) applyForLayer(lvl, layersLight[key], lvl)
  })

  const alts: any = layersLight?.['layer-alternative'] || {}
  Object.keys(alts).forEach((altKey) => {
    applyForLayer(altKey, alts[altKey], `alternative-${altKey}`)
  })

  return result
}


