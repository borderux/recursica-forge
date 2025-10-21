import './index.css'
import { useState, useEffect, useMemo } from 'react'
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
  paletteKey: string // Selected palette (e.g., 'neutral', 'palette-1', 'palette-2')
  colorShade: string // Selected color shade (e.g., '050', '100', '200', ..., '900')
  alphaToken: string // Reference to opacity token for alpha
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
      paletteKey: 'gray',
      colorShade: '900',
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

  const getShadowColor = () => {
    // Get alpha value from opacity tokens
    let alphaValue = 0
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && entry.name === shadowColorControl.alphaToken && entry.value) {
        alphaValue = entry.value
      }
    })
    const alpha = alphaValue / 100 // Convert percentage to decimal
    const paletteKey = shadowColorControl.paletteKey
    const colorShade = shadowColorControl.colorShade
    
    // Get the base color from the palette using the selected shade
    const colorToken = `color/${paletteKey}/${colorShade}`
    
    // Get color value from tokens JSON directly
    let colorValue = '#000000'
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && entry.name === colorToken && entry.value) {
        colorValue = entry.value
      }
    })
    
    // Convert hex to rgba
    const hex = colorValue.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const getElevationStyle = (elevation: string) => {
    const control = elevationControls[elevation]
    if (!control) return {}
    
    const blurValue = getBlurValue(elevation)
    const spreadValue = getSpreadValue(elevation)
    const offsetXValue = getOffsetXValue(elevation)
    const offsetYValue = getOffsetYValue(elevation)
    const shadowColor = getShadowColor()
    
    return {
      backgroundColor: 'var(--layer-layer-0-property-surface)',
      boxShadow: `${offsetXValue}px ${offsetYValue}px ${blurValue}px ${spreadValue}px ${shadowColor}`
    }
  }

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

  // Get available palette colors (the three main palettes)
  const availablePaletteColors = useMemo(() => {
    return [
      { key: 'gray', title: 'Neutral' },
      { key: 'mandy', title: 'Primary' },
      { key: 'salmon', title: 'Secondary' }
    ]
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

  // Get available color shades for the selected palette
  const availableColorShades = useMemo(() => {
    const shades: Array<{ value: string; label: string }> = []
    const paletteKey = shadowColorControl.paletteKey
    
    // Find all available shades for this palette by checking tokens JSON
    Object.values(tokensJson as Record<string, any>).forEach((entry: any) => {
      if (entry && entry.name && entry.name.startsWith(`color/${paletteKey}/`) && entry.value) {
        // Extract shade from token name (e.g., "color/gray/900" -> "900")
        const shade = entry.name.split('/').pop()
        if (shade) {
          shades.push({
            value: shade,
            label: shade
          })
        }
      }
    })
    
    // Sort shades numerically (050, 100, 200, etc.)
    return shades.sort((a, b) => {
      const aNum = parseInt(a.value)
      const bNum = parseInt(b.value)
      return aNum - bNum
    })
  }, [shadowColorControl.paletteKey])

  // Reset color shade when palette color changes
  useEffect(() => {
    const currentShades = availableColorShades.map(s => s.value)
    if (!currentShades.includes(shadowColorControl.colorShade)) {
      // If current shade is not available for the new color, reset to the darkest available shade
      const darkestShade = availableColorShades.length > 0 ? availableColorShades[availableColorShades.length - 1].value : '900'
      setShadowColorControl(prev => ({ ...prev, colorShade: darkestShade }))
    }
  }, [shadowColorControl.paletteKey, availableColorShades, shadowColorControl.colorShade])

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
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="control-group" style={{ minWidth: '200px' }}>
                <label>
                  Palette
                </label>
                <select
                  value={shadowColorControl.paletteKey}
                  onChange={(e) => setShadowColorControl(prev => ({ ...prev, paletteKey: e.target.value }))}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                >
                  {availablePaletteColors.map(palette => (
                    <option key={palette.key} value={palette.key}>
                      {palette.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group" style={{ minWidth: '150px' }}>
                <label>
                  Color Shade
                </label>
                <select
                  value={shadowColorControl.colorShade}
                  onChange={(e) => setShadowColorControl(prev => ({ ...prev, colorShade: e.target.value }))}
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}
                >
                  {availableColorShades.map(shade => (
                    <option key={shade.value} value={shade.value}>
                      {shade.label}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="control-group" style={{ minWidth: '100px', display: 'flex', alignItems: 'end' }}>
                <div style={{ 
                  width: '60px', 
                  height: '40px', 
                  background: getShadowColor(), 
                  border: '1px solid var(--layer-layer-1-property-border-color)', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--layer-layer-0-property-element-text-color)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    Preview
                  </span>
                </div>
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

