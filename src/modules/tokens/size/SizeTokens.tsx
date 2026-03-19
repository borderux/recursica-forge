import React, { useMemo, useState, useEffect } from 'react'
import { useThemeMode } from '../../theme/ThemeModeContext'
import tokensImport from '../../../../recursica_tokens.json'
import { Slider } from '../../../components/adapters/Slider'
import { Button } from '../../../components/adapters/Button'
import { Switch } from '../../../components/adapters/Switch'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { genericLayerText } from '../../../core/css/cssVarBuilder'
import { tokenSize } from '../../../core/css/cssVarBuilder'
import { readCssVarNumber } from '../../../core/css/readCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'

export default function SizeTokens() {
  const { mode } = useThemeMode()

  // Original values from the static JSON import (for reset)
  const originalValues = useMemo(() => {
    const map: Record<string, number> = {}
    try {
      const src: any = (tokensImport as any)?.tokens?.sizes || (tokensImport as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$') && !k.startsWith('elevation-')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) map[k] = num
      })
    } catch { }
    return map
  }, [])

  // Token keys in their original order
  const tokenKeys = useMemo(() => {
    try {
      const src: any = (tokensImport as any)?.tokens?.sizes || (tokensImport as any)?.tokens?.size || {}
      return Object.keys(src).filter((k) => !k.startsWith('$') && !k.startsWith('elevation-'))
    } catch { }
    return []
  }, [])

  // Read current values from CSS variables
  const readAllFromCss = (): Record<string, number> => {
    const map: Record<string, number> = {}
    tokenKeys.forEach((k) => {
      map[k] = readCssVarNumber(tokenSize(k), originalValues[k] ?? 0)
    })
    return map
  }

  const [values, setValues] = useState<Record<string, number>>(readAllFromCss)

  // Re-read from CSS vars when cssVarsUpdated fires (e.g., after reset or recompute)
  useEffect(() => {
    const handler = () => {
      setValues(readAllFromCss())
    }
    window.addEventListener('cssVarsUpdated', handler)
    window.addEventListener('tokenOverridesChanged', handler)
    return () => {
      window.removeEventListener('cssVarsUpdated', handler)
      window.removeEventListener('tokenOverridesChanged', handler)
    }
  }, [tokenKeys])

  const [scaleByDefault, setScaleByDefault] = useState(true)

  // Local state to track slider values during drag (for smooth UI when auto-scale is on)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})

  function parseMultiplier(raw: string): number {
    if (raw === 'default') return 1
    if (raw === 'none') return 0
    const cleaned = raw.replace(/-/g, '.').replace(/x/g, '')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 1
  }

  // Write a size value to the CSS var (and delta)
  const writeSizeCssVar = (key: string, num: number) => {
    updateCssVar(tokenSize(key), `${num}px`)
  }

  const handleReset = () => {
    setSliderValues({})
    // Restore all sizes to original JSON values
    Object.keys(originalValues).forEach((key) => {
      writeSizeCssVar(key, originalValues[key])
    })
    setValues({ ...originalValues })
  }

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--recursica_brand_dimensions_gutters_vertical)',
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
          fontSize: 'var(--recursica_brand_typography_h2-font-size)',
          fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
          color: `var(${genericLayerText(0, 'color')})`,
          opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
        }}>
          Size
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_general_md)' }}>
          <Button
            variant="outline"
            size="small"
            onClick={handleReset}
            icon={(() => {
              const RefreshIcon = iconNameToReactComponent('arrow-path')
              return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
            })()}
          >
            Reset all
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_general_sm)' }}>
            <span style={{
              fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
              color: `var(${genericLayerText(0, 'color')})`,
              opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
            }}>
              Auto scale
            </span>
            <Switch
              checked={scaleByDefault}
              onChange={(checked) => {
                setScaleByDefault(checked)
                if (checked) {
                  // When enabling auto-scale, recalculate all scaled sizes from the current default
                  const defaultValue = values['default'] ?? originalValues['default'] ?? 0
                  tokenKeys.forEach((key) => {
                    if (key !== 'none' && key !== 'default') {
                      const mul = parseMultiplier(key)
                      const computed = Math.round(defaultValue * mul)
                      writeSizeCssVar(key, computed)
                    }
                  })
                  setValues(readAllFromCss())
                }
              }}
              layer="layer-0"
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'grid', gap: 'var(--recursica_brand_dimensions_general_sm)' }}>
        {tokenKeys.map((rawKey, index) => {
          const label = (rawKey === 'default' || rawKey === 'none') ? rawKey.charAt(0).toUpperCase() + rawKey.slice(1) : rawKey
          const isNone = rawKey === 'none'
          const isDefault = rawKey === 'default'

          // Get current default value (may be from slider during drag)
          const defaultSliderValue = sliderValues['default']
          const effectiveDefault = (scaleByDefault && isDefault && defaultSliderValue !== undefined)
            ? defaultSliderValue
            : (values['default'] ?? originalValues['default'] ?? 0)
          const currentDefault = Number(effectiveDefault)
          const mul = parseMultiplier(rawKey)
          const computed = Math.round(currentDefault * mul)

          // Determine displayed value
          const current: number = isNone
            ? 0
            : (scaleByDefault && isDefault && sliderValues[rawKey] !== undefined)
              ? sliderValues[rawKey]
              : (scaleByDefault && !isDefault)
                ? computed
                : (values[rawKey] ?? originalValues[rawKey] ?? 0)

          const disabled = isNone || (scaleByDefault && !isDefault)
          const isLast = index === tokenKeys.length - 1

          return (
            <div key={rawKey} style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              gap: 'var(--recursica_brand_dimensions_general_md)',
              alignItems: 'center',
              paddingTop: 0,
              paddingBottom: isLast ? 0 : 'var(--recursica_brand_dimensions_general_default)',
            }}>
              <label htmlFor={`size/${rawKey}`} style={{
                fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                color: `var(${genericLayerText(0, 'color')})`,
                opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
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
                      // Dragging default with auto-scale: update local slider state for smooth UI
                      setSliderValues((prev) => ({ ...prev, [rawKey]: next }))
                    } else if (!scaleByDefault) {
                      // No auto-scale: update CSS var immediately
                      writeSizeCssVar(rawKey, next)
                      setValues((prev) => ({ ...prev, [rawKey]: next }))
                    }
                  }}
                  onChangeCommitted={(val) => {
                    const next = typeof val === 'number' ? val : val[0]
                    if (scaleByDefault && isDefault) {
                      // Commit default: update default + all scaled sizes
                      writeSizeCssVar(rawKey, next)
                      tokenKeys.forEach((key) => {
                        if (key !== 'none' && key !== 'default') {
                          const m = parseMultiplier(key)
                          const c = Math.round(next * m)
                          writeSizeCssVar(key, c)
                        }
                      })
                      // Clear slider drag state
                      setSliderValues((prev) => {
                        const copy = { ...prev }
                        delete copy[rawKey]
                        return copy
                      })
                      setValues(readAllFromCss())
                    }
                    // No else needed — non-auto-scale writes happen in onChange
                  }}
                  min={0}
                  max={100}
                  step={1}
                  disabled={disabled}
                  layer="layer-1"
                  layout="stacked"
                  showInput={true}
                  showValueLabel={false}
                  valueLabel={(val: number) => `${Math.round(val)}px`}
                  showMinMaxLabels={false} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
