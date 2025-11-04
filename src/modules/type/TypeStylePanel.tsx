import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'

const CHOICES_KEY = 'type-token-choices'

function readChoices(): Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }> {
  try { const raw = localStorage.getItem(CHOICES_KEY); if (raw) return JSON.parse(raw) } catch {}
  return {}
}
function writeChoices(next: Record<string, { family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>) {
  try { localStorage.setItem(CHOICES_KEY, JSON.stringify(next)) } catch {}
  try { window.dispatchEvent(new CustomEvent('typeChoicesChanged', { detail: next })) } catch {}
}

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function brandKeyFromPrefix(prefix: string): string {
  const map: Record<string, string> = { 'subtitle-1': 'subtitle', 'subtitle-2': 'subtitle-small', 'body-1': 'body', 'body-2': 'body-small' }
  return map[prefix] || prefix
}

function parseTokenShortFromRef(ref: any, kind: 'size' | 'weight' | 'letter-spacing' | 'line-height' | 'family' | 'typeface'): string | undefined {
  try {
    if (typeof ref !== 'string') return undefined
    const s = ref.trim()
    const inner = s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1).trim() : s
    const re = new RegExp(`^(tokens|token)\.font\.${kind}\.(.+)$`, 'i')
    const m = inner.match(re)
    if (m) return m[2]
  } catch {}
  return undefined
}

export default function TypeStylePanel({ open, selectedPrefixes, title, onClose }: { open: boolean; selectedPrefixes: string[]; title: string; onClose: () => void }) {
  const { tokens, theme } = useVars()
  const [form, setForm] = useState<{ family?: string; size?: string; weight?: string; spacing?: string; lineHeight?: string }>({})

  // options
  const sizeOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.size || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const weightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.weight || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const spacingOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['letter-spacing'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const lineHeightOptions = useMemo(() => {
    const out: Array<{ short: string; label: string }> = []
    try { Object.keys((tokens as any)?.tokens?.font?.['line-height'] || {}).forEach((k) => out.push({ short: k, label: toTitleCase(k) })) } catch {}
    return out
  }, [tokens])
  const familyOptions = useMemo(() => {
    const out: Array<{ short: string; label: string; value: string }> = []
    const seen = new Set<string>()
    // from Tokens.json (font.family)
    try {
      Object.entries((tokens as any)?.tokens?.font?.family || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // from Tokens.json (font.typeface)
    try {
      Object.entries((tokens as any)?.tokens?.font?.['typeface'] || {}).forEach(([short, rec]: [string, any]) => {
        const val = String((rec as any)?.$value || '')
        if (val && !seen.has(val)) { seen.add(val); out.push({ short, label: toTitleCase(short), value: val }) }
      })
    } catch {}
    // include overrides-only additions (font/family/* and font/typeface/*)
    try {
      const ov = (window && typeof window !== 'undefined') ? ((): Record<string, any> => { try { return JSON.parse(localStorage.getItem('token-overrides') || '{}') } catch { return {} } })() : {}
      Object.entries(ov || {}).forEach(([name, val]) => {
        if (typeof name !== 'string') return
        if (!(name.startsWith('font/family/') || name.startsWith('font/typeface/'))) return
        const short = name.split('/').pop() as string
        const literal = String(val || '')
        if (literal && !seen.has(literal)) { seen.add(literal); out.push({ short, label: toTitleCase(short), value: literal }) }
      })
    } catch {}
    out.sort((a,b) => a.label.localeCompare(b.label))
    return out
  }, [tokens])

  // seed form: existing choice (from the first selected prefix) or brand JSON
  useEffect(() => {
    if (!open) return
    const prefix = selectedPrefixes[0]
    if (!prefix) return
    const choices = readChoices()
    const existing = choices[prefix] || {}
    if (existing && (existing.size || existing.weight || existing.spacing || existing.lineHeight || existing.family)) {
      setForm(existing)
      return
    }
    try {
      const key = brandKeyFromPrefix(prefix)
      const spec = ((theme as any)?.brand?.typography?.[key]?.$value) || {}
      const next: any = {}
      const famShort = parseTokenShortFromRef(spec.fontFamily, 'typeface') || parseTokenShortFromRef(spec.fontFamily, 'family')
      if (famShort) {
        const entry = familyOptions.find((o) => o.short === famShort)
        if (entry) next.family = entry.value
      }
      const sizeShort = parseTokenShortFromRef(spec.fontSize, 'size'); if (sizeShort) next.size = sizeShort
      const weightShort = parseTokenShortFromRef(spec.fontWeight ?? spec.weight, 'weight'); if (weightShort) next.weight = weightShort
      const spacingShort = parseTokenShortFromRef(spec.letterSpacing, 'letter-spacing'); if (spacingShort) next.spacing = spacingShort
      const lineShort = parseTokenShortFromRef(spec.lineHeight, 'line-height'); if (lineShort) next.lineHeight = lineShort
      setForm(next)
    } catch { setForm({}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedPrefixes])

  const applyPartial = (partial: Partial<{ family: string; size: string; weight: string; spacing: string; lineHeight: string }>) => {
    const cur = readChoices()
    const applyTo = selectedPrefixes && selectedPrefixes.length ? selectedPrefixes : []
    applyTo.forEach((p) => { cur[p] = { ...cur[p], ...partial } as any })
    writeChoices(cur)
  }

  const revert = () => {
    const cur = readChoices()
    const applyTo = selectedPrefixes && selectedPrefixes.length ? selectedPrefixes : []
    applyTo.forEach((p) => { delete (cur as any)[p] })
    writeChoices(cur)
    onClose()
  }

  return (
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(240px, 36vw, 520px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1200, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Font</span>
          <select value={form.family || ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, family: v })); applyPartial({ family: v }) }}>
            <option value=""></option>
            {familyOptions.map((o) => (<option key={o.short} value={o.value}>{o.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Size</span>
          <select value={form.size || ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, size: v })); applyPartial({ size: v }) }}>
            <option value=""></option>
            {sizeOptions.map((o) => (<option key={o.short} value={o.short}>{o.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Weight</span>
          <select value={form.weight || ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, weight: v })); applyPartial({ weight: v }) }}>
            <option value=""></option>
            {weightOptions.map((o) => (<option key={o.short} value={o.short}>{o.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Letter Spacing</span>
          <select value={form.spacing || ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, spacing: v })); applyPartial({ spacing: v }) }}>
            <option value=""></option>
            {spacingOptions.map((o) => (<option key={o.short} value={o.short}>{o.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Line Height</span>
          <select value={form.lineHeight || ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setForm((f) => ({ ...f, lineHeight: v })); applyPartial({ lineHeight: v }) }}>
            <option value=""></option>
            {lineHeightOptions.map((o) => (<option key={o.short} value={o.short}>{o.label}</option>))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={revert}>Revert</button>
        </div>
      </div>
    </div>
  )
}



