import { useMemo } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Slider } from '../../../components/adapters/Slider'

type FontLetterSpacingTokensProps = {
  autoScale?: boolean
}

export default function FontLetterSpacingTokens({ autoScale = false }: FontLetterSpacingTokensProps) {
  const { tokens: tokensJson, updateToken } = useVars()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (letter-spacings) and singular (letter-spacing) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.font?.['letter-spacings'] || (tokensJson as any)?.tokens?.font?.['letter-spacing'] || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `font/letter-spacing/${k}`, value: num })
      })
    } catch { }
    return list
  }, [tokensJson])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const canonical = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest']
    const weight = (n: string) => {
      const raw = n.replace('font/letter-spacing/', '')
      const key = raw === 'tighest' ? 'tightest' : raw
      const idx = canonical.indexOf(key)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    return out.slice().sort((a, b) => weight(a.name) - weight(b.name))
  }, [flattened])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  const order = ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest'] as const
  const defaultIdx = 3
  const scaleByTW = autoScale
  const availableShorts = useMemo(() => new Set(flattened.map((f) => f.name.replace('font/letter-spacing/', ''))), [flattened])
  const resolveShortToActual = (short: string): string => {
    if (availableShorts.has(short)) return short
    if (short === 'tightest' && availableShorts.has('tighest')) return 'tighest'
    return short
  }
  const getVal = (fullName: string): number => {
    // fullName is like 'font/letter-spacing/{short}'
    const short = fullName.replace('font/letter-spacing/', '')
    const actual = resolveShortToActual(short)
    // Read directly from tokensJson - support both plural and singular
    try {
      const v = (tokensJson as any)?.tokens?.font?.['letter-spacings']?.[actual]?.$value ||
        (tokensJson as any)?.tokens?.font?.['letter-spacing']?.[actual]?.$value
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
    <div style={{ display: 'grid', gap: 0 }}>
      {items.map((it, index) => {
        const keyName = it.name.replace('font/letter-spacing/', '')
        const label = keyName === 'tighest' ? 'Tightest' : toTitle(keyName)
        const current = Number(it.value)
        const isDefault = keyName === 'default'
        const isTight = keyName === 'tight'
        const isWide = keyName === 'wide'
        const disabled = scaleByTW && !(isDefault || isTight || isWide)
        const letterSpacingVar = `--recursica-tokens-font-letter-spacings-${keyName === 'tighest' ? 'tightest' : keyName}`
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
              fontFamily: 'var(--recursica-tokens-font-typefaces-primary)',
              letterSpacing: `var(${letterSpacingVar})`,
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
              gap: 'var(--recursica-brand-dimensions-general-default)',
              borderLeft: `1px solid var(${layer1Base}-border-color)`,
              paddingTop: index === 0 ? 'var(--recursica-brand-dimensions-gutters-vertical)' : 0,
              paddingBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
              paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              paddingRight: 'var(--recursica-brand-dimensions-gutters-horizontal)',
              width: '350px',
              overflow: 'hidden',
            }}>
              <Slider
                min={-2}
                max={2}
                step={0.05}
                disabled={disabled}
                value={current}
                onChange={(next) => {
                  const value = typeof next === 'number' ? next : next[0]
                  if (scaleByTW && (isDefault || isTight || isWide)) {
                    applyScaled(it.name, value)
                  } else {
                    updateToken(it.name, value)
                  }
                }}
                layer="layer-0"
                layout="stacked"
                showInput={false}
                showValueLabel={true}
                valueLabel={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}px`}
                showMinMaxLabels={false}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

