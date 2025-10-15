import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

function toTitleCase(label: string): string {
  return (label || '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .trim()
}

export default function OpacityTokens() {
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
      if (!entry.name.startsWith('opacity/')) return
      out.push({ name: entry.name, value: entry.value })
    })
    const toPct = (v: any) => {
      const n = typeof v === 'number' ? v : parseFloat(v)
      if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY
      return n <= 1 ? n * 100 : n
    }
    return out.sort((a, b) => toPct(a.value) - toPct(b.value))
  }, [])

  const toPctNumber = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (!Number.isFinite(n)) return 0
    return n <= 1 ? Math.round(n * 100) : Math.round(n)
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontWeight: 600 }}>Opacity</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitleCase(it.name.replace('opacity/', ''))
          const currentRaw = (values[it.name] as any) ?? it.value
          const current = toPctNumber(currentRaw)
          return (
            <>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                key={it.name}
                id={it.name}
                type="range"
                min={0}
                max={100}
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
                max={100}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (Number.isFinite(next)) {
                    setValues((prev) => ({ ...prev, [it.name]: next }))
                    setOverride(it.name, next)
                  }
                }}
                style={{ width: 50 }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>%</span>
            </>
          )
        })}
      </div>
    </div>
  )
}


