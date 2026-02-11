import { useState, useMemo, useEffect, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import FloatingPalette from '../toolbar/menu/floating-palette/FloatingPalette'
import Dropdown from '../toolbar/menu/dropdown/Dropdown'
import { Label } from '../../components/adapters/Label'
import './OverlayTokenPicker.css'

interface OverlayTokenPickerProps {
  anchorElement: HTMLElement | null
  onClose: () => void
}

export default function OverlayTokenPicker({ anchorElement, onClose }: OverlayTokenPickerProps) {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase()
  
  const overlayColorVar = `--recursica-brand-themes-${modeLower}-state-overlay-color`
  const overlayOpacityVar = `--recursica-brand-themes-${modeLower}-state-overlay-opacity`

  // Get opacity tokens and build dropdown options
  const opacityOptions = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ key: string; label: string; tokenName: string }> = Object.keys(src)
      .filter((k) => !k.startsWith('$'))
      .map((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        const percentage = Math.round((num <= 1 ? num : num / 100) * 100)
        const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
        return {
          key: k,
          label: `${label} (${percentage}%)`,
          tokenName: `opacity/${k}`,
          value: num, // Store the numeric value for filtering and sorting
        }
      })
      .filter((it) => Number.isFinite(it.value)) // Filter by value, not key
      .map(({ value, ...rest }) => rest) // Remove value from final objects
    list.sort((a, b) => {
      const aVal = src[a.key]?.$value
      const bVal = src[b.key]?.$value
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal)
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal)
      return aNum - bNum
    })
    return list
  }, [tokensJson])

  // Extract current opacity token from CSS variable
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      const rawValue = readCssVar(cssVar)
      if (!rawValue) return null
      
      let match = rawValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return match[1]
      
      const resolvedValue = readCssVarResolved(cssVar)
      if (resolvedValue) {
        match = resolvedValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
        if (match) return match[1]
        
        const resolvedNum = parseFloat(resolvedValue)
        if (!isNaN(resolvedNum)) {
          const normalized = resolvedNum <= 1 ? resolvedNum : resolvedNum / 100
          const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
          for (const [key, val] of Object.entries(src)) {
            if (key.startsWith('$')) continue
            const v = (val as any)?.$value
            const num = typeof v === 'number' ? v : Number(v)
            const tokenNormalized = num <= 1 ? num : num / 100
            if (Math.abs(tokenNormalized - normalized) < 0.01) {
              return key
            }
          }
        }
      }
    } catch {}
    return null
  }

  const getCurrentOpacitySelection = useMemo(() => {
    return (): string => {
      const tokenKey = extractTokenFromCssVar(overlayOpacityVar)
      if (tokenKey) return tokenKey
      // If no token found, try to find by value
      const resolvedValue = readCssVarResolved(overlayOpacityVar)
      if (resolvedValue) {
        const resolvedNum = parseFloat(resolvedValue)
        if (!isNaN(resolvedNum)) {
          const normalized = resolvedNum <= 1 ? resolvedNum : resolvedNum / 100
          const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
          for (const [key, val] of Object.entries(src)) {
            if (key.startsWith('$')) continue
            const v = (val as any)?.$value
            const num = typeof v === 'number' ? v : Number(v)
            const tokenNormalized = num <= 1 ? num : num / 100
            if (Math.abs(tokenNormalized - normalized) < 0.01) {
              return key
            }
          }
        }
      }
      return opacityOptions[0]?.key || ''
    }
  }, [overlayOpacityVar, tokensJson, opacityOptions])

  const [selectedOpacity, setSelectedOpacity] = useState(() => getCurrentOpacitySelection())

  // Force initial read and update when dependencies change
  useEffect(() => {
    const current = getCurrentOpacitySelection()
    if (current) {
      setSelectedOpacity(current)
    }
  }, [getCurrentOpacitySelection])

  // Listen for opacity changes and update dropdown value
  useEffect(() => {
    const handleUpdate = () => {
      setSelectedOpacity(getCurrentOpacitySelection())
    }
    
    window.addEventListener('tokenOverridesChanged', handleUpdate as any)
    window.addEventListener('paletteVarsChanged', handleUpdate as any)
    
    const interval = setInterval(handleUpdate, 200)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('tokenOverridesChanged', handleUpdate as any)
      window.removeEventListener('paletteVarsChanged', handleUpdate as any)
    }
  }, [modeLower, opacityOptions, tokensJson])

  // Handle opacity selection from dropdown
  const handleOpacitySelect = (key: string) => {
    const option = opacityOptions.find(o => o.key === key)
    if (option) {
      const tokenKey = option.key
      const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
      
      // Update CSS var
      updateCssVar(overlayOpacityVar, `var(${opacityCssVar})`)
      
      // Update theme JSON
      if (setTheme && themeJson) {
        try {
          const themeCopy = JSON.parse(JSON.stringify(themeJson))
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root
          
          if (!themes[modeLower]) themes[modeLower] = {}
          if (!themes[modeLower].states) themes[modeLower].states = {}
          if (!themes[modeLower].states.overlay) themes[modeLower].states.overlay = {}
          
          themes[modeLower].states.overlay.opacity = {
            $type: 'number',
            $value: `{tokens.opacity.${tokenKey}}`
          }
          
          setTheme(themeCopy)
        } catch (err) {
          console.error('Failed to update theme JSON for overlay opacity:', err)
        }
      }
      
      setSelectedOpacity(key)
    }
  }

  // Get core colors
  const coreColors = useMemo(() => {
    const colors: Array<{ key: string; cssVar: string; label: string }> = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const coreColorsRaw: any = themes?.[modeLower]?.palettes?.['core-colors'] || themes?.[modeLower]?.palettes?.core || {}
      const coreColorsObj: any = coreColorsRaw?.$value || coreColorsRaw || {}
      
      // Add interactive colors (default and hover states)
      if (coreColorsObj?.interactive) {
        const interactive = coreColorsObj.interactive
        if (interactive.default?.tone) {
          colors.push({
            key: 'interactive-default',
            cssVar: `--recursica-brand-themes-${modeLower}-palettes-core-interactive-default-tone`,
            label: 'Interactive / Default'
          })
        }
        if (interactive.hover?.tone) {
          colors.push({
            key: 'interactive-hover',
            cssVar: `--recursica-brand-themes-${modeLower}-palettes-core-interactive-hover-tone`,
            label: 'Interactive / Hover'
          })
        }
        if (!interactive.default && !interactive.hover && interactive.tone) {
          colors.push({
            key: 'interactive',
            cssVar: `--recursica-brand-themes-${modeLower}-palettes-core-interactive`,
            label: 'Interactive'
          })
        }
      }
      
      // Add other core colors
      const coreColorKeys = ['black', 'white', 'alert', 'warning', 'success']
      coreColorKeys.forEach((colorKey) => {
        if (coreColorsObj[colorKey]) {
          colors.push({
            key: colorKey,
            cssVar: `--recursica-brand-themes-${modeLower}-palettes-core-${colorKey}-tone`,
            label: colorKey.charAt(0).toUpperCase() + colorKey.slice(1)
          })
        }
      })
    } catch {}
    return colors
  }, [themeJson, modeLower])

  // Get palette keys and levels for color picker
  const { palettes } = useVars()
  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const lightPal: any = themes?.light?.palettes || themes?.light?.palette || {}
      Object.keys(lightPal).forEach((k) => {
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch {}
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])

  const paletteLevels = useMemo(() => {
    const levels: Record<string, string[]> = {}
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const modePal: any = themes?.[modeLower]?.palettes || themes?.[modeLower]?.palette || {}
      
      paletteKeys.forEach((pk) => {
        const palette: any = modePal[pk]
        if (palette) {
          const $value = palette.$value || palette
          const keys = Object.keys($value).filter((k) => !k.startsWith('$'))
          levels[pk] = keys
        }
      })
    } catch {}
    return levels
  }, [paletteKeys, themeJson, modeLower])

  // Build palette CSS var
  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    const normalizedLevel = level === 'primary' ? 'default' : level
    return `--recursica-brand-themes-${modeLower}-palettes-${paletteKey}-${normalizedLevel}-tone`
  }

  // Check if a palette swatch is selected
  const isSwatchSelected = (paletteCssVar: string): boolean => {
    const currentValue = readCssVarResolved(overlayColorVar)
    if (!currentValue) return false
    
    const paletteValue = readCssVarResolved(paletteCssVar)
    if (!paletteValue) return false
    
    return currentValue === paletteValue
  }

  // Handle core color selection
  const handleCoreColorSelect = (coreColorCssVar: string, coreColorKey: string) => {
    try {
      // Update CSS var directly (same as palette colors)
      const cssVarValue = `var(${coreColorCssVar})`
      const success = updateCssVar(overlayColorVar, cssVarValue, tokensJson)
      if (!success) {
        console.warn(`[OverlayPicker] Failed to update overlay color CSS var: ${overlayColorVar} = ${cssVarValue}`)
      }
      
      // Update theme JSON
      if (setTheme && themeJson) {
        try {
          const themeCopy = JSON.parse(JSON.stringify(themeJson))
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root
          const modeKey = modeLower
          
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].states) themes[modeKey].states = {}
          if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
          
          // Handle interactive colors with states
          if (coreColorKey === 'interactive-default') {
            themes[modeKey].states.overlay.color = {
              $type: 'color',
              $value: `{brand.themes.${modeKey}.palettes.core-colors.interactive.default.tone}`
            }
          } else if (coreColorKey === 'interactive-hover') {
            themes[modeKey].states.overlay.color = {
              $type: 'color',
              $value: `{brand.themes.${modeKey}.palettes.core-colors.interactive.hover.tone}`
            }
          } else {
            // For non-interactive core colors (black, white, alert, warning, success),
            // use the reference format with .tone to match the CSS variable format
            // This will resolve to: var(--recursica-brand-themes-${mode}-palettes-core-${coreColorKey}-tone)
            themes[modeKey].states.overlay.color = {
              $type: 'color',
              $value: `{brand.palettes.core-colors.${coreColorKey}.tone}`
            }
          }
          
          setTheme(themeCopy)
        } catch (err) {
          console.error('Failed to update theme JSON for overlay color:', err)
        }
      }
      
      // Dispatch event
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
            detail: { cssVars: [overlayColorVar] } 
          }))
        } catch {}
      }, 0)
    } catch (err) {
      console.error('Failed to set overlay color:', err)
    }
  }

  // Handle palette color selection
  const handleColorSelect = (paletteCssVar: string, paletteKey: string, level: string) => {
    try {
      // Update CSS var
      updateCssVar(overlayColorVar, `var(${paletteCssVar})`, tokensJson)
      
      // Update theme JSON
      if (setTheme && themeJson) {
        try {
          const themeCopy = JSON.parse(JSON.stringify(themeJson))
          const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
          const themes = root?.themes || root
          const modeKey = modeLower
          
          const cssLevel = level === 'primary' ? 'default' : level
          
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].states) themes[modeKey].states = {}
          if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
          
          themes[modeKey].states.overlay.color = {
            $type: 'color',
            $value: `{brand.themes.${modeKey}.palettes.${paletteKey}.${cssLevel}.color.tone}`
          }
          
          setTheme(themeCopy)
        } catch (err) {
          console.error('Failed to update theme JSON for overlay color:', err)
        }
      }
      
      // Dispatch event
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
            detail: { cssVars: [overlayColorVar] } 
          }))
        } catch {}
      }, 0)
    } catch (err) {
      console.error('Failed to set overlay color:', err)
    }
  }

  const toTitle = (str: string): string => {
    return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }

  const swatch = 24
  const gap = 4

  if (!anchorElement) return null

  // Collect all swatches in a flat list (no palette grouping)
  const allSwatches = useMemo(() => {
    const swatches: Array<{ cssVar: string; key: string; label: string; type: 'core' | 'palette'; paletteKey?: string; level?: string; coreColorKey?: string }> = []
    
    // Add core colors
    coreColors.forEach(cc => {
      swatches.push({
        cssVar: cc.cssVar,
        key: `core-${cc.key}`,
        label: cc.label,
        type: 'core' as const,
        coreColorKey: cc.key
      })
    })
    
    // Add all palette swatches
    paletteKeys.forEach(pk => {
      (paletteLevels[pk] || []).forEach(level => {
        const paletteCssVar = buildPaletteCssVar(pk, level)
        swatches.push({
          cssVar: paletteCssVar,
          key: `${pk}::${level}`, // Use :: as separator to avoid conflicts with hyphens in palette keys
          label: `${toTitle(pk)} / ${level}`,
          type: 'palette',
          paletteKey: pk,
          level: level
        })
      })
    })
    
    return swatches
  }, [coreColors, paletteKeys, paletteLevels, modeLower])

  return (
    <FloatingPalette
      anchorElement={anchorElement}
      title="Choose overlay tokens"
      onClose={onClose}
      draggable={true}
      className="overlay-token-picker"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
        {/* Opacity Dropdown */}
        <div>
          <Label layer="layer-3" style={{ marginBottom: 'var(--recursica-brand-dimensions-general-sm)' }}>
            Opacity
          </Label>
          <Dropdown
            trigger={
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if ((window as any).openOpacityPicker) {
                    (window as any).openOpacityPicker(e.currentTarget, overlayOpacityVar)
                  }
                }}
                style={{
                  width: '100%',
                  padding: `var(--recursica-brand-dimensions-general-sm) var(--recursica-brand-dimensions-general-md)`,
                  border: `1px solid var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-border-color)`,
                  borderRadius: 'var(--recursica-brand-dimensions-border-radii-sm)',
                  backgroundColor: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-surface)`,
                  color: `var(--recursica-brand-themes-${modeLower}-layer-layer-2-property-element-text-color)`,
                  fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                  fontSize: 'var(--recursica-brand-typography-body-font-size)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <span>{opacityOptions.find(o => o.key === selectedOpacity)?.label || 'Select...'}</span>
                <span style={{ fontSize: '12px' }}>▼</span>
              </button>
            }
            items={opacityOptions.map(o => ({ key: o.key, label: o.label }))}
            onSelect={handleOpacitySelect}
          />
        </div>

        {/* Color Swatches - Flat list, no palette grouping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: gap }}>
          {/* None option */}
          <div
            title="None"
            onClick={(e) => {
              e.stopPropagation()
              try {
                const { removeCssVar } = require('../../core/css/updateCssVar')
                removeCssVar(overlayColorVar)
                
                if (setTheme && themeJson) {
                  const themeCopy = JSON.parse(JSON.stringify(themeJson))
                  const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                  const themes = root?.themes || root
                  const modeKey = modeLower
                  
                  if (themes[modeKey]?.states?.overlay) {
                    delete themes[modeKey].states.overlay.color
                    setTheme(themeCopy)
                  }
                }
                
                setTimeout(() => {
                  try {
                    window.dispatchEvent(new CustomEvent('cssVarsUpdated', { 
                      detail: { cssVars: [overlayColorVar] } 
                    }))
                  } catch {}
                }, 0)
              } catch (err) {
                console.error('Failed to set none:', err)
              }
            }}
            style={{
              position: 'relative',
              width: swatch,
              height: swatch,
              cursor: 'pointer',
              border: `1px solid var(--recursica-brand-themes-${modeLower}-palettes-neutral-500-tone)`,
              flex: '0 0 auto',
              borderRadius: 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-surface)`,
                position: 'relative',
              }}
            >
              <svg
                width={swatch}
                height={swatch}
                viewBox={`0 0 ${swatch} ${swatch}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1="2"
                  y1="2"
                  x2={swatch - 2}
                  y2={swatch - 2}
                  stroke={`var(--recursica-brand-themes-${modeLower}-palettes-neutral-500-tone)`}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* All swatches in flat list */}
          {allSwatches.map((swatchItem) => {
            const isSelected = isSwatchSelected(swatchItem.cssVar)
            const handleClick = () => {
              if (swatchItem.type === 'core' && swatchItem.coreColorKey) {
                handleCoreColorSelect(swatchItem.cssVar, swatchItem.coreColorKey)
              } else if (swatchItem.type === 'palette' && swatchItem.paletteKey && swatchItem.level) {
                handleColorSelect(swatchItem.cssVar, swatchItem.paletteKey, swatchItem.level)
              }
            }
            
            return (
              <div
                key={swatchItem.key}
                title={swatchItem.label}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleClick()
                }}
                style={{
                  position: 'relative',
                  width: swatch,
                  height: swatch,
                  cursor: 'pointer',
                  border: isSelected 
                    ? `2px solid var(--recursica-brand-themes-${modeLower}-palettes-core-black)` 
                    : `1px solid var(--recursica-brand-themes-${modeLower}-palettes-neutral-500-tone)`,
                  flex: '0 0 auto',
                  padding: isSelected ? '1px' : '0',
                  borderRadius: isSelected ? '5px' : '0',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: `var(${swatchItem.cssVar})`,
                    borderRadius: isSelected ? '4px' : '0',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </FloatingPalette>
  )
}
