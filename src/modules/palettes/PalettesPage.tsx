import '../theme/index.css'
import { useMemo, useState, useEffect } from 'react'
import PaletteGrid from './PaletteGrid'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import { readCssVar } from '../../core/css/readCssVar'
import { contrastRatio } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'

type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

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
            backgroundColor: `var(--recursica-brand-${mode}-layer-layer-1-property-surface)`,
            border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`,
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
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-color)` }}>
            Both black and white don't pass contrast (≥4.5:1)
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-color)`, opacity: 0.8 }}>
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
                // Check for token reference format: {tokens.color.{family}.{level}}
                const match = tone.match(/\{tokens\.color\.([a-z0-9_-]+)\./)
                if (match && match[1]) {
                  const detectedFamily = match[1]
                  set.add(detectedFamily)
                  foundFamily = true
                  break // Found a family for this palette, move to next palette
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
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding">
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="theme-mode-label" style={{ margin: 0 }}>Palettes</h2>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Core</h3>
          <button type="button" onClick={addPalette} disabled={!canAddPalette} style={{ padding: '6px 10px', border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, background: 'transparent', borderRadius: 6, cursor: canAddPalette ? 'pointer' : 'not-allowed', opacity: canAddPalette ? 1 : `var(--recursica-brand-${mode}-opacity-disabled, 0.5)` }}>Add Palette</button>
          </div>

          <table className="color-swatches">
            <thead>
              <tr>
                <th>Black</th>
                <th>White</th>
                <th>Alert</th>
                <th>Warn</th>
                <th>Success</th>
                <th>Interactive</th>
                <th>Interactive (hover)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="swatch-box" style={{ backgroundColor: `var(--recursica-brand-${mode}-palettes-core-black)`, cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-${mode}-palettes-core-black`)} />
                <td className="swatch-box" style={{ backgroundColor: `var(--recursica-brand-${mode}-palettes-core-white)`, cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-${mode}-palettes-core-white`)} />
                <td className="swatch-box" style={{ backgroundColor: `var(--recursica-brand-${mode}-palettes-core-alert)`, cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-${mode}-palettes-core-alert`)} />
                <td className="swatch-box" style={{ backgroundColor: `var(--recursica-brand-${mode}-palettes-core-warning)`, cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-${mode}-palettes-core-warning`)} />
                <td className="swatch-box" style={{ backgroundColor: `var(--recursica-brand-${mode}-palettes-core-success)`, cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, `--recursica-brand-${mode}-palettes-core-success`)} />
                <CoreInteractiveSwatch
                  toneCssVar={`--recursica-brand-${mode}-palettes-core-interactive-default-tone`}
                  onToneCssVar={`--recursica-brand-${mode}-palettes-core-interactive-default-on-tone`}
                  fallbackToneCssVar={`--recursica-brand-${mode}-palettes-core-interactive`}
                  pickerCssVar={`--recursica-brand-${mode}-palettes-core-interactive-default-tone`}
                />
                <CoreInteractiveSwatch
                  toneCssVar={`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`}
                  onToneCssVar={`--recursica-brand-${mode}-palettes-core-interactive-hover-on-tone`}
                  pickerCssVar={`--recursica-brand-${mode}-palettes-core-interactive-hover-tone`}
                />
              </tr>
              {/* Removed hex values row under swatches per request */}
            </tbody>
          </table>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Opacity</h3>
            <table className="color-swatches">
              <thead>
                <tr>
                  <th>Overlay</th>
                  <th>High Emphasis</th>
                  <th>Low Emphasis</th>
                  <th>Disabled</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(() => {
                    const modeVar = mode.toLowerCase()
                    const layer0Surface = `var(--recursica-brand-${modeVar}-layer-layer-0-property-surface)`
                    const layer0TextColor = `var(--recursica-brand-${modeVar}-layer-layer-0-property-element-text-color)`
                    return (
                      <>
                        <td className="swatch-box overlay" style={{ background: `var(--recursica-brand-${modeVar}-layer-layer-0-property-surface)`, padding: `var(--recursica-brand-${modeVar}-layer-layer-0-property-padding)`, cursor: 'pointer', position: 'relative' }} onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          // Open color token picker for color
                          if ((window as any).openPicker) {
                            (window as any).openPicker(e.currentTarget, `--recursica-brand-${modeVar}-state-overlay-color`)
                          }
                          // Open opacity picker after a short delay, positioned to the right of the color token picker
                          setTimeout(() => {
                            if ((window as any).openOpacityPicker) {
                              // Create a temporary element positioned to the right of where the palette picker would be
                              const tempEl = document.createElement('div')
                              tempEl.style.position = 'fixed'
                              tempEl.style.top = `${rect.bottom + 8}px`
                              tempEl.style.left = `${Math.min(rect.left + 450, window.innerWidth - 400)}px`
                              tempEl.style.width = '1px'
                              tempEl.style.height = '1px'
                              document.body.appendChild(tempEl)
                              ;(window as any).openOpacityPicker(tempEl, `--recursica-brand-${modeVar}-state-overlay-opacity`)
                              // Clean up temporary element after picker opens
                              setTimeout(() => {
                                document.body.removeChild(tempEl)
                              }, 100)
                            }
                          }, 100)
                        }}>
                          <div style={{ width: '100%', height: '100%', minHeight: '30px', background: `var(--recursica-brand-${modeVar}-state-overlay-color)`, opacity: `var(--recursica-brand-${modeVar}-state-overlay-opacity)` }} />
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-${modeVar}-text-emphasis-high`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-text-emphasis-high)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-${modeVar}-text-emphasis-low`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-text-emphasis-low)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box disabled" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-${modeVar}-opacity-disabled`)}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-brand-typography-body-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-brand-typography-body-font-size, 16px)`, fontWeight: `var(--recursica-brand-typography-body-font-weight, 400)`, letterSpacing: `var(--recursica-brand-typography-body-font-letter-spacing, 0)`, lineHeight: `var(--recursica-brand-typography-body-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-opacity-disabled)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                      </>
                    )
                  })()}
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


