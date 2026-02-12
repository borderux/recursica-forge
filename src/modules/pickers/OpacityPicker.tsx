import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'

export default function OpacityPicker() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetCssVar(null)
      setCurrentToken(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  
  const options = useMemo(() => {
    // Support both plural (opacities) and singular (opacity) for backwards compatibility
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ name: string; value: number }> = Object.keys(src)
      .filter((k) => !k.startsWith('$'))
      .map((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        return { name: `opacity/${k}`, value: num }
      })
      .filter((it) => Number.isFinite(it.value))
    list.sort((a, b) => a.value - b.value)
    return list
  }, [tokensJson])

  // Extract token name from CSS variable value (handles nested var() references)
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      // First try reading the raw value
      const rawValue = readCssVar(cssVar)
      if (!rawValue) return null
      
      // Match patterns like: var(--recursica-tokens-opacities-solid) or var(--tokens-opacities-solid) or old format (opacity)
      let match = rawValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return `opacity/${match[1]}`
      
      // If no direct match, try resolving nested var() references
      // This handles cases where the CSS var references another CSS var that references the token
      const resolvedValue = readCssVarResolved(cssVar)
      if (resolvedValue) {
        // Try matching the resolved value (might be a var() reference)
        match = resolvedValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
        if (match) return `opacity/${match[1]}`
        
        // If resolved to a numeric value, try to find matching token by value
        const resolvedNum = parseFloat(resolvedValue)
        if (!isNaN(resolvedNum)) {
          // Normalize to 0-1 range for comparison
          const normalized = resolvedNum <= 1 ? resolvedNum : resolvedNum / 100
          
          const tokensRoot: any = (tokensJson as any)?.tokens || {}
          const opacitiesRoot: any = tokensRoot?.opacities || tokensRoot?.opacity || {}
          
          // Try to find a matching token by value
          for (const [key, obj] of Object.entries(opacitiesRoot)) {
            if (key.startsWith('$')) continue
            const tokenValue = (obj as any)?.$value
            const tokenNum = typeof tokenValue === 'number' ? tokenValue : Number(tokenValue)
            if (!isNaN(tokenNum)) {
              const tokenNormalized = tokenNum <= 1 ? tokenNum : tokenNum / 100
              // Match if values are very close (within 0.001)
              if (Math.abs(tokenNormalized - normalized) < 0.001) {
                return `opacity/${key}`
              }
            }
          }
        }
      }
    } catch {}
    return null
  }

  // Update currentToken whenever targetCssVar changes or CSS vars are updated
  useEffect(() => {
    if (!targetCssVar) {
      setCurrentToken(null)
      return
    }
    
    // Extract current token from CSS var value
    const current = extractTokenFromCssVar(targetCssVar)
    setCurrentToken(current)
    
    // Listen for CSS var changes and token override changes to update currentToken
    const handleUpdate = () => {
      const updated = extractTokenFromCssVar(targetCssVar)
      setCurrentToken(updated)
    }
    
    // Check periodically for CSS var changes
    const checkInterval = setInterval(handleUpdate, 200)
    
    // Also listen for token override changes
    window.addEventListener('tokenOverridesChanged', handleUpdate as any)
    window.addEventListener('paletteVarsChanged', handleUpdate as any)
    
    return () => {
      clearInterval(checkInterval)
      window.removeEventListener('tokenOverridesChanged', handleUpdate as any)
      window.removeEventListener('paletteVarsChanged', handleUpdate as any)
    }
  }, [targetCssVar, tokensJson])

  ;(window as any).openOpacityPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetCssVar(cssVar)
    // Extract current token from CSS var value (will also be updated by useEffect)
    const current = extractTokenFromCssVar(cssVar)
    setCurrentToken(current)
    // Calculate absolute position (relative to document, not viewport)
    const rect = el.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop
    const top = rect.bottom + scrollY + 8
    const left = Math.min(rect.left + scrollX, window.innerWidth - 260)
    setPos({ top, left })
  }

  const handleSelect = (tokenName: string) => {
    if (!targetCssVar) return
    
    // Build the opacity token CSS variable - use plural form (opacities)
    const tokenKey = tokenName.replace('opacity/', '')
    const opacityCssVar = `--recursica-tokens-opacities-${tokenKey}`
    
    // Immediately update currentToken to show selection
    setCurrentToken(tokenName)
    
    // Persist to theme JSON if this is a text-emphasis opacity, hover opacity, disabled opacity, or overlay opacity
    const isEmphasisOpacity = targetCssVar.includes('text-emphasis-high') || 
                               targetCssVar.includes('text-emphasis-low')
    const isHoverOpacity = targetCssVar.includes('state-hover')
    const isDisabledOpacity = targetCssVar.includes('state-disabled')
    const isOverlayOpacity = targetCssVar.includes('state-overlay-opacity')
    
    if ((isEmphasisOpacity || isHoverOpacity || isDisabledOpacity || isOverlayOpacity) && setTheme && themeJson) {
      try {
        const themeCopy = JSON.parse(JSON.stringify(themeJson))
        const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
        const themes = root?.themes || root
        
        // Determine which mode (light or dark)
        const isDark = targetCssVar.includes('-dark-')
        const modeKey = isDark ? 'dark' : 'light'
        
        if (isEmphasisOpacity) {
          // Handle text-emphasis opacity
          const isHigh = targetCssVar.includes('text-emphasis-high')
          const emphasisKey = isHigh ? 'high' : 'low'
          
          // Ensure text-emphasis structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey]['text-emphasis']) themes[modeKey]['text-emphasis'] = {}
          
          // Update the opacity reference in theme JSON
          // Use singular form (opacity) to match Brand.json structure, but support both
          themes[modeKey]['text-emphasis'][emphasisKey] = {
            $type: 'number',
            // Support both singular (opacity) and plural (opacities) for backwards compatibility
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isHoverOpacity) {
          // Handle hover opacity
          // Ensure states structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].states) themes[modeKey].states = {}
          
          // Update the hover opacity reference in theme JSON
          themes[modeKey].states.hover = {
            $type: 'number',
            // Use singular form (opacity) to match Brand.json structure
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isDisabledOpacity) {
          // Handle disabled opacity
          // Ensure states structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].states) themes[modeKey].states = {}
          
          // Update the disabled opacity reference in theme JSON
          themes[modeKey].states.disabled = {
            $type: 'number',
            // Use singular form (opacity) to match Brand.json structure
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isOverlayOpacity) {
          // Handle overlay opacity
          // Ensure states structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].states) themes[modeKey].states = {}
          if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
          
          // Update the overlay opacity reference in theme JSON
          themes[modeKey].states.overlay.opacity = {
            $type: 'number',
            // Use singular form (opacity) to match Brand.json structure
            $value: `{tokens.opacity.${tokenKey}}`
          }
        }
        
        // Update theme JSON FIRST - this will trigger recomputeAndApplyAll which will update CSS vars
        setTheme(themeCopy)
        
        // After theme update, the recompute will handle CSS var update, but we can also update it directly
        // as a fallback in case the recompute doesn't catch it immediately
        setTimeout(() => {
          updateCssVar(targetCssVar, `var(${opacityCssVar})`)
        }, 10)
      } catch (err) {
        console.error('Failed to update theme JSON for opacity:', err)
        // Fallback: update CSS var directly if theme update fails
        updateCssVar(targetCssVar, `var(${opacityCssVar})`)
      }
    } else {
      // Not a theme-managed opacity, just update CSS var directly
      updateCssVar(targetCssVar, `var(${opacityCssVar})`)
    }
    
    // If high or low emphasis opacity changed, re-check all palette on-tone colors
    // Use setTimeout to ensure CSS var update completes first
    if (isEmphasisOpacity) {
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('recheckAllPaletteOnTones'))
        } catch {}
      }, 50)
    }
    
    // Re-extract current token after a delay to ensure CSS var is updated
    setTimeout(() => {
      const updated = extractTokenFromCssVar(targetCssVar)
      if (updated) {
        setCurrentToken(updated)
      }
      // Close the picker after selection
      setAnchor(null)
      setTargetCssVar(null)
      setCurrentToken(null)
    }, 100)
  }

  const { mode } = useThemeMode()
  if (!anchor || !targetCssVar) return null
  
  return createPortal(
    <div style={{ 
      position: 'absolute', 
      top: pos.top, 
      left: pos.left, 
      width: 240, 
      background: `var(--recursica-brand-themes-${mode}-layers-layer-3-properties-surface)`, 
      color: `var(--recursica-brand-themes-${mode}-layers-layer-3-elements-text-color)`,
      border: `var(--recursica-brand-themes-${mode}-layers-layer-3-properties-border-thickness) solid var(--recursica-brand-themes-${mode}-layers-layer-3-properties-border-color)`, 
      borderRadius: `var(--recursica-brand-themes-${mode}-layers-layer-3-properties-border-radius)`, 
      boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`, 
      padding: 10, 
      zIndex: 20000 
    }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { 
              left: Math.max(0, Math.min(window.innerWidth - 240, start.left + dx)), 
              top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) 
            }
            setPos(next)
          }
          const up = () => { 
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', up) 
          }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick opacity</div>
        <button 
          onClick={() => { setAnchor(null); setTargetCssVar(null); setCurrentToken(null) }} 
          aria-label="Close" 
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: `var(--recursica-brand-themes-${mode}-layers-layer-3-elements-text-color)` }}
        >
          &times;
        </button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {options.map((opt) => {
          const isSelected = currentToken === opt.name
          return (
            <button 
              key={opt.name} 
              onClick={() => handleSelect(opt.name)} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%', 
                border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-3-properties-border-color)`, 
                background: isSelected 
                  ? `var(--recursica-brand-themes-${mode}-layers-layer-3-properties-surface)` 
                  : 'transparent', 
                color: `var(--recursica-brand-themes-${mode}-layers-layer-3-elements-text-color)`,
                borderRadius: 6, 
                padding: '6px 8px', 
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400,
                opacity: isSelected ? 1 : 0.9
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = `var(--recursica-brand-themes-${mode}-layers-layer-2-properties-surface)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSelected && (
                  <span style={{ fontSize: 14, color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)` }}>✓</span>
                )}
                <span style={{ textTransform: 'capitalize' }}>{opt.name.replace('opacity/','')}</span>
              </span>
              <span>{`${Math.round(opt.value <= 1 ? opt.value * 100 : opt.value)}%`}</span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

