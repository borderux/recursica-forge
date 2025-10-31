import { useEffect, useMemo, useState } from 'react'
import { useUiKit } from '../uikit/UiKitContext'
import { useVars } from '../vars/VarsContext'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

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

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function ensureGoogleFontLoaded(family: string | undefined) {
  if (!family) return
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
}

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

const letterOrder = ['tighest','tighter','tight','default','wide','wider','widest']

export default function TypeSample({ label, tag, text, prefix }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }) {
  const Tag = tag as any
  const [editing, setEditing] = useState<boolean>(false)
  const [form, setForm] = useState<{ family?: string; sizeToken?: string; weightToken?: string; spacingToken?: string; lineHeightToken?: string }>({})
  const [version, setVersion] = useState(0)
  const { kit } = useUiKit()
  const { tokens, theme } = useVars()
  const CHOICES_KEY = 'type-token-choices'
  const [choicesVersion, setChoicesVersion] = useState(0)
  const readChoices = (): Record<string, { family?: string; size?: string; weight?: string; spacing?: string }> => {
    try {
      const raw = localStorage.getItem(CHOICES_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return {}
  }
  const writeChoices = (next: Record<string, { family?: string; size?: string; weight?: string; spacing?: string }>) => {
    try { localStorage.setItem(CHOICES_KEY, JSON.stringify(next)) } catch {}
    setChoicesVersion((v) => v + 1)
    try { window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: next })) } catch {}
  }
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    window.addEventListener('typeChoicesChanged', handler as any)
    return () => { window.removeEventListener('tokenOverridesChanged', handler as any); window.removeEventListener('typeChoicesChanged', handler as any) }
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])

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
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    try {
      const src = (tokens as any)?.tokens?.font?.size || {}
      Object.entries(src).forEach(([short, rec]: [string, any]) => {
        const val = Number(rec?.$value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: `font/size/${short}`, label: toTitleCase(short) })
      })
    } catch {}
    out.sort((a,b) => a.value - b.value)
    return out
  }, [tokens])
  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    try {
      const src = (tokens as any)?.tokens?.font?.weight || {}
      Object.entries(src).forEach(([short, rec]: [string, any]) => {
        const val = Number(rec?.$value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: `font/weight/${short}`, label: toTitleCase(short) })
      })
    } catch {}
    out.sort((a,b) => a.value - b.value)
    return out
  }, [tokens])
  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    try {
      const src = (tokens as any)?.tokens?.font?.['letter-spacing'] || {}
      Object.entries(src).forEach(([short, rec]: [string, any]) => {
        const val = Number(rec?.$value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: `font/letter-spacing/${short}`, label: toTitleCase(short) })
      })
    } catch {}
    const idx = (s: string) => {
      const i = letterOrder.indexOf(s)
      return i === -1 ? Number.POSITIVE_INFINITY : i
    }
    return out.sort((a,b) => idx(a.short) - idx(b.short))
  }, [tokens])

  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; value: string; token: string; label: string }> = []
    const seen = new Set<string>()
    // from Tokens.json
    try {
      const src = (tokens as any)?.tokens?.font?.family || {}
      Object.entries(src).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) {
          seen.add(val)
          out.push({ short, value: val, token: `font/family/${short}`, label: toTitleCase(short) })
        }
      })
    } catch {}
    // include overrides-only additions
    const ov = readOverrides() as Record<string, any>
    Object.keys(ov || {}).forEach((name) => {
      if (typeof name === 'string' && name.startsWith('font/family/')) {
        const short = name.split('/').pop() as string
        const val = String(ov[name] || '')
        if (val && !seen.has(val)) {
          seen.add(val)
          out.push({ short, value: val, token: name, label: toTitleCase(short) })
        }
      }
    })
    out.sort((a,b) => a.label.localeCompare(b.label))
    return out
  }, [tokens, version])

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
  const currentStyle: Style = (() => {
    // Prefer brand.typography if provided, else fall back to theme entries
    const root: any = (theme as any)?.brand ? (theme as any).brand : theme
    const spec: any = root?.typography?.[prefix]?.$value || (prefix.startsWith('body') ? root?.typography?.body?.normal?.$value : undefined)
    const fam = spec?.fontFamily ?? resolveThemeValue(familyRec?.value, overrides, tokens as any, themeIndex)
    const size = spec?.fontSize ?? resolveThemeValue(sizeRec?.value, overrides, tokens as any, themeIndex)
    const spacing = spec?.letterSpacing ?? resolveThemeValue(spacingRec?.value, overrides, tokens as any, themeIndex)
    const weight = (spec?.fontWeight ?? spec?.weight) ?? resolveThemeValue(weightRec?.value, overrides, tokens as any, themeIndex)
    const base: any = {
      fontFamily: typeof fam === 'string' && fam ? fam : readCssVar(`--font-${prefix}-font-family`) || 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: typeof size === 'number' || typeof size === 'string' ? pxOrUndefined(String(size)) : pxOrUndefined(readCssVar(`--font-${prefix}-font-size`)),
      fontWeight: (typeof weight === 'number' || typeof weight === 'string') ? (weight as any) : (readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)) as any,
      letterSpacing: typeof spacing === 'number' ? `${spacing}em` : (typeof spacing === 'string' ? spacing : pxOrUndefined(readCssVar(`--font-${prefix}-font-letter-spacing`))),
      lineHeight: ((): any => {
        const fromSpec = spec?.lineHeight
        if (typeof fromSpec === 'number' || typeof fromSpec === 'string') return fromSpec as any
        const rec = getThemeEntry(prefix, 'line-height', (theme as any)?.brand ? (theme as any).brand : (theme as any))
        const v = resolveThemeValue(rec?.value, overrides, tokens as any, themeIndex)
        return (typeof v === 'number' || typeof v === 'string') ? v : (readCssVar(`--font-${prefix}-line-height`) as any)
      })(),
      margin: '0 0 12px 0',
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
  const familyToken = getTokenNameFor(prefix, 'font-family', theme as any)
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
  const previewStyle: Style = (() => {
    if (!editing) return currentStyle
    const next: any = { ...currentStyle }
    if (form.family) { ensureGoogleFontLoaded(form.family); next.fontFamily = form.family }
    const sizeShort = (form.sizeToken ?? (sizeToken ? sizeToken.split('/').pop() : '')) as string
    if (sizeShort) {
      const v = getTokenValueWithOverrides(`font/size/${sizeShort}`, overrides, tokens as any)
      if (typeof v === 'number' || typeof v === 'string') next.fontSize = pxOrUndefined(String(v))
    }
    const weightShort = (form.weightToken ?? (weightToken ? weightToken.split('/').pop() : '')) as string
    if (weightShort) {
      const v = getTokenValueWithOverrides(`font/weight/${weightShort}`, overrides, tokens as any)
      if (typeof v === 'number' || typeof v === 'string') next.fontWeight = v as any
    }
    const spacingShort = (form.spacingToken ?? (spacingToken ? spacingToken.split('/').pop() : '')) as string
    if (spacingShort) {
      const v = getTokenValueWithOverrides(`font/letter-spacing/${spacingShort}`, overrides, tokens as any)
      if (typeof v === 'number') next.letterSpacing = `${v}em`
      else if (typeof v === 'string') next.letterSpacing = v
    }
    const lineHeightShortDefault = (lineHeightToken ? lineHeightToken.split('/').pop() : '') as string
    const fallbackShort = hasLineHeightDefault ? 'default' : ''
    if (form.lineHeightToken || lineHeightShortDefault || fallbackShort) {
      const tmp = (form.lineHeightToken ?? lineHeightShortDefault) as string | undefined
      const short = (tmp || fallbackShort) as string
      if (short) {
        const v = getTokenValueWithOverrides(`font/line-height/${short}`, overrides, tokens as any)
        if (typeof v === 'number' || typeof v === 'string') next.lineHeight = v as any
      }
    }
    return next
  })()

  const previewFamily = extractBaseFamily(previewStyle.fontFamily as string)
  const fontAvailable = isFontAvailable(previewFamily)
  const kitLabel = kit === 'mantine' ? 'Mantine' : kit === 'material' ? 'Material UI' : 'Carbon'

  return (
    <div style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 16 }}>
      <Tag style={previewStyle}>{text}</Tag>
      {!fontAvailable && previewFamily && (
        <div style={{ marginTop: 6 }}>
          <span style={{ display: 'inline-block', fontSize: 11, border: '1px solid var(--temp-disabled)', borderRadius: 999, padding: '2px 8px', color: 'var(--temp-disabled)' }}>
            Font unavailable in Recursica Forge, displaying fallback from {kitLabel}
          </span>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {!editing ? (
          <>
            {!fontAvailable && previewFamily && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ display: 'inline-block', fontSize: 11, border: '1px solid var(--temp-disabled)', borderRadius: 999, padding: '2px 8px', color: 'var(--temp-disabled)' }}>
                  Font unavailable in Recursica Forge, displaying fallback from {kitLabel}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={() => {
              try {
                const choices = readChoices()
                const c = choices[prefix] || {}
                setForm({
                  family: c.family,
                  sizeToken: c.size,
                  weightToken: c.weight,
                  spacingToken: c.spacing,
                  lineHeightToken: (c as any).lineHeight,
                })
              } catch { setForm({}) }
              setEditing(true)
            }}>
              {(() => {
                const choice = readChoices()[prefix] || {}
                const changedStyle = { background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', border: 'none' }
                const baseStyle = { border: '1px solid var(--temp-disabled)', color: 'inherit' }
                const common = { borderRadius: 16, padding: '4px 10px', cursor: 'pointer' } as React.CSSProperties
                const famChanged = !!choice.family
                const sizeChanged = !!choice.size
                const weightChanged = !!choice.weight
                const spacingChanged = !!choice.spacing
                const lineHeightChanged = !!(choice as any).lineHeight
                return (
                  <>
                    <span style={{ ...(famChanged ? changedStyle : baseStyle), ...common }}>{toTitleCase(extractBaseFamily(previewStyle.fontFamily as string) || '') || '—'}</span>
                    <span style={{ ...(sizeChanged ? changedStyle : baseStyle), ...common }}>{(() => {
                      const c = choice.size
              const short = c ?? (sizeToken ? (sizeToken.split('/').pop() as string) : '')
              return short ? `Size / ${toTitleCase(short)}` : '—'
                    })()}</span>
                    <span style={{ ...(weightChanged ? changedStyle : baseStyle), ...common }}>{(() => {
                const c = choice.weight
              const short = c ?? (weightToken ? (weightToken.split('/').pop() as string) : '')
              return short ? `Weight / ${toTitleCase(short)}` : '—'
                    })()}</span>
                    <span style={{ ...(spacingChanged ? changedStyle : baseStyle), ...common }}>{(() => {
                const c = choice.spacing
              const short = c ?? (spacingToken ? (spacingToken.split('/').pop() as string) : '')
              return short ? `Letter Spacing / ${toTitleCase(short)}` : '—'
                    })()}</span>
                    <span style={{ ...(lineHeightChanged ? changedStyle : baseStyle), ...common }}>{(() => {
                const c = (choice as any).lineHeight
                const shortRaw = c ?? (lineHeightToken ? (lineHeightToken.split('/').pop() as string) : '')
                const short = shortRaw || (hasLineHeightDefault ? 'default' : '')
                return `Line Height / ${toTitleCase(short || 'default')}`
                    })()}</span>
                  </>
                )
              })()}
            </div>
          </>
        ) : (
          <form style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }} onSubmit={(e) => {
            e.preventDefault()
            // Persist per-style selections; do not change global tokens so other styles are not affected
            const cur = readChoices()
            const entry = cur[prefix] || {}
            if (form.family) entry.family = form.family
            if (form.sizeToken) entry.size = form.sizeToken
            if (form.weightToken) entry.weight = form.weightToken
            if (form.spacingToken) entry.spacing = form.spacingToken
            if (form.lineHeightToken) (entry as any).lineHeight = form.lineHeightToken
            cur[prefix] = entry
            writeChoices(cur)
            setEditing(false)
          }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Font</span>
              {(() => {
                const base = extractBaseFamily(currentStyle.fontFamily as string) || ''
                const selected = (() => {
                  const v = form.family ?? base
                  return familyOptions.some((o) => o.value === v) ? v : (familyOptions[0]?.value || '')
                })()
                return (
                  <select required value={selected} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; ensureGoogleFontLoaded(v); setForm((f) => ({ ...f, family: v })) }}>
                    {familyOptions.map((o) => (
                      <option key={o.token} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )
              })()}
            </label>
            {sizeToken && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Size</span>
                <select value={form.sizeToken ?? (sizeToken ? (sizeToken.split('/').pop() as string) : '')} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, sizeToken: val })) }}>
                  {sizeOptions.map((o) => (<option key={o.token} value={o.short}>{o.label}</option>))}
                </select>
              </label>
            )}
            
            {weightToken && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Weight</span>
                <select value={form.weightToken ?? (weightToken ? (weightToken.split('/').pop() as string) : '')} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, weightToken: val })) }}>
                  {weightOptions.map((o) => (<option key={o.token} value={o.short}>{o.label}</option>))}
                </select>
              </label>
            )}
            {spacingToken && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Letter Spacing</span>
                <select value={form.spacingToken ?? (spacingToken ? (spacingToken.split('/').pop() as string) : '')} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, spacingToken: val })) }}>
                  {spacingOptions.map((o) => (<option key={o.token} value={o.short}>{o.label}</option>))}
                </select>
              </label>
            )}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Line Height</span>
              <select value={(() => {
                const fromForm = form.lineHeightToken
                if (fromForm) return fromForm
                const tokenShort = lineHeightToken ? (lineHeightToken.split('/').pop() as string) : ''
                return tokenShort || 'default'
              })()} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, lineHeightToken: val })) }}>
                {(() => {
                  const order = ['shortest','shorter','short','default','tall','taller','tallest']
                  return order.map((short) => (
                    <option key={short} value={short}>{toTitleCase(short)}</option>
                  ))
                })()}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => { setForm({}); setEditing(false) }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


