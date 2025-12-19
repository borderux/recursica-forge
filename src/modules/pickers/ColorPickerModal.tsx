import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { hexToHsv, hsvToHex } from '../tokens/colors/colorUtils'
import { useThemeMode } from '../theme/ThemeModeContext'

export type ColorPickerModalProps = {
  open: boolean
  defaultHex: string
  onClose: () => void
  onAccept: (hex: string) => void
}

export function ColorPickerModal({
  open,
  defaultHex,
  onClose,
  onAccept,
}: ColorPickerModalProps) {
  const [hsvState, setHsvState] = useState<{ h: number; s: number; v: number }>(() => 
    hexToHsv(/^#([0-9a-f]{6})$/i.test(defaultHex) ? defaultHex : '#000000')
  )
  const [hexInput, setHexInput] = useState<string>(() => 
    (/^#([0-9a-f]{6})$/i.test(defaultHex) ? defaultHex : '#000000').toLowerCase()
  )

  useEffect(() => {
    if (open) {
      const hex = /^#([0-9a-f]{6})$/i.test(defaultHex) ? defaultHex : '#000000'
      setHsvState(hexToHsv(hex))
      setHexInput(hex.toLowerCase())
    }
  }, [open, defaultHex])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const handleSV = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
    const next = { ...hsvState, s, v }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
  }

  const handleH = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const h = clamp(((e.clientX - rect.left) / rect.width) * 360, 0, 360)
    const next = { ...hsvState, h }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
  }

  const handleAccept = () => {
    const hex = hsvToHex(hsvState.h, hsvState.s, hsvState.v).toLowerCase()
    onAccept(hex)
  }

  const thumbLeft = `${hsvState.s * 100}%`
  const thumbTop = `${(1 - hsvState.v) * 100}%`
  const gradientColor = hsvToHex(hsvState.h, 1, 1)
  const currentHex = hsvToHex(hsvState.h, hsvState.s, hsvState.v).toLowerCase()
  const { mode } = useThemeMode()

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: `var(--recursica-brand-${mode}-layer-layer-3-property-surface, var(--recursica-brand-${mode}-layer-layer-3-property-surface))`,
          color: `var(--recursica-brand-${mode}-layer-layer-3-property-element-text-color, var(--recursica-brand-${mode}-layer-layer-3-property-element-text-color))`,
          border: `var(--recursica-brand-${mode}-layer-layer-3-property-border-thickness, var(--recursica-brand-${mode}-layer-layer-3-property-border-thickness)) solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color, var(--recursica-brand-${mode}-layer-layer-3-property-border-color))`,
          borderRadius: `var(--recursica-brand-${mode}-layer-layer-3-property-border-radius, var(--recursica-brand-${mode}-layer-layer-3-property-border-radius))`,
          boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-${mode}-elevations-elevation-4-blur) var(--recursica-brand-${mode}-elevations-elevation-4-spread) var(--recursica-brand-${mode}-elevations-elevation-4-shadow-color)`,
          padding: 20,
          display: 'grid',
          gap: 16,
          width: 360,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Choose Color for New Scale</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        <div
          onMouseDown={(e) => {
            handleSV(e)
            const move = (ev: MouseEvent) => handleSV(ev as any)
            const up = () => {
              window.removeEventListener('mousemove', move)
              window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: 200,
            borderRadius: 8,
            background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, ${gradientColor})`,
            cursor: 'crosshair',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: thumbLeft,
              top: thumbTop,
              transform: 'translate(-50%, -50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid #fff',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        <div
          onMouseDown={(e) => {
            handleH(e)
            const move = (ev: MouseEvent) => handleH(ev as any)
            const up = () => {
              window.removeEventListener('mousemove', move)
              window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          }}
          style={{
            width: '100%',
            height: 16,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            cursor: 'ew-resize',
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              background: currentHex,
              border: `1px solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color, rgba(0,0,0,0.1))`,
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              const raw = e.currentTarget.value
              setHexInput(raw)
              const m = raw.match(/^#?[0-9a-fA-F]{6}$/i)
              if (m) {
                const normalized = (raw.startsWith('#') ? raw : `#${raw}`).toLowerCase()
                setHsvState(hexToHsv(normalized))
              }
            }}
            style={{
              flex: 1,
              fontSize: 14,
              padding: '8px 12px',
              border: `1px solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color, rgba(0,0,0,0.1))`,
              borderRadius: 6,
            }}
            placeholder="#000000"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid var(--recursica-brand-${mode}-layer-layer-3-property-border-color, rgba(0,0,0,0.1))`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: `var(--recursica-brand-${mode}-palettes-core-interactive, #3b82f6)`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Create Scale
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

