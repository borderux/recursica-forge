/**
 * TypeSample
 *
 * Renders a single typography preview (e.g. H1, Body) and delegates
 * chips and editing UX to TypeControls. Resolves the effective style from
 * brand.typography entries (or legacy Theme records), token overrides, and
 * user per-style choices.
 */
import { useEffect, useMemo, useState } from 'react'
import { useUiKit } from '../uikit/UiKitContext'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import TypeControls, { readChoices, writeChoices } from './TypeControls'

type Style = React.CSSProperties

function readCssVar(name: string, fallback?: string): string | undefined {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function pxOrUndefined(value?: string) {
  if (!value) return undefined
  if (/px$|em$|rem$|%$/.test(value)) return value
  if (!Number.isNaN(Number(value))) return `${value}px`
  return value
}

// helpers moved to TypeControls

function extractBaseFamily(value?: string): string | undefined {
  if (!value) return undefined
  const base = String(value).split(',')[0] || ''
  return base.replace(/["']/g, '').trim()
}

function isFontAvailable(family?: string): boolean {
  try {
    if (!family) return true
    const api: any = (document as any).fonts
    if (!api || typeof api.check !== 'function') return true
    return api.check(`12px "${family}"`)
  } catch {
    return true
  }
}

type ThemeRecord = { name: string; mode?: string; value?: any }

function resolveThemeValue(ref: any, overrides: Record<string, any>, tokens: Record<string, any>, themeIndex: Record<string, ThemeRecord>): string | number | undefined {
  if (ref == null) return undefined
  if (typeof ref === 'string' || typeof ref === 'number') return ref
  if (typeof ref === 'object') {
    const coll = (ref as any).collection
    const name = (ref as any).name
    if (coll === 'Tokens') {
      if (name in overrides) return overrides[name]
      const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
      return entry ? (entry as any).value : undefined
    }
    if (coll === 'Theme') {
      const entry = themeIndex[name]
      if (!entry) return undefined
      return resolveThemeValue(entry.value, overrides, tokens, themeIndex)
    }
  }
  return undefined
}

function getTokenValueWithOverrides(name: string | undefined, overrides: Record<string, any>, tokens: Record<string, any>): string | number | undefined {
  if (!name) return undefined
  if (Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
  // Fallback 1: flat map structure
  const flatEntry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
  if (flatEntry) return (flatEntry as any).value
  // Fallback 2: nested tokens structure tokens.tokens.*
  try {
    const path = name.replace(/^token\./, '').split('/')
    const root: any = (tokens as any)?.tokens || tokens
    let cur: any = root
    for (const seg of path) {
      if (cur == null) return undefined
      if (typeof cur[seg] !== 'undefined') {
        cur = cur[seg]
      } else {
        // handle kebab keys like 'letter-spacing'
        cur = cur?.[seg]
      }
    }
    const val = (cur && typeof cur === 'object' && '$value' in cur) ? (cur as any)['$value'] : cur
    if (typeof val === 'number' || typeof val === 'string') return val
    if (val && typeof val === 'object' && typeof (val as any).value !== 'undefined') return (val as any).value
  } catch {}
  return undefined
}

function getThemeEntry(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal' | 'line-height', theme: Record<string, any>) {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  const key = `[themes][Light][font/${map[prefix] || prefix}/${prop}]`
  const recRoot = ((theme as any)?.brand?.RecursicaBrand) || ((theme as any)?.RecursicaBrand)
  return (recRoot ? (recRoot as any)[key] : undefined) as ThemeRecord | undefined
}

function getTokenNameFor(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'line-height', theme: Record<string, any>): string | undefined {
  const rec = prop === 'weight' ? (getThemeEntry(prefix, 'weight', theme) || getThemeEntry(prefix, 'weight-normal', theme)) : getThemeEntry(prefix, prop, theme)
  const v: any = rec?.value
  if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
  return undefined
}

function getBrandTypographySpec(theme: any, prefix: string): any | undefined {
  const root: any = theme?.brand ? theme.brand : theme
  const typ = root?.typography
  if (!typ) return undefined
  const base = typ?.[prefix]?.$value
  if (base) return base
  if (prefix.startsWith('body')) return typ?.body?.normal?.$value
  return undefined
}

function getTokenNameFromBrand(theme: any, prefix: string, field: 'fontSize' | 'fontWeight' | 'letterSpacing'): string | undefined {
  try {
    const spec: any = getBrandTypographySpec(theme, prefix)
    if (!spec) return undefined
    const v: any = field === 'fontWeight' ? (spec.fontWeight ?? spec.weight) : (spec as any)[field]
    if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
  } catch {}
  return undefined
}

function findFontTokenNameByNumericValue(tokens: any, kind: 'size' | 'letter-spacing' | 'weight', value: number): string | undefined {
  try {
    const font = (tokens as any)?.tokens?.font || (tokens as any)?.font || {}
    const bucket = kind === 'size' ? font?.size : (kind === 'letter-spacing' ? font?.['letter-spacing'] : font?.weight)
    if (!bucket || typeof bucket !== 'object') return undefined
    const entries = Object.entries(bucket) as Array<[string, any]>
    // allow small epsilon for floats
    const epsilon = 1e-6
    for (const [short, rec] of entries) {
      const raw = Number((rec as any)?.$value)
      if (Number.isFinite(raw) && Math.abs(raw - value) < epsilon) {
        return `font/${kind}/${short}`
      }
    }
  } catch {}
  return undefined
}

// letter order moved into TypeControls

export default function TypeSample({ tag, text, prefix }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }) {
  const Tag = tag as any
  const [livePreview, setLivePreview] = useState<Partial<Style> | null>(null)
  // Rely on VarsContext subscription to re-render when overrides or choices change
  const { kit } = useUiKit()
  const { tokens, theme } = useVars()
  // removed choicesVersion state (not needed)
  const overrides = useMemo(() => readOverrides(), [])

  const hasLineHeightDefault = useMemo(() => {
    return !!Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === 'font/line-height/default')
  }, [tokens])
  // lineHeight options are ordered when rendering the select

  // Seed per-style choices from JSON on first mount if missing
  useEffect(() => {
    try {
      const cur = readChoices()
      const existing = cur[prefix] || {}
      const spec: any = getBrandTypographySpec(theme as any, prefix) || {}
      let changed = false
      const nextEntry: any = { ...existing }

      // family literal
      if (!nextEntry.family && typeof spec.fontFamily === 'string' && spec.fontFamily.trim()) {
        nextEntry.family = spec.fontFamily
        changed = true
      }
      // size token short
      if (!nextEntry.size) {
        const tokenName = getTokenNameFromBrand(theme as any, prefix, 'fontSize')
          || (typeof spec.fontSize === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'size', Number(spec.fontSize)) : undefined)
          || getTokenNameFor(prefix, 'size', theme as any)
          || 'font/size/md'
        if (tokenName) { nextEntry.size = tokenName.split('/').pop(); changed = true }
      }
      // weight token short
      if (!nextEntry.weight) {
        const tokenName = getTokenNameFromBrand(theme as any, prefix, 'fontWeight')
          || (typeof spec.fontWeight === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'weight', Number(spec.fontWeight)) : undefined)
          || getTokenNameFor(prefix, 'weight', theme as any)
          || 'font/weight/regular'
        if (tokenName) { nextEntry.weight = tokenName.split('/').pop(); changed = true }
      }
      // spacing token short
      if (!nextEntry.spacing) {
        const tokenName = getTokenNameFromBrand(theme as any, prefix, 'letterSpacing')
          || (typeof spec.letterSpacing === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'letter-spacing', Number(spec.letterSpacing)) : undefined)
          || getTokenNameFor(prefix, 'letter-spacing', theme as any)
          || 'font/letter-spacing/default'
        if (tokenName) { nextEntry.spacing = tokenName.split('/').pop(); changed = true }
      }
      // line-height short (optional)
      if (!nextEntry.lineHeight) {
        const tokenName = getTokenNameFor(prefix, 'line-height', theme as any)
        if (tokenName) { nextEntry.lineHeight = tokenName.split('/').pop(); changed = true }
        else if (hasLineHeightDefault) { nextEntry.lineHeight = 'default'; changed = true }
      }

      if (changed) {
        const merged = { ...cur, [prefix]: nextEntry }
        writeChoices(merged)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, tokens])

  // options
  // Options moved into TypeControls

  const themeIndex = useMemo(() => {
    const bucket: Record<string, ThemeRecord> = {}
    const rec: any = ((theme as any)?.brand?.RecursicaBrand) || ((theme as any)?.RecursicaBrand) || {}
    Object.values(rec as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string') bucket[e.name] = e
    })
    return bucket
  }, [theme])
  // resolve current style
  const familyRec = getThemeEntry(prefix, 'font-family', theme as any)
  const sizeRec = getThemeEntry(prefix, 'size', theme as any)
  const spacingRec = getThemeEntry(prefix, 'letter-spacing', theme as any)
  const weightRec = getThemeEntry(prefix, 'weight', theme as any) || getThemeEntry(prefix, 'weight-normal', theme as any)
  const resolveBraceRefToTokenValue = (ref: any): string | number | undefined => {
    try {
      if (typeof ref !== 'string') return undefined
      const s = ref.trim()
      // Accept both braced and unbraced forms, case-insensitive 'tokens.'
      const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
      if (!/^(tokens|token)\./i.test(inner)) return undefined
      const fontPrefixRe = /^(tokens|token)\.font\./i
      if (!fontPrefixRe.test(inner)) return undefined
      const rest = inner.replace(fontPrefixRe, '') // size.md or weight.regular etc (dots or slashes)
      const name = `font/${rest.replace(/[\.]/g, '/').replace(/\/+/, '/')}`
      return getTokenValueWithOverrides(name, overrides, tokens as any)
    } catch {
      return undefined
    }
  }
  const currentStyle: Style = (() => {
    // Prefer brand.typography if provided, else fall back to theme entries
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    const spec: any = root?.typography?.[prefix]?.$value || (prefix.startsWith('body') ? root?.typography?.body?.normal?.$value : undefined)
    const fam = (() => {
      const v: any = spec?.fontFamily
      if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') {
        const resolved = getTokenValueWithOverrides(v.name.replace(/^token\./, ''), overrides, tokens as any)
        if (resolved != null) return resolved
      }
      const fromString = resolveBraceRefToTokenValue(v)
      if (fromString != null) return fromString
      const fallback = spec?.fontFamily ?? resolveThemeValue(familyRec?.value, overrides, tokens as any, themeIndex)
      // As a last resort, try to resolve string-like token refs that slipped through
      if (typeof fallback === 'string') {
        const again = resolveBraceRefToTokenValue(fallback)
        if (again != null) return again
      }
      return fallback
    })()
    const size = ((): any => {
      const fromString = resolveBraceRefToTokenValue(spec?.fontSize)
      if (fromString != null) return fromString
      return spec?.fontSize ?? resolveThemeValue(sizeRec?.value, overrides, tokens as any, themeIndex)
    })()
    const spacing = ((): any => {
      const fromString = resolveBraceRefToTokenValue(spec?.letterSpacing)
      if (fromString != null) return fromString
      return spec?.letterSpacing ?? resolveThemeValue(spacingRec?.value, overrides, tokens as any, themeIndex)
    })()
    const weight = ((): any => {
      const fromString = resolveBraceRefToTokenValue(spec?.fontWeight ?? spec?.weight)
      if (fromString != null) return fromString
      return (spec?.fontWeight ?? spec?.weight) ?? resolveThemeValue(weightRec?.value, overrides, tokens as any, themeIndex)
    })()
    const base: any = {
      fontFamily: typeof fam === 'string' && fam ? fam : readCssVar(`--font-${prefix}-font-family`) || 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: typeof size === 'number' || typeof size === 'string' ? pxOrUndefined(String(size)) : pxOrUndefined(readCssVar(`--font-${prefix}-font-size`)),
      fontWeight: (typeof weight === 'number' || typeof weight === 'string') ? (weight as any) : (readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)) as any,
      letterSpacing: typeof spacing === 'number' ? `${spacing}em` : (typeof spacing === 'string' ? spacing : pxOrUndefined(readCssVar(`--font-${prefix}-font-letter-spacing`))),
      lineHeight: ((): any => {
        const fromSpec = spec?.lineHeight
        if (typeof fromSpec === 'number') return fromSpec as any
        if (typeof fromSpec === 'string') {
          const fromString = resolveBraceRefToTokenValue(fromSpec)
          if (fromString != null) return fromString as any
          return fromSpec as any
        }
        const rec = getThemeEntry(prefix, 'line-height', (theme as any)?.brand ? (theme as any).brand : (theme as any))
        const v = resolveThemeValue(rec?.value, overrides, tokens as any, themeIndex)
        return (typeof v === 'number' || typeof v === 'string') ? v : (readCssVar(`--font-${prefix}-line-height`) as any)
      })(),
      margin: '0',
    }
    // Apply per-style saved choices so only this style is affected
    const choices = readChoices()
    const c = choices[prefix]
    if (c) {
      if (c.family) base.fontFamily = c.family
      if (c.size) {
        const tokenName = `font/size/${c.size}`
        const v = getTokenValueWithOverrides(tokenName, overrides, tokens as any)
        if (typeof v === 'number' || typeof v === 'string') base.fontSize = pxOrUndefined(String(v))
      }
      const lhChoice: any = (c as any).lineHeight
      if (lhChoice) {
        const tokenName = `font/line-height/${lhChoice}`
        const v = getTokenValueWithOverrides(tokenName, overrides, tokens as any)
        if (typeof v === 'number' || typeof v === 'string') base.lineHeight = v as any
      }
      if (c.weight) {
        const tokenName = `font/weight/${c.weight}`
        const v = getTokenValueWithOverrides(tokenName, overrides, tokens as any)
        if (typeof v === 'number' || typeof v === 'string') base.fontWeight = v as any
      }
      if (c.spacing) {
        const tokenName = `font/letter-spacing/${c.spacing}`
        const v = getTokenValueWithOverrides(tokenName, overrides, tokens as any)
        if (typeof v === 'number') base.letterSpacing = `${v}em`
        else if (typeof v === 'string') base.letterSpacing = v
      }
    }
    return base
  })()

  // token names
  // const familyToken = getTokenNameFor(prefix, 'font-family', theme as any)
  const brandSpec: any = getBrandTypographySpec(theme as any, prefix)
  let sizeToken = getTokenNameFromBrand(theme as any, prefix, 'fontSize')
    || (typeof brandSpec?.fontSize === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'size', Number(brandSpec.fontSize)) : undefined)
    || getTokenNameFor(prefix, 'size', theme as any)
  let weightToken = getTokenNameFromBrand(theme as any, prefix, 'fontWeight')
    || (typeof brandSpec?.fontWeight === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'weight', Number(brandSpec.fontWeight)) : undefined)
    || getTokenNameFor(prefix, 'weight', theme as any)
  let spacingToken = getTokenNameFromBrand(theme as any, prefix, 'letterSpacing')
    || (typeof brandSpec?.letterSpacing === 'number' ? findFontTokenNameByNumericValue(tokens as any, 'letter-spacing', Number(brandSpec.letterSpacing)) : undefined)
    || getTokenNameFor(prefix, 'letter-spacing', theme as any)
  let lineHeightToken = getTokenNameFor(prefix, 'line-height', theme as any)

  // Default fallbacks when JSON lacks a mapping
  if (!sizeToken) sizeToken = 'font/size/md'
  if (!weightToken) weightToken = 'font/weight/regular'
  if (!spacingToken) spacingToken = 'font/letter-spacing/default'
  if (!lineHeightToken && hasLineHeightDefault) lineHeightToken = 'font/line-height/default'

  // preview style when editing
  const previewStyle: Style = useMemo(() => {
    return livePreview ? { ...currentStyle, ...livePreview } : currentStyle
  }, [currentStyle, livePreview])

  const previewFamily = extractBaseFamily(previewStyle.fontFamily as string)
  const fontAvailable = isFontAvailable(previewFamily)
  const kitLabel = kit === 'mantine' ? 'Mantine' : kit === 'material' ? 'Material UI' : 'Carbon'

  return (
    <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 16 }}>
      <Tag style={previewStyle}>{text}</Tag>
      {!fontAvailable && previewFamily && (
        <div style={{ marginTop: 6 }}>
          <span style={{ display: 'inline-block', fontSize: 11, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 8px', color: 'var(--layer-layer-1-property-element-text-color)', opacity: 'var(--layer-layer-1-property-element-text-low-emphasis)' }}>
            Font unavailable in Recursica Forge, displaying fallback from {kitLabel}
          </span>
        </div>
      )}
      <TypeControls
        prefix={prefix}
        currentStyle={previewStyle}
        sizeToken={sizeToken}
        weightToken={weightToken}
        spacingToken={spacingToken}
        lineHeightToken={lineHeightToken}
        hasLineHeightDefault={hasLineHeightDefault}
        overrides={overrides as any}
        tokens={tokens as any}
        onPreview={setLivePreview}
      />
    </div>
  )
}


