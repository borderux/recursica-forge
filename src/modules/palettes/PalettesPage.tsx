import '../theme/index.css'
import { useMemo, useState, useEffect } from 'react'
import PaletteGrid from './PaletteGrid'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'

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

type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

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
    const emphasisValue = readCssVar(emphasisCssVar)
    
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

// Component for core interactive swatch with AA compliance checking
function CoreInteractiveSwatch({
  toneCssVar,
  onToneCssVar,
  fallbackToneCssVar,
  pickerCssVar,
}: {
  toneCssVar: string
  onToneCssVar: string
  fallbackToneCssVar?: string
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
    return () => {
      window.removeEventListener('paletteVarsChanged', handleVarsChanged)
    }
  }, [])

  // Check AA compliance (without opacity for core colors - they're fully opaque)
  const aaStatus = useMemo(() => {
    if (!tokensJson) return null
    
    const toneValue = readCssVar(toneCssVar) || (fallbackToneCssVar ? readCssVar(fallbackToneCssVar) : null)
    const onToneValue = readCssVar(onToneCssVar)
    
    if (!toneValue || !onToneValue) return null
    
    const tokenIndex = buildTokenIndex(tokensJson)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex) || (fallbackToneCssVar ? resolveCssVarToHex(readCssVar(fallbackToneCssVar) || '', tokenIndex) : null)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)
    
    if (!toneHex || !onToneHex) return null
    
    // Core colors are fully opaque, so no opacity blending needed
    const currentRatio = contrastRatio(toneHex, onToneHex)
    const passesAA = currentRatio >= AA
    
    // Check if black and white pass AA
    const black = '#000000'
    const white = '#ffffff'
    const blackContrast = contrastRatio(toneHex, black)
    const whiteContrast = contrastRatio(toneHex, white)
    const blackPasses = blackContrast >= AA
    const whitePasses = whiteContrast >= AA
    
    return {
      passesAA,
      blackPasses,
      whitePasses,
      currentRatio,
      toneHex,
      onToneHex,
    }
  }, [toneCssVar, fallbackToneCssVar, onToneCssVar, tokensJson, refreshKey])

  const showAAWarning = aaStatus 
    ? (!aaStatus.passesAA && !aaStatus.blackPasses && !aaStatus.whitePasses)
    : false

  return (
    <td 
      className="swatch-box" 
      style={{ 
        position: 'relative',
        backgroundColor: `var(${toneCssVar}${fallbackToneCssVar ? `, var(${fallbackToneCssVar})` : ''})`, 
        cursor: 'pointer' 
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
            color: `var(${onToneCssVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </div>
      ) : (
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: `var(${onToneCssVar})`,
            // No border as requested
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
    </td>
  )
}

export default function PalettesPage() {
  const { tokens: tokensJson, theme: themeJson, palettes: palettesState, setPalettes, setTheme } = useVars()
  const { mode } = useThemeMode()
  
  const allFamilies = useMemo(() => {
    const fams = new Set<string>(Object.keys((tokensJson as any)?.tokens?.color || {}))
    fams.delete('translucent')
    return Array.from(fams).sort()
  }, [tokensJson])
  
  // Removed automatic AA compliance check - let JSON values be set first
  
  const palettes = palettesState.dynamic
  const writePalettes = (next: PaletteEntry[]) => setPalettes({ ...palettesState, dynamic: next })
  
  // Track which families are already used by palettes
  // Check both initialFamily and the actual family from theme JSON
  const usedFamilies = useMemo(() => {
    const set = new Set<string>()
    
    // First, add families from initialFamily
    palettes.forEach((p) => {
      if (p.initialFamily) set.add(p.initialFamily)
    })
    
    // Then, detect actual families from theme JSON (in case user changed the family)
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      palettes.forEach((p) => {
        const paletteKey = p.key
        let foundFamily = false
        // Check both light and dark modes (but a palette should use same family in both)
        for (const modeKey of ['light', 'dark']) {
          if (foundFamily) break
          const palette = root?.[modeKey]?.palettes?.[paletteKey]
          if (palette) {
            // Check a few levels to detect the family
            const checkLevels = ['200', '500', '400', '300']
            for (const lvl of checkLevels) {
              const tone = palette?.[lvl]?.color?.tone?.$value
              if (typeof tone === 'string') {
                // Use centralized parser to check for token references
                const tokenIndex = buildTokenIndex(tokensJson)
                const context: TokenReferenceContext = { currentMode: modeKey as 'light' | 'dark', tokenIndex }
                const parsed = parseTokenReference(tone, context)
                if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'color') {
                  // Extract family name from token path (e.g., color/gray/100 -> gray)
                  const detectedFamily = parsed.path[1]
                  if (detectedFamily) {
                    set.add(detectedFamily)
                    foundFamily = true
                    break // Found a family for this palette, move to next palette
                  }
                }
              }
            }
          }
        }
      })
    } catch (err) {
      console.error('Failed to detect used families from theme:', err)
    }
    
    return set
  }, [palettes, themeJson])
  
  const unusedFamilies = useMemo(() => 
    allFamilies.filter((f) => !usedFamilies.has(f)), 
    [allFamilies, usedFamilies]
  )
  
  const canAddPalette = unusedFamilies.length > 0
  
  // Initialize theme JSON for a new palette with CSS var references
  const initializePaletteTheme = (paletteKey: string, family: string) => {
    if (!setTheme || !themeJson) return
    
    try {
      const themeCopy = JSON.parse(JSON.stringify(themeJson))
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const headerLevels = ['1000', '900', '800', '700', '600', '500', '400', '300', '200']
      
      // Initialize for both light and dark modes
      for (const modeKey of ['light', 'dark']) {
        if (!root[modeKey]) root[modeKey] = {}
        if (!root[modeKey].palettes) root[modeKey].palettes = {}
        if (!root[modeKey].palettes[paletteKey]) root[modeKey].palettes[paletteKey] = {}
        
        headerLevels.forEach((lvl) => {
          if (!root[modeKey].palettes[paletteKey][lvl]) root[modeKey].palettes[paletteKey][lvl] = {}
          if (!root[modeKey].palettes[paletteKey][lvl].color) root[modeKey].palettes[paletteKey][lvl].color = {}
          
          // Set tone to reference the family token
          root[modeKey].palettes[paletteKey][lvl].color.tone = {
            $value: `{tokens.color.${family}.${lvl}}`
          }
          
          // Set on-tone to reference white (will be updated by PaletteGrid based on contrast)
          root[modeKey].palettes[paletteKey][lvl]['on-tone'] = {
            $value: `{brand.${modeKey}.palettes.core-colors.white}`
          }
        })
      }
      
      setTheme(themeCopy)
    } catch (err) {
      console.error('Failed to initialize palette theme:', err)
    }
  }
  
  const addPalette = () => {
    if (!canAddPalette) return
    const family = unusedFamilies[0]
    const existing = new Set(palettes.map((p) => p.key))
    let i = 1
    while (existing.has(`palette-${i}`)) i += 1
    const nextKey = `palette-${i}`
    
    // Initialize theme JSON for this palette
    initializePaletteTheme(nextKey, family)
    
    // Add palette entry
    writePalettes([...palettes, { key: nextKey, title: `Palette ${i}`, defaultLevel: 500, initialFamily: family }])
  }
  
  const deletePalette = (key: string) => {
    if (key === 'neutral' || key === 'palette-1') return
    writePalettes(palettes.filter((p) => p.key !== key))
    // Dispatch event for AA compliance watcher
    try {
      window.dispatchEvent(new CustomEvent('paletteDeleted', { detail: { key } }))
    } catch {}
  }

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding">
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="theme-mode-label" style={{ margin: 0 }}>Palettes</h2>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ marginTop: 0 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Opacity</h3>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Core</h3>
          <button type="button" onClick={addPalette} disabled={!canAddPalette} style={{ padding: '6px 10px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, background: 'transparent', borderRadius: 6, cursor: canAddPalette ? 'pointer' : 'not-allowed', opacity: canAddPalette ? 1 : `var(--recursica-brand-${mode}-opacity-disabled, 0.5)` }}>Add Palette</button>
          </div>

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

          {palettes.map((p) => (
            <PaletteGrid
              key={p.key}
              paletteKey={p.key}
              title={p.title}
              defaultLevel={p.defaultLevel}
              mode={mode === 'dark' ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        <ColorTokenPicker />

        <OpacityPicker />

        <PaletteSwatchPicker />
      </div>
    </div>
  )
}


