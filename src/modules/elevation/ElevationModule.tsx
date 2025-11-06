import React from 'react'

export type ElevationExampleProps = {
  label: React.ReactNode
  // If level is provided (0..4), box-shadow will be read from centrally
  // computed CSS variables: --elevation-elevation-{level}-{x|y|blur|spread|shadow-color}
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
      return `var(--elevation-elevation-${k}-x-axis, 0px) var(--elevation-elevation-${k}-y-axis, 0px) var(--elevation-elevation-${k}-blur, 0px) var(--elevation-elevation-${k}-spread, 0px) var(--elevation-elevation-${k}-shadow-color, rgba(0,0,0,0))`
    }
    const shadowColor = toRgba(colorHex, alpha)
    return `${offsetXPx}px ${offsetYPx}px ${blurPx}px ${spreadPx}px ${shadowColor}`
  })()
  return (
    <div
      className="elevation-card"
      style={{ boxShadow, display: 'flex', alignItems: 'center', gap: 12, height: 100, borderRadius: 8, padding: 16, cursor: canToggle ? 'pointer' : undefined, zIndex }}
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


