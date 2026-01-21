import React, { useState, useEffect, useMemo } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
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

// Helper to get border color for swatches based on color type
function getSwatchBorderColor(colorName: string, modeLower: string): string {
  if (colorName === 'black') {
    return `var(--recursica-brand-themes-${modeLower}-palettes-core-black)`
  }
  if (colorName === 'white') {
    return `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-border-color)`
  }
  // For other colors, use a slightly darker shade or border color
  return `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-border-color)`
}

// Component for High/Low emphasis cells
function EmphasisCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  pickerCssVar,
  colorName,
  modeLower,
}: {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  pickerCssVar: string
  colorName: string
  modeLower: string
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

  const showAAWarning = aaStatus ? !aaStatus.passesAA : false

  return (
    <div 
      className="palette-box" 
      style={{ 
        backgroundColor: `var(${toneCssVar})`, 
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} 
      onClick={(e) => (window as any).openPalettePicker?.(e.currentTarget, pickerCssVar)}
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
            opacity: `var(${emphasisCssVar})`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
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
  )
}

// Component for Interactive row cells
function InteractiveCell({
  toneCssVar,
  interactiveCssVar,
  pickerCssVar,
  colorName,
  modeLower,
}: {
  toneCssVar: string
  interactiveCssVar: string
  pickerCssVar: string
  colorName: string
  modeLower: string
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
    <div 
      className="palette-box" 
      style={{ 
        backgroundColor: `var(${toneCssVar})`, 
        border: `1px solid ${getSwatchBorderColor(colorName, modeLower)}`,
        borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} 
      onClick={(e) => (window as any).openPalettePicker?.(e.currentTarget, pickerCssVar)}
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
            width: '12px',
            height: '12px',
            borderRadius: '50%',
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
  )
}

export default function BaseColorsGrid() {
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase()

  const baseColors = ['black', 'white', 'alert', 'warning', 'success', 'interactive'] as const
  const rows = [
    { key: 'high', label: 'High', emphasisVar: `--recursica-brand-themes-${modeLower}-text-emphasis-high` },
    { key: 'low', label: 'Low', emphasisVar: `--recursica-brand-themes-${modeLower}-text-emphasis-low` },
    { key: 'interactive', label: 'Interactive', emphasisVar: null },
  ] as const

  return (
    <div style={{
      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-surface)`,
      border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-border-color)`,
      borderRadius: 'var(--recursica-brand-dimensions-border-radii-lg)',
      padding: `var(--recursica-brand-themes-${modeLower}-layer-layer-1-property-padding)`,
      boxShadow: `var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-x-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-y-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-blur) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-spread) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-shadow-color)`,
    }}>
      <h2 style={{ 
        margin: '0 0 var(--recursica-brand-dimensions-general-md) 0',
        fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
        fontSize: 'var(--recursica-brand-typography-h2-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
        color: `var(--recursica-brand-themes-${modeLower}-layer-layer-0-property-element-text-color)`,
      }}>Base colors</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px repeat(6, 1fr)',
        gap: 'var(--recursica-brand-dimensions-general-sm)',
      }}>
        {/* Header row */}
        <div></div>
        {baseColors.map(color => (
          <div key={color} style={{
            textAlign: 'center',
            fontFamily: 'var(--recursica-brand-typography-body-font-family)',
            fontSize: 'var(--recursica-brand-typography-body-font-size)',
            fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
            color: `var(--recursica-brand-themes-${modeLower}-layer-layer-0-property-element-text-color)`,
            padding: 'var(--recursica-brand-dimensions-general-sm)',
          }}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
        ))}

        {/* Data rows */}
        {rows.map(row => (
          <React.Fragment key={row.key}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
              color: `var(--recursica-brand-themes-${modeLower}-layer-layer-0-property-element-text-color)`,
              padding: 'var(--recursica-brand-dimensions-general-sm)',
            }}>
              {row.label}
            </div>
            {baseColors.map(color => {
              if (row.key === 'interactive' && color === 'interactive') {
                // NA case
                return (
                  <div key={`${row.key}-${color}`} style={{
                    backgroundColor: `var(--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone)`,
                    border: `1px solid ${getSwatchBorderColor('interactive', modeLower)}`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      color: `var(--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-on-tone)`,
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>NA</span>
                  </div>
                )
              }

              if (row.key === 'interactive') {
                return (
                  <div key={`${row.key}-${color}`} style={{ minHeight: '60px' }}>
                    <InteractiveCell
                      toneCssVar={`--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-on-tone`}
                      pickerCssVar={`--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`}
                      colorName={color}
                      modeLower={modeLower}
                    />
                  </div>
                )
              }

              // Handle interactive color specially - it uses -default-tone and -default-on-tone
              const toneCssVar = color === 'interactive' 
                ? `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`
                : `--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`
              const onToneCssVar = color === 'interactive'
                ? `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-on-tone`
                : `--recursica-brand-themes-${modeLower}-palettes-core-${color}-on-tone`
              const pickerCssVar = color === 'interactive'
                ? `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`
                : `--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`

              return (
                <div key={`${row.key}-${color}`} style={{ minHeight: '60px' }}>
                  <EmphasisCell
                    toneCssVar={toneCssVar}
                    onToneCssVar={onToneCssVar}
                    emphasisCssVar={row.emphasisVar!}
                    pickerCssVar={pickerCssVar}
                    colorName={color}
                    modeLower={modeLower}
                  />
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
