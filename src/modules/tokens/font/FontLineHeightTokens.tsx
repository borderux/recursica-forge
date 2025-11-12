import React, { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { readOverrides, setOverride } from '../../theme/tokenOverrides'

export default function FontLineHeightTokens() {
  const { tokens: tokensJson } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.['line-height'] || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `font/line-height/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])
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

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const order = ['shortest','shorter','short','default','tall','taller','tallest'] as const
  const defaultIdx = order.indexOf('default')

  const getVal = (name: string): number => {
    const v = (values[name] as any)
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (Number.isFinite(n)) return n
    // sensible fallbacks if tokens are missing
    const key = name.replace('font/line-height/','')
    const fallbackDef = 1
    const fallbackD = 0.1
    const idx = order.indexOf(key as any)
    if (idx === -1) return fallbackDef
    const offset = idx - defaultIdx
    return Number((fallbackDef + offset * (fallbackD / 1)).toFixed(2))
  }

  const computeD = () => {
    const def = getVal('font/line-height/default')
    const short = getVal('font/line-height/short')
    return def - short
  }

  const applyScaled = (changed: string, nextVal: number) => {
    const def = changed === 'font/line-height/default' ? nextVal : getVal('font/line-height/default')
    let d = computeD()
    if (changed === 'font/line-height/short') d = def - nextVal
    if (changed === 'font/line-height/tall') d = nextVal - def

    const updates: Record<string, number> = {}
    order.forEach((k, idx) => {
      const name = `font/line-height/${k}`
      if (k === 'default') {
        updates[name] = def
      } else if (k === 'short') {
        updates[name] = def - d
      } else if (k === 'tall') {
        updates[name] = def + d
      } else {
        const offset = idx - defaultIdx
        updates[name] = def + offset * d
      }
    })
    setValues((prev) => ({ ...prev, ...updates }))
    Object.entries(updates).forEach(([n, v]) => setOverride(n, v))
  }

  const scaleKey = 'font-line-scale-by-short-tall'
  const [scaleByST, setScaleByST] = useState<boolean>(() => {
    const v = localStorage.getItem(scaleKey)
    return v === null ? false : v === 'true'
  })

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Line Height</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={scaleByST} onChange={(e) => {
            const next = e.currentTarget.checked
            setScaleByST(next)
            localStorage.setItem(scaleKey, String(next))
          }} />
          Scale based on short/tall
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 80px', gap: 8, alignItems: 'center' }}>
        {order.map((k) => {
          const name = `font/line-height/${k}`
          const label = toTitle(k)
          const current = getVal(name)
          const isDefault = k === 'default'
          const isShort = k === 'short'
          const isTall = k === 'tall'
          const disabled = scaleByST && !(isDefault || isShort || isTall)
          return (
            <React.Fragment key={name}>
              <label htmlFor={name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                disabled={disabled}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (scaleByST && (isDefault || isShort || isTall)) {
                    applyScaled(name, next)
                  } else {
                    setValues((prev) => ({ ...prev, [name]: next }))
                    setOverride(name, next)
                  }
                }}
                style={{ width: '100%', justifySelf: 'end' }}
                list={name + '-ticks'}
              />
              <datalist id={name + '-ticks'}>
                <option value={0.5} />
                <option value={0.75} />
                <option value={1} />
                <option value={1.25} />
                <option value={1.5} />
              </datalist>
              <input
                type="number"
                step={0.05}
                disabled={disabled}
                value={Number.isFinite(current) ? Number(current.toFixed(2)) : current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (scaleByST && (isDefault || isShort || isTall)) {
                    applyScaled(name, next)
                  } else {
                    setValues((prev) => ({ ...prev, [name]: next }))
                    setOverride(name, next)
                  }
                }}
                style={{ width: 80, paddingRight: 0, textAlign: 'right' }}
              />
            </React.Fragment>
          )
        })}
      </div>
    </section>
  )
}

