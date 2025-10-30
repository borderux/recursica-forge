import { useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { readOverrides, setOverride } from '../theme/tokenOverrides'

export default function SizeTokens() {
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `size/${k}`, value: num })
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

  const [scaleByDefault, setScaleByDefault] = useState<boolean>(() => {
    const v = localStorage.getItem('size-scale-by-default')
    return v === null ? true : v === 'true'
  })

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const weight = (full: string) => {
      const n = full.replace('size/', '').replace('-', '.')
      if (n === 'none') return [0, 0]
      if (n === '0.5x') return [1, 0]
      if (n === 'default') return [2, 0]
      const asNum = parseFloat(n.replace('x', ''))
      return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum]
    }
    return out.sort((a, b) => {
      const wa = weight(a.name)
      const wb = weight(b.name)
      if (wa[0] !== wb[0]) return wa[0] - wb[0]
      return wa[1] - wb[1]
    })
  }, [flattened])

  function parseMultiplier(raw: string): number {
    if (raw === 'default') return 1
    if (raw === 'none') return 0
    const n = parseFloat(raw.replace('-', '.').replace('x', ''))
    return Number.isFinite(n) ? n : 1
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Size</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={scaleByDefault} onChange={(e) => {
            const next = e.currentTarget.checked
            setScaleByDefault(next)
            localStorage.setItem('size-scale-by-default', String(next))
          }} />
          Scale based on default
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px) 50px auto', gap: 8, alignItems: 'center' }}>
        {items.map((it) => {
          const raw = it.name.replace('size/', '')
          const label = (raw === 'default' || raw === 'none') ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw
          const isNone = raw === 'none'
          const isDefault = raw === 'default'
          const currentDefault = Number((values['size/default'] as any) ?? (items.find((i) => i.name === 'size/default')?.value as any) ?? 0)
          const mul = parseMultiplier(raw)
          const computed = Math.round(currentDefault * mul)
          const current: any = isNone ? 0 : (scaleByDefault && !isDefault) ? computed : ((values[it.name] as any) ?? (it.value as any))
          const disabled = isNone || (scaleByDefault && !isDefault)
          return (
            <>
              <label key={it.name + '-label'} htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                disabled={disabled}
                value={Number(current)}
                onChange={(e) => {
                  const next = Number(e.currentTarget.value)
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next as any)
                }}
                style={{ width: '100%', maxWidth: 300, justifySelf: 'end' }}
              />
              <input
                id={it.name}
                type={typeof it.value === 'number' ? 'number' : 'text'}
                value={Number(current)}
                disabled={disabled}
                onChange={(e) => {
                  const next = Number(e.currentTarget.value)
                  setValues((prev) => ({ ...prev, [it.name]: next }))
                  setOverride(it.name, next as any)
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


