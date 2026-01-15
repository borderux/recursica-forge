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

  const items = useMemo(() => {
    const order = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
    const weight = (n: string) => {
      const key = n.replace('font/size/', '')
      const idx = order.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return flattened.slice().sort((a, b) => weight(a.name) - weight(b.name))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`

  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-md)' }}>
      {items.map((it) => {
        const label = toTitle(it.name.replace('font/size/', ''))
        const current = Number(it.value)
        const fontSizeVar = `--recursica-tokens-font-sizes-${it.name.replace('font/size/', '')}`
        
        return (
          <div key={it.name} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            gap: 'var(--recursica-brand-dimensions-spacers-md)',
            alignItems: 'start',
          }}>
            <label htmlFor={it.name} style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              minWidth: 60,
              paddingTop: 'var(--recursica-brand-dimensions-spacers-xs)',
            }}>
              {label}
            </label>
            <div style={{
              fontSize: `var(${fontSizeVar})`,
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              lineHeight: 1.5,
            }}>
              {exampleText}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
              <Slider
                min={8}
                max={72}
                step={1}
                value={current}
                onChange={(next) => updateToken(it.name, typeof next === 'number' ? next : next[0])}
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

