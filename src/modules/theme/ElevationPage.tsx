import './index.css'
import { useState, useEffect, useMemo, useRef } from 'react'
import EffectTokens from '../tokens/EffectTokens'
import { readOverrides, setOverride } from './tokenOverrides'
import tokensJson from '../../vars/Tokens.json'

interface ElevationControl {
  blurToken: string // Reference to effect token for blur
  spreadToken: string // Reference to effect token for spread
  offsetXToken: string // Reference to effect token for horizontal offset
  offsetYToken: string // Reference to effect token for vertical offset
}

interface ShadowColorControl {
  colorToken: string // Selected color token (e.g., 'color/gray/900', 'color/mandy/500')
  alphaToken: string // Reference to opacity token for alpha
}

// Shadow Color Picker Component
function ShadowColorPicker({ 
  onSelect, 
  currentColor 
}: { 
  onSelect: (tokenName: string, hex: string) => void
  currentColor: string 
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Helper function to get token value (same as PaletteGrid)
  const getTokenValueByName = (name: string): string | undefined => {
    // Prefer runtime overrides, then fall back to Tokens.json
    try {
      const overrides = readOverrides() as Record<string, any>
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
        const ov = overrides[name]
        if (ov != null) return String(ov)
      }
    } catch {}
    const entry: any = Object.values(tokensJson as Record<string, any>).find((e: any) => e && e.name === name)
    return entry ? String(entry.value) : undefined
  }

  // Track token override changes and palette family changes to make options reactive
  const [overrideVersion, setOverrideVersion] = useState(0)
  useEffect(() => {
    const tokenHandler = () => setOverrideVersion((v) => v + 1)
    const paletteHandler = () => setOverrideVersion((v) => v + 1)
    
    window.addEventListener('tokenOverridesChanged', tokenHandler as any)
    window.addEventListener('paletteFamilyChanged', paletteHandler as any)
    
    // Force initial update
    setOverrideVersion(1)
    
    return () => {
      window.removeEventListener('tokenOverridesChanged', tokenHandler as any)
      window.removeEventListener('paletteFamilyChanged', paletteHandler as any)
    }
  }, [])

  const options = useMemo(() => {
    // Get the actual palette families that are currently being used
    const getCurrentPaletteFamilies = (): string[] => {
      const families: string[] = []
      try {
        // Get the palette family mappings from localStorage
        const raw = localStorage.getItem('palette-grid-family:neutral')
        if (raw) families.push(JSON.parse(raw))
        
        const raw1 = localStorage.getItem('palette-grid-family:palette-1')
        if (raw1) families.push(JSON.parse(raw1))
        
        const raw2 = localStorage.getItem('palette-grid-family:palette-2')
        if (raw2) families.push(JSON.parse(raw2))
      } catch (e) {
        // Ignore errors
      }
      
      // Fallback to defaults if no mappings found
      if (families.length === 0) {
        families.push('gray', 'salmon', 'mandarin')
      }
      
      return families.filter(Boolean)
    }
    
    const mainPalettes = getCurrentPaletteFamilies()
    const byFamily: Record<string, Array<{ level: string; name: string; value: string }>> = {}
    
    mainPalettes.forEach((fam) => { byFamily[fam] = [] })
    
    Object.values(tokensJson as Record<string, any>).forEach((e: any) => {
      if (e && typeof e.name === 'string' && e.name.startsWith('color/')) {
        const parts = e.name.split('/')
        if (parts.length === 3) {
          const fam = parts[1]
          const lvl = parts[2]
          if (mainPalettes.includes(fam) && byFamily[fam]) {
            // Use the actual current value (including overrides) instead of static token value
            const currentValue = getTokenValueByName(e.name) || String(e.value)
            byFamily[fam].push({ level: lvl, name: e.name, value: currentValue })
          }
        }
      }
    })
    
    Object.values(byFamily).forEach((arr) => arr.sort((a, b) => Number(b.level) - Number(a.level)))
    return byFamily
  }, [overrideVersion])

  const openPicker = () => {
    if (buttonRef.current) {
      setAnchor(buttonRef.current)
      const rect = buttonRef.current.getBoundingClientRect()
      const top = rect.bottom + 8
      const left = Math.min(rect.left, window.innerWidth - 420)
      setPos({ top, left })
    }
  }

  const closePicker = () => {
    setAnchor(null)
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (anchor) {
        const target = e.target as Node
        // Check if click is outside both the button and the popup
        const isInsideButton = anchor.contains(target)
        const isInsidePopup = document.querySelector('[data-color-picker-popup]')?.contains(target)
        
        if (!isInsideButton && !isInsidePopup) {
          closePicker()
        }
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [anchor])

  const toTitle = (s: string) => {
    if (s === 'gray') return 'Neutral'
    if (s === 'mandarin') return 'Primary'
    if (s === 'salmon') return 'Secondary'
    return s.replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  }

  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const labelCol = 110
  const swatch = 18
  const gap = 1
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openPicker}
        style={{
          width: '60px',
          height: '40px',
          background: currentColor,
          border: '2px solid var(--layer-layer-1-property-border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        title={`Current shadow color: ${currentColor}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.borderColor = 'var(--layer-layer-2-property-border-color)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = 'var(--layer-layer-1-property-border-color)'
        }}
      >
        <span style={{ 
          fontSize: '0.75rem', 
          color: currentColor === '#000000' || currentColor === '#ffffff' ? 'var(--layer-layer-0-property-element-text-color)' : 'white',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          fontWeight: '500'
        }}>
          Pick
        </span>
      </button>
      
      {anchor && (
        <div 
          data-color-picker-popup
          style={{ 
            position: 'fixed', 
            top: pos.top, 
            left: pos.left, 
            width: overlayWidth, 
            background: 'var(--layer-layer-0-property-surface)', 
            border: '1px solid var(--layer-layer-1-property-border-color)', 
            borderRadius: 8, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', 
            padding: 10, 
            zIndex: 1100,
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8 
          }}>
            <div style={{ fontWeight: 600, color: 'var(--layer-layer-0-property-element-text-color)' }}>Pick Shadow Color</div>
            <button 
              onClick={closePicker} 
              aria-label="Close" 
              style={{ 
                border: 'none', 
                background: 'transparent', 
                cursor: 'pointer', 
                fontSize: 16,
                color: 'var(--layer-layer-0-property-element-text-color)'
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {Object.entries(options).map(([family, items]) => (
              <div key={family} style={{ 
                display: 'grid', 
                gridTemplateColumns: `${labelCol}px 1fr`, 
                alignItems: 'center', 
                gap: 6 
              }}>
                <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize', color: 'var(--layer-layer-0-property-element-text-color)' }}>
                  {toTitle(family)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
                  {items.map((it) => (
                    <div 
                      key={it.name} 
                      title={it.name} 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onSelect(it.name, it.value)
                        closePicker()
                      }} 
                      style={{ 
                        width: swatch, 
                        height: swatch, 
                        background: it.value, 
                        cursor: 'pointer', 
                        border: '1px solid rgba(0,0,0,0.15)', 
                        flex: '0 0 auto',
                        borderRadius: '2px'
                      }} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function ElevationPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [shadowColorControl, setShadowColorControl] = useState<ShadowColorControl>(() => {
    try {
      const saved = localStorage.getItem('shadow-color-control')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load shadow color control from localStorage')
    }
    return {
      colorToken: 'color/gray/900',
      alphaToken: 'opacity/veiled'
    }
  })
  const [elevationControls, setElevationControls] = useState<Record<string, ElevationControl>>(() => {
    // Initialize with default values
    const defaults: Record<string, ElevationControl> = {}
    for (let i = 0; i <= 4; i++) {
      // Map elevations to available effect tokens
      let blurToken = 'effect/none'
      if (i === 1) blurToken = 'effect/default'
      else if (i === 2) blurToken = 'effect/2x'
      else if (i === 3) blurToken = 'effect/3x'
      else if (i === 4) blurToken = 'effect/4x'
      
      defaults[`elevation-${i}`] = {
        blurToken: blurToken,
        spreadToken: 'effect/none', // Default spread to none
        offsetXToken: 'effect/none', // Default horizontal offset to none
        offsetYToken: i === 0 ? 'effect/none' : `effect/${i}x` // Default vertical offset
      }
    }
    return defaults
  })

  // Get current effect token values - make it reactive to changes
  const [effectTokens, setEffectTokens] = useState<Record<string, number>>(() => {
    const tokens: Record<string, number> = {}
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && entry.name.startsWith('effect/') && typeof entry.value === 'number') {
        tokens[entry.name] = entry.value
      }
    })
    const overrides = readOverrides()
    return { ...tokens, ...overrides }
  })

  // State to trigger re-renders when tokens change (for shadow color)
  const [tokenUpdateTrigger, setTokenUpdateTrigger] = useState(0)

  // Load saved elevation controls from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('elevation-controls')
      if (saved) {
        const parsed = JSON.parse(saved)
        setElevationControls(parsed)
      }
    } catch (e) {
      console.warn('Failed to load elevation controls from localStorage')
    }
  }, [])

  // Save elevation controls to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('elevation-controls', JSON.stringify(elevationControls))
    } catch (e) {
      console.warn('Failed to save elevation controls to localStorage')
    }
  }, [elevationControls])

  // Save shadow color control to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shadow-color-control', JSON.stringify(shadowColorControl))
    } catch (e) {
      console.warn('Failed to save shadow color control to localStorage')
    }
  }, [shadowColorControl])


  // Listen for token changes
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value } = detail
      
      if (all && typeof all === 'object') {
        // Update effect tokens when all tokens are updated
        const newEffectTokens: Record<string, number> = {}
        Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
          if (entry && typeof entry.name === 'string' && entry.name.startsWith('effect/') && typeof entry.value === 'number') {
            newEffectTokens[entry.name] = entry.value
          }
        })
        setEffectTokens({ ...newEffectTokens, ...all })
        // Force re-render for shadow color updates
        setShadowColorControl(prev => ({ ...prev }))
        return
      }
      
      if (typeof name === 'string' && (name.startsWith('effect/') || name.startsWith('opacity/') || name.startsWith('color/'))) {
        // Update specific token
        if (name.startsWith('effect/')) {
          setEffectTokens(prev => ({
            ...prev,
            [name]: value
          }))
        }
        // Force re-render for shadow color updates
        setShadowColorControl(prev => ({ ...prev }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])

  const updateElevationControl = (elevation: string, property: 'blurToken' | 'spreadToken' | 'offsetXToken' | 'offsetYToken', value: string) => {
    setElevationControls(prev => ({
      ...prev,
      [elevation]: {
        ...prev[elevation],
        [property]: value
      }
    }))
  }

  const getBlurValue = (elevation: string) => {
    const control = elevationControls[elevation]
    if (!control) return 0
    
    const tokenValue = effectTokens[control.blurToken]
    return tokenValue || 0
  }

  const getSpreadValue = (elevation: string) => {
    const control = elevationControls[elevation]
    if (!control) return 0
    
    const tokenValue = effectTokens[control.spreadToken]
    return tokenValue || 0
  }

  const getOffsetXValue = (elevation: string) => {
    const control = elevationControls[elevation]
    if (!control) return 0
    
    const tokenValue = effectTokens[control.offsetXToken]
    return tokenValue || 0
  }

  const getOffsetYValue = (elevation: string) => {
    const control = elevationControls[elevation]
    if (!control) return 0
    
    const tokenValue = effectTokens[control.offsetYToken]
    return tokenValue || 0
  }

  // Helper function to get token value (same as PaletteGrid)
  const getTokenValueByName = (name: string): string | undefined => {
    // Prefer runtime overrides, then fall back to Tokens.json
    try {
      const overrides = readOverrides() as Record<string, any>
      if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) {
        const ov = overrides[name]
        if (ov != null) {
          return String(ov)
        }
      }
    } catch {}
    const entry: any = Object.values(tokensJson as Record<string, any>).find((e: any) => e && e.name === name)
    const result = entry ? String(entry.value) : undefined
    return result
  }

  const getBaseColor = useMemo(() => {
    // Get color value from the selected color token (without alpha)
    const colorValue = getTokenValueByName(shadowColorControl.colorToken) || '#000000'
    return colorValue
  }, [shadowColorControl.colorToken, tokenUpdateTrigger])

  const getShadowColor = useMemo(() => {
    // Get alpha value from opacity tokens
    const alphaValue = Number(getTokenValueByName(shadowColorControl.alphaToken)) || 0
    const alpha = alphaValue / 100 // Convert percentage to decimal
    
    // Get the base color
    const colorValue = getBaseColor
    
    // Convert hex to rgba
    const hex = colorValue.replace('#', '')
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      const result = `rgba(${r}, ${g}, ${b}, ${alpha})`
      return result
    }
    
    // Fallback to the original color if hex parsing fails
    return colorValue
  }, [getBaseColor, shadowColorControl.alphaToken, tokenUpdateTrigger])

  const getElevationStyle = useMemo(() => {
    return (elevation: string) => {
      const control = elevationControls[elevation]
      if (!control) return {}
      
      const blurValue = getBlurValue(elevation)
      const spreadValue = getSpreadValue(elevation)
      const offsetXValue = getOffsetXValue(elevation)
      const offsetYValue = getOffsetYValue(elevation)
      const shadowColor = getShadowColor
      
      const boxShadow = `${offsetXValue}px ${offsetYValue}px ${blurValue}px ${spreadValue}px ${shadowColor}`
      
      return {
        backgroundColor: 'var(--layer-layer-0-property-surface)',
        boxShadow: boxShadow
      }
    }
  }, [elevationControls, getShadowColor, tokenUpdateTrigger, effectTokens])

  // Get available effect tokens for dropdowns
  const availableEffectTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && entry.name.startsWith('effect/') && typeof entry.value === 'number') {
        const label = entry.name.replace('effect/', '').replace('-', '.')
        tokens.push({
          name: entry.name,
          value: entry.value,
          label: label === 'none' ? 'None' : label === 'default' ? 'Default' : `${label}x`
        })
      }
    })
    // Sort tokens by value
    return tokens.sort((a, b) => a.value - b.value)
  }, [])

  // Get available opacity tokens
  const availableOpacityTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && typeof entry.name === 'string' && entry.name.startsWith('opacity/') && typeof entry.value === 'number') {
        const label = entry.name.replace('opacity/', '')
        tokens.push({
          name: entry.name,
          value: entry.value,
          label: label.charAt(0).toUpperCase() + label.slice(1)
        })
      }
    })
    // Sort tokens by value
    return tokens.sort((a, b) => a.value - b.value)
  }, [])


  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Elevation</h2>
            <button
              onClick={() => setIsPanelOpen(true)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
            >Edit Tokens</button>
          </div>
          
          {/* Shadow Color Controls */}
          <div className="shadow-color-controls" style={{ marginBottom: '24px', padding: '16px', background: 'var(--layer-layer-1-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Shadow Color</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div className="control-group" style={{ minWidth: '200px' }}>
                <label>
                  Alpha: {(() => {
                    let alphaValue = 0
                    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
                      if (entry && entry.name === shadowColorControl.alphaToken && entry.value) {
                        alphaValue = entry.value
                      }
                    })
                    return alphaValue
                  })()}%
                </label>
                <select
                  value={shadowColorControl.alphaToken}
                  onChange={(e) => setShadowColorControl(prev => ({ ...prev, alphaToken: e.target.value }))}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                >
                  {availableOpacityTokens.map(token => (
                    <option key={token.name} value={token.name}>
                      {token.label} ({token.value}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group" style={{ minWidth: '100px' }}>
                <label>Color</label>
                <ShadowColorPicker
                  onSelect={(tokenName, hex) => {
                    setShadowColorControl(prev => {
                      const newState = { ...prev, colorToken: tokenName }
                      // Save to localStorage with the new state
                      localStorage.setItem('shadow-color-control', JSON.stringify(newState))
                      return newState
                    })
                    // Force a re-render to update the shadow colors
                    setTokenUpdateTrigger(prev => prev + 1)
                  }}
                  currentColor={getBaseColor}
                />
              </div>
            </div>
          </div>
          
          <div className="elevation-grid">
            {[0, 1, 2, 3, 4].map(i => {
              const elevation = `elevation-${i}`
              const control = elevationControls[elevation]
              return (
                <div key={i} className="elevation-card">
                  <div className="card text-center" style={getElevationStyle(elevation)}>
                    <span style={{ color: 'var(--color-black)' }}>{i}</span>
                  </div>
                  <div className="elevation-controls">
                    <div className="control-group">
                      <label>
                        Blur: {getBlurValue(elevation)}px
                        {control?.blurToken && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 4 }}>
                            ({control.blurToken.replace('effect/', '')})
                          </span>
                        )}
                      </label>
                      <select
                        value={control?.blurToken || 'effect/none'}
                        onChange={(e) => updateElevationControl(elevation, 'blurToken', e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                      >
                        {availableEffectTokens.map(token => (
                          <option key={token.name} value={token.name}>
                            {token.label} ({token.value}px)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="control-group">
                      <label>
                        Spread: {getSpreadValue(elevation)}px
                        {control?.spreadToken && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 4 }}>
                            ({control.spreadToken.replace('effect/', '')})
                          </span>
                        )}
                      </label>
                      <select
                        value={control?.spreadToken || 'effect/none'}
                        onChange={(e) => updateElevationControl(elevation, 'spreadToken', e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                      >
                        {availableEffectTokens.map(token => (
                          <option key={token.name} value={token.name}>
                            {token.label} ({token.value}px)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="control-group">
                      <label>
                        Offset X: {getOffsetXValue(elevation)}px
                        {control?.offsetXToken && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 4 }}>
                            ({control.offsetXToken.replace('effect/', '')})
                          </span>
                        )}
                      </label>
                      <select
                        value={control?.offsetXToken || 'effect/none'}
                        onChange={(e) => updateElevationControl(elevation, 'offsetXToken', e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                      >
                        {availableEffectTokens.map(token => (
                          <option key={token.name} value={token.name}>
                            {token.label} ({token.value}px)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="control-group">
                      <label>
                        Offset Y: {getOffsetYValue(elevation)}px
                        {control?.offsetYToken && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 4 }}>
                            ({control.offsetYToken.replace('effect/', '')})
                          </span>
                        )}
                      </label>
                      <select
                        value={control?.offsetYToken || 'effect/none'}
                        onChange={(e) => updateElevationControl(elevation, 'offsetYToken', e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                      >
                        {availableEffectTokens.map(token => (
                          <option key={token.name} value={token.name}>
                            {token.label} ({token.value}px)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div
          aria-hidden={!isPanelOpen}
          style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1000, padding: 12, overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Effect Tokens</div>
            <button onClick={() => setIsPanelOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
          </div>
          <EffectTokens />
        </div>
      </div>
    </div>
  )
}

