import '../theme/index.css'
import { useState, useEffect, useMemo } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'

// Helper to blend foreground over background with opacity
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

// Component for core on-tone cell with AA compliance checking
function CoreOnToneCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  pickerCssVar: string
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const AA = 4.5

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }
    
    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    window.addEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    window.addEventListener('recheckAllPaletteOnTones', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
      window.removeEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
      window.removeEventListener('recheckAllPaletteOnTones', handleVarsChanged)
    }
  }, [])

  // Check AA compliance with opacity consideration
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null
    
    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)
    
    if (!toneValue || !onToneValue) return null
    
    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)
    
    if (!toneHex || !onToneHex) return null
    
    // Get emphasis opacity value
    const emphasisResolved = readCssVarResolved(emphasisCssVar) || readCssVar(emphasisCssVar)
    let opacityRaw: number = 1
    
    if (emphasisResolved) {
      const tokenMatch = emphasisResolved.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
      if (tokenMatch) {
        const [, tokenName] = tokenMatch
        const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
        if (typeof tokenValue === 'number') {
          opacityRaw = tokenValue
        } else {
          opacityRaw = readCssVarNumber(emphasisCssVar, 1)
        }
      } else {
        opacityRaw = parseFloat(emphasisResolved)
        if (isNaN(opacityRaw)) {
          opacityRaw = readCssVarNumber(emphasisCssVar, 1)
        }
      }
    } else {
      opacityRaw = readCssVarNumber(emphasisCssVar, 1)
    }
    
    const opacity = (opacityRaw && !isNaN(opacityRaw) && opacityRaw > 0)
      ? Math.max(0, Math.min(1, opacityRaw))
      : 1
    
    // Blend on-tone color over tone color with opacity
    const onToneBlended = blendHexOver(onToneHex, toneHex, opacity)
    const currentRatio = contrastRatio(toneHex, onToneBlended)
    const passesAA = currentRatio >= AA
    
    // Check if black and white pass AA with opacity
    const black = '#000000'
    const white = '#ffffff'
    const blackBlended = blendHexOver(black, toneHex, opacity)
    const whiteBlended = blendHexOver(white, toneHex, opacity)
    const blackContrast = contrastRatio(toneHex, blackBlended)
    const whiteContrast = contrastRatio(toneHex, whiteBlended)
    const blackPasses = blackContrast >= AA
    const whitePasses = whiteContrast >= AA
    
    return {
      passesAA,
      blackPasses,
      whitePasses,
      currentRatio,
      toneHex,
      onToneHex,
      opacity,
    }
  }, [toneCssVar, onToneCssVar, emphasisCssVar, tokensJson, refreshKey, mode])

  // Show "x" whenever the on-tone doesn't pass AA compliance with the underlying tone
  const showAAWarning = aaStatus ? !aaStatus.passesAA : false

  return (
    <td>
      <div 
        className="palette-box" 
        style={{ 
          backgroundColor: `var(${toneCssVar})`, 
          cursor: 'pointer',
          position: 'relative'
        }} 
        onClick={(e) => (window as any).openPicker?.(e.currentTarget, pickerCssVar)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAAWarning ? (
          <div 
            className="palette-x" 
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: `var(${onToneCssVar})`, 
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: `var(${emphasisCssVar})`
            }}
          >
            ✕
          </div>
        ) : (
          <div 
            className="palette-dot" 
            style={{ 
              backgroundColor: `var(${onToneCssVar})`, 
              opacity: `var(${emphasisCssVar})` 
            }} 
          />
        )}
        
        {showAAWarning && isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              AA Compliance Issue
            </div>
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)` }}>
              Both black and white don't pass contrast (≥4.5:1)
            </div>
            <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)`, opacity: 0.8 }}>
              Current: {aaStatus?.currentRatio.toFixed(2)}:1
            </div>
          </div>
        )}
      </div>
    </td>
  )
}

