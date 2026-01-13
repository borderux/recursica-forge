import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { StyledSlider } from './StyledSlider'
import { getFormCssVar } from '../../../components/utils/cssVarNames'

type FontLetterSpacingTokensProps = {
  autoScale?: boolean
}

export default function FontLetterSpacingTokens({ autoScale = false }: FontLetterSpacingTokensProps) {
  const { tokens: tokensJson, updateToken } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.font?.['letter-spacing'] || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `font/letter-spacing/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const canonical = ['tightest','tighter','tight','default','wide','wider','widest']
    const weight = (n: string) => {
      const raw = n.replace('font/letter-spacing/','')
      const key = raw === 'tighest' ? 'tightest' : raw
      const idx = canonical.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return out.slice().sort((a,b) => weight(a.name) - weight(b.name))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const order = ['tightest','tighter','tight','default','wide','wider','widest'] as const
  const defaultIdx = 3
  const scaleByTW = autoScale
  const availableShorts = useMemo(() => new Set(flattened.map((f) => f.name.replace('font/letter-spacing/',''))), [flattened])
  const resolveShortToActual = (short: string): string => {
    if (availableShorts.has(short)) return short
    if (short === 'tightest' && availableShorts.has('tighest')) return 'tighest'
    return short
  }
  const getVal = (fullName: string): number => {
    // fullName is like 'font/letter-spacing/{short}'
    const short = fullName.replace('font/letter-spacing/','')
    const actual = resolveShortToActual(short)
    // Read directly from tokensJson
    try {
      const v = (tokensJson as any)?.tokens?.font?.['letter-spacing']?.[actual]?.$value
      const n = typeof v === 'number' ? v : parseFloat(v)
      return Number.isFinite(n) ? n : 0
    } catch {
      return 0
    }
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
      const actual = resolveShortToActual(k)
      const name = `font/letter-spacing/${actual}`
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
    // write updates directly via updateToken - no local state needed
    Object.entries(updates).forEach(([n, v]) => updateToken(n, v))
  }

  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const exampleText = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-md)' }}>
      {items.map((it) => {
        const keyName = it.name.replace('font/letter-spacing/','')
        const label = keyName === 'tighest' ? 'Tightest' : toTitle(keyName)
        const current = Number(it.value)
        const isDefault = keyName === 'default'
        const isTight = keyName === 'tight'
        const isWide = keyName === 'wide'
        const disabled = scaleByTW && !(isDefault || isTight || isWide)
        const letterSpacingVar = `--recursica-tokens-font-letter-spacing-${keyName === 'tighest' ? 'tightest' : keyName}`
        
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
              minWidth: 80,
              paddingTop: 'var(--recursica-brand-dimensions-spacers-xs)',
            }}>
              {label}
            </label>
            <div style={{
              letterSpacing: `var(${letterSpacingVar})`,
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
              lineHeight: 1.5,
            }}>
              {exampleText}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
              <StyledSlider
                id={it.name}
                min={-2}
                max={2}
                step={0.05}
                disabled={disabled}
                value={current}
                onChange={(next) => {
                  if (scaleByTW && (isDefault || isTight || isWide)) {
                    applyScaled(it.name, next)
                  } else {
                    updateToken(it.name, next)
                  }
                }}
                style={{ 
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 300,
                }}
              />
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
                    updateToken(it.name, next)
                  }
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

