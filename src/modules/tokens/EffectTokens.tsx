import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function EffectTokens() {
  const { tokens: tokensJson } = useVars()
  const flattenEffect = (): Array<{ name: string; value: number }> => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.effect || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `effect/${k}`, value: num })
      })
    } catch {}
    return list
  }

  const baseEffects = useMemo(() => flattenEffect(), [])

  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {}
    baseEffects.forEach((e) => { init[e.name] = e.value })
    const overrides = readOverrides()
    const merged = { ...init, ...overrides }
    if (typeof merged['effect/none'] !== 'undefined') merged['effect/none'] = 0
    return merged
  })

  const [scaleByDefault, setScaleByDefault] = useState<boolean>(() => {
    const v = localStorage.getItem('effects-scale-by-default')
    return v === null ? true : v === 'true'
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

  useEffect(() => {
    const handler = (ev: Event) => {
      const d = (ev as CustomEvent).detail
      if (typeof d === 'boolean') setScaleByDefault(d)
    }
    window.addEventListener('effectsScaleByDefaultChanged', handler)
    return () => window.removeEventListener('effectsScaleByDefaultChanged', handler)
  }, [])

  const effectItems = useMemo(() => {
    const out: Array<{ name: string; value: string | number }> = baseEffects
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
  }, [baseEffects])

  function parseMultiplier(label: string): number {
    if (label === 'default') return 1
    if (label === 'none') return 0
    const m = label.replace('-', '.').replace('x', '')
    const n = parseFloat(m)
    return Number.isFinite(n) ? n : 1
  }

  function applyScaledFromDefault(newDefault: number) {
    if (!scaleByDefault) return
    const nextUpdates: Record<string, number> = {}
    effectItems.forEach((e) => {
      const label = e.name.replace('effect/', '').replace('-', '.')
      if (label === 'default' || label === 'none') return
      const mul = parseMultiplier(label)
      const val = Math.round(newDefault * mul)
      nextUpdates[e.name] = val
    })
    if (Object.keys(nextUpdates).length) {
      setValues((prev) => ({ ...prev, ...nextUpdates }))
      Object.entries(nextUpdates).forEach(([k, v]) => setOverride(k, v))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Effect</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={scaleByDefault} onChange={(e) => {
            const next = e.currentTarget.checked
            setScaleByDefault(next)
            localStorage.setItem('effects-scale-by-default', String(next))
            try { window.dispatchEvent(new CustomEvent('effectsScaleByDefaultChanged', { detail: next })) } catch {}
            if (next) {
              const def = Number((values['effect/default'] as any) ?? 0)
              applyScaledFromDefault(def)
            }
          }} />
          Scale based on default
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {effectItems.map((e) => {
          const displayRaw = e.name.replace('effect/', '').replace('-', '.')
          const display = (displayRaw === 'default' || displayRaw === 'none')
            ? displayRaw.charAt(0).toUpperCase() + displayRaw.slice(1)
            : displayRaw
          const isNone = e.name === 'effect/none'
          const currentDefault = Number((values['effect/default'] as any) ?? 0)
          const mul = parseMultiplier(display)
          const computed = mul * currentDefault
          const isDefault = e.name === 'effect/default'
          const current = isNone ? 0 : scaleByDefault && !isDefault ? Math.round(computed) : Number((values[e.name] as any) ?? (e.value as any) ?? 0)
          return (
            <>
              <label key={e.name + '-label'} htmlFor={e.name} style={{ fontSize: 13, opacity: 0.9 }}>{display}</label>
              <input
                key={e.name}
                id={e.name}
                type="range"
                min={0}
                max={100}
                disabled={isNone || (scaleByDefault && !isDefault)}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  setValues((prev) => ({ ...prev, [e.name]: next }))
                  setOverride(e.name, next)
                  if (scaleByDefault && isDefault) applyScaledFromDefault(next)
                }}
                style={{ width: '100%', maxWidth: 300, justifySelf: 'end' }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={current}
                disabled={isNone || (scaleByDefault && !isDefault)}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (Number.isFinite(next)) {
                    setValues((prev) => ({ ...prev, [e.name]: next }))
                    setOverride(e.name, next)
                    if (scaleByDefault && isDefault) applyScaledFromDefault(next)
                  }
                }}
                style={{ width: 50 }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>px</span>
            </>
          )
        })}
      </div>
    </div>
  )
}


