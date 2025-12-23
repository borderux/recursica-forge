import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
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
    const src = (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ name: string; value: number }> = Object.keys(src).map((k) => ({ 
      name: `opacity/${k}`, 
      value: Number(src[k]?.$value) 
    }))
    list.sort((a, b) => a.value - b.value)
    return list
  }, [tokensJson])

  // Extract token name from CSS variable value
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      const value = readCssVar(cssVar)
      if (!value) return null
      // Match patterns like: var(--recursica-tokens-opacity-solid) or var(--tokens-opacity-solid)
      const match = value.match(/var\(--(?:recursica-)?tokens-opacity-([^)]+)\)/)
      if (match) return `opacity/${match[1]}`
    } catch {}
    return null
  }

  ;(window as any).openOpacityPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetCssVar(cssVar)
    // Extract current token from CSS var value
    const current = extractTokenFromCssVar(cssVar)
    setCurrentToken(current)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 260)
    setPos({ top, left })
  }

  const handleSelect = (tokenName: string) => {
    if (!targetCssVar) return
    
    // Build the opacity token CSS variable
    const tokenKey = tokenName.replace('opacity/', '')
    const opacityCssVar = `--recursica-tokens-opacity-${tokenKey}`
    
    // Update the target CSS variable to reference the opacity token
    updateCssVar(targetCssVar, `var(${opacityCssVar})`)
    
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
          themes[modeKey]['text-emphasis'][emphasisKey] = {
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isHoverOpacity) {
          // Handle hover opacity
          // Ensure state structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].state) themes[modeKey].state = {}
          
          // Update the hover opacity reference in theme JSON
          themes[modeKey].state.hover = {
            $type: 'number',
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isDisabledOpacity) {
          // Handle disabled opacity
          // Ensure state structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].state) themes[modeKey].state = {}
          
          // Update the disabled opacity reference in theme JSON
          themes[modeKey].state.disabled = {
            $type: 'number',
            $value: `{tokens.opacity.${tokenKey}}`
          }
        } else if (isOverlayOpacity) {
          // Handle overlay opacity
          // Ensure state structure exists
          if (!themes[modeKey]) themes[modeKey] = {}
          if (!themes[modeKey].state) themes[modeKey].state = {}
          if (!themes[modeKey].state.overlay) themes[modeKey].state.overlay = {}
          
          // Update the overlay opacity reference in theme JSON
          themes[modeKey].state.overlay.opacity = {
            $type: 'number',
            $value: `{tokens.opacity.${tokenKey}}`
          }
        }
        
        setTheme(themeCopy)
      } catch (err) {
        console.error('Failed to update theme JSON for opacity:', err)
      }
    }
    
    // If high or low emphasis opacity changed, re-check all palette on-tone colors
    // Use setTimeout to ensure CSS var update completes first
    if (isEmphasisOpacity) {
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('recheckAllPaletteOnTones'))
        } catch {}
      }, 10)
    }
    
    setAnchor(null)
    setTargetCssVar(null)
    setCurrentToken(null)
  }

  const { mode } = useThemeMode()
  if (!anchor || !targetCssVar) return null
  
  return createPortal(
    <div style={{ 
      position: 'fixed', 
      top: pos.top, 
      left: pos.left, 
      width: 240, 
      background: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)`, 
      color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
      border: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-thickness) solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, 
      borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-radius)`, 
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
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)` }}
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
                border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color)`, 
                background: isSelected ? `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface)` : 'transparent', 
                color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color)`,
                borderRadius: 6, 
                padding: '6px 8px', 
                cursor: 'pointer' 
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSelected && (
                  <span style={{ fontSize: 14, color: `var(--recursica-brand-${mode}-palettes-core-interactive-default-tone)` }}>✓</span>
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

