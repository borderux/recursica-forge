import React, { useMemo, useState, useEffect } from 'react'
import { useVars } from '../../vars/VarsContext'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { readOverrides, setOverride, writeOverrides } from '../../theme/tokenOverrides'
import tokensImport from '../../../vars/Tokens.json'
import { Slider } from '../../../components/adapters/Slider'
import { Button } from '../../../components/adapters/Button'
import { Switch } from '../../../components/adapters/Switch'
import { iconNameToReactComponent } from '../../components/iconUtils'

export default function SizeTokens() {
  const { tokens: tokensJson, resetAll, updateToken } = useVars()
  const { mode } = useThemeMode()
  // Store original values from JSON import
  const originalValues = useMemo(() => {
    const map: Record<string, number> = {}
    try {
      const src: any = (tokensImport as any)?.tokens?.sizes || (tokensImport as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) map[`size/${k}`] = num
      })
    } catch {}
    return map
  }, []) // Only compute once on mount
  
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
  
  // Listen for reset events to clear local state
  useEffect(() => {
    const handler = (ev: CustomEvent) => {
      if (ev.detail?.reset) {
        // On reset, sync with store values (ignore overrides)
        const init: Record<string, string | number> = {}
        flattened.forEach((it) => { 
          try {
            const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
            const rawKey = it.name.replace('size/', '')
            const rawValue = src[rawKey]?.$value
            const v = (rawValue && typeof rawValue === 'object' && typeof rawValue.value !== 'undefined') ? rawValue.value : rawValue
            const num = typeof v === 'number' ? v : Number(v)
            if (Number.isFinite(num)) {
              init[it.name] = num
            } else {
              init[it.name] = it.value
            }
          } catch {
            init[it.name] = it.value
          }
        })
        setValues(init)
      }
    }
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [flattened, tokensJson])
  
  // Sync values with store when tokensJson changes
  useEffect(() => {
    const init: Record<string, string | number> = {}
    flattened.forEach((it) => { 
      // Read from store first, then fall back to original value
      try {
        const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
        const rawKey = it.name.replace('size/', '')
        const rawValue = src[rawKey]?.$value
        const v = (rawValue && typeof rawValue === 'object' && typeof rawValue.value !== 'undefined') ? rawValue.value : rawValue
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          init[it.name] = num
        } else {
          init[it.name] = it.value
        }
      } catch {
        init[it.name] = it.value
      }
    })
    const overrides = readOverrides()
    setValues({ ...init, ...overrides })
  }, [tokensJson, flattened])

  const [scaleByDefault, setScaleByDefault] = useState<boolean>(() => {
    const v = localStorage.getItem('size-scale-by-default')
    // Default to true if not set
    if (v === null) {
      localStorage.setItem('size-scale-by-default', 'true')
      return true
    }
    return v === 'true'
  })
  
  // Local state to track slider values during drag (for smooth UI feedback when auto scale is enabled)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})

  const items = useMemo(() => {
    // Return items in their original order without sorting
    return flattened
  }, [flattened])

  function parseMultiplier(raw: string): number {
    if (raw === 'default') return 1
    if (raw === 'none') return 0
    // Parse multiplier from strings like "1.5x", "1-5x", "2x", etc.
    // Replace '-' with '.' to handle "1-5x" -> 1.5, then remove 'x'
    const cleaned = raw.replace(/-/g, '.').replace(/x/g, '')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 1
  }

  const handleReset = () => {
    // Clear local slider values
    setSliderValues({})
    
    // Restore size values from original values and update tokens in store
    Object.keys(originalValues).forEach((tokenName) => {
      const num = originalValues[tokenName]
      if (Number.isFinite(num)) {
        // Update token in store (this updates CSS vars)
        updateToken(tokenName, num)
        // Also update override for backwards compatibility
        setOverride(tokenName, num)
      }
    })
    
    // Remove all size overrides that aren't in the original JSON
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-size overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('size/')) {
        updated[k] = all[k]
      }
    })
    
    // Add back only the original size values
    Object.keys(originalValues).forEach((tokenName) => {
      updated[tokenName] = originalValues[tokenName]
    })
    
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
                
                if (checked) {
                  // When enabling auto scale, compute and update all scaled sizes
                  const defaultItem = items.find((i) => i.name === 'size/default')
                  if (defaultItem) {
                    // Get default value from store
                    let defaultValue: number
                    try {
                      const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
                      const defaultRaw = src['default']?.$value
                      const defaultV = (defaultRaw && typeof defaultRaw === 'object' && typeof defaultRaw.value !== 'undefined') ? defaultRaw.value : defaultRaw
                      const defaultNum = typeof defaultV === 'number' ? defaultV : Number(defaultV)
                      defaultValue = Number.isFinite(defaultNum) ? defaultNum : Number((values['size/default'] as any) ?? defaultItem.value ?? 0)
                    } catch {
                      defaultValue = Number((values['size/default'] as any) ?? defaultItem.value ?? 0)
                    }
                    
                    items.forEach((it) => {
                      const rawKey = it.name.replace('size/', '')
                      const isNone = rawKey === 'none'
                      const isDefault = rawKey === 'default'
                      if (!isNone && !isDefault) {
                        const mul = parseMultiplier(rawKey)
                        const computed = Math.round(defaultValue * mul)
                        updateToken(it.name, computed)
                        setOverride(it.name, computed)
                      }
                    })
                  }
                }
                // When disabling, values will be read from store/overrides which have the original values
              }}
              layer="layer-0"
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'grid', gap: 0 }}>
        {items.map((it, index) => {
          const rawKey = it.name.replace('size/', '')
          const label = (rawKey === 'default' || rawKey === 'none') ? rawKey.charAt(0).toUpperCase() + rawKey.slice(1) : rawKey
          const isNone = rawKey === 'none'
          const isDefault = rawKey === 'default'
          
          // Read current value from store (tokensJson) first, then fall back to local state, then original value
          const storeValue = (() => {
            try {
              const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
              const rawValue = src[rawKey]?.$value
              const v = (rawValue && typeof rawValue === 'object' && typeof rawValue.value !== 'undefined') ? rawValue.value : rawValue
              const num = typeof v === 'number' ? v : Number(v)
              if (Number.isFinite(num)) return num
            } catch {}
            return null
          })()
          
          // Get the current default value from store
          const defaultStoreValue = (() => {
            try {
              const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
              const defaultRaw = src['default']?.$value
              const defaultV = (defaultRaw && typeof defaultRaw === 'object' && typeof defaultRaw.value !== 'undefined') ? defaultRaw.value : defaultRaw
              const defaultNum = typeof defaultV === 'number' ? defaultV : Number(defaultV)
              if (Number.isFinite(defaultNum)) return defaultNum
            } catch {}
            return null
          })()
          
          // Get the default value - use local slider value if dragging default with auto scale
          const defaultSliderValue = sliderValues['size/default']
          const effectiveDefault = (scaleByDefault && isDefault && defaultSliderValue !== undefined) 
            ? defaultSliderValue 
            : (defaultStoreValue ?? (values['size/default'] as any) ?? (items.find((i) => i.name === 'size/default')?.value as any) ?? 0)
          
          const currentDefault = Number(effectiveDefault)
          const mul = parseMultiplier(rawKey)
          const computed = Math.round(currentDefault * mul)
          
          // Use local slider value if dragging with auto scale enabled, otherwise use store/override value
          const baseValue = isNone ? 0 : (scaleByDefault && !isDefault) ? computed : (storeValue ?? (values[it.name] as any) ?? (it.value as any))
          // For default size with auto scale, use slider value if dragging; for non-default with auto scale, computed is already based on default slider value
          const current: any = (scaleByDefault && isDefault && sliderValues[it.name] !== undefined) 
            ? sliderValues[it.name] 
            : baseValue
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
                    if (scaleByDefault && isDefault) {
                      // When auto scale is enabled and dragging default, update local state for smooth UI
                      setSliderValues((prev) => ({ ...prev, [it.name]: next }))
                      // Also update local values for preview
                      setValues((prev) => ({ ...prev, [it.name]: next }))
                    } else if (!scaleByDefault) {
                      // When auto scale is disabled, update immediately
                      setValues((prev) => ({ ...prev, [it.name]: next }))
                      updateToken(it.name, next)
                      setOverride(it.name, next as any)
                    }
                  }}
                  onChangeCommitted={(val) => {
                    const next = typeof val === 'number' ? val : val[0]
                    if (scaleByDefault && isDefault) {
                      // Update default size in store
                      setValues((prev) => ({ ...prev, [it.name]: next }))
                      updateToken(it.name, next)
                      setOverride(it.name, next as any)
                      
                      // Update all scaled sizes
                      items.forEach((otherIt) => {
                        const otherRawKey = otherIt.name.replace('size/', '')
                        const otherIsNone = otherRawKey === 'none'
                        const otherIsDefault = otherRawKey === 'default'
                        if (!otherIsNone && !otherIsDefault) {
                          const mul = parseMultiplier(otherRawKey)
                          const computed = Math.round(next * mul)
                          updateToken(otherIt.name, computed)
                          setOverride(otherIt.name, computed)
                        }
                      })
                      
                      // Clear local slider values
                      setSliderValues((prev) => {
                        const next = { ...prev }
                        delete next[it.name]
                        return next
                      })
                    } else if (!scaleByDefault) {
                      // Already updated in onChange when auto scale is disabled
                    }
                  }}
                  min={0}
                  max={100}
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
                    if (scaleByDefault && isDefault) {
                      // When auto scale is enabled and changing default, update local state for preview
                      setValues((prev) => ({ ...prev, [it.name]: next }))
                    } else {
                      // When auto scale is disabled, or it's not the default, update immediately
                      setValues((prev) => ({ ...prev, [it.name]: next }))
                      updateToken(it.name, next)
                      setOverride(it.name, next as any)
                    }
                  }
                }}
                onBlur={(e) => {
                  // On blur (when user finishes editing), commit the change
                  const next = Number(e.currentTarget.value)
                  if (Number.isFinite(next)) {
                    if (scaleByDefault && isDefault) {
                      // Update default size in store
                      updateToken(it.name, next)
                      setOverride(it.name, next as any)
                      
                      // Update all scaled sizes
                      items.forEach((otherIt) => {
                        const otherRawKey = otherIt.name.replace('size/', '')
                        const otherIsNone = otherRawKey === 'none'
                        const otherIsDefault = otherRawKey === 'default'
                        if (!otherIsNone && !otherIsDefault) {
                          const mul = parseMultiplier(otherRawKey)
                          const computed = Math.round(next * mul)
                          updateToken(otherIt.name, computed)
                          setOverride(otherIt.name, computed)
                        }
                      })
                    }
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
