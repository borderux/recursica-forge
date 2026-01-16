import React, { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { readOverrides, setOverride, writeOverrides } from '../../theme/tokenOverrides'
import OpacityPickerOverlay from '../../pickers/OpacityPickerOverlay'
import { Slider } from '../../../components/adapters/Slider'
import { Button } from '../../../components/adapters/Button'
import { iconNameToReactComponent } from '../../components/iconUtils'

function toTitleCase(label: string): string {
  return (label || '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .trim()
}

export default function OpacityTokens() {
  const { tokens: tokensJson, resetAll } = useVars()
  const { mode } = useThemeMode()
  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      // Support both plural (opacities) and singular (opacity) for backwards compatibility
      const src: any = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `opacity/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  // Reflect latest overrides; listen to tokenOverridesChanged events
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const toPct = (v: any) => {
      const n = typeof v === 'number' ? v : parseFloat(v)
      if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY
      return n <= 1 ? n * 100 : n
    }
    return out.sort((a, b) => toPct(a.value) - toPct(b.value))
  }, [flattened])

  const toPctNumber = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (!Number.isFinite(n)) return 0
    return n <= 1 ? Math.round(n * 100) : Math.round(n)
  }

  const handleReset = () => {
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-opacity overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('opacity/')) {
        updated[k] = all[k]
      }
    })
    
    // Restore opacity values from JSON only
    try {
      const src: any = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          updated[`opacity/${k}`] = num
        }
      })
    } catch {}
    
    writeOverrides(updated)
    
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, reset: true } }))
    } catch {}
  }

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-themes-${mode}-palettes-core-interactive`

  return (
    <>
      <OpacityPickerOverlay />
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
            Opacity
          </h2>
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
        </div>

        {/* Rows */}
        <div style={{ display: 'grid', gap: 0 }}>
          {items.map((it, index) => {
            const rawName = it.name.replace('opacity/', '')
            const label = toTitleCase(rawName)
            const currentRaw = (overrides as any)[it.name] ?? it.value
            const current = toPctNumber(currentRaw)
            const isDisabled = rawName === 'invisible' || rawName === 'solid'
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
                    value={current}
                    onChange={(val) => {
                      const num = typeof val === 'number' ? val : val[0]
                      setOverride(it.name, num)
                    }}
                    min={0}
                    max={100}
                    step={1}
                    disabled={isDisabled}
                    layer="layer-0"
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={current}
                  disabled={isDisabled}
                  onChange={(ev) => { 
                    const next = Number(ev.currentTarget.value)
                    if (Number.isFinite(next) && next >= 0 && next <= 100) {
                      setOverride(it.name, next)
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
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'text',
                  }}
                />
                <span style={{ 
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-medium-emphasis)`,
                  minWidth: 20,
                }}>
                  %
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
