import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'

export default function FontSizeTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.size || {}
      // Tokens are already sorted in the store, so we can read them in order
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : (typeof v === 'object' && v && typeof v.value === 'number' ? v.value : Number(v))
        if (Number.isFinite(num)) list.push({ name: `font/size/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  const items = useMemo(() => {
    // Read directly from tokensJson - no local state needed since updateToken updates tokens directly
    // Don't sort - keep stable order to prevent React from reordering inputs
    return flattened.map((it) => ({
      name: it.name,
      value: it.value
    }))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return (
    <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Font Size</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/size/', ''))
          const current = Number(it.value)
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
                  updateToken(it.name, next)
                }}
                style={{ width: '100%', maxWidth: 300, justifySelf: 'end' }}
              />
              <input
                type="number"
                min={0}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  updateToken(it.name, next)
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

