import type { JsonLike } from './tokens'
import { buildTokenIndex, resolveBraceRef } from './tokens'

export type TypographyChoices = Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>

export function buildTypographyVars(tokens: JsonLike, theme: JsonLike, overrides: Record<string, any> | undefined, choices: TypographyChoices | undefined): { vars: Record<string, string>; familiesToLoad: string[] } {
  const PREFIXES = ['h1','h2','h3','h4','h5','h6','subtitle-1','subtitle-2','body-1','body-2','button','caption','overline']
  const tokenIndex = buildTokenIndex(tokens)
  const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
  const ttyp: any = troot?.typography || {}
  const usedFamilies = new Set<string>()
  const vars: Record<string, string> = {}
  const readChoices = choices || {}

  const getFontToken = (path: string): any => {
    // Allow overrides of font tokens using the same flat key naming used elsewhere
    const parts = path.split('/')
    const name = (() => {
      const [kind, key] = [parts[0], parts[1]]
      if (!kind || !key) return undefined
      return `font/${kind}/${key}`
    })()
    if (name && overrides && Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
    return tokenIndex.get(`font/${parts[0]}/${parts[1]}`)
  }

  const toCssValue = (v: any, unitIfNumber?: string) => {
    if (v == null) return undefined
    if (v && typeof v === 'object') {
      const anyV: any = v
      if (Object.prototype.hasOwnProperty.call(anyV, 'value')) {
        const val: any = anyV.value
        const unit: any = anyV.unit
        if (typeof val === 'number') return unit ? `${val}${unit}` : (unitIfNumber ? `${val}${unitIfNumber}` : String(val))
        return unit ? `${val}${unit}` : String(val)
      }
      return String(anyV)
    }
    if (typeof v === 'number') return unitIfNumber ? `${v}${unitIfNumber}` : String(v)
    return String(v)
  }

  const familyTokens: Record<string, string> = (() => {
    const src: any = (tokens as any)?.tokens?.font?.family || {}
    const map: Record<string, string> = {}
    Object.keys(src).forEach((short) => { const val = String(src[short]?.$value || ''); if (val) map[short] = val })
    return map
  })()
  const findOverrideForFamilyLiteral = (literal?: string): string | undefined => {
    if (!literal) return undefined
    const entry = Object.entries(familyTokens).find(([, val]) => val === literal)
    if (!entry) return undefined
    const short = entry[0]
    const ov = overrides ? (overrides as any)[`font/family/${short}`] : undefined
    return typeof ov === 'string' && ov.trim() ? ov : undefined
  }

  const resolveTokenRef = (ref: any) => {
    try {
      if (typeof ref === 'string') {
        const s = ref.trim()
        const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
        const fontPrefixRe = /^(tokens|token)\.font\./i
        if (fontPrefixRe.test(inner)) {
          const rest = inner.replace(fontPrefixRe, '')
          const path = rest.replace(/[\.]/g, '/').replace(/\/+/, '/')
          return getFontToken(path)
        }
      }
    } catch {}
    return resolveBraceRef(ref, tokenIndex)
  }

  PREFIXES.forEach((p) => {
    const mapKey: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
    const brandKey = mapKey[p] || p
    const spec: any = ttyp?.[brandKey]?.$value
    const ch = readChoices[p] || {}

    const familyFromChoice = (() => {
      const v = (ch as any).family
      return (typeof v === 'string' && v.trim()) ? v : undefined
    })()
    const familyResolvedFromTokenRef = (() => {
      const v: any = spec?.fontFamily
      if (v && typeof v === 'object') {
        if (v.collection === 'Tokens' && typeof v.name === 'string') {
          const name = v.name.replace(/^token\./, '')
          const parts = name.split('/').slice(1) // drop leading 'font'
          if (parts[0] === 'typeface' && parts[1]) return getFontToken(`typeface/${parts[1]}`)
          if (parts[0] === 'family' && parts[1]) return getFontToken(`family/${parts[1]}`)
        }
      }
      const strResolved = resolveTokenRef(v)
      if (typeof strResolved !== 'undefined') return strResolved
      return undefined
    })()
    const defaultFamily = (() => getFontToken('typeface/primary') ?? getFontToken('family/primary') ?? undefined)()
    const defaultSize = (() => getFontToken('size/md') ?? 16)()
    const defaultWeight = (() => getFontToken('weight/regular') ?? 400)()
    const defaultSpacing = (() => getFontToken('letter-spacing/default') ?? 0)()
    const defaultLineHeight = (() => getFontToken('line-height/default') ?? 'normal')()

    const family = familyFromChoice ?? familyResolvedFromTokenRef ?? findOverrideForFamilyLiteral(spec?.fontFamily) ?? resolveTokenRef(spec?.fontFamily) ?? spec?.fontFamily ?? defaultFamily
    const sizeChoice = ch.size ? getFontToken(`size/${ch.size}`) : undefined
    const size = (sizeChoice != null ? sizeChoice : (resolveTokenRef(spec?.fontSize) ?? spec?.fontSize ?? defaultSize))
    const weightChoice = ch.weight ? getFontToken(`weight/${ch.weight}`) : undefined
    const weight = (weightChoice != null ? weightChoice : (resolveTokenRef(spec?.fontWeight ?? spec?.weight) ?? (spec?.fontWeight ?? spec?.weight) ?? defaultWeight))
    const spacingChoice = ch.spacing ? getFontToken(`letter-spacing/${ch.spacing}`) : undefined
    const spacing = (spacingChoice != null ? spacingChoice : (resolveTokenRef(spec?.letterSpacing) ?? spec?.letterSpacing ?? defaultSpacing))
    const lineHeightChoice = (ch as any).lineHeight ? getFontToken(`line-height/${(ch as any).lineHeight}`) : undefined
    const lineHeight = (lineHeightChoice != null ? lineHeightChoice : (resolveTokenRef(spec?.lineHeight) ?? spec?.lineHeight ?? defaultLineHeight))
    if (family != null) vars[`--font-${p}-font-family`] = toCssValue(family)!
    if (size != null) vars[`--font-${p}-font-size`] = toCssValue(size, 'px')!
    if (weight != null) vars[`--font-${p}-font-weight`] = toCssValue(weight)!
    if (spacing != null) vars[`--font-${p}-font-letter-spacing`] = toCssValue(spacing, 'em')!
    if (lineHeight != null) vars[`--font-${p}-line-height`] = toCssValue(lineHeight)!
    if (typeof family === 'string' && family.trim()) usedFamilies.add(family)
  })

  return { vars, familiesToLoad: Array.from(usedFamilies) }
}


