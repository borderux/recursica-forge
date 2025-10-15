import './index.css'
import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from './tokenOverrides'

export default function ElevationPage() {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && (typeof entry.value === 'number' || typeof entry.value === 'string')) {
        init[entry.name] = entry.value
      }
    })
    const overrides = readOverrides()
    const merged = { ...init, ...overrides }
    if (typeof merged['effect/none'] !== 'undefined') merged['effect/none'] = 0
    return merged
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
        const coerced = name === 'effect/none' ? 0 : value
        setValues((prev) => ({ ...prev, [name]: coerced }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])
  const effectItems = useMemo(() => {
    const out: Array<{ name: string; value: string | number }> = []
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return
      if (typeof entry.name !== 'string') return
      if (!entry.name.startsWith('effect/')) return
      if (typeof entry.value !== 'number' && typeof entry.value !== 'string') return
      out.push({ name: entry.name, value: entry.value })
    })
    const weight = (full: string) => {
      const n = full.replace('effect/', '')
      if (n === 'none') return [0, 0]
      if (n === '0-5x') return [1, 0]
      if (n === 'default') return [2, 0]
      const asNum = parseFloat(n.replace('x', '').replace('-', '.'))
      return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum]
    }
    return out.sort((a, b) => {
      const wa = weight(a.name)
      const wb = weight(b.name)
      if (wa[0] !== wb[0]) return wa[0] - wb[0]
      return wa[1] - wb[1]
    })
  }, [])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Tokens</h3>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Effects</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 8, alignItems: 'center' }}>
              {effectItems.map((e) => {
                const display = e.name.replace('effect/', '').replace('-', '.')
                const isNone = e.name === 'effect/none'
                const current = isNone ? 0 : Number((values[e.name] as any) ?? (e.value as any) ?? 0)
                return (
                  <>
                    <label key={e.name + '-label'} htmlFor={e.name} style={{ fontSize: 13, opacity: 0.9 }}>{display}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        key={e.name}
                        id={e.name}
                        type="range"
                        min={0}
                        max={100}
                        disabled={isNone}
                        value={current}
                        onChange={(ev) => {
                          const next = Number(ev.currentTarget.value)
                          setValues((prev) => ({ ...prev, [e.name]: next }))
                          setOverride(e.name, next)
                        }}
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={current}
                        disabled={isNone}
                        onChange={(ev) => {
                          const next = Number(ev.currentTarget.value)
                          if (Number.isFinite(next)) {
                            setValues((prev) => ({ ...prev, [e.name]: next }))
                            setOverride(e.name, next)
                          }
                        }}
                        style={{ width: 60 }}
                      />
                    </div>
                  </>
                )
              })}
            </div>
          </div>
        </section>
        <div className="section">
          <h2>Elevation</h2>
          <div className="elevation-grid">
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-0-x-axis) var(--elevation-elevation-0-y-axis) var(--elevation-elevation-0-blur) var(--elevation-elevation-0-spread) var(--elevation-elevation-0-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>0</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-1-x-axis) var(--elevation-elevation-1-y-axis) var(--elevation-elevation-1-blur) var(--elevation-elevation-1-spread) var(--elevation-elevation-1-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>1</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-2-x-axis) var(--elevation-elevation-2-y-axis) var(--elevation-elevation-2-blur) var(--elevation-elevation-2-spread) var(--elevation-elevation-2-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>2</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-3-x-axis) var(--elevation-elevation-3-y-axis) var(--elevation-elevation-3-blur) var(--elevation-elevation-3-spread) var(--elevation-elevation-3-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>3</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-4-x-axis) var(--elevation-elevation-4-y-axis) var(--elevation-elevation-4-blur) var(--elevation-elevation-4-spread) var(--elevation-elevation-4-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


