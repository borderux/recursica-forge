import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { iconNameToReactComponent } from '../components/iconUtils'
import brandDefault from '../../vars/Brand.json'
import { Button } from '../../components/adapters/Button'

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
    return `var(--recursica-brand-themes-${modeLower}-layers-layer-1-properties-border-color)`
  }
  // For other colors, use a slightly darker shade or border color
  return `var(--recursica-brand-themes-${modeLower}-layers-layer-1-properties-border-color)`
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
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const cellRef = useRef<HTMLDivElement>(null)
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
  const WarningIcon = iconNameToReactComponent('warning')

  // Update tooltip position when hovering (debounced to avoid excessive calculations)
  useEffect(() => {
    if (!isHovered) {
      setTooltipPosition(null)
      return
    }
    
    if (!cellRef.current) return
    
    // Use requestAnimationFrame to batch position updates
    const updatePosition = () => {
      if (cellRef.current && isHovered) {
        const rect = cellRef.current.getBoundingClientRect()
        setTooltipPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX + rect.width / 2,
        })
      }
    }
    
    const rafId = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(rafId)
  }, [isHovered])

  return (
    <>
      <div 
        ref={cellRef}
        className="palette-box" 
        style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAAWarning ? (
          <div 
            className="palette-warning" 
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: `var(${onToneCssVar})`, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: `var(${emphasisCssVar})`
            }}
          >
            {WarningIcon && <WarningIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} />}
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
      </div>
      {showAAWarning && isHovered && tooltipPosition && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-1-properties-surface)`,
            border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999,
            minWidth: '200px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            AA Compliance Issue
          </div>
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)` }}>
            Both black and white don't pass contrast (≥4.5:1)
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)`, opacity: 0.8 }}>
            Current: {aaStatus?.currentRatio.toFixed(2)}:1
          </div>
        </div>,
        document.body
      )}
    </>
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
  const { mode: themeMode } = useThemeMode()
  const [isHovered, setIsHovered] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null)
  const cellRef = useRef<HTMLDivElement>(null)
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
  const WarningIcon = iconNameToReactComponent('warning')
  const { mode } = useThemeMode()

  // Update tooltip position when hovering (debounced to avoid excessive calculations)
  useEffect(() => {
    if (!isHovered) {
      setTooltipPosition(null)
      return
    }
    
    if (!cellRef.current) return
    
    // Use requestAnimationFrame to batch position updates
    const updatePosition = () => {
      if (cellRef.current && isHovered) {
        const rect = cellRef.current.getBoundingClientRect()
        setTooltipPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX + rect.width / 2,
        })
      }
    }
    
    const rafId = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(rafId)
  }, [isHovered])

  return (
    <>
      <div 
        ref={cellRef}
        className="palette-box" 
        style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {showAAWarning ? (
        <div 
          className="palette-warning"
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: `var(${interactiveCssVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {WarningIcon && <WarningIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} />}
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
      </div>
      {showAAWarning && isHovered && tooltipPosition && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            backgroundColor: `var(--recursica-brand-themes-${themeMode}-layers-layer-1-properties-surface)`,
            border: `1px solid var(--recursica-brand-themes-${themeMode}-layers-layer-1-properties-border-color)`,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999,
            minWidth: '200px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            AA Compliance Issue
          </div>
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)` }}>
            Interactive color contrast ratio {aaStatus?.currentRatio.toFixed(2)}:1 {'<'} 4.5:1
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default function BaseColorsGrid() {
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase()
  const [refreshKey, setRefreshKey] = useState(0)
  const { theme: themeJson, setTheme } = useVars()

  // Listen for CSS var changes to trigger re-render
  useEffect(() => {
    const handleVarsChanged = () => {
      setRefreshKey(k => k + 1)
    }
    
    window.addEventListener('paletteVarsChanged', handleVarsChanged)
    window.addEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
    window.addEventListener('recheckAllPaletteOnTones', handleVarsChanged)
    window.addEventListener('cssVarsUpdated', handleVarsChanged)
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
      window.removeEventListener('recheckCoreColorInteractiveOnTones', handleVarsChanged)
      window.removeEventListener('recheckAllPaletteOnTones', handleVarsChanged)
      window.removeEventListener('cssVarsUpdated', handleVarsChanged)
    }
  }, [])

  const handleResetAll = () => {
    if (!themeJson || !setTheme) return

    // Get default values from Brand.json
    const root: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
    const themes = root?.themes || root
    const defaultCoreColors = themes?.[modeLower]?.palettes?.['core-colors']?.$value

    if (!defaultCoreColors) return

    // Create a copy of the current theme
    const themeCopy = JSON.parse(JSON.stringify(themeJson))
    const themeRoot: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    const currentThemes = themeRoot?.themes || themeRoot

    // Ensure structure exists
    if (!currentThemes[modeLower]) currentThemes[modeLower] = {}
    if (!currentThemes[modeLower].palettes) currentThemes[modeLower].palettes = {}
    if (!currentThemes[modeLower].palettes['core-colors']) currentThemes[modeLower].palettes['core-colors'] = {}
    if (!currentThemes[modeLower].palettes['core-colors'].$value) {
      currentThemes[modeLower].palettes['core-colors'].$value = {}
    }

    const currentCoreColors = currentThemes[modeLower].palettes['core-colors'].$value

    // Reset each core color's tone and on-tone to original values
    const coreColorNames = ['black', 'white', 'alert', 'warning', 'success']
    coreColorNames.forEach((colorName) => {
      const defaultColor = defaultCoreColors[colorName]
      if (!defaultColor) return

      // Ensure structure exists
      if (!currentCoreColors[colorName]) currentCoreColors[colorName] = {}

      // Reset tone
      if (defaultColor.tone?.$value) {
        currentCoreColors[colorName].tone = {
          $type: 'color',
          $value: defaultColor.tone.$value
        }
      }

      // Reset on-tone
      if (defaultColor['on-tone']?.$value) {
        currentCoreColors[colorName]['on-tone'] = {
          $type: 'color',
          $value: defaultColor['on-tone'].$value
        }
      }
    })

    // Reset interactive colors (default and hover)
    const defaultInteractive = defaultCoreColors.interactive
    if (defaultInteractive) {
      if (!currentCoreColors.interactive) currentCoreColors.interactive = {}

      // Reset default tone and on-tone
      if (defaultInteractive.default) {
        if (!currentCoreColors.interactive.default) currentCoreColors.interactive.default = {}
        if (defaultInteractive.default.tone?.$value) {
          currentCoreColors.interactive.default.tone = {
            $type: 'color',
            $value: defaultInteractive.default.tone.$value
          }
        }
        if (defaultInteractive.default['on-tone']?.$value) {
          currentCoreColors.interactive.default['on-tone'] = {
            $type: 'color',
            $value: defaultInteractive.default['on-tone'].$value
          }
        }
      }

      // Reset hover tone and on-tone
      if (defaultInteractive.hover) {
        if (!currentCoreColors.interactive.hover) currentCoreColors.interactive.hover = {}
        if (defaultInteractive.hover.tone?.$value) {
          currentCoreColors.interactive.hover.tone = {
            $type: 'color',
            $value: defaultInteractive.hover.tone.$value
          }
        }
        if (defaultInteractive.hover['on-tone']?.$value) {
          currentCoreColors.interactive.hover['on-tone'] = {
            $type: 'color',
            $value: defaultInteractive.hover['on-tone'].$value
          }
        }
      }
    }

    // Update theme
    setTheme(themeCopy)

    // Trigger recomputation to update CSS variables
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('paletteVarsChanged', {}))
      window.dispatchEvent(new CustomEvent('recheckCoreColorInteractiveOnTones', {}))
      window.dispatchEvent(new CustomEvent('recheckAllPaletteOnTones', {}))
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {}))
    }, 100)
  }

  const baseColors = ['black', 'white', 'alert', 'warning', 'success', 'interactive'] as const
  const rows = [
    { key: 'high', label: 'High', emphasisVar: `--recursica-brand-themes-${modeLower}-text-emphasis-high` },
    { key: 'low', label: 'Low', emphasisVar: `--recursica-brand-themes-${modeLower}-text-emphasis-low` },
    { key: 'interactive', label: 'Interactive', emphasisVar: null },
  ] as const

  const ResetIcon = iconNameToReactComponent('arrow-path')

  if (!ResetIcon) return null

  return (
    <div style={{
      backgroundColor: `var(--recursica-brand-themes-${modeLower}-layers-layer-1-properties-surface)`,
      border: `1px solid var(--recursica-brand-themes-${modeLower}-layers-layer-1-properties-border-color)`,
      borderRadius: 'var(--recursica-brand-dimensions-border-radii-lg)',
      padding: `var(--recursica-brand-themes-${modeLower}-layers-layer-1-properties-padding)`,
      boxShadow: `var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-x-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-y-axis) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-blur) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-spread) var(--recursica-brand-themes-${modeLower}-elevations-elevation-0-shadow-color)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--recursica-brand-dimensions-general-md)' }}>
        <h2 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          color: `var(--recursica-brand-themes-${modeLower}-layers-layer-1-elements-text-color)`,
        }}>Base colors</h2>
        <Button
          variant="outline"
          size="small"
          onClick={handleResetAll}
          icon={<ResetIcon />}
        >
          Reset all
        </Button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px repeat(6, 1fr)',
        gridTemplateRows: `auto repeat(${rows.length}, auto)`,
        rowGap: 0,
        columnGap: 'var(--recursica-brand-dimensions-gutters-horizontal)',
      }}>
        {/* Header row */}
        <div style={{ gridRow: 1, gridColumn: 1 }}></div>
        {baseColors.map((color, colIndex) => (
          <div 
            key={color} 
            style={{
              gridRow: 1,
              gridColumn: colIndex + 2,
              textAlign: 'center',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
              color: `var(--recursica-brand-themes-${modeLower}-layers-layer-1-elements-text-color)`,
              padding: 'var(--recursica-brand-dimensions-general-sm)',
            }}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
        ))}

        {/* Row labels - stacked vertically */}
        {rows.map((row, rowIndex) => (
          <div 
            key={row.key} 
            style={{
              gridRow: rowIndex + 2,
              gridColumn: 1,
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--recursica-brand-typography-body-font-family)',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
              color: `var(--recursica-brand-themes-${modeLower}-layers-layer-1-elements-text-color)`,
              padding: 'var(--recursica-brand-dimensions-general-sm)',
            }}
          >
            {row.label}
          </div>
        ))}

        {/* Column wrappers - each column contains all three cells and spans all data rows */}
        {baseColors.map((color, colIndex) => {
              // Determine the tone CSS var for this column (used as background)
              const columnToneCssVar = color === 'interactive' 
                ? `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`
                : `--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`
              
              return (
                <div
                  key={`${color}-${refreshKey}`}
                  onClick={(e) => {
                    // Open scale picker for the base color tone
                    if ((window as any).openPicker) {
                      (window as any).openPicker(e.currentTarget, columnToneCssVar)
                    }
                  }}
                  style={{
                    gridRow: `2 / ${2 + rows.length}`, // Span all data rows (rows 2, 3, 4)
                    gridColumn: colIndex + 2, // Column index + 2 (skip label column, account for 1-based grid)
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-evenly',
                    backgroundColor: `var(${columnToneCssVar})`,
                    border: `1px solid var(--recursica-brand-themes-${modeLower}-palettes-neutral-100-tone)`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {rows.map(row => {
                    if (row.key === 'interactive' && color === 'interactive') {
                      // NA case - use disabled on-tone (on-tone color with disabled opacity)
                      const onToneCssVar = `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-on-tone`
                      const disabledOpacityVar = `--recursica-brand-themes-${modeLower}-state-disabled`
                      return (
                        <div key={`${row.key}-${color}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{
                            color: `var(${onToneCssVar})`,
                            opacity: `var(${disabledOpacityVar}, 0.5)`,
                            fontSize: '12px',
                            fontWeight: 500,
                          }}>NA</span>
                        </div>
                      )
                    }

              if (row.key === 'interactive') {
                return (
                  <div key={`${row.key}-${color}`}>
                    <InteractiveCell
                      toneCssVar={`--recursica-brand-themes-${modeLower}-palettes-core-${color}-tone`}
                      interactiveCssVar={`--recursica-brand-themes-${modeLower}-palettes-core-${color}-interactive`}
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
                <div key={`${row.key}-${color}`}>
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
                </div>
              )
            })}
      </div>
    </div>
  )
}
