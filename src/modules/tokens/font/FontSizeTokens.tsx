import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'

type FontSizeTokensProps = {
  autoScale?: boolean
}

export default function FontSizeTokens({ autoScale = false }: FontSizeTokensProps) {
  const { tokens: tokensJson, updateToken } = useVars()
  const { mode } = useThemeMode()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (sizes) and singular (size) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.font?.sizes || (tokensJson as any)?.tokens?.font?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : (typeof v === 'object' && v && typeof v.value === 'number' ? v.value : Number(v))
        if (Number.isFinite(num)) list.push({ name: `font/size/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  const order = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const
  const defaultIdx = order.indexOf('md')

  const items = useMemo(() => {
    const weight = (n: string) => {
      const key = n.replace('font/size/', '')
      const idx = order.indexOf(key as any)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return flattened.slice().sort((a, b) => weight(a.name) - weight(b.name))
  }, [flattened])

  const getVal = (name: string): number => {
    const key = name.replace('font/size/', '')
    try {
      const v = (tokensJson as any)?.tokens?.font?.sizes?.[key]?.$value || 
                (tokensJson as any)?.tokens?.font?.size?.[key]?.$value
      const num = typeof v === 'number' ? v : (typeof v === 'object' && v && typeof v.value === 'number' ? v.value : Number(v))
      return Number.isFinite(num) ? num : 16
    } catch {
      return 16
    }
  }

  const computeLogRatio = () => {
    const def = getVal('font/size/md')
    const sm = getVal('font/size/sm')
    // Calculate logarithmic ratio: log(def) - log(sm) = log(def/sm)
    // This gives us the step size in log space
    return Math.log(def) - Math.log(sm)
  }

  const applyScaled = (changed: string, nextVal: number) => {
    const def = changed === 'font/size/md' ? nextVal : getVal('font/size/md')
    let logStep = computeLogRatio()
    if (changed === 'font/size/sm') {
      logStep = Math.log(def) - Math.log(nextVal)
    }

    const updates: Record<string, number> = {}
    // Process all sizes from items (which includes all sizes in the data)
    items.forEach((it) => {
      const keyName = it.name.replace('font/size/', '')
      const idx = order.indexOf(keyName as any)
      
      if (keyName === 'md') {
        updates[it.name] = def
      } else if (keyName === 'sm') {
        updates[it.name] = def / Math.exp(logStep)
      } else if (idx !== -1) {
        // Only scale if the size is in the order array
        const offset = idx - defaultIdx
        // Logarithmic scaling: each step is exp(logStep) times the previous
        // For sizes smaller than md: def / exp(logStep * |offset|)
        // For sizes larger than md: def * exp(logStep * offset)
        if (offset < 0) {
          updates[it.name] = def / Math.exp(logStep * Math.abs(offset))
        } else {
          updates[it.name] = def * Math.exp(logStep * offset)
        }
      }
    })
    Object.entries(updates).forEach(([n, v]) => updateToken(n, Math.round(v)))
  }

  const scaleByDefault = autoScale
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`

  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {items.map((it, index) => {
        const keyName = it.name.replace('font/size/', '')
        const label = toTitle(keyName)
        const current = getVal(it.name)
        const isDefault = keyName === 'md'
        const isSmall = keyName === 'sm'
        const disabled = scaleByDefault && !(isDefault || isSmall)
        const fontSizeVar = `--recursica-tokens-font-sizes-${keyName}`
        const isLast = index === items.length - 1
        
        return (
          <div key={it.name} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr 350px', 
            gap: 0,
            alignItems: 'stretch',
          }}>
            <label htmlFor={it.name} style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              minWidth: 60,
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
              fontSize: `var(${fontSizeVar})`,
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              lineHeight: 1.5,
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
                min={8}
                max={72}
                step={1}
                value={current}
                disabled={disabled}
                onChange={(next) => {
                  const value = typeof next === 'number' ? next : next[0]
                  if (scaleByDefault && (isDefault || isSmall)) {
                    applyScaled(it.name, value)
                  } else {
                    updateToken(it.name, value)
                  }
                }}
                layer="layer-0"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={(val) => `${val}px`}
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

