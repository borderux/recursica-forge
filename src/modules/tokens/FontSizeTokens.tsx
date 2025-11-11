import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function FontSizeTokens() {
  const { tokens: tokensJson } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.size || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : (typeof v === 'object' && v && typeof v.value === 'number' ? v.value : Number(v))
        if (Number.isFinite(num)) list.push({ name: `font/size/${k}`, value: num })
      })
    } catch {}
    return list
  }, [])

  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    flattened.forEach((it) => { init[it.name] = it.value })
    const overrides = readOverrides()
    return { ...init, ...overrides }
  })

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value } = detail
      if (all && typeof all === 'object') {
        setValues(all)
        return
      }
      if (typeof name === 'string') {
        setValues((prev) => ({ ...prev, [name]: value }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    // Order by numeric px
    const px = (v: any) => {
      const n = typeof v === 'number' ? v : parseFloat(v)
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
    }
    return out.sort((a,b) => px(a.value) - px(b.value))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return (
    <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Font Size</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/size/', ''))
          const current = Number((values[it.name] as any) ?? it.value)
          return (
            <div key={it.name} style={{ display: 'contents' }}>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={8}
                max={72}
                step={1}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next)
                }}
                style={{ width: '100%', maxWidth: 300, justifySelf: 'end' }}
              />
              <input
                type="number"
                min={0}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next)
                }}
                style={{ width: 50 }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>px</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}