// Component for interactive row cell with AA compliance checking
function CoreInteractiveCell({
  toneCssVar,
  interactiveCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  interactiveCssVar: string
  pickerCssVar: string
}) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const AA = 4.5

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }
    
    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    window.addEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
      window.removeEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    }
  }, [])

  // Check AA compliance
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null
    
    const toneValue = readCssVar(toneCssVar)
    const interactiveValue = readCssVar(interactiveCssVar)
    
    if (!toneValue || !interactiveValue) return null
    
    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const interactiveHex = resolveCssVarToHex(interactiveValue, tokenIndex)
    
    if (!toneHex || !interactiveHex) return null
    
    const currentRatio = contrastRatio(toneHex, interactiveHex)
    const passesAA = currentRatio >= AA
    
    return {
      passesAA,
      currentRatio,
      toneHex,
      interactiveHex,
    }
  }, [toneCssVar, interactiveCssVar, tokensJson, refreshKey])

  const showAAWarning = aaStatus ? !aaStatus.passesAA : false

  return (
    <td>
      <div 
        className="palette-box" 
        style={{ 
          backgroundColor: `var(${toneCssVar})`, 
          cursor: 'pointer',
          position: 'relative'
        }} 
        onClick={(e) => (window as any).openPicker?.(e.currentTarget, pickerCssVar)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAAWarning ? (
          <div 
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: 'bold',
              color: `var(${interactiveCssVar})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </div>
        ) : (
          <div 
            className="palette-dot"
            style={{ 
              backgroundColor: `var(${interactiveCssVar})`,
            }} 
          />
        )}
        
        {showAAWarning && isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              padding: '8px 12px',
              backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
              border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              AA Compliance Issue
            </div>
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)` }}>
              Interactive color contrast ratio {aaStatus?.currentRatio.toFixed(2)}:1 {'<'} 4.5:1
            </div>
          </div>
        )}
      </div>
    </td>
  )
}

