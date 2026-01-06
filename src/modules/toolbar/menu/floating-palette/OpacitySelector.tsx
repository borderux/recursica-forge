import React, { useMemo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'

interface OpacitySelectorProps {
  targetCssVar: string
  label: string
}

export default function OpacitySelector({ targetCssVar, label }: OpacitySelectorProps) {
  const { tokens: tokensJson } = useVars()
  const { mode } = useThemeMode()
  const [isOpen, setIsOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Get available opacity tokens
  const opacityTokens = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ name: string; value: number; label: string }> = Object.keys(src).map((k) => {
      const raw = src[k]?.$value
      const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
      const num = typeof v === 'number' ? v : Number(v)
      return {
        name: `opacity/${k}`,
        value: num <= 1 ? num : num / 100,
        label: k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
      }
    })
    return list.sort((a, b) => a.value - b.value)
  }, [tokensJson])

  // Get current value
  const currentValue = readCssVarResolved(targetCssVar)
  const rawValue = readCssVar(targetCssVar) || ''
  
  // Extract current token from CSS variable value
  const currentToken = useMemo(() => {
    if (!rawValue) return null
    // Match patterns like: var(--recursica-tokens-opacity-solid) or var(--recursica-brand-themes-light-text-emphasis-low)
    const tokenMatch = rawValue.match(/var\(--(?:recursica-)?tokens-opacity-([^)]+)\)/)
    if (tokenMatch) return `opacity/${tokenMatch[1]}`
    
    // If it's a brand text-emphasis reference, try to find matching token by value
    if (rawValue.includes('text-emphasis')) {
      const resolved = currentValue ? parseFloat(currentValue) : null
      if (resolved !== null) {
        const matchingToken = opacityTokens.find(t => Math.abs(t.value - resolved) < 0.01)
        if (matchingToken) return matchingToken.name
      }
    }
    
    return null
  }, [rawValue, currentValue, opacityTokens])

  // Update position when opening
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 260)
      })
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        const dropdown = document.querySelector('.opacity-selector-dropdown')
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (tokenName: string) => {
    const tokenKey = tokenName.replace('opacity/', '')
    const opacityCssVar = `--recursica-tokens-opacity-${tokenKey}`
    
    // Update the target CSS variable to reference the opacity token
    updateCssVar(targetCssVar, `var(${opacityCssVar})`)
    setIsOpen(false)
  }

  const displayValue = currentValue 
    ? `${Math.round(parseFloat(currentValue) * 100)}%`
    : rawValue || 'Not set'

  const currentTokenObj = opacityTokens.find(t => t.name === currentToken)
  const displayLabel = currentTokenObj ? currentTokenObj.label : displayValue

  return (
    <>
      <div className="prop-control-content">
        <label className="prop-control-label">{label}</label>
        <div
          ref={anchorRef}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--recursica-brand-layers-layer-0-properties-surface, #f5f5f5)',
            border: '1px solid var(--recursica-brand-layers-layer-0-properties-border-color, #e0e0e0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '32px',
          }}
        >
          <span>{displayLabel}</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>▼</span>
        </div>
      </div>
      
      {isOpen && createPortal(
        <div
          className="opacity-selector-dropdown"
          style={{
            position: 'fixed',
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            width: '260px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface, #ffffff)`,
            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, #e0e0e0)`,
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            {opacityTokens.map((token) => {
              const isSelected = currentToken === token.name
              return (
                <button
                  key={token.name}
                  onClick={() => handleSelect(token.name)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-3-property-border-color, #e0e0e0)`,
                    background: isSelected 
                      ? `var(--recursica-brand-themes-${mode}-layer-layer-3-property-surface-hover, #f0f0f0)` 
                      : 'transparent',
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-3-property-element-text-color, #000000)`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && (
                      <span style={{ fontSize: 14, color: `var(--recursica-brand-themes-${mode}-palettes-palette-1-default-color-tone, #0066cc)` }}>✓</span>
                    )}
                    <span>{token.label}</span>
                  </span>
                  <span>{`${Math.round(token.value * 100)}%`}</span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

