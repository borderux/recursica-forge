import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
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
    return `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-tone`
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
    const directPaletteMatch = trimmed.match(/var\(--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone\)/)
    if (directPaletteMatch) {
      const [, paletteKey, level] = directPaletteMatch
      return `${paletteKey}-${level}`
    }
    
    // Check if target is a color-mix() that contains a palette var
    if (trimmed.includes('color-mix')) {
      const colorMixPaletteMatch = trimmed.match(/--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone/)
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

  // Check if a palette swatch is currently selected
  const isSwatchSelected = (paletteCssVar: string): boolean => {
    if (!targetResolvedValue || !targetCssVar) return false
    
    // Extract palette key and level from the palette CSS var
    const paletteMatch = paletteCssVar.match(/--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone/)
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
    }
    
    // Use the tracked selected swatch to avoid multiple selections
    if (selectedPaletteSwatch) {
      return selectedPaletteSwatch === paletteId
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
  const overlayWidth = labelCol + maxLevelCount * (swatch + gap) + 32
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-surface, var(--recursica-brand-${mode}-layer-layer-3-property-surface))`, color: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-element-text-color, var(--recursica-brand-${mode}-layer-layer-3-property-element-text-color))`, border: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-thickness, var(--recursica-brand-${mode}-layer-layer-3-property-border-thickness)) solid var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-color, var(--recursica-brand-${mode}-layer-layer-3-property-border-color))`, borderRadius: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-radius, var(--recursica-brand-${mode}-layer-layer-3-property-border-radius))`, boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-4-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-4-shadow-color, rgba(0, 0, 0, 0.1))`, padding: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-padding, var(--recursica-brand-${mode}-layer-layer-3-property-padding))`, zIndex: 20000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Pick palette color</div>
        <button onClick={() => setAnchor(null)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {paletteKeys.map((pk) => (
          <div key={pk} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{toTitle(pk)}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
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
                            // Format: --recursica-brand-{mode}-palettes-{paletteKey}-{level}-tone
                            const paletteMatch = paletteCssVar.match(/--recursica-brand-(?:light|dark)-palettes-([a-z0-9-]+)-([a-z0-9]+)-tone/)
                            if (paletteMatch) {
                              const [, paletteKey, level] = paletteMatch
                              const cssLevel = level === 'primary' ? 'default' : level
                              
                              // Ensure state structure exists
                              if (!themes[modeKey]) themes[modeKey] = {}
                              if (!themes[modeKey].state) themes[modeKey].state = {}
                              if (!themes[modeKey].state.overlay) themes[modeKey].state.overlay = {}
                              
                              // Update the overlay color reference in theme JSON
                              themes[modeKey].state.overlay.color = {
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
                      border: `var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-thickness) solid var(--recursica-brand-${mode}-layer-layer-alternative-floating-property-border-color)`,
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
                          stroke={`var(--recursica-brand-${mode}-palettes-core-black)`}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.4"
                        />
                        <path
                          d="M2 6L5 9L10 2"
                          stroke={`var(--recursica-brand-${mode}-palettes-core-white)`}
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
