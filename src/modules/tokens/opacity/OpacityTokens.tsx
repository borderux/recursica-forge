import React, { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { readOverrides, setOverride, writeOverrides } from '../../theme/tokenOverrides'
import tokensImport from '../../../vars/Tokens.json'
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
  const { tokens: tokensJson, resetAll, updateToken } = useVars()
  const { mode } = useThemeMode()
  // Store original values from JSON import
  const originalValues = useMemo(() => {
    const map: Record<string, number> = {}
    try {
      const src: any = (tokensImport as any)?.tokens?.opacities || (tokensImport as any)?.tokens?.opacity || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) map[`opacity/${k}`] = num
      })
    } catch {}
    return map
  }, []) // Only compute once on mount
  
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

  // Local state to track slider values during drag (for smooth UI feedback)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  
  // Reflect latest overrides; listen to tokenOverridesChanged events
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = (ev: CustomEvent) => {
      // Clear local slider values on reset
      if (ev.detail?.reset) {
        setSliderValues({})
      }
      setVersion((v) => v + 1)
    }
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])
  
  // Force re-render when tokensJson changes (from store updates)
  useEffect(() => {
    // This ensures the component re-reads values when tokens are updated via updateToken
    // Also clear slider values when store resets
    setSliderValues({})
    setVersion((v) => v + 1)
  }, [tokensJson])

  const items = useMemo(() => {
    // Return items in their original order without sorting
    return flattened
  }, [flattened])

  const toPctNumber = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(v)
    if (!Number.isFinite(n)) return 0
    return n <= 1 ? Math.round(n * 100) : Math.round(n)
  }

  const handleReset = () => {
    // Clear local slider values so they read from store
    setSliderValues({})
    
    // Restore opacity values from original values and update tokens in store
    Object.keys(originalValues).forEach((tokenName) => {
      const num = originalValues[tokenName]
      if (Number.isFinite(num)) {
        // Update token in store (this updates CSS vars)
        updateToken(tokenName, num)
        // Also update override for backwards compatibility
        setOverride(tokenName, num)
      }
    })
    
    // Remove all opacity overrides that aren't in the original JSON
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-opacity overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('opacity/')) {
        updated[k] = all[k]
      }
    })
    
    // Add back only the original opacity values
    Object.keys(originalValues).forEach((tokenName) => {
      updated[tokenName] = originalValues[tokenName]
    })
    
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
            // Read current value from store (tokensJson) first, then fall back to overrides, then original value
            const storeValue = (() => {
              try {
                const src: any = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
                const v = src[rawName]?.$value
                const num = typeof v === 'number' ? v : Number(v)
                if (Number.isFinite(num)) return num
              } catch {}
              return null
            })()
            const currentRaw = storeValue ?? (overrides as any)[it.name] ?? it.value
            // Use local slider value if dragging, otherwise use store/override value
            const current = sliderValues[it.name] ?? toPctNumber(currentRaw)
            const isDisabled = rawName === 'invisible' || rawName === 'solid'
            const isLast = index === items.length - 1
            
            return (
              <div key={it.name} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr auto auto', 
                gap: 'var(--recursica-brand-dimensions-general-md)',
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
                      // Update local state for smooth UI feedback during drag
                      const num = typeof val === 'number' ? val : val[0]
                      setSliderValues((prev) => ({ ...prev, [it.name]: num }))
                    }}
                    onChangeCommitted={(val) => {
                      const num = typeof val === 'number' ? val : val[0]
                      // Convert percentage (0-100) to decimal (0-1) for token storage
                      const decimalValue = num / 100
                      // Update store and CSS variables
                      updateToken(it.name, decimalValue)
                      // Also update override for backwards compatibility
                      setOverride(it.name, decimalValue)
                      // Clear local slider value so it reads from store
                      setSliderValues((prev) => {
                        const next = { ...prev }
                        delete next[it.name]
                        return next
                      })
                    }}
                    min={0}
                    max={100}
                    step={1}
                    disabled={isDisabled}
                    layer="layer-0"
                    layout="stacked"
                    showInput={false}
                    showValueLabel={true}
                    valueLabel={(val) => `${val}%`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
