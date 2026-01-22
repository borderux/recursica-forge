import { useState, useEffect, useMemo, useRef } from 'react'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { Button } from '../../components/adapters/Button'
import { Label } from '../../components/adapters/Label'
import Dropdown from '../toolbar/menu/dropdown/Dropdown'
import { iconNameToReactComponent } from '../components/iconUtils'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'

export default function ElementsModalDemo() {
  const { mode } = useThemeMode()
  const { tokens: tokensJson } = useVars()
  const modeLower = mode.toLowerCase()
  
  // Get opacity tokens and build dropdown options
  const opacityOptions = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ key: string; label: string; tokenName: string }> = Object.keys(src)
      .filter((k) => !k.startsWith('$'))
      .map((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        const percentage = Math.round((num <= 1 ? num : num / 100) * 100)
        const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
        return {
          key: k,
          label: `${label} (${percentage}%)`,
          tokenName: `opacity/${k}`,
        }
      })
      .filter((it) => Number.isFinite(parseFloat(String(it.key))))
    list.sort((a, b) => {
      const aVal = src[a.key]?.$value
      const bVal = src[b.key]?.$value
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal)
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal)
      return aNum - bNum
    })
    return list
  }, [tokensJson])

  // Extract current opacity token from CSS variable
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      const rawValue = readCssVar(cssVar)
      if (!rawValue) return null
      
      // Match patterns like: var(--recursica-tokens-opacities-solid) or var(--tokens-opacities-solid)
      let match = rawValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return match[1]
      
      // If no direct match, try resolving nested var() references
      const resolvedValue = readCssVarResolved(cssVar)
      if (resolvedValue) {
        match = resolvedValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
        if (match) return match[1]
        
        // If resolved to a numeric value, try to find matching token by value
        const resolvedNum = parseFloat(resolvedValue)
        if (!isNaN(resolvedNum)) {
          const normalized = resolvedNum <= 1 ? resolvedNum : resolvedNum / 100
          const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
          for (const [key, val] of Object.entries(src)) {
            if (key.startsWith('$')) continue
            const v = (val as any)?.$value
            const num = typeof v === 'number' ? v : Number(v)
            const tokenNormalized = num <= 1 ? num : num / 100
            if (Math.abs(tokenNormalized - normalized) < 0.01) {
              return key
            }
          }
        }
      }
    } catch {}
    return null
  }

  // Get current selected values from CSS variables
  const getCurrentSelection = (cssVar: string): string => {
    const tokenKey = extractTokenFromCssVar(cssVar)
    return tokenKey || opacityOptions[0]?.key || ''
  }

  const [selectedHigh, setSelectedHigh] = useState(() => 
    getCurrentSelection(`--recursica-brand-themes-${modeLower}-text-emphasis-high`)
  )
  const [selectedLow, setSelectedLow] = useState(() => 
    getCurrentSelection(`--recursica-brand-themes-${modeLower}-text-emphasis-low`)
  )
  const [selectedDisabled, setSelectedDisabled] = useState(() => 
    getCurrentSelection(`--recursica-brand-themes-${modeLower}-state-disabled`)
  )

  // Listen for opacity changes and update dropdown values
  useEffect(() => {
    const handleUpdate = () => {
      setSelectedHigh(getCurrentSelection(`--recursica-brand-themes-${modeLower}-text-emphasis-high`))
      setSelectedLow(getCurrentSelection(`--recursica-brand-themes-${modeLower}-text-emphasis-low`))
      setSelectedDisabled(getCurrentSelection(`--recursica-brand-themes-${modeLower}-state-disabled`))
    }
    
    window.addEventListener('tokenOverridesChanged', handleUpdate as any)
    window.addEventListener('paletteVarsChanged', handleUpdate as any)
    
    // Also check periodically
    const interval = setInterval(handleUpdate, 200)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('tokenOverridesChanged', handleUpdate as any)
      window.removeEventListener('paletteVarsChanged', handleUpdate as any)
    }
  }, [modeLower, opacityOptions, tokensJson])

  const HouseIcon = iconNameToReactComponent('house')
  const XIcon = iconNameToReactComponent('x-mark')
  const PencilIcon = iconNameToReactComponent('pencil')
  const ResetIcon = iconNameToReactComponent('arrow-path')
  const editOverlayButtonRef = useRef<HTMLDivElement>(null)

  // Checkerboard pattern
  const checkerboardStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
  }

  return (
    <div style={{
      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-surface)`,
      border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-border-color)`,
      borderRadius: 'var(--recursica-brand-dimensions-border-radii-lg)',
      padding: `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-padding)`,
      boxShadow: `var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-x-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-y-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-blur) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-spread) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-shadow-color)`,
      position: 'relative',
    }}>
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
          color: `var(--recursica-brand-themes-${modeLower}-layer-layer-0-property-element-text-color)`,
        }}>Elements</h2>
        <div ref={editOverlayButtonRef}>
          <Button
            variant="outline"
            size="small"
            icon={PencilIcon ? <PencilIcon /> : undefined}
            onClick={() => {
              if (editOverlayButtonRef.current && (window as any).openPalettePicker) {
                const overlayColorVar = `--recursica-brand-themes-${modeLower}-state-overlay-color`
                const overlayOpacityVar = `--recursica-brand-themes-${modeLower}-state-overlay-opacity`
                ;(window as any).openPalettePicker(editOverlayButtonRef.current, overlayColorVar, undefined, overlayOpacityVar)
              }
            }}
          >
            Edit overlay
          </Button>
        </div>
      </div>

      {/* Modal demo area */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--recursica-brand-dimensions-general-xl)',
      }}>
        {/* Checkerboard background */}
        <div style={checkerboardStyle} />

        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `var(--recursica-brand-themes-${modeLower}-state-overlay-color)`,
          opacity: `var(--recursica-brand-themes-${modeLower}-state-overlay-opacity)`,
          zIndex: 1,
        }} />

        {/* Modal */}
        <div style={{
          position: 'relative',
          width: '550px',
          maxWidth: '90%',
          minHeight: '400px',
          backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-surface)`,
          border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-border-color)`,
          borderRadius: `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-border-radius)`,
          padding: 'var(--recursica-brand-dimensions-general-xl)',
          boxShadow: `var(--recursica-brand-themes-${modeLower}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-4-blur) var(--recursica-brand-themes-${modeLower}-elevations-elevation-4-spread) var(--recursica-brand-themes-${modeLower}-elevations-elevation-4-shadow-color)`,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
        }}>
          {/* Modal header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--recursica-brand-typography-h3-font-family)',
              fontSize: 'var(--recursica-brand-typography-h3-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h3-font-weight)',
              color: `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-element-text-color)`,
            }}>
              Modal title
            </h3>
            {XIcon && (
              <div style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: `var(--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone)`,
                cursor: 'default', // Can't be closed
              }}>
                <XIcon style={{ width: '16px', height: '16px' }} />
              </div>
            )}
          </div>

          {/* Emphasis tabs */}
          <div style={{
            display: 'flex',
            gap: 'var(--recursica-brand-dimensions-general-sm)',
          }}>
            {[
              { label: 'High emphasis', opacityVar: `--recursica-brand-themes-${modeLower}-text-emphasis-high` },
              { label: 'Low emphasis', opacityVar: `--recursica-brand-themes-${modeLower}-text-emphasis-low` },
              { label: 'Disabled', opacityVar: `--recursica-brand-themes-${modeLower}-state-disabled` },
            ].map((item, index) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  padding: `var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)`,
                  border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-border-color)`,
                  borderRadius: '999px', // Fully rounded pill shape
                  backgroundColor: index === 0 
                    ? `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-surface)`
                    : 'transparent',
                  color: `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-element-text-color)`,
                  opacity: `var(${item.opacityVar})`,
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--recursica-brand-dimensions-general-sm)',
                  justifyContent: 'center',
                }}
              >
                {HouseIcon && <HouseIcon style={{ width: '16px', height: '16px' }} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Dropdowns */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica-brand-dimensions-gutters-vertical)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Label layer="layer-3">
                High emphasis text / icons
              </Label>
              <Dropdown
                trigger={
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      if ((window as any).openOpacityPicker) {
                        (window as any).openOpacityPicker(e.currentTarget, `--recursica-brand-themes-${modeLower}-text-emphasis-high`)
                      }
                    }}
                    style={{
                      padding: `var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)`,
                      border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-border-color)`,
                      borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
                      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-surface)`,
                      color: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-element-text-color)`,
                      fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--recursica-brand-dimensions-general-sm)',
                    }}>
                    <span>{opacityOptions.find(o => o.key === selectedHigh)?.label || 'Select...'}</span>
                    <span style={{ fontSize: '12px' }}>▼</span>
                  </button>
                }
                items={opacityOptions.map(o => ({ key: o.key, label: o.label }))}
                onSelect={(key) => {
                  const option = opacityOptions.find(o => o.key === key)
                  if (option && (window as any).openOpacityPicker) {
                    // Update the opacity token directly
                    const tokenKey = option.key
                    const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
                    const targetCssVar = `--recursica-brand-themes-${modeLower}-text-emphasis-high`
                    updateCssVar(targetCssVar, `var(${opacityCssVar})`)
                    setSelectedHigh(key)
                  }
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Label layer="layer-3">
                Low emphasis text / icons
              </Label>
              <Dropdown
                trigger={
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      if ((window as any).openOpacityPicker) {
                        (window as any).openOpacityPicker(e.currentTarget, `--recursica-brand-themes-${modeLower}-text-emphasis-low`)
                      }
                    }}
                    style={{
                      padding: `var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)`,
                      border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-border-color)`,
                      borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
                      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-surface)`,
                      color: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-element-text-color)`,
                      fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--recursica-brand-dimensions-general-sm)',
                    }}>
                    <span>{opacityOptions.find(o => o.key === selectedLow)?.label || 'Select...'}</span>
                    <span style={{ fontSize: '12px' }}>▼</span>
                  </button>
                }
                items={opacityOptions.map(o => ({ key: o.key, label: o.label }))}
                onSelect={(key) => {
                  const option = opacityOptions.find(o => o.key === key)
                  if (option && (window as any).openOpacityPicker) {
                    // Update the opacity token directly
                    const tokenKey = option.key
                    const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
                    const targetCssVar = `--recursica-brand-themes-${modeLower}-text-emphasis-low`
                    updateCssVar(targetCssVar, `var(${opacityCssVar})`)
                    setSelectedLow(key)
                  }
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Label layer="layer-3">
                Disabled interactive elements
              </Label>
              <Dropdown
                trigger={
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      if ((window as any).openOpacityPicker) {
                        (window as any).openOpacityPicker(e.currentTarget, `--recursica-brand-themes-${modeLower}-state-disabled`)
                      }
                    }}
                    style={{
                      padding: `var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)`,
                      border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-border-color)`,
                      borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
                      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-surface)`,
                      color: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-element-text-color)`,
                      fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                      fontSize: 'var(--recursica-brand-typography-body-font-size)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--recursica-brand-dimensions-general-sm)',
                    }}>
                    <span>{opacityOptions.find(o => o.key === selectedDisabled)?.label || 'Select...'}</span>
                    <span style={{ fontSize: '12px' }}>▼</span>
                  </button>
                }
                items={opacityOptions.map(o => ({ key: o.key, label: o.label }))}
                onSelect={(key) => {
                  const option = opacityOptions.find(o => o.key === key)
                  if (option && (window as any).openOpacityPicker) {
                    // Update the opacity token directly
                    const tokenKey = option.key
                    const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
                    const targetCssVar = `--recursica-brand-themes-${modeLower}-state-disabled`
                    updateCssVar(targetCssVar, `var(${opacityCssVar})`)
                    setSelectedDisabled(key)
                  }
                }}
              />
            </div>

            {/* Reset all button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'var(--recursica-brand-dimensions-gutters-vertical)',
            }}>
              <Button
                variant="outline"
                size="small"
                layer="layer-1"
                icon={ResetIcon ? <ResetIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : undefined}
                onClick={() => {
                  // Reset all opacities to default values from Brand.json
                  try {
                    // Default values from Brand.json:
                    // text-emphasis-high: {tokens.opacity.solid}
                    // text-emphasis-low: {tokens.opacity.smoky}
                    // state-disabled: {tokens.opacity.ghost}
                    const defaultHighToken = 'solid'
                    const defaultLowToken = 'smoky'
                    const defaultDisabledToken = 'ghost'
                    
                    // Reset CSS variables to default token references
                    const highCssVar = `--recursica-brand-themes-${modeLower}-text-emphasis-high`
                    const lowCssVar = `--recursica-brand-themes-${modeLower}-text-emphasis-low`
                    const disabledCssVar = `--recursica-brand-themes-${modeLower}-state-disabled`
                    
                    updateCssVar(highCssVar, `var(--recursica-tokens-opacities-${defaultHighToken})`)
                    updateCssVar(lowCssVar, `var(--recursica-tokens-opacities-${defaultLowToken})`)
                    updateCssVar(disabledCssVar, `var(--recursica-tokens-opacities-${defaultDisabledToken})`)
                    
                    // Update dropdown selections
                    setSelectedHigh(defaultHighToken)
                    setSelectedLow(defaultLowToken)
                    setSelectedDisabled(defaultDisabledToken)
                  } catch (err) {
                    console.error('Failed to reset opacities:', err)
                  }
                }}
              >
                Reset all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
