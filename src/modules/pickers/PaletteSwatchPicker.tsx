import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'

export default function PaletteSwatchPicker({ onSelect }: { onSelect?: (cssVarName: string) => void }) {
  const { palettes, theme: themeJson, tokens: tokensJson, setTheme } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [targetCssVars, setTargetCssVars] = useState<string[]>([])
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetCssVar(null)
      setTargetCssVars([])
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || themes?.light?.palette || {}
      Object.keys(lightPal).forEach((k) => {
        // Only show palettes, exclude core and core-colors
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch {}
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])

  const paletteLevels = useMemo(() => {
    const levelsByPalette: Record<string, string[]> = {}
    paletteKeys.forEach((pk) => {
      try {
        const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
        // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
        const themes = root?.themes || root
        const paletteData: any = themes?.light?.palettes?.[pk] || themes?.light?.palette?.[pk]
        if (paletteData) {
          // Get all numeric levels including 000 and 1000 - no normalization or deduplication
          const levels = Object.keys(paletteData).filter((k) => /^(\d{2,4}|000|1000)$/.test(k))
          // Sort: 1000, 900, 800, ..., 100, 050, 000
          levels.sort((a, b) => {
            const aNum = a === '000' ? 0 : a === '050' ? 50 : a === '1000' ? 1000 : Number(a)
            const bNum = b === '000' ? 0 : b === '050' ? 50 : b === '1000' ? 1000 : Number(b)
            return bNum - aNum
          })
          levelsByPalette[pk] = levels
        }
      } catch {}
      // Fallback to standard levels if not found (including 000 and 1000)
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson])

  const { mode } = useThemeMode()
  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    // Use actual level - no normalization (000 stays 000, 1000 stays 1000)
    // Use new brand.json structure: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
    return `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
  }

  // Get the resolved value of the target CSS var to compare with palette swatches
  // This hook must be called before any early returns to follow Rules of Hooks
  const targetResolvedValue = useMemo(() => {
    if (!targetCssVar) return null
    const resolved = readCssVarResolved(targetCssVar)
    const directValue = readCssVar(targetCssVar)
    return { resolved, direct: directValue }
  }, [targetCssVar])

  // Track which palette swatch we've already selected to avoid multiple selections
  const selectedPaletteSwatch = useMemo(() => {
    if (!targetResolvedValue || !targetCssVar) return null
    
    const directValue = readCssVar(targetCssVar)
    if (!directValue) return null
    
    const trimmed = directValue.trim()
    
    // Check if target directly references a palette var
    // Use new brand.json structure: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
    const directPaletteMatch = trimmed.match(/var\(--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone\)/)
    if (directPaletteMatch) {
      const [, paletteKey, level] = directPaletteMatch
      return `${paletteKey}-${level}`
    }
    
    // Check if target is a color-mix() that contains a palette var
    if (trimmed.includes('color-mix')) {
      const colorMixPaletteMatch = trimmed.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone/)
      if (colorMixPaletteMatch) {
        const [, paletteKey, level] = colorMixPaletteMatch
        return `${paletteKey}-${level}`
      }
      
      // Check if color-mix() contains a token reference - extract and resolve the token directly (not the color-mix result)
      const tokenMatch = trimmed.match(/var\(--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)\)/)
      if (tokenMatch) {
        const [, family, level] = tokenMatch
        // Resolve the token directly (not the color-mix result which includes opacity)
        const tokenCssVar = `--recursica-tokens-color-${family}-${level}`
        const tokenHex = readCssVarResolved(tokenCssVar)
        if (tokenHex && /^#[0-9a-f]{6}$/i.test(tokenHex)) {
          const targetHex = tokenHex.toLowerCase().trim()
          // Find the first palette swatch that matches this hex
          for (const pk of paletteKeys) {
            const levels = paletteLevels[pk] || []
            for (const level of levels) {
              const paletteCssVar = buildPaletteCssVar(pk, level)
              const paletteResolved = readCssVarResolved(paletteCssVar)
              if (paletteResolved && /^#[0-9a-f]{6}$/i.test(paletteResolved)) {
                const paletteHex = paletteResolved.toLowerCase().trim()
                if (targetHex === paletteHex) {
                  return `${pk}-${level}`
                }
              }
            }
          }
        }
      }
    }
    
    // If target is a direct token reference (not in color-mix), find the first matching palette swatch
    const isTokenReference = trimmed.startsWith('var(--recursica-tokens-color-')
    if (isTokenReference && targetResolvedValue.resolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
      const targetHex = targetResolvedValue.resolved.toLowerCase().trim()
      // Find the first palette swatch that matches this hex
      for (const pk of paletteKeys) {
        const levels = paletteLevels[pk] || []
        for (const level of levels) {
          const paletteCssVar = buildPaletteCssVar(pk, level)
          const paletteResolved = readCssVarResolved(paletteCssVar)
          if (paletteResolved && /^#[0-9a-f]{6}$/i.test(paletteResolved)) {
            const paletteHex = paletteResolved.toLowerCase().trim()
            if (targetHex === paletteHex) {
              return `${pk}-${level}`
            }
          }
        }
      }
    }
    
    return null
  }, [targetResolvedValue, targetCssVar, paletteKeys, paletteLevels, buildPaletteCssVar])

  // Check if "none" is selected (CSS var is empty, null, or transparent)
  const isNoneSelected = useMemo(() => {
    if (!targetCssVar) return false
    const directValue = readCssVar(targetCssVar)
    if (!directValue || directValue.trim() === '' || directValue === 'null' || directValue === 'transparent') {
      return true
    }
    // Check if resolved value is transparent
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved && (resolved === 'transparent' || resolved === 'rgba(0, 0, 0, 0)' || resolved === 'rgba(255, 255, 255, 0)')) {
      return true
    }
    return false
  }, [targetCssVar])

  // Check if a palette swatch is currently selected
  const isSwatchSelected = (paletteCssVar: string): boolean => {
    if (!targetResolvedValue || !targetCssVar) return false
    
    // Extract palette key and level from the palette CSS var
    // Use new brand.json structure: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
    const paletteMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone/)
    if (!paletteMatch) return false
    
    const [, paletteKey, level] = paletteMatch
    const paletteId = `${paletteKey}-${level}`
    
    // Check if target CSS var directly references this palette var
    const directValue = readCssVar(targetCssVar)
    if (directValue) {
      const trimmed = directValue.trim()
      const expectedValue = `var(${paletteCssVar})`
      if (trimmed === expectedValue) {
        return true
      }
      
      // Check if target is a color-mix() that contains this palette var
      // Extract the palette var name (without var()) to check if it's in the color-mix
      const paletteVarName = paletteCssVar.replace(/^var\(/, '').replace(/\)$/, '')
      if (trimmed.includes('color-mix') && trimmed.includes(paletteVarName)) {
        return true
      }
      
      // If target is a UIKit variable or other var() reference, resolve it and compare hex values
      if (trimmed.startsWith('var(')) {
        // Resolve the target CSS variable to hex
        const targetHex = readCssVarResolved(targetCssVar, 10)
        if (targetHex && /^#[0-9a-f]{6}$/i.test(targetHex.trim())) {
          // Resolve the palette CSS variable to hex
          const paletteHex = readCssVarResolved(paletteCssVar, 10)
          if (paletteHex && /^#[0-9a-f]{6}$/i.test(paletteHex.trim())) {
            // Compare hex values (case-insensitive)
            if (targetHex.trim().toLowerCase() === paletteHex.trim().toLowerCase()) {
              return true
            }
          }
        }
      }
    }
    
    // Use the tracked selected swatch to avoid multiple selections
    if (selectedPaletteSwatch) {
      return selectedPaletteSwatch === paletteId
    }
    
    // Fallback: compare resolved hex values
    if (targetResolvedValue.resolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
      const paletteHex = readCssVarResolved(paletteCssVar, 10)
      if (paletteHex && /^#[0-9a-f]{6}$/i.test(paletteHex.trim())) {
        if (targetResolvedValue.resolved.trim().toLowerCase() === paletteHex.trim().toLowerCase()) {
          return true
        }
      }
    }
    
    return false
  }

  ;(window as any).openPalettePicker = (el: HTMLElement, cssVar: string, cssVarsArray?: string[]) => {
    setAnchor(el)
    setTargetCssVar(cssVar || null)
    setTargetCssVars(cssVarsArray && cssVarsArray.length > 0 ? cssVarsArray : [])
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetCssVar) return null

  const labelCol = 120
  const swatch = 18
  const gap = 1
  const maxLevelCount = Math.max(...Object.values(paletteLevels).map((levels) => levels.length), 0)
  // Calculate width to fit all swatches without wrapping - hug the content
  const swatchAreaWidth = maxLevelCount * (swatch + gap) - gap // Exact width needed for all swatches
  const overlayWidth = labelCol + swatchAreaWidth + 32
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  // Get elevation level from layer 3
  const elevationLevel = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const layerSpec: any = themes?.[mode]?.layers?.['layer-3'] || themes?.[mode]?.layer?.['layer-3'] || {}
      const v: any = layerSpec?.properties?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations?\.(elevation-(\d+))/i)
        if (m) return m[2]
      }
    } catch {}
    return '3' // Default to elevation-3 if not found
  }, [themeJson, mode])

  const elevationBoxShadow = `var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0.1))`

  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, maxWidth: '90vw', background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface))`, color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color))`, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color))`, borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius, var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius))`, boxShadow: elevationBoxShadow, padding: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding, var(--recursica-brand-themes-${mode}-layer-layer-3-property-padding))`, zIndex: 20000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Pick palette color</div>
        <button onClick={() => setAnchor(null)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        {/* None option */}
        <div style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>None</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
            <div
              title="None"
              onClick={(e) => {
                e.stopPropagation()
                try {
                  const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                  
                  // Remove CSS variables for "none" (remove the CSS var to use default/transparent)
                  cssVarsToUpdate.forEach((cssVar) => {
                    const prefixedTarget = cssVar.startsWith('--recursica-')
                      ? cssVar
                      : cssVar.startsWith('--')
                        ? `--recursica-${cssVar.slice(2)}`
                        : `--recursica-${cssVar}`
                    
                    // Remove the CSS var to clear the color (falls back to default/transparent)
                    removeCssVar(prefixedTarget)
                  })
                  
                  try {
                    window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                      detail: { cssVars: cssVarsToUpdate } 
                    }))
                  } catch {}
                  
                  onSelect?.('none')
                } catch (err) {
                  console.error('Failed to set none:', err)
                }
                setAnchor(null)
                setTargetCssVar(null)
                setTargetCssVars([])
              }}
              style={{
                position: 'relative',
                width: swatch,
                height: swatch,
                background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`,
                cursor: 'pointer',
                border: `1px solid var(--recursica-brand-themes-${mode}-palettes-neutral-200-tone)`,
                flex: '0 0 auto',
              }}
            >
              {/* Diagonal line through box */}
              <svg
                width={swatch}
                height={swatch}
                viewBox={`0 0 ${swatch} ${swatch}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1="2"
                  y1="2"
                  x2={swatch - 2}
                  y2={swatch - 2}
                  stroke={`var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {isNoneSelected && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                >
                  {/* White checkmark with dark shadow for visibility on any background */}
                  <path
                    d="M2 6L5 9L10 2"
                    stroke={`var(--recursica-brand-themes-${mode}-palettes-core-black)`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.4"
                  />
                  <path
                    d="M2 6L5 9L10 2"
                    stroke={`var(--recursica-brand-themes-${mode}-palettes-core-white)`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
        {paletteKeys.map((pk) => (
          <div key={pk} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{toTitle(pk)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap }}>
              {(paletteLevels[pk] || []).map((level) => {
                const paletteCssVar = buildPaletteCssVar(pk, level)
                const isSelected = isSwatchSelected(paletteCssVar)
                return (
                  <div
                    key={`${pk}-${level}`}
                    title={`${pk}/${level}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        // Get all CSS vars to update (use array if provided, otherwise just the single target)
                        const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                        
                        // Update all CSS variables - only update CSS vars, never JSON
                        cssVarsToUpdate.forEach((cssVar) => {
                          // Ensure target CSS var has --recursica- prefix if it doesn't already
                          const prefixedTarget = cssVar.startsWith('--recursica-')
                            ? cssVar
                            : cssVar.startsWith('--')
                              ? `--recursica-${cssVar.slice(2)}`
                              : `--recursica-${cssVar}`

                          // Set the target CSS variable to reference the selected palette CSS variable
                          updateCssVar(prefixedTarget, `var(${paletteCssVar})`, tokensJson)
                        })
                        
                        // Trigger a custom event to notify that CSS vars were updated
                        try {
                          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                            detail: { cssVars: cssVarsToUpdate, paletteCssVar } 
                          }))
                        } catch {}
                        
                        // Persist to theme JSON if this is an overlay color
                        const isOverlayColor = cssVarsToUpdate.some(cssVar => cssVar.includes('state-overlay-color'))
                        if (isOverlayColor && setTheme && themeJson) {
                          try {
                            const themeCopy = JSON.parse(JSON.stringify(themeJson))
                            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                            const themes = root?.themes || root
                            
                            // Determine which mode (light or dark)
                            const isDark = cssVarsToUpdate.some(cssVar => cssVar.includes('-dark-'))
                            const modeKey = isDark ? 'dark' : 'light'
                            
                            // Extract palette key and level from paletteCssVar
                            // Format: --recursica-brand-themes-{mode}-palettes-{paletteKey}-{level}-tone
                            const paletteMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-([a-z0-9]+)-tone/)
                            if (paletteMatch) {
                              const [, paletteKey, level] = paletteMatch
                              const cssLevel = level === 'primary' ? 'default' : level
                              
                              // Ensure state structure exists
                              if (!themes[modeKey]) themes[modeKey] = {}
                              if (!themes[modeKey].states) themes[modeKey].states = {}
                              if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
                              
                              // Update the overlay color reference in theme JSON
                              themes[modeKey].states.overlay.color = {
                                $type: 'color',
                                $value: `{brand.themes.${modeKey}.palettes.${paletteKey}.${cssLevel}.color.tone}`
                              }
                              
                              setTheme(themeCopy)
                            }
                          } catch (err) {
                            console.error('Failed to update theme JSON for overlay color:', err)
                          }
                        }
                        
                        onSelect?.(paletteCssVar)
                      } catch (err) {
                        console.error('Failed to set palette CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                      setTargetCssVars([])
                    }}
                    style={{
                      position: 'relative',
                      width: swatch,
                      height: swatch,
                      background: `var(${paletteCssVar})`,
                      cursor: 'pointer',
                      border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`,
                      flex: '0 0 auto',
                    }}
                  >
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        {/* White checkmark with dark shadow for visibility on any background */}
                        <path
                          d="M2 6L5 9L10 2"
                          stroke={`var(--recursica-brand-themes-${mode}-palettes-core-black)`}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.4"
                        />
                        <path
                          d="M2 6L5 9L10 2"
                          stroke={`var(--recursica-brand-themes-${mode}-palettes-core-white)`}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
