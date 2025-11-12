import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'

export default function FontWeightTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.weight || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `font/weight/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  const items = useMemo(() => {
    // Read directly from tokensJson - no local state needed since updateToken updates tokens directly
    // Sort once by a stable order (token name, not value) to prevent React from reordering inputs
    const order = ['thin','extra-light','light','regular','medium','semi-bold','bold','extra-bold','black']
    const weight = (n: string) => {
      const key = n.replace('font/weight/','')
      const idx = order.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    // Create a sorted copy once - this order won't change when values update
    return [...flattened].sort((a,b) => weight(a.name) - weight(b.name))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return (
    <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Font Weight</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 80px', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/weight/', ''))
          const current = Number(it.value)
          return (
            <div key={it.name} style={{ display: 'contents' }}>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={100}
                max={900}
                step={50}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  updateToken(it.name, next)
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
                  updateToken(it.name, next)
                }}
                style={{ width: 80 }}
              />
              
            </div>
          )
        })}
      </div>
    </section>
  )
}

