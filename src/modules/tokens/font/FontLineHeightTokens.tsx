import React, { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'

type FontLineHeightTokensProps = {
  autoScale?: boolean
}

export default function FontLineHeightTokens({ autoScale = false }: FontLineHeightTokensProps) {
  const { tokens: tokensJson, updateToken } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (line-heights) and singular (line-height) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.font?.['line-heights'] || (tokensJson as any)?.tokens?.font?.['line-height'] || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `font/line-height/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const order = ['shortest','shorter','short','default','tall','taller','tallest'] as const
  const defaultIdx = order.indexOf('default')

  const getVal = (name: string): number => {
    // Read directly from tokensJson - support both plural and singular
    const key = name.replace('font/line-height/','')
    try {
      const v = (tokensJson as any)?.tokens?.font?.['line-heights']?.[key]?.$value || 
                (tokensJson as any)?.tokens?.font?.['line-height']?.[key]?.$value
      const n = typeof v === 'number' ? v : parseFloat(v)
      if (Number.isFinite(n)) return n
    } catch {}
    // sensible fallbacks if tokens are missing
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
    // write updates directly via updateToken - no local state needed
    Object.entries(updates).forEach(([n, v]) => updateToken(n, v))
  }

  const scaleByST = autoScale
  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-md)' }}>
      {order.map((k) => {
        const name = `font/line-height/${k}`
        const label = toTitle(k)
        const current = getVal(name)
        const isDefault = k === 'default'
        const isShort = k === 'short'
        const isTall = k === 'tall'
        const disabled = scaleByST && !(isDefault || isShort || isTall)
        const lineHeightVar = `--recursica-tokens-font-line-heights-${k}`
        
        return (
          <div key={name} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            gap: 'var(--recursica-brand-dimensions-spacers-md)',
            alignItems: 'start',
          }}>
            <label htmlFor={name} style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              minWidth: 80,
              paddingTop: 'var(--recursica-brand-dimensions-spacers-xs)',
            }}>
              {label}
            </label>
            <div style={{
              lineHeight: `var(${lineHeightVar})`,
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
            }}>
              {exampleText}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
              <Slider
                min={0.5}
                max={1.5}
                step={0.05}
                disabled={disabled}
                value={current}
                onChange={(next) => {
                  const value = typeof next === 'number' ? next : next[0]
                  if (scaleByST && (isDefault || isShort || isTall)) {
                    applyScaled(name, value)
                  } else {
                    updateToken(name, value)
                  }
                }}
                layer="layer-0"
                layout="stacked"
                showInput={true}
                style={{ 
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 300,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

