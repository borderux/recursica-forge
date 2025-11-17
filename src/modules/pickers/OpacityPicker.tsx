import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'

export default function OpacityPicker() {
  const { tokens: tokensJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  
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
    
    setAnchor(null)
    setTargetCssVar(null)
    setCurrentToken(null)
  }

  if (!anchor || !targetCssVar) return null
  
  return createPortal(
    <div style={{ 
      position: 'fixed', 
      top: pos.top, 
      left: pos.left, 
      width: 240, 
      background: 'var(--recursica-brand-light-layer-layer-2-property-surface)', 
      border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color)', 
      borderRadius: 8, 
      boxShadow: 'var(--recursica-brand-light-elevations-elevation-2-x-axis) var(--recursica-brand-light-elevations-elevation-2-y-axis) var(--recursica-brand-light-elevations-elevation-2-blur) var(--recursica-brand-light-elevations-elevation-2-spread) var(--recursica-brand-light-elevations-elevation-2-shadow-color)', 
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
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}
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
                border: `1px solid ${isSelected ? 'var(--recursica-brand-light-layer-layer-2-property-border-color)' : 'var(--recursica-brand-light-layer-layer-2-property-border-color)'}`, 
                background: isSelected ? 'var(--recursica-brand-light-layer-layer-2-property-surface)' : 'transparent', 
                borderRadius: 6, 
                padding: '6px 8px', 
                cursor: 'pointer' 
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSelected && (
                  <span style={{ fontSize: 14, color: 'var(--recursica-brand-light-palettes-core-interactive-default-tone)' }}>✓</span>
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

