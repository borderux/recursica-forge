import React from 'react'

export type ElevationExampleProps = {
  label: React.ReactNode
  blurPx: number
  spreadPx: number
  offsetXPx: number
  offsetYPx: number
  colorHex: string
  alpha: number // 0-1 decimal as stored in tokens
  isSelected?: boolean
  onToggle?: () => void
  selectable?: boolean
}

export default function ElevationModule({ label, blurPx, spreadPx, offsetXPx, offsetYPx, colorHex, alpha, isSelected = false, onToggle, selectable = true }: ElevationExampleProps) {
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
  const shadowColor = toRgba(colorHex, alpha)
  const boxShadow = `${offsetXPx}px ${offsetYPx}px ${blurPx}px ${spreadPx}px ${shadowColor}`
  return (
    <div
      className="elevation-card"
      style={{ boxShadow, display: 'flex', alignItems: 'center', gap: 12, height: 100, borderRadius: 8, padding: 16, cursor: canToggle ? 'pointer' : undefined }}
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


