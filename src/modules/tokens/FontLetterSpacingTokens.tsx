import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function FontLetterSpacingTokens() {
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
      if (!entry.name.startsWith('font/letter-spacing/')) return
      out.push({ name: entry.name, value: entry.value })
    })
    const order = ['tighest','tighter','tight','default','wide','wider','widest']
    const weight = (n: string) => {
      const key = n.replace('font/letter-spacing/','')
      const idx = order.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return out.sort((a,b) => weight(a.name) - weight(b.name))
  }, [])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const order = ['tighest','tighter','tight','default','wide','wider','widest'] as const
  const defaultIdx = 3
  const [scaleByTW, setScaleByTW] = useState<boolean>(() => {
    const v = localStorage.getItem('font-letter-scale-by-tight-wide')
    return v === null ? false : v === 'true'
  })
  const getVal = (name: string): number => {
    const v = (values[name] as any)
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  const computeD = () => {
    const def = getVal('font/letter-spacing/default')
    const tight = getVal('font/letter-spacing/tight')
    return def - tight
  }
  const applyScaled = (changed: string, nextVal: number) => {
    const def = changed === 'font/letter-spacing/default' ? nextVal : getVal('font/letter-spacing/default')
    let d = computeD()
    if (changed === 'font/letter-spacing/tight') d = def - nextVal
    if (changed === 'font/letter-spacing/wide') d = nextVal - def

    const updates: Record<string, number> = {}
    order.forEach((k, idx) => {
      const name = `font/letter-spacing/${k}`
      if (k === 'default') {
        updates[name] = def
      } else if (k === 'tight') {
        updates[name] = def - d
      } else if (k === 'wide') {
        updates[name] = def + d
      } else {
        const offset = idx - defaultIdx
        updates[name] = def + offset * d
      }
    })
    // write updates
    setValues((prev) => ({ ...prev, ...updates }))
    Object.entries(updates).forEach(([n, v]) => setOverride(n, v))
  }

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Letter Spacing</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={scaleByTW} onChange={(e) => {
            const next = e.currentTarget.checked
            setScaleByTW(next)
            localStorage.setItem('font-letter-scale-by-tight-wide', String(next))
          }} />
          Scale based on tight/wide
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 80px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const label = toTitle(it.name.replace('font/letter-spacing/', ''))
          const current = Number((values[it.name] as any) ?? it.value)
          const keyName = it.name.replace('font/letter-spacing/','')
          const isDefault = keyName === 'default'
          const isTight = keyName === 'tight'
          const isWide = keyName === 'wide'
          const disabled = scaleByTW && !(isDefault || isTight || isWide)
          return (
            <>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.05}
                disabled={disabled}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (scaleByTW && (isDefault || isTight || isWide)) {
                    applyScaled(it.name, next)
                  } else {
                    setValues((prev) => ({ ...prev, [it.name]: next }))
                    setOverride(it.name, next)
                  }
                }}
                style={{ width: '100%', maxWidth: 300, justifySelf: 'end', background: `linear-gradient(to right, transparent 0%, transparent 50%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.15) 50%), linear-gradient(to right, transparent 50%, rgba(0,0,0,0.3) 50%)` }}
                list={it.name + '-ticks'}
              />
              <datalist id={it.name + '-ticks'}>
                <option value={0} />
              </datalist>
              <input
                type="number"
                step={0.05}
                disabled={disabled}
                value={Number.isFinite(current) ? Number(current.toFixed(2)) : current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (scaleByTW && (isDefault || isTight || isWide)) {
                    applyScaled(it.name, next)
                  } else {
                    setValues((prev) => ({ ...prev, [it.name]: next }))
                    setOverride(it.name, next)
                  }
                }}
                style={{ width: 80, paddingRight: 0, textAlign: 'right' }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>em</span>
            </>
          )
        })}
      </div>
    </section>
  )
}


