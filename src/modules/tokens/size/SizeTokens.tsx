import React, { useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { readOverrides, setOverride, writeOverrides } from '../../theme/tokenOverrides'
import { Slider } from '../../../components/adapters/Slider'
import { Button } from '../../../components/adapters/Button'
import { Switch } from '../../../components/adapters/Switch'
import { iconNameToReactComponent } from '../../components/iconUtils'

export default function SizeTokens() {
  const { tokens: tokensJson, resetAll } = useVars()
  const { mode } = useThemeMode()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (sizes) and singular (size) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `size/${k}`, value: num })
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

  const [scaleByDefault, setScaleByDefault] = useState<boolean>(() => {
    const v = localStorage.getItem('size-scale-by-default')
    return v === null ? false : v === 'true'
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

  const handleReset = () => {
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-size overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('size/')) {
        updated[k] = all[k]
      }
    })
    
    // Restore size values from JSON only
    try {
      const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          updated[`size/${k}`] = num
        }
      })
    } catch {}
    
    writeOverrides(updated)
    
    // Reset local state
    const init: Record<string, string | number> = {}
    flattened.forEach((it) => { init[it.name] = it.value })
    setValues({ ...init, ...updated })
    
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, reset: true } }))
    } catch {}
  }

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-themes-${mode}-palettes-core-interactive`

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
      }}>
        <h2 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-high-emphasis)`,
        }}>
          Size
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-md)' }}>
          <Button
            variant="outline"
            size="small"
            onClick={handleReset}
            icon={(() => {
              const RefreshIcon = iconNameToReactComponent('arrow-path')
              return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
            })()}
          >
            Reset all
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-sm)' }}>
            <span style={{
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
            }}>
              Auto scale
            </span>
            <Switch
              checked={scaleByDefault}
              onChange={(checked) => {
                setScaleByDefault(checked)
                localStorage.setItem('size-scale-by-default', String(checked))
              }}
              layer="layer-0"
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'grid', gap: 0 }}>
        {items.map((it, index) => {
          const raw = it.name.replace('size/', '')
          const label = (raw === 'default' || raw === 'none') ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw
          const isNone = raw === 'none'
          const isDefault = raw === 'default'
          const currentDefault = Number((values['size/default'] as any) ?? (items.find((i) => i.name === 'size/default')?.value as any) ?? 0)
          const mul = parseMultiplier(raw)
          const computed = Math.round(currentDefault * mul)
          const current: any = isNone ? 0 : (scaleByDefault && !isDefault) ? computed : ((values[it.name] as any) ?? (it.value as any))
          const disabled = isNone || (scaleByDefault && !isDefault)
          const isLast = index === items.length - 1
          
          return (
            <div key={it.name} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr auto auto', 
              gap: 'var(--recursica-brand-dimensions-spacers-md)',
              alignItems: 'center',
              paddingTop: 0,
              paddingBottom: isLast ? 0 : 'var(--recursica-brand-dimensions-gutters-vertical)',
            }}>
              <label htmlFor={it.name} style={{ 
                fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                color: `var(${layer0Base}-element-text-color)`,
                opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                minWidth: 80,
              }}>
                {label}
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Slider
                  value={Number(current)}
                  onChange={(val) => {
                    const next = typeof val === 'number' ? val : val[0]
                    setValues((prev) => ({ ...prev, [it.name]: next }))
                    setOverride(it.name, next as any)
                  }}
                  min={0}
                  max={200}
                  step={1}
                  disabled={disabled}
                  layer="layer-0"
                />
              </div>
              <input
                id={it.name}
                type="number"
                value={Number(current)}
                disabled={disabled}
                onChange={(e) => {
                  const next = Number(e.currentTarget.value)
                  if (Number.isFinite(next)) {
                    setValues((prev) => ({ ...prev, [it.name]: next }))
                    setOverride(it.name, next as any)
                  }
                }}
                style={{ 
                  width: 60,
                  padding: 'var(--recursica-brand-dimensions-spacers-xs) var(--recursica-brand-dimensions-spacers-sm)',
                  border: `1px solid var(${layer1Base}-border-color)`,
                  borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                  background: `var(${layer0Base}-surface)`,
                  color: `var(${layer0Base}-element-text-color)`,
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  textAlign: 'center',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'text',
                }}
              />
              <span style={{ 
                fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                color: `var(${layer0Base}-element-text-color)`,
                opacity: `var(${layer0Base}-element-text-medium-emphasis)`,
                minWidth: 20,
              }}>
                px
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
