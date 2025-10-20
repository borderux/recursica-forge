import { useEffect, useMemo, useState } from 'react'
import { useUiKit } from '../uikit/UiKitContext'
import tokens from '../../vars/Tokens.json'
import theme from '../../vars/Theme.json'
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
const themeIndex: Record<string, ThemeRecord> = (() => {
  const bucket: Record<string, ThemeRecord> = {}
  const rec: any = (theme as any).RecursicaBrand || {}
  Object.values(rec as Record<string, any>).forEach((e: any) => {
    if (e && typeof e.name === 'string') bucket[e.name] = e
  })
  return bucket
})()

function resolveThemeValue(ref: any, overrides: Record<string, any>): string | number | undefined {
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
      return resolveThemeValue(entry.value, overrides)
    }
  }
  return undefined
}

function getTokenValueWithOverrides(name: string | undefined, overrides: Record<string, any>): string | number | undefined {
  if (!name) return undefined
  if (Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name]
  const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
  return entry ? (entry as any).value : undefined
}

function getThemeEntry(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal' | 'line-height') {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  const key = `[themes][Light][font/${map[prefix] || prefix}/${prop}]`
  return (theme as any).RecursicaBrand?.[key] as ThemeRecord | undefined
}

function getTokenNameFor(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'line-height'): string | undefined {
  const rec = prop === 'weight' ? (getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')) : getThemeEntry(prefix, prop)
  const v: any = rec?.value
  if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
  return undefined
}

const letterOrder = ['tighest','tighter','tight','default','wide','wider','widest']

export default function TypeSample({ label, tag, text, prefix }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }) {
  const Tag = tag as any
  const [editing, setEditing] = useState<boolean>(false)
  const [form, setForm] = useState<{ family?: string; sizeToken?: string; weightToken?: string; spacingToken?: string; lineHeightToken?: string }>({})
  const [version, setVersion] = useState(0)
  const { kit } = useUiKit()
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
  }
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])

  // options
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    Object.values(tokens as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('font/size/')) {
        const short = e.name.split('/').pop() as string
        const val = Number(e.value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: e.name, label: toTitleCase(short) })
      }
    })
    out.sort((a,b) => a.value - b.value)
    return out
  }, [])
  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    Object.values(tokens as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('font/weight/')) {
        const short = e.name.split('/').pop() as string
        const val = Number(e.value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: e.name, label: toTitleCase(short) })
      }
    })
    out.sort((a,b) => a.value - b.value)
    return out
  }, [])
  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; value: number; token: string; label: string }> = []
    Object.values(tokens as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('font/letter-spacing/')) {
        const short = e.name.split('/').pop() as string
        const val = Number(e.value)
        if (Number.isFinite(val)) out.push({ short, value: val, token: e.name, label: toTitleCase(short) })
      }
    })
    const idx = (s: string) => {
      const i = letterOrder.indexOf(s)
      return i === -1 ? Number.POSITIVE_INFINITY : i
    }
    return out.sort((a,b) => idx(a.short) - idx(b.short))
  }, [])

  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; value: string; token: string; label: string }> = []
    const seen = new Set<string>()
    // from Tokens.json
    Object.values(tokens as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('font/family/')) {
        const short = e.name.split('/').pop() as string
        const val = String(e.value || '')
        if (val && !seen.has(val)) {
          seen.add(val)
          out.push({ short, value: val, token: e.name, label: toTitleCase(short) })
        }
      }
    })
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
  }, [version])

  // resolve current style
  const familyRec = getThemeEntry(prefix, 'font-family')
  const sizeRec = getThemeEntry(prefix, 'size')
  const spacingRec = getThemeEntry(prefix, 'letter-spacing')
  const weightRec = getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')
  const currentStyle: Style = (() => {
    const fam = resolveThemeValue(familyRec?.value, overrides)
    const size = resolveThemeValue(sizeRec?.value, overrides)
    const spacing = resolveThemeValue(spacingRec?.value, overrides)
    const weight = resolveThemeValue(weightRec?.value, overrides)
    const base: any = {
      fontFamily: typeof fam === 'string' && fam ? fam : readCssVar(`--font-${prefix}-font-family`) || 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: typeof size === 'number' || typeof size === 'string' ? pxOrUndefined(String(size)) : pxOrUndefined(readCssVar(`--font-${prefix}-font-size`)),
      fontWeight: (typeof weight === 'number' || typeof weight === 'string') ? (weight as any) : (readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)) as any,
      letterSpacing: typeof spacing === 'number' ? `${spacing}em` : (typeof spacing === 'string' ? spacing : pxOrUndefined(readCssVar(`--font-${prefix}-font-letter-spacing`))),
      lineHeight: ((): any => {
        const rec = getThemeEntry(prefix, 'line-height')
        const v = resolveThemeValue(rec?.value, overrides)
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
        const v = getTokenValueWithOverrides(tokenName, overrides)
        if (typeof v === 'number' || typeof v === 'string') base.fontSize = pxOrUndefined(String(v))
      }
      const lhChoice: any = (c as any).lineHeight
      if (lhChoice) {
        const tokenName = `font/line-height/${lhChoice}`
        const v = getTokenValueWithOverrides(tokenName, overrides)
        if (typeof v === 'number' || typeof v === 'string') base.lineHeight = v as any
      }
      if (c.weight) {
        const tokenName = `font/weight/${c.weight}`
        const v = getTokenValueWithOverrides(tokenName, overrides)
        if (typeof v === 'number' || typeof v === 'string') base.fontWeight = v as any
      }
      if (c.spacing) {
        const tokenName = `font/letter-spacing/${c.spacing}`
        const v = getTokenValueWithOverrides(tokenName, overrides)
        if (typeof v === 'number') base.letterSpacing = `${v}em`
        else if (typeof v === 'string') base.letterSpacing = v
      }
    }
    return base
  })()

  // token names
  const familyToken = getTokenNameFor(prefix, 'font-family')
  const sizeToken = getTokenNameFor(prefix, 'size')
  const weightToken = getTokenNameFor(prefix, 'weight')
  const spacingToken = getTokenNameFor(prefix, 'letter-spacing')
  const lineHeightToken = getTokenNameFor(prefix, 'line-height')

  // preview style when editing
  const previewStyle: Style = (() => {
    if (!editing) return currentStyle
    const next: any = { ...currentStyle }
    if (form.family) { ensureGoogleFontLoaded(form.family); next.fontFamily = form.family }
    const sizeShort = (form.sizeToken ?? (sizeToken ? sizeToken.split('/').pop() : '')) as string
    if (sizeShort) {
      const v = getTokenValueWithOverrides(`font/size/${sizeShort}`, overrides)
      if (typeof v === 'number' || typeof v === 'string') next.fontSize = pxOrUndefined(String(v))
    }
    const weightShort = (form.weightToken ?? (weightToken ? weightToken.split('/').pop() : '')) as string
    if (weightShort) {
      const v = getTokenValueWithOverrides(`font/weight/${weightShort}`, overrides)
      if (typeof v === 'number' || typeof v === 'string') next.fontWeight = v as any
    }
    const spacingShort = (form.spacingToken ?? (spacingToken ? spacingToken.split('/').pop() : '')) as string
    if (spacingShort) {
      const v = getTokenValueWithOverrides(`font/letter-spacing/${spacingShort}`, overrides)
      if (typeof v === 'number') next.letterSpacing = `${v}em`
      else if (typeof v === 'string') next.letterSpacing = v
    }
    const lineHeightShortDefault = (lineHeightToken ? lineHeightToken.split('/').pop() : '') as string
    if (form.lineHeightToken || lineHeightShortDefault) {
      const short = (form.lineHeightToken ?? lineHeightShortDefault) as string
      if (short) {
        const v = getTokenValueWithOverrides(`font/line-height/${short}`, overrides)
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={() => setEditing(true)}>
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
                const short = c ?? (lineHeightToken ? (lineHeightToken.split('/').pop() as string) : '')
                return short ? `Line Height / ${toTitleCase(short)}` : '—'
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
            {lineHeightToken && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Line Height</span>
                <select value={form.lineHeightToken ?? (lineHeightToken ? (lineHeightToken.split('/').pop() as string) : '')} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, lineHeightToken: val })) }}>
                  {Object.values(tokens as Record<string, any>).filter((e: any) => e && typeof e.name === 'string' && e.name.startsWith('font/line-height/')).map((e: any) => {
                    const short = (e.name as string).split('/').pop() as string
                    const label = toTitleCase(short)
                    return (<option key={e.name} value={short}>{label}</option>)
                  })}
                </select>
              </label>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


