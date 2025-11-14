import '../theme/index.css'
import { useMemo, useState } from 'react'
import PaletteGrid from './PaletteGrid'
import { useVars } from '../vars/VarsContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'

type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

export default function PalettesPage() {
  const { tokens: tokensJson, theme: themeJson, palettes: palettesState, setPalettes, setTheme } = useVars()
  const [isDarkMode, setIsDarkMode] = useState(false)
  
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
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--recursica-brand-light-layer-layer-0-property-surface, #ffffff)', color: 'var(--recursica-brand-light-layer-layer-0-property-element-text-color, #111111)' }}>
      <div className="container-padding">
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="theme-mode-label" style={{ margin: 0 }}>Palettes</h2>
          <div style={{ display: 'inline-flex', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setIsDarkMode(false)}
              style={{ padding: '6px 10px', border: 'none', background: !isDarkMode ? 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: !isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Light</button>
            <button
              onClick={() => setIsDarkMode(true)}
              style={{ padding: '6px 10px', border: 'none', borderLeft: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: isDarkMode ? 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Dark</button>
          </div>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Core</h3>
          <button type="button" onClick={addPalette} disabled={!canAddPalette} style={{ padding: '6px 10px', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: canAddPalette ? 'pointer' : 'not-allowed', opacity: canAddPalette ? 1 : 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>Add Palette</button>
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
                <td className="swatch-box" style={{ backgroundColor: 'var(--recursica-brand-light-palettes-core-black)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-black')} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--recursica-brand-light-palettes-core-white)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-white')} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--recursica-brand-light-palettes-core-alert)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-alert')} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--recursica-brand-light-palettes-core-warning)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-warning')} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--recursica-brand-light-palettes-core-success)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-success')} />
                <td 
                  className="swatch-box" 
                  style={{ 
                    position: 'relative',
                    backgroundColor: 'var(--recursica-brand-light-palettes-core-interactive-default-tone, var(--recursica-brand-light-palettes-core-interactive))', 
                    cursor: 'pointer' 
                  }} 
                  onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-interactive-default-tone')}
                >
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--recursica-brand-light-palettes-core-interactive-default-on-tone, #ffffff)',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                </td>
                <td 
                  className="swatch-box" 
                  style={{ 
                    position: 'relative',
                    backgroundColor: 'var(--recursica-brand-light-palettes-core-interactive-hover-tone)', 
                    cursor: 'pointer' 
                  }} 
                  onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-interactive-hover-tone')}
                >
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--recursica-brand-light-palettes-core-interactive-hover-on-tone, #ffffff)',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                </td>
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
                    const modeVar = isDarkMode ? 'dark' : 'light'
                    const layer0Surface = `var(--recursica-brand-${modeVar}-layer-layer-0-property-surface)`
                    const layer0TextColor = `var(--recursica-brand-${modeVar}-layer-layer-0-property-element-text-color)`
                    return (
                      <>
                        <td className="swatch-box overlay" style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', padding: 'var(--recursica-brand-light-layer-layer-0-property-padding)', cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, `--recursica-brand-${modeVar}-opacity-overlay`)}>
                          <div style={{ width: '100%', height: '100%', minHeight: '30px', background: 'var(--recursica-brand-light-palettes-core-black)', opacity: `var(--recursica-brand-${modeVar}-opacity-overlay)` }} />
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
              mode={isDarkMode ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        <ColorTokenPicker />

        <OpacityPicker />
      </div>
    </div>
  )
}


