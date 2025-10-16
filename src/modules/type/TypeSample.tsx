import { useEffect, useMemo, useState } from 'react'
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

function getThemeEntry(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal') {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  const key = `[themes][Light][font/${map[prefix] || prefix}/${prop}]`
  return (theme as any).RecursicaBrand?.[key] as ThemeRecord | undefined
}

function getTokenNameFor(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight'): string | undefined {
  const rec = prop === 'weight' ? (getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')) : getThemeEntry(prefix, prop)
  const v: any = rec?.value
  if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
  return undefined
}

const letterOrder = ['tighest','tighter','tight','default','wide','wider','widest']

export default function TypeSample({ label, tag, text, prefix }: { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }) {
  const Tag = tag as any
  const [editing, setEditing] = useState<boolean>(false)
  const [form, setForm] = useState<{ family?: string; sizeToken?: string; weightToken?: string; spacingToken?: string }>({})
  const [version, setVersion] = useState(0)
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
      margin: '0 0 12px 0',
    }
    // Apply per-style saved choices so only this style is affected
    const choices = readChoices()
    const c = choices[prefix]
    if (c) {
      if (c.family) base.fontFamily = c.family
      if (c.size) {
        const so = sizeOptions.find((o) => o.short === c.size)
        if (so) base.fontSize = pxOrUndefined(String(so.value))
      }
      if (c.weight) {
        const wo = weightOptions.find((o) => o.short === c.weight)
        if (wo) base.fontWeight = wo.value as any
      }
      if (c.spacing) {
        const lo = spacingOptions.find((o) => o.short === c.spacing)
        if (lo) base.letterSpacing = `${lo.value}em`
      }
    }
    return base
  })()

  // token names
  const familyToken = getTokenNameFor(prefix, 'font-family')
  const sizeToken = getTokenNameFor(prefix, 'size')
  const weightToken = getTokenNameFor(prefix, 'weight')
  const spacingToken = getTokenNameFor(prefix, 'letter-spacing')

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

  // preview style when editing
  const previewStyle: Style = (() => {
    if (!editing) return currentStyle
    const next: any = { ...currentStyle }
    if (form.family) { ensureGoogleFontLoaded(form.family); next.fontFamily = form.family }
    const so = sizeOptions.find((o) => o.short === (form.sizeToken ?? (sizeToken ? sizeToken.split('/').pop() : '')))
    if (so) next.fontSize = pxOrUndefined(String(so.value))
    const wo = weightOptions.find((o) => o.short === (form.weightToken ?? (weightToken ? weightToken.split('/').pop() : '')))
    if (wo) next.fontWeight = wo.value as any
    const lo = spacingOptions.find((o) => o.short === (form.spacingToken ?? (spacingToken ? spacingToken.split('/').pop() : '')))
    if (lo) next.letterSpacing = `${lo.value}em`
    return next
  })()

  const previewFamily = extractBaseFamily(previewStyle.fontFamily as string)
  const fontAvailable = isFontAvailable(previewFamily)

  return (
    <div style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 16 }}>
      <Tag style={previewStyle}>{text}</Tag>
      {!fontAvailable && previewFamily && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--temp-disabled)' }}>{previewFamily} is not available for previewing</div>
      )}
      <div style={{ marginTop: 12 }}>
        {!editing ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={() => setEditing(true)}>
            <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{toTitleCase(extractBaseFamily(previewStyle.fontFamily as string) || '') || '—'}</span>
            <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{(() => {
              const c = readChoices()[prefix]?.size
              const short = c ?? (sizeToken ? (sizeToken.split('/').pop() as string) : '')
              return short ? `Size / ${toTitleCase(short)}` : '—'
            })()}</span>
            <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{(() => {
              const c = readChoices()[prefix]?.weight
              const short = c ?? (weightToken ? (weightToken.split('/').pop() as string) : '')
              return short ? `Weight / ${toTitleCase(short)}` : '—'
            })()}</span>
            <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{(() => {
              const c = readChoices()[prefix]?.spacing
              const short = c ?? (spacingToken ? (spacingToken.split('/').pop() as string) : '')
              return short ? `Letter Spacing / ${toTitleCase(short)}` : '—'
            })()}</span>
          </div>
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
            cur[prefix] = entry
            writeChoices(cur)
            setEditing(false)
          }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Font</span>
              <input value={form.family ?? (extractBaseFamily(currentStyle.fontFamily as string) || '')} onChange={(e) => { const v = (e.target as HTMLInputElement).value; ensureGoogleFontLoaded(v); setForm((f) => ({ ...f, family: v })) }} />
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


