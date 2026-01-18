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
  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal. As the creature soared through the air with remarkable agility, it noticed a shimmering portal opening beneath the ancient oak tree. Without hesitation, the goblin adjusted its trajectory mid-flight, tumbling gracefully through the mystical gateway into a realm where time flowed backwards and colors sang in harmony. The dwarf, momentarily stunned by this unexpected display of acrobatic prowess, slowly rose from his comfortable position and began to chase after the vanishing figure, determined to understand the secrets of this magical transformation that had unfolded before his very eyes."

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {order.map((k, index) => {
        const name = `font/line-height/${k}`
        const label = toTitle(k)
        const current = getVal(name)
        const isDefault = k === 'default'
        const isShort = k === 'short'
        const isTall = k === 'tall'
        const disabled = scaleByST && !(isDefault || isShort || isTall)
        const lineHeightVar = `--recursica-tokens-font-line-heights-${k}`
        const isLast = index === order.length - 1
        
        return (
          <div key={name} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr 350px', 
            gap: 0,
            alignItems: 'stretch',
          }}>
            <label htmlFor={name} style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              minWidth: 80,
              paddingTop: index === 0 ? 'var(--recursica-brand-dimensions-gutters-vertical)' : 0,
              paddingBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
              paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              paddingRight: 0,
              display: 'flex',
              alignItems: 'center',
            }}>
              {label}
            </label>
            <div style={{
              lineHeight: `var(${lineHeightVar})`,
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              paddingTop: index === 0 ? 'var(--recursica-brand-dimensions-gutters-vertical)' : 0,
              paddingBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
              paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              paddingRight: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              display: 'flex',
              alignItems: 'center',
            }}>
              {exampleText}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 'var(--recursica-brand-dimensions-spacers-default)',
              borderLeft: `1px solid var(${layer1Base}-border-color)`,
              paddingTop: index === 0 ? 'var(--recursica-brand-dimensions-gutters-vertical)' : 0,
              paddingBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
              paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              paddingRight: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              width: '350px',
            }}>
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
                showInput={false}
                showValueLabel={true}
                valueLabel={(val) => val.toFixed(2)}
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

