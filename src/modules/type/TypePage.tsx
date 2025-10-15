import { useMemo, useState } from 'react'
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

function sampleStyle(prefix: string): Style {
  const fontFamily = readCssVar(`--font-${prefix}-font-family`)
  const fontSize = readCssVar(`--font-${prefix}-font-size`)
  const fontWeight = readCssVar(`--font-${prefix}-font-weight`) || readCssVar(`--font-${prefix}-font-weight-normal`)
  const letterSpacing = readCssVar(`--font-${prefix}-font-letter-spacing`)
  return {
    fontFamily: fontFamily || 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
    fontSize: pxOrUndefined(fontSize),
    fontWeight: fontWeight as any,
    letterSpacing: pxOrUndefined(letterSpacing),
    margin: '0 0 12px 0',
  }
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
    { label: 'H1', tag: 'h1', text: 'Heading 1 – The quick brown fox jumps over the lazy dog', prefix: 'h1' },
    { label: 'H2', tag: 'h2', text: 'Heading 2 – The quick brown fox jumps over the lazy dog', prefix: 'h2' },
    { label: 'H3', tag: 'h3', text: 'Heading 3 – The quick brown fox jumps over the lazy dog', prefix: 'h3' },
    { label: 'H4', tag: 'h4', text: 'Heading 4 – The quick brown fox jumps over the lazy dog', prefix: 'h4' },
    { label: 'H5', tag: 'h5', text: 'Heading 5 – The quick brown fox jumps over the lazy dog', prefix: 'h5' },
    { label: 'H6', tag: 'h6', text: 'Heading 6 – The quick brown fox jumps over the lazy dog', prefix: 'h6' },
    { label: 'Subtitle 1', tag: 'p', text: 'Subtitle 1 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-1' },
    { label: 'Subtitle 2', tag: 'p', text: 'Subtitle 2 – The quick brown fox jumps over the lazy dog', prefix: 'subtitle-2' },
    { label: 'Body 1', tag: 'p', text: 'Body 1 – The quick brown fox jumps over the lazy dog', prefix: 'body-1' },
    { label: 'Body 2', tag: 'p', text: 'Body 2 – The quick brown fox jumps over the lazy dog', prefix: 'body-2' },
    { label: 'Button', tag: 'button', text: 'Button', prefix: 'button' },
    { label: 'Caption', tag: 'p', text: 'Caption – The quick brown fox jumps over the lazy dog', prefix: 'caption' },
    { label: 'Overline', tag: 'p', text: 'OVERLINE – THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', prefix: 'overline' },
  ]

  // Determine if a given sample property is backed by Tokens in Theme.json (Light mode)
  function isTokenBacked(prefix: string, prop: 'size' | 'font-family' | 'font-weight' | 'letter-spacing') {
    const key = `[themes][Light][font/${prefix}/${prop}]`
    const record: any = (theme as any).RecursicaBrand?.[key]
    return record && record.value && record.value.collection === 'Tokens'
  }

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

  function findSizeTokenShortByPx(px?: string): string | undefined {
    if (!px) return undefined
    const v = stripUnits(px)
    const match = fontSizeTokenOptions.find((o) => o.value === v)
    return match?.short
  }

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

  function isTokenBackedWeight(prefix: string): boolean {
    const rec: any = (theme as any).RecursicaBrand
    if (!rec) return false
    const candidates = [
      `[themes][Light][font/${prefix}/weight]`,
      `[themes][Light][font/${prefix}/weight-normal]`,
      `[themes][Light][font/${prefix}/weight-strong]`,
    ]
    for (const key of candidates) {
      const r = rec[key]
      if (r && r.value && r.value.collection === 'Tokens') return true
    }
    for (const [k, v] of Object.entries(rec)) {
      if (k.startsWith(`[themes][Light][font/${prefix}/`) && k.includes('weight')) {
        if ((v as any).value && (v as any).value.collection === 'Tokens') return true
      }
    }
    return false
  }

  function findWeightTokenShortByValue(weight?: string | number): string | undefined {
    if (weight == null) return undefined
    const n = typeof weight === 'number' ? weight : mapWeightKeywordToNumber(String(weight))
    if (n == null) return undefined
    const match = fontWeightTokenOptions.find((o) => o.value === n)
    return match?.short
  }

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{ family?: string; size?: string; weight?: number | string; spacing?: string }>({})

  function displayFontLabel(family?: string) {
    if (!family) return '—'
    const normalized = String(family).toLowerCase().trim()
    const match = fontFamilyOptions.find((o) => o.slug.toLowerCase() === normalized || o.label.toLowerCase() === normalized)
    return match ? match.label : family
  }

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

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Type Scale</h2>
      {samples.map((s) => {
        const Tag = s.tag as any
        const sStyle = sampleStyle(s.prefix)
        const tokenBackedWeight = isTokenBackedWeight(s.prefix)
        const weightTokenShort = tokenBackedWeight ? findWeightTokenShortByValue(sStyle.fontWeight as any) : undefined
        const tokenBackedSize = isTokenBacked(s.prefix, 'size')
        const sizeTokenShort = tokenBackedSize ? findSizeTokenShortByPx(String(sStyle.fontSize)) : undefined
        return (
          <div key={s.label} style={{ border: '1px solid var(--temp-disabled)', borderRadius: 8, padding: 16 }}>
            <div style={{ opacity: 0.65, marginBottom: 6 }}>{s.label}</div>
            <Tag style={sStyle}>{s.text}</Tag>
            <div style={{ marginTop: 12 }}>
              {editing !== s.prefix ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={() => startEdit(s.prefix)}>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{displayFontLabel(sStyle.fontFamily as string)}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{sizeTokenShort ?? (sStyle.fontSize || '—')}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{weightTokenShort ?? (sStyle.fontWeight || '—')}</span>
                  <span style={{ border: '1px solid var(--temp-disabled)', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }}>{sStyle.letterSpacing || '—'}</span>
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
    </div>
  )
}

export default TypePage


