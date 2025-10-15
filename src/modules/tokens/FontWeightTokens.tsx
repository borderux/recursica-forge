import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function FontWeightTokens() {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && (typeof entry.value === 'number' || typeof entry.value === 'string')) {
        init[entry.name] = entry.value
      }
    })
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
    const out: Array<{ name: string; value: number | string }> = []
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return
      if (typeof entry.name !== 'string') return
      if (!entry.name.startsWith('font/weight/')) return
      out.push({ name: entry.name, value: entry.value })
    })
    const order = ['thin','extra-light','light','regular','medium','semi-bold','bold','extra-bold','black']
    const weight = (n: string) => {
      const key = n.replace('font/weight/','')
      const idx = order.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return out.sort((a,b) => weight(a.name) - weight(b.name))
  }, [])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Font Weight</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/weight/', ''))
          const current = Number((values[it.name] as any) ?? it.value)
          return (
            <>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={100}
                max={900}
                step={50}
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
                min={100}
                max={900}
                step={50}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next)
                }}
                style={{ width: 50 }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>wght</span>
            </>
          )
        })}
      </div>
    </section>
  )
}


