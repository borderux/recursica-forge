import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function FontFamiliesTokens() {
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
    const out: Array<{ name: string; value: string | number }> = []
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return
      if (typeof entry.name !== 'string') return
      if (!entry.name.startsWith('font/family/')) return
      out.push({ name: entry.name, value: entry.value })
    })
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Families</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/family/', ''))
          const current = (values[it.name] as any) ?? it.value
          return (
            <>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                key={it.name}
                id={it.name}
                type="text"
                value={String(current)}
                onChange={(ev) => {
                  const next = ev.currentTarget.value
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next)
                }}
              />
            </>
          )
        })}
      </div>
    </section>
  )
}


