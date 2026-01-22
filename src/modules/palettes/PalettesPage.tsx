import '../theme/index.css'
import { useMemo, useState, useEffect } from 'react'
import PaletteGrid from './PaletteGrid'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'
import { hexToRgb, contrastRatio } from '../theme/contrastUtil'
import { readCssVar, readCssVarResolved, readCssVarNumber } from '../../core/css/readCssVar'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'

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
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)` }}>
              Both black and white don't pass contrast (≥4.5:1)
            </div>
            <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`, opacity: 0.8 }}>
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
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)` }}>
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
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)` }}>
            Both black and white don't pass contrast (≥4.5:1)
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`, opacity: 0.8 }}>
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
          root[modeKey].palettes[paletteKey][lvl].color['on-tone'] = {
            $value: `{brand.palettes.white}`
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

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  
  // Generate descriptive labels: Grayscale for neutral (index 0), then Primary, Secondary, etc.
  const getDescriptiveLabel = (paletteKey: string, index: number): string => {
    if (paletteKey === 'neutral' || index === 0) return 'Grayscale'
    const ordinalWords = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary', 'Senary', 'Septenary', 'Octonary']
    return ordinalWords[index - 1] || `Palette ${index}`
  }
  
  const PlusIcon = iconNameToReactComponent('plus')
  
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-gutters-horizontal)' }}>
          <h1 id="theme-mode-label" style={{ 
            margin: 0,
            fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
            fontSize: 'var(--recursica-brand-typography-h1-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
            color: `var(${layer0Base}-element-text-color)`,
          }}>Palettes</h1>
          <Button
            variant="outline"
            size="small"
            onClick={addPalette}
            disabled={!canAddPalette}
            icon={PlusIcon ? <PlusIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null}
          >
            Add palette
          </Button>
        </div>

        <div className="section" style={{ marginTop: 'var(--recursica-brand-dimensions-gutters-vertical)', display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
          {palettes.map((p, index) => (
            <PaletteGrid
              key={p.key}
              paletteKey={p.key}
              title={p.title}
              descriptiveLabel={getDescriptiveLabel(p.key, index)}
              defaultLevel={p.defaultLevel}
              mode={mode === 'dark' ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        <ColorTokenPicker />

        <PaletteSwatchPicker />
      </div>
    </div>
  )
}