export default function CorePropertiesPage() {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 id="theme-mode-label" style={{ 
            margin: 0,
            fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
            fontSize: 'var(--recursica-brand-typography-h1-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
            color: `var(${layer0Base}-element-text-color)`,
          }}>Core Properties</h1>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ marginTop: 0 }}>
            <h2 style={{ 
              margin: '0 0 12px 0',
              fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
              fontSize: 'var(--recursica-brand-typography-h2-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
              letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
              lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
              color: `var(${layer0Base}-element-text-color)`,
            }}>Opacity</h2>
            <table className="color-swatches">
              <thead>
                <tr>
                  <th>Overlay</th>
                  <th>High Emphasis</th>
                  <th>Low Emphasis</th>
                  <th>Hover</th>
                  <th>Disabled</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(() => {
                    const modeVar = mode.toLowerCase()
                    const layer0Surface = `var(--recursica-brand-themes-${modeVar}-layer-layer-0-property-surface)`
                    const layer0TextColor = `var(--recursica-brand-themes-${modeVar}-layer-layer-0-property-element-text-color)`
                    return (
                      <>
                        <td className="swatch-box overlay" style={{ background: `var(--recursica-brand-themes-${modeVar}-layer-layer-0-property-surface)`, padding: `var(--recursica-brand-themes-${modeVar}-layer-layer-0-property-padding)`, cursor: 'pointer', position: 'relative' }} onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          // Open color token picker for color
                          if ((window as any).openPicker) {
                            (window as any).openPicker(e.currentTarget, `--recursica-brand-themes-${modeVar}-state-overlay-color`)
                          }
                          // Open opacity picker immediately, positioned to the right of the color token picker
                          if ((window as any).openOpacityPicker) {
                            // Create a temporary element positioned to the right of where the palette picker would be
                            const tempEl = document.createElement('div')
                            tempEl.style.position = 'fixed'
                            tempEl.style.top = `${rect.bottom + 8}px`
                            tempEl.style.left = `${Math.min(rect.left + 450, window.innerWidth - 400)}px`
                            tempEl.style.width = '1px'
                            tempEl.style.height = '1px'
                            document.body.appendChild(tempEl)
                            ;(window as any).openOpacityPicker(tempEl, `--recursica-brand-themes-${modeVar}-state-overlay-opacity`)
                            // The picker component will handle cleanup of the temporary element
                          }
                        }}>
                          <div style={{ width: '100%', height: '100%', minHeight: '30px', background: `var(--recursica-brand-themes-${modeVar}-state-overlay-color)`, opacity: `var(--recursica-brand-themes-${modeVar}-state-overlay-opacity)` }} />
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-themes-${modeVar}-text-emphasis-high`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-themes-${modeVar}-text-emphasis-high)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-themes-${modeVar}-text-emphasis-low`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-themes-${modeVar}-text-emphasis-low)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box hover" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer', padding: '8px' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-themes-${modeVar}-state-hover`)}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                            {/* Interactive background with black hover overlay */}
                            <div style={{ 
                              flex: 1, 
                              background: `var(--recursica-brand-themes-${modeVar}-palettes-core-interactive-default-tone)`,
                              position: 'relative',
                              borderRadius: '4px',
                              minHeight: '20px'
                            }}>
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `var(--recursica-brand-themes-${modeVar}-palettes-core-black)`,
                                opacity: `var(--recursica-brand-themes-${modeVar}-state-hover)`,
                                borderRadius: '4px'
                              }} />
                            </div>
                            {/* Text / Icons in interactive color with hover opacity */}
                            <div style={{ 
                              flex: 1, 
                              background: `var(--recursica-brand-themes-${modeVar}-palettes-core-white)`,
                              position: 'relative',
                              borderRadius: '4px',
                              minHeight: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              isolation: 'isolate'
                            }}>
                              <p aria-hidden style={{ 
                                margin: 0, 
                                fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, 
                                fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, 
                                fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, 
                                letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, 
                                lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, 
                                color: `var(--recursica-brand-themes-${modeVar}-palettes-core-interactive-default-tone)`,
                                position: 'relative',
                                zIndex: 1,
                                whiteSpace: 'nowrap' 
                              }}>
                                Text / Icons
                              </p>
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `var(--recursica-brand-themes-${modeVar}-palettes-core-black)`,
                                opacity: `var(--recursica-brand-themes-${modeVar}-state-hover)`,
                                borderRadius: '4px',
                                mixBlendMode: 'darken',
                                pointerEvents: 'none',
                                zIndex: 0
                              }} />
                            </div>
                          </div>
                        </td>
                        <td className="swatch-box disabled" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-themes-${modeVar}-state-disabled`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-themes-${modeVar}-state-disabled)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                      </>
                    )
                  })()}
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={{ 
              margin: '0 0 12px 0',
              fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
              fontSize: 'var(--recursica-brand-typography-h2-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
              letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
              lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
              color: `var(${layer0Base}-element-text-color)`,
            }}>Core</h2>

            <div className="palette-container">
              <table className="color-palettes" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}></th>
                    <th>Black</th>
                    <th>White</th>
                    <th>Alert</th>
                    <th>Warn</th>
                    <th>Success</th>
                    <th>Interactive</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="high-emphasis">
                    <td>High</td>
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-high`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`}
                    />
                  </tr>
                  <tr className="low-emphasis">
                    <td>Low</td>
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                    />
                    <CoreOnToneCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`}
                      onToneCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      emphasisCssVar={`--recursica-brand-themes-${mode}-text-emphasis-low`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`}
                    />
                  </tr>
                  <tr>
                    <td>Interactive</td>
                    <CoreInteractiveCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-black-tone`}
                    />
                    <CoreInteractiveCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-white-tone`}
                    />
                    <CoreInteractiveCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-alert-tone`}
                    />
                    <CoreInteractiveCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-warning-tone`}
                    />
                    <CoreInteractiveCell
                      toneCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${mode}-palettes-core-success-tone`}
                    />
                    <td>
                      <div className="palette-box" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, cursor: 'pointer', position: 'relative' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone`)}>
                        <div className="palette-dot" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)` }} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ColorTokenPicker />

        <OpacityPicker />

        <PaletteSwatchPicker />
      </div>
    </div>
  )
}
