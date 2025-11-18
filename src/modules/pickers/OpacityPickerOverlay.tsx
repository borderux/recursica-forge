import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides, setOverride } from '../theme/tokenOverrides'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'

function toTitleCase(label: string): string {
  return (label || '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .trim()
}

const toPctNumber = (v: any) => {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) return 0
  return n <= 1 ? Math.round(n * 100) : Math.round(n)
}

export type OpacityPickerOverlayProps = {
  tokenName?: string
  onClose?: () => void
  onSelect?: (tokenName: string, value: number, cssVarName?: string) => void
}

export default function OpacityPickerOverlay({ tokenName: propTokenName, onClose, onSelect }: OpacityPickerOverlayProps) {
  const { tokens: tokensJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [selectedTokenName, setSelectedTokenName] = useState<string | undefined>(propTokenName)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)

  // Close overlay when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetCssVar(null)
      setCurrentToken(null)
      onClose()
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [onClose])

  const flattened = useMemo(() => {
    const list: Array<{ name: string; value: number }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(src).forEach((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) list.push({ name: `opacity/${k}`, value: num })
      })
    } catch {}
    return list
  }, [tokensJson])

  // Reflect latest overrides; listen to tokenOverridesChanged events
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener('tokenOverridesChanged', handler as any)
    return () => window.removeEventListener('tokenOverridesChanged', handler as any)
  }, [])
  const overrides = useMemo(() => readOverrides(), [version])

  const items = useMemo(() => {
    const out: Array<{ name: string; value: number | string }> = flattened
    const toPct = (v: any) => {
      const n = typeof v === 'number' ? v : parseFloat(v)
      if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY
      return n <= 1 ? n * 100 : n
    }
    return out.sort((a, b) => toPct(a.value) - toPct(b.value))
  }, [flattened])

  // If tokenName is provided, filter to show only that token
  const filteredItems = useMemo(() => {
    const tokenToFilter = selectedTokenName || propTokenName
    if (!tokenToFilter) return items
    return items.filter((item) => item.name === tokenToFilter)
  }, [items, selectedTokenName, propTokenName])

  // Extract token name from CSS variable value
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      // Ensure CSS var has --recursica- prefix if it doesn't already
      const prefixedTarget = cssVar.startsWith('--recursica-') 
        ? cssVar 
        : cssVar.startsWith('--') 
          ? `--recursica-${cssVar.slice(2)}`
          : `--recursica-${cssVar}`
      
      const value = readCssVar(prefixedTarget)
      if (!value) return null
      // Match patterns like: var(--recursica-tokens-opacity-solid) or var(--tokens-opacity-solid)
      const match = value.match(/var\(--(?:recursica-)?tokens-opacity-([^)]+)\)/)
      if (match) return `opacity/${match[1]}`
    } catch {}
    return null
  }

  ;(window as any).openOpacityPicker = (el: HTMLElement, targetTokenNameOrCssVar?: string) => {
    setAnchor(el)
    // If it looks like a CSS variable (starts with --), treat it as targetCssVar
    if (targetTokenNameOrCssVar?.startsWith('--')) {
      setTargetCssVar(targetTokenNameOrCssVar)
      setSelectedTokenName(undefined)
      // Extract current token from CSS var value
      const current = extractTokenFromCssVar(targetTokenNameOrCssVar)
      setCurrentToken(current)
    } else {
      // Otherwise, treat it as a token name filter
      setTargetCssVar(null)
      setSelectedTokenName(targetTokenNameOrCssVar)
      setCurrentToken(null)
    }
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 400)
    setPos({ top, left })
  }

  const handleClose = () => {
    setAnchor(null)
    setTargetCssVar(null)
    setCurrentToken(null)
    onClose?.()
  }

  const handleTokenSelect = (tokenName: string, value: number) => {
    // Build the CSS variable name for the opacity token
    const tokenKey = tokenName.replace('opacity/', '')
    const opacityCssVar = `--recursica-tokens-opacity-${tokenKey}`
    
    // If we have a target CSS variable, set it to reference the opacity token
    if (targetCssVar) {
      try {
        const root = document.documentElement
        // Ensure target CSS var has --recursica- prefix if it doesn't already
        const prefixedTarget = targetCssVar.startsWith('--recursica-') 
          ? targetCssVar 
          : targetCssVar.startsWith('--') 
            ? `--recursica-${targetCssVar.slice(2)}`
            : `--recursica-${targetCssVar}`
        
        // Set the target CSS variable to reference the opacity token CSS variable
        updateCssVar(prefixedTarget, `var(${opacityCssVar})`)
        
        // Call onSelect with the opacity token CSS var name
        onSelect?.(tokenName, value, opacityCssVar)
      } catch (err) {
        console.error('Failed to set opacity CSS variable:', err)
      }
    } else {
      // No target CSS var, just call onSelect
      onSelect?.(tokenName, value)
    }
    
    handleClose()
  }

  if (!anchor) return null

  const { mode } = useThemeMode()
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 400,
        background: `var(--recursica-brand-${mode}-layer-layer-2-property-surface)`,
        color: `var(--recursica-brand-${mode}-layer-layer-2-property-element-text-color)`,
        border: `1px solid var(--recursica-brand-${mode}-layer-layer-2-property-border-color)`,
        borderRadius: 8,
        boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-2-x-axis) var(--recursica-brand-${mode}-elevations-elevation-2-y-axis) var(--recursica-brand-${mode}-elevations-elevation-2-blur) var(--recursica-brand-${mode}-elevations-elevation-2-spread) var(--recursica-brand-${mode}-elevations-elevation-2-shadow-color)`,
        padding: 16,
        zIndex: 20000,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Opacity</div>
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}
        >
          &times;
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {filteredItems.map((it) => {
          const label = toTitleCase(it.name.replace('opacity/', ''))
          const currentRaw = (overrides as any)[it.name] ?? it.value
          const current = toPctNumber(currentRaw)
          const tokenKey = it.name.replace('opacity/', '')
          const opacityCssVar = `--recursica-tokens-opacity-${tokenKey}`
          const isClickable = targetCssVar !== null || onSelect !== undefined
          const isSelected = currentToken === it.name
          
          return (
            <div
              key={it.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr minmax(0, 200px) 50px auto',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {isClickable ? (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleTokenSelect(it.name, typeof currentRaw === 'number' ? currentRaw : Number(currentRaw))
                  }}
                  style={{
                    fontSize: 13,
                    opacity: 0.9,
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  title={targetCssVar ? `Set ${targetCssVar} to ${opacityCssVar}` : `Select ${it.name}`}
                >
                  {isSelected && (
                    <span style={{ fontSize: 14, color: `var(--recursica-brand-${mode}-palettes-core-interactive-default-tone)` }}>✓</span>
                  )}
                  {label}
                </button>
              ) : (
                <label htmlFor={it.name} style={{ fontSize: 13, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isSelected && (
                    <span style={{ fontSize: 14, color: `var(--recursica-brand-${mode}-palettes-core-interactive-default-tone)` }}>✓</span>
                  )}
                  {label}
                </label>
              )}
              <input
                id={it.name}
                type="range"
                min={0}
                max={100}
                value={current}
                onChange={(ev) => {
                  setOverride(it.name, Number(ev.currentTarget.value))
                }}
                style={{ width: '100%', maxWidth: 200, justifySelf: 'end' }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={current}
                onChange={(ev) => {
                  const next = Number(ev.currentTarget.value)
                  if (Number.isFinite(next)) setOverride(it.name, next)
                }}
                style={{ width: 50 }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>%</span>
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

