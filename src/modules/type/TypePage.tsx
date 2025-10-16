import { useMemo, useState } from 'react'
import FontFamiliesTokens from '../tokens/FontFamiliesTokens'
import FontSizeTokens from '../tokens/FontSizeTokens'
import FontWeightTokens from '../tokens/FontWeightTokens'
import FontLetterSpacingTokens from '../tokens/FontLetterSpacingTokens'
import tokens from '../../vars/Tokens.json'
import theme from '../../vars/Theme.json'

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

function stripUnits(value?: string) {
  if (!value) return ''
  return String(value).replace(/\s/g, '').replace(/(px|rem|em|%)$/i, '')
}

function normalizeFontBase(value?: string): string | undefined {
  if (!value) return undefined
  const base = String(value).split(',')[0] || ''
  return base.replace(/["']/g, '').trim().toLowerCase()
}

function mapWeightKeywordToNumber(value?: string): number | undefined {
  if (!value) return undefined
  const v = String(value).trim().toLowerCase()
  if (/^\d+$/.test(v)) return Number(v)
  switch (v) {
    case 'thin': return 100
    case 'extralight':
    case 'ultralight': return 200
    case 'light': return 300
    case 'normal':
    case 'regular': return 400
    case 'medium': return 500
    case 'semibold':
    case 'demibold': return 600
    case 'bold': return 700
    case 'extrabold':
    case 'ultrabold': return 800
    case 'black':
    case 'heavy': return 900
    default: return undefined
  }
}

// --- Theme resolver (Light mode) ---
type ThemeRecord = { name: string; mode?: string; value?: any }
const themeIndex: Record<string, ThemeRecord> = (() => {
  const bucket: Record<string, ThemeRecord> = {}
  const rec: any = (theme as any).RecursicaBrand || {}
  Object.values(rec as Record<string, any>).forEach((e: any) => {
    if (e && typeof e.name === 'string') bucket[e.name] = e
  })
  return bucket
})()

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function getTokenValueByName(name?: string): string | number | undefined {
  if (!name) return undefined
  const entry = Object.values(tokens as Record<string, any>).find((e: any) => e && e.name === name)
  return entry ? (entry as any).value : undefined
}

function resolveThemeValue(ref: any): string | number | undefined {
  if (ref == null) return undefined
  if (typeof ref === 'string' || typeof ref === 'number') return ref
  if (typeof ref === 'object') {
    const coll = (ref as any).collection
    const name = (ref as any).name
    if (coll === 'Tokens') return getTokenValueByName(name)
    if (coll === 'Theme') {
      const entry = themeIndex[name]
      if (!entry) return undefined
      return resolveThemeValue(entry.value)
    }
  }
  return undefined
}

function getThemeEntry(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight' | 'weight-normal' | 'weight-strong'): ThemeRecord | undefined {
  const map: Record<string, string> = {
    'subtitle-1': 'subtitle',
    'subtitle-2': 'subtitle-small',
    'body-1': 'body',
    'body-2': 'body-small',
  }
  const themePrefix = map[prefix] || prefix
  const key = `[themes][Light][font/${themePrefix}/${prop}]`
  const rec: any = (theme as any).RecursicaBrand
  return rec ? (rec[key] as ThemeRecord | undefined) : undefined
}

function getResolvedSampleStyle(prefix: string): Style {
  // Resolve from Theme.json token references when available
  const familyRec = getThemeEntry(prefix, 'font-family')
  const sizeRec = getThemeEntry(prefix, 'size')
  const spacingRec = getThemeEntry(prefix, 'letter-spacing')
  const weightRec = getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')

  const familyVal = resolveThemeValue(familyRec?.value)
  const sizeVal = resolveThemeValue(sizeRec?.value)
  const spacingVal = resolveThemeValue(spacingRec?.value)
  const weightVal = resolveThemeValue(weightRec?.value)

  const fontFamily = typeof familyVal === 'string' && familyVal ? familyVal : (readCssVar(`--font-${prefix}-font-family`) || 'system-ui, -apple-system, Segoe UI, Roboto, Arial')
  const fontSize = typeof sizeVal === 'number' || typeof sizeVal === 'string' ? pxOrUndefined(String(sizeVal)) : pxOrUndefined(readCssVar(`--font-${prefix}-font-size`))
  const letterSpacing = (() => {
    if (typeof spacingVal === 'number') return `${spacingVal}em`
    if (typeof spacingVal === 'string' && spacingVal.trim() !== '') return spacingVal
    return pxOrUndefined(readCssVar(`--font-${prefix}-font-letter-spacing`))
  })()
  const fontWeight = ((): any => {
    if (typeof weightVal === 'number' || typeof weightVal === 'string') return weightVal
    return (readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)) as any
  })()

  return {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    margin: '0 0 12px 0',
  }
}

function getTokenNameFor(prefix: string, prop: 'size' | 'font-family' | 'letter-spacing' | 'weight'): string | undefined {
  // Prefer canonical keys, fall back for weight-normal
  const rec = prop === 'weight' ? (getThemeEntry(prefix, 'weight') || getThemeEntry(prefix, 'weight-normal')) : getThemeEntry(prefix, prop)
  const v: any = rec?.value
  if (v && typeof v === 'object' && v.collection === 'Tokens' && typeof v.name === 'string') return v.name
  return undefined
}

export function TypePage() {
  type Sample = { label: string; tag: keyof JSX.IntrinsicElements; text: string; prefix: string }

  const fontFamilyOptions = useMemo(() => {
    const options: Array<{ label: string; slug: string; value: string }> = []
    for (const [, entry] of Object.entries(tokens as Record<string, any>)) {
      if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.startsWith('font/family/')) {
        const slug = entry.name.split('/').pop() as string
        options.push({ label: String(entry.value), slug, value: String(entry.value) })
      }
    }
    const seen = new Set<string>()
    return options.filter((o) => (seen.has(o.label) ? false : (seen.add(o.label), true)))
  }, [])

  const fontWeightOptions = useMemo(() => {
    const options: Array<{ label: string; value: number }> = []
    for (const [, entry] of Object.entries(tokens as Record<string, any>)) {
      if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.startsWith('font/weight/')) {
        const val = Number(entry.value)
        if (!Number.isNaN(val)) options.push({ label: String(val), value: val })
      }
    }
    options.sort((a, b) => a.value - b.value)
    return options
  }, [])

  const samples: Sample[] = [
    { label: 'H1', tag: 'h1', text: 'H1 – The quick brown fox jumps over the lazy dog', prefix: 'h1' },
    { label: 'H2', tag: 'h2', text: 'H2 – The quick brown fox jumps over the lazy dog', prefix: 'h2' },
    { label: 'H3', tag: 'h3', text: 'H3 – The quick brown fox jumps over the lazy dog', prefix: 'h3' },
    { label: 'H4', tag: 'h4', text: 'H4 – The quick brown fox jumps over the lazy dog', prefix: 'h4' },
    { label: 'H5', tag: 'h5', text: 'H5 – The quick brown fox jumps over the lazy dog', prefix: 'h5' },
    { label: 'H6', tag: 'h6', text: 'H6 – The quick brown fox jumps over the lazy dog', prefix: 'h6' },
    { label: 'Subtitle 1', tag: 'p', text: 'Subtitle 1 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-1' },
    { label: 'Subtitle 2', tag: 'p', text: 'Subtitle 2 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-2' },
    { label: 'Body 1', tag: 'p', text: 'Body 1 – The quick brown fox jumps over the lazy dog', prefix: 'body-1' },
    { label: 'Body 2', tag: 'p', text: 'Body 2 – The quick brown fox jumps over the lazy dog', prefix: 'body-2' },
    { label: 'Button', tag: 'button', text: 'Button', prefix: 'button' },
    { label: 'Caption', tag: 'p', text: 'Caption – The quick brown fox jumps over the lazy dog', prefix: 'caption' },
    { label: 'Overline', tag: 'p', text: 'Overline – THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', prefix: 'overline' },
  ]

  // (removed) token-backed helpers replaced by getTokenNameFor

  const fontSizeTokenOptions = useMemo(() => {
    const opts: Array<{ label: string; value: string; token: string; short: string }> = []
    for (const [, entry] of Object.entries(tokens as Record<string, any>)) {
      if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.startsWith('font/size/')) {
        const val = String(entry.value)
        const short = entry.name.split('/').pop() as string
        opts.push({ label: `${short} (${val})`, value: stripUnits(val), token: entry.name, short })
      }
    }
    const seen = new Set<string>()
    const deduped = opts.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)))
    deduped.sort((a, b) => Number(a.value) - Number(b.value))
    return deduped
  }, [])

  // (removed) no longer displaying value-derived chip text

  const fontWeightTokenOptions = useMemo(() => {
    const opts: Array<{ label: string; value: number; token: string; short: string }> = []
    for (const [, entry] of Object.entries(tokens as Record<string, any>)) {
      if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.startsWith('font/weight/')) {
        const val = Number(entry.value)
        if (!Number.isNaN(val)) {
          const short = (entry.name.split('/').pop() as string) || String(val)
          opts.push({ label: `${short} (${val})`, value: val, token: entry.name, short })
        }
      }
    }
    opts.sort((a, b) => a.value - b.value)
    return opts
  }, [])

  // (removed) superseded by getTokenNameFor

  // (removed) no longer displaying value-derived chip text

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{ family?: string; size?: string; weight?: number | string; spacing?: string }>({})

  // (removed) chips show token names only

  function startEdit(prefix: string) {
    const currentFamily = readCssVar(`--font-${prefix}-font-family`)
    const currentSize = readCssVar(`--font-${prefix}-font-size`)
    const currentWeight = readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)
    const currentSpacing = readCssVar(`--font-${prefix}-font-letter-spacing`)

    // Map current family to a token value for preselecting
    const currentFamilyBase = normalizeFontBase(currentFamily)
    const matchedFamily = fontFamilyOptions.find((opt) => normalizeFontBase(opt.value) === currentFamilyBase)

    // Map weight keywords (e.g., bold/regular) to numeric values for preselecting
    const numericWeight = mapWeightKeywordToNumber(currentWeight)

    setEditing(prefix)
    setForm({
      family: matchedFamily ? matchedFamily.value : currentFamily,
      size: currentSize,
      weight: numericWeight != null ? numericWeight : (currentWeight ?? undefined),
      spacing: currentSpacing,
    })
  }

  function saveEdit(prefix: string) {
    const root = document.documentElement
    if (form.family) root.style.setProperty(`--font-${prefix}-font-family`, String(form.family))
    if (form.size) root.style.setProperty(`--font-${prefix}-font-size`, String(form.size))
    if (form.weight !== undefined && form.weight !== null) root.style.setProperty(`--font-${prefix}-font-weight`, String(form.weight))
    if (form.spacing) root.style.setProperty(`--font-${prefix}-font-letter-spacing`, String(form.spacing))
    setEditing(null)
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Type</h2>
        <button onClick={() => setIsPanelOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}>Edit Tokens</button>
      </div>
      {samples.map((s) => {
        const Tag = s.tag as any
        const sStyle = getResolvedSampleStyle(s.prefix)
        const familyToken = getTokenNameFor(s.prefix, 'font-family')
        const sizeToken = getTokenNameFor(s.prefix, 'size')
        const weightToken = getTokenNameFor(s.prefix, 'weight')
        const spacingToken = getTokenNameFor(s.prefix, 'letter-spacing')
        const tokenBackedSize = !!sizeToken
        const tokenBackedWeight = !!weightToken
        return (
          <div key={s.label} style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 16 }}>
            <Tag style={sStyle}>{s.text}</Tag>
            <div style={{ marginTop: 12 }}>
              {editing !== s.prefix ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={() => startEdit(s.prefix)}>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{familyToken ? toTitleCase(familyToken.split('/').pop() as string) : '—'}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{sizeToken ? `Size / ${toTitleCase(sizeToken.split('/').pop() as string)}` : '—'}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{weightToken ? `Weight / ${toTitleCase(weightToken.split('/').pop() as string)}` : '—'}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{spacingToken ? `Letter Spacing / ${toTitleCase(spacingToken.split('/').pop() as string)}` : '—'}</span>
                </div>
              ) : (
                <form style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }} onSubmit={(e) => { e.preventDefault(); saveEdit(s.prefix) }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Font</span>
                    <select value={form.family ?? ''} onChange={(e) => {
                      const val = (e.target as HTMLSelectElement).value
                      setForm((f) => ({ ...f, family: val }))
                    }}>
                      <option value="">Select font…</option>
                      {fontFamilyOptions.map((opt) => (
                        <option key={opt.slug} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Size</span>
                    {tokenBackedSize ? (
                      <select value={stripUnits(String(form.size ?? ''))} onChange={(e) => {
                        const val = (e.target as HTMLSelectElement).value
                        setForm((f) => ({ ...f, size: val }))
                      }}>
                        <option value="">Select token…</option>
                        {fontSizeTokenOptions.map((opt) => (
                          <option key={opt.token} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="number" step="1" value={stripUnits(String(form.size ?? ''))} onChange={(e) => {
                        const val = (e.target as HTMLInputElement).value
                        setForm((f) => ({ ...f, size: val }))
                      }} />
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Weight</span>
                    {tokenBackedWeight ? (
                      <select value={form.weight != null ? String(form.weight) : ''} onChange={(e) => {
                        const val = (e.target as HTMLSelectElement).value
                        setForm((f) => ({ ...f, weight: val ? Number(val) : '' }))
                      }}>
                        <option value="">Select token…</option>
                        {fontWeightTokenOptions.map((opt) => (
                          <option key={opt.token} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <select value={form.weight != null ? String(form.weight) : ''} onChange={(e) => {
                        const val = (e.target as HTMLSelectElement).value
                        setForm((f) => ({ ...f, weight: val ? Number(val) : '' }))
                      }}>
                        <option value="">Select weight…</option>
                        {fontWeightOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Letter spacing (px)</span>
                    <input type="number" step="0.05" value={form.spacing ?? ''} onChange={(e) => {
                      const val = (e.target as HTMLInputElement).value
                      setForm((f) => ({ ...f, spacing: val }))
                    }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )
      })}
      {/* Slide-in fonts panel */}
      <div
        aria-hidden={!isPanelOpen}
        style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1000, padding: 12, overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Font Tokens</div>
          <button onClick={() => setIsPanelOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <FontFamiliesTokens />
          <FontSizeTokens />
          <FontWeightTokens />
          <FontLetterSpacingTokens />
        </div>
      </div>
    </div>
  )
}

export default TypePage


