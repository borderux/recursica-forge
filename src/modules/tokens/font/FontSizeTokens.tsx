import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { StyledSlider } from './StyledSlider'
import { getFormCssVar } from '../../../components/utils/cssVarNames'

type FontSizeTokensProps = {
  autoScale?: boolean
}

export default function FontSizeTokens({ autoScale = false }: FontSizeTokensProps) {
  const { tokens: tokensJson, updateToken } = useVars()
  const { mode } = useThemeMode()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.size || {}
      Object.keys(src).forEach((k) => {
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
  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`

  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacer-md)' }}>
      {items.map((it) => {
        const label = toTitle(it.name.replace('font/size/', ''))
        const current = Number(it.value)
        const fontSizeVar = `--recursica-tokens-font-size-${it.name.replace('font/size/', '')}`
        
        return (
          <div key={it.name} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            gap: 'var(--recursica-brand-dimensions-spacer-md)',
            alignItems: 'start',
          }}>
            <label htmlFor={it.name} style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              minWidth: 60,
              paddingTop: 'var(--recursica-brand-dimensions-spacer-xs)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacer-default)' }}>
              <StyledSlider
                id={it.name}
                min={8}
                max={72}
                step={1}
                value={current}
                onChange={(next) => updateToken(it.name, next)}
                style={{ 
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 300,
                }}
              />
              <input
                type="number"
                min={0}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  updateToken(it.name, next)
                }}
                style={{ 
                  width: 60,
                  height: `var(${getFormCssVar('field', 'size', 'single-line-input-height')})`,
                  paddingLeft: `var(${getFormCssVar('field', 'size', 'horizontal-padding')})`,
                  paddingRight: `var(${getFormCssVar('field', 'size', 'horizontal-padding')})`,
                  paddingTop: `var(${getFormCssVar('field', 'size', 'vertical-padding')})`,
                  paddingBottom: `var(${getFormCssVar('field', 'size', 'vertical-padding')})`,
                  border: `var(${getFormCssVar('field', 'size', 'border-thickness-default')}) solid var(${getFormCssVar('field', 'color', 'border')})`,
                  borderRadius: `var(${getFormCssVar('field', 'size', 'border-radius')})`,
                  background: `var(${getFormCssVar('field', 'color', 'background')})`,
                  color: `var(${getFormCssVar('field', 'color', 'text-valued')})`,
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

