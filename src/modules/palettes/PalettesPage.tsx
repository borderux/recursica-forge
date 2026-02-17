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
import { getLayerElevationBoxShadow } from '../../components/utils/brandCssVars'

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
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
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
              backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-1-properties-surface)`,
              border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
              borderRadius: '6px',
              boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
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
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)` }}>
              Both black and white don't pass contrast (≥4.5:1)
            </div>
            <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)`, opacity: 0.8 }}>
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
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
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
              backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-1-properties-surface)`,
              border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
              borderRadius: '6px',
              boxShadow: layer1Elevation || '0 2px 8px rgba(0,0,0,0.15)',
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
            <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)` }}>
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
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
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
            backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-1-properties-surface)`,
            border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-1-properties-border-color)`,
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
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)` }}>
            Both black and white don't pass contrast (≥4.5:1)
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layers-layer-1-elements-text-color)`, opacity: 0.8 }}>
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
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  
  const allFamilies = useMemo(() => {
    const fams = new Set<string>()
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    
    // Add families from new colors structure (use scale keys, not aliases, for internal tracking)
    const colorsRoot: any = tokensRoot?.colors || {}
    if (colorsRoot && typeof colorsRoot === 'object' && !Array.isArray(colorsRoot)) {
      Object.keys(colorsRoot).forEach((scaleKey) => {
        if (scaleKey.startsWith('scale-')) {
          fams.add(scaleKey) // Use scale key for internal tracking
        }
      })
    }
    
    // Also add from old color structure for backwards compatibility
    const oldColors = tokensRoot?.color || {}
    Object.keys(oldColors).forEach((fam) => {
      if (fam !== 'translucent') fams.add(fam)
    })
    
    fams.delete('translucent')
    const list = Array.from(fams)
    list.sort((a, b) => {
      // Sort scale keys together, then other families
      const aIsScale = a.startsWith('scale-')
      const bIsScale = b.startsWith('scale-')
      if (aIsScale && !bIsScale) return 1
      if (!aIsScale && bIsScale) return -1
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    return list
  }, [tokensJson])
  
  // Removed automatic AA compliance check - let JSON values be set first
  
  const palettes = palettesState.dynamic
  const writePalettes = (next: PaletteEntry[]) => setPalettes({ ...palettesState, dynamic: next })
  
  // Track which families are already used by palettes
  // Use theme JSON as the source of truth (it reflects actual current usage)
  // Only fall back to initialFamily if theme JSON doesn't have the palette
  const [paletteFamilyChangeVersion, setPaletteFamilyChangeVersion] = useState(0)
  
  // Listen for palette family changes to force recalculation
  useEffect(() => {
    const handlePaletteFamilyChanged = () => {
      setPaletteFamilyChangeVersion(v => v + 1)
    }
    window.addEventListener('paletteFamilyChanged', handlePaletteFamilyChanged as any)
    return () => {
      window.removeEventListener('paletteFamilyChanged', handlePaletteFamilyChanged as any)
    }
  }, [])
  
  const usedFamilies = useMemo(() => {
    const set = new Set<string>()
    const tokensRoot: any = (tokensJson as any)?.tokens || {}
    const colorsRoot: any = tokensRoot?.colors || {}
    const detectedFromTheme = new Set<string>() // Track which palettes we detected from theme
    
    // First, detect actual families from theme JSON - this is the source of truth
    // Theme JSON reflects what's actually being used, even if initialFamily is stale
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      
      palettes.forEach((p) => {
        const paletteKey = p.key
        let foundFamily = false
        
        // Check both light and dark modes (but a palette should use same family in both)
        for (const modeKey of ['light', 'dark']) {
          if (foundFamily) break
          
          // Try both possible paths
          const palette = themes?.[modeKey]?.palettes?.[paletteKey] || root?.[modeKey]?.palettes?.[paletteKey]
          
          if (palette) {
            // Check a few levels to detect the family
            const checkLevels = ['200', '500', '400', '300', '100', '600']
            for (const lvl of checkLevels) {
              const tone = palette?.[lvl]?.color?.tone?.$value
              if (typeof tone === 'string') {
                // Use centralized parser to check for token references
                const tokenIndex = buildTokenIndex(tokensJson)
                const context: TokenReferenceContext = { currentMode: modeKey as 'light' | 'dark', tokenIndex }
                const parsed = parseTokenReference(tone, context)
                if (parsed && parsed.type === 'token' && parsed.path.length >= 2) {
                  let detectedFamily: string | null = null
                  
                  // Handle new colors format (colors.scale-XX.level or colors.alias.level)
                  if (parsed.path[0] === 'colors') {
                    const scaleOrAlias = parsed.path[1]
                    // If it's a scale key, use it directly
                    if (scaleOrAlias.startsWith('scale-')) {
                      detectedFamily = scaleOrAlias
                    } else {
                      // It's an alias - find the scale that has this alias
                      for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
                        if (!scaleKey.startsWith('scale-')) continue
                        const scaleObj = scale as any
                        if (scaleObj?.alias === scaleOrAlias) {
                          detectedFamily = scaleKey
                          break
                        }
                      }
                      // If not found, use the alias itself (fallback for old format)
                      if (!detectedFamily) {
                        detectedFamily = scaleOrAlias
                      }
                    }
                  }
                  // Handle old color format (color.family.level)
                  else if (parsed.path[0] === 'color') {
                    detectedFamily = parsed.path[1]
                  }
                  
                  if (detectedFamily) {
                    set.add(detectedFamily)
                    detectedFromTheme.add(paletteKey)
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
    
    // Only use initialFamily as fallback for palettes not found in theme JSON
    // This handles edge cases where a palette exists but theme JSON hasn't been initialized yet
    palettes.forEach((p) => {
      // Skip if we already detected this palette from theme JSON
      if (detectedFromTheme.has(p.key)) return
      
      if (p.initialFamily) {
        // If initialFamily is a scale key, use it directly
        // If it's an alias, find the corresponding scale key
        if (p.initialFamily.startsWith('scale-')) {
          set.add(p.initialFamily)
        } else {
          // Check if it's an alias that maps to a scale
          let foundScale = false
          for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
            if (!scaleKey.startsWith('scale-')) continue
            const scaleObj = scale as any
            if (scaleObj?.alias === p.initialFamily) {
              set.add(scaleKey)
              foundScale = true
              break
            }
          }
          // If not found as alias, use the family name directly (old format)
          if (!foundScale) {
            set.add(p.initialFamily)
          }
        }
      }
    })
    
    return set
  }, [palettes, themeJson, tokensJson, paletteFamilyChangeVersion])
  
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
      const tokensRoot: any = (tokensJson as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}
      
      // Determine the correct token reference format based on family type
      let tokenRef: string = `{tokens.color.${family}.${headerLevels[0]}}` // Default fallback
      
      if (family.startsWith('scale-')) {
        // Direct scale reference: use colors format
        tokenRef = `{tokens.colors.${family}.${headerLevels[0]}}`
      } else {
        // Check if it's an alias that maps to a scale
        let isScaleAlias = false
        for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
          if (!scaleKey.startsWith('scale-')) continue
          const scaleObj = scale as any
          if (scaleObj?.alias === family) {
            // Use the scale key for the reference
            tokenRef = `{tokens.colors.${scaleKey}.${headerLevels[0]}}`
            isScaleAlias = true
            break
          }
        }
        if (!isScaleAlias) {
          // Fallback to old color format
          tokenRef = `{tokens.color.${family}.${headerLevels[0]}}`
        }
      }
      
      // Initialize for both light and dark modes
      for (const modeKey of ['light', 'dark']) {
        if (!root[modeKey]) root[modeKey] = {}
        if (!root[modeKey].palettes) root[modeKey].palettes = {}
        if (!root[modeKey].palettes[paletteKey]) root[modeKey].palettes[paletteKey] = {}
        
        headerLevels.forEach((lvl) => {
          if (!root[modeKey].palettes[paletteKey][lvl]) root[modeKey].palettes[paletteKey][lvl] = {}
          if (!root[modeKey].palettes[paletteKey][lvl].color) root[modeKey].palettes[paletteKey][lvl].color = {}
          
          // Determine the correct token reference for this level
          let levelTokenRef: string
          if (family.startsWith('scale-')) {
            levelTokenRef = `{tokens.colors.${family}.${lvl}}`
          } else {
            // Try to find if this family is an alias for a scale
            let foundScaleKey: string | undefined
            for (const [scaleKey, scale] of Object.entries(colorsRoot)) {
              if (!scaleKey.startsWith('scale-')) continue
              const scaleObj = scale as any
              if (scaleObj?.alias === family) {
                foundScaleKey = scaleKey
                break
              }
            }
            if (foundScaleKey) {
              levelTokenRef = `{tokens.colors.${foundScaleKey}.${lvl}}`
            } else {
              levelTokenRef = `{tokens.color.${family}.${lvl}}`
            }
          }
          
          // Set tone to reference the family token
          root[modeKey].palettes[paletteKey][lvl].color.tone = {
            $type: 'color',
            $value: levelTokenRef
          }
          
          // Set on-tone to reference white (will be updated by PaletteGrid based on contrast)
          root[modeKey].palettes[paletteKey][lvl].color['on-tone'] = {
            $type: 'color',
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
    if (!canAddPalette || unusedFamilies.length === 0) {
      console.warn('Cannot add palette:', { canAddPalette, unusedFamiliesLength: unusedFamilies.length })
      return
    }
    
    // Only use unused color scales - take the first available one
    // unusedFamilies already filters out used families, so we can trust it
    const family = unusedFamilies[0]
    
    if (!family) {
      console.warn('No family available to add palette')
      return
    }
    
    const existing = new Set(palettes.map((p) => p.key))
    let i = 1
    while (existing.has(`palette-${i}`)) i += 1
    const nextKey = `palette-${i}`
    
    try {
      // Initialize theme JSON for this palette using the unused color scale
      initializePaletteTheme(nextKey, family)
      
      // Add palette entry with the unused color scale as initialFamily
      const newPalette: PaletteEntry = { key: nextKey, title: `Palette ${i}`, defaultLevel: 500, initialFamily: family }
      const updatedPalettes = [...palettes, newPalette]
      writePalettes(updatedPalettes)
    } catch (err) {
      console.error('Failed to add palette:', err)
    }
  }
  
  const deletePalette = (key: string) => {
    if (key === 'neutral' || key === 'palette-1') return
    writePalettes(palettes.filter((p) => p.key !== key))
    // Dispatch event for AA compliance watcher
    try {
      window.dispatchEvent(new CustomEvent('paletteDeleted', { detail: { key } }))
    } catch {}
  }

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  
  // Generate descriptive labels: Grayscale for neutral (index 0), then Primary, Secondary, etc.
  const getDescriptiveLabel = (paletteKey: string, index: number): string => {
    if (paletteKey === 'neutral' || index === 0) return 'Grayscale'
    const ordinalWords = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary', 'Senary', 'Septenary', 'Octonary']
    return ordinalWords[index - 1] || `Palette ${index}`
  }
  
  const PlusIcon = iconNameToReactComponent('plus')
  
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-0-properties-surface)`, color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-gutters-horizontal)' }}>
          <h1 id="theme-mode-label" style={{ 
            margin: 0,
            fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
            fontSize: 'var(--recursica-brand-typography-h1-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
            color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
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


