import React from 'react'
import { useThemeMode } from '../theme/ThemeModeContext'

export type ElevationExampleProps = {
  label: React.ReactNode
  // If level is provided (0..4), box-shadow will be read from centrally
  // computed CSS variables: --brand-light-elevations-elevation-{level}-{x|y|blur|spread|shadow-color}
  level?: number
  // Legacy explicit props (used only when level is not provided)
  blurPx?: number
  spreadPx?: number
  offsetXPx?: number
  offsetYPx?: number
  colorHex?: string
  alpha?: number // 0-1 decimal as stored in tokens
  isSelected?: boolean
  onToggle?: () => void
  selectable?: boolean
  zIndex?: number
}

export default function ElevationModule({ label, level, blurPx = 0, spreadPx = 0, offsetXPx = 0, offsetYPx = 0, colorHex = '#000000', alpha = 1, isSelected = false, onToggle, selectable = true, zIndex }: ElevationExampleProps) {
  const canToggle = selectable && !!onToggle
  const { mode } = useThemeMode()
  const toRgba = (hex: string, aIn: number): string => {
    try {
      let h = hex.trim()
      if (!h) return 'rgba(0,0,0,0)'
      if (h.startsWith('var(')) return h // already a CSS var color
      if (!h.startsWith('#')) h = `#${h}`
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
      if (!m) return h
      const r = parseInt(m[1], 16)
      const g = parseInt(m[2], 16)
      const b = parseInt(m[3], 16)
      const a = Math.max(0, Math.min(1, Number(aIn) || 0))
      return `rgba(${r}, ${g}, ${b}, ${a})`
    } catch {
      return hex
    }
  }
  const boxShadow = (() => {
    if (typeof level === 'number' && level >= 0) {
      const k = String(level)
      // Use centrally computed CSS variables so preview matches layers exactly
      return `var(--recursica-brand-themes-light-elevations-elevation-${k}-x-axis) var(--recursica-brand-themes-light-elevations-elevation-${k}-y-axis) var(--recursica-brand-themes-light-elevations-elevation-${k}-blur) var(--recursica-brand-themes-light-elevations-elevation-${k}-spread) var(--recursica-brand-themes-light-elevations-elevation-${k}-shadow-color)`
    }
    const shadowColor = toRgba(colorHex, alpha)
    return `${offsetXPx}px ${offsetYPx}px ${blurPx}px ${spreadPx}px ${shadowColor}`
  })()
  
  // Add border for elevation 0 (neutral/100, 1px)
  const borderStyle = level === 0 ? {
    border: `1px solid var(--recursica-brand-themes-${mode}-palettes-neutral-100-tone)`,
  } : {}
  
  return (
    <div
      className="elevation-card"
      style={{ boxShadow, display: 'flex', alignItems: 'center', gap: 12, height: 100, borderRadius: 8, padding: '16px 12px', cursor: canToggle ? 'pointer' : undefined, zIndex, ...borderStyle }}
      onClick={canToggle ? onToggle : undefined}
    >
      {canToggle && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <span style={{ color: 'var(--color-black)' }}>{label}</span>
    </div>
  )
}


