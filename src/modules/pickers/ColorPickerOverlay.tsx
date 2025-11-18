import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { hexToHsv, hsvToHex, toKebabCase } from '../tokens/colors/colorUtils'

export type ColorPickerOverlayProps = {
  tokenName: string
  currentHex: string
  swatchRect: DOMRect
  onClose: () => void
  onChange: (hex: string, cascadeDown: boolean, cascadeUp: boolean) => void
  onNameFromHex: (family: string, hex: string) => void
  displayFamilyName?: string
}

export function ColorPickerOverlay({
  tokenName,
  currentHex,
  swatchRect,
  onClose,
  onChange,
  onNameFromHex,
  displayFamilyName,
}: ColorPickerOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const svRef = useRef<HTMLDivElement | null>(null)
  const hRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [hsvState, setHsvState] = useState<{ h: number; s: number; v: number }>(() => hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
  const [cascadeDown, setCascadeDown] = useState<boolean>(false)
  const [cascadeUp, setCascadeUp] = useState<boolean>(false)
  const [hexInput, setHexInput] = useState<string>(() => (/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : hsvToHex(hsvState.h, hsvState.s, hsvState.v)).toLowerCase())

  useEffect(() => {
    setHsvState(hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
    setHexInput((/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000').toLowerCase())
  }, [currentHex])

  useEffect(() => {
    const overlayEl = overlayRef.current
    if (!overlayEl) return
    const overlayW = overlayEl.offsetWidth || 300
    const overlayH = overlayEl.offsetHeight || 320
    const candidates = [
      { top: swatchRect.top - overlayH, left: swatchRect.left - overlayW },
      { top: swatchRect.top - overlayH, left: swatchRect.right },
      { top: swatchRect.bottom, left: swatchRect.left - overlayW },
      { top: swatchRect.bottom, left: swatchRect.right },
    ]
    const fits = (p: { top: number; left: number }) => p.left >= 0 && p.left + overlayW <= window.innerWidth && p.top >= 0 && p.top + overlayH <= window.innerHeight
    const chosen = candidates.find(fits) || {
      top: Math.max(0, Math.min(window.innerHeight - overlayH, swatchRect.top)),
      left: Math.max(0, Math.min(window.innerWidth - overlayW, swatchRect.left)),
    }
    setPos(chosen)
  }, [swatchRect.left, swatchRect.top, swatchRect.right, swatchRect.bottom])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const handleSV = (clientX: number, clientY: number) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = clamp((clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
    const next = { ...hsvState, s, v }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChange(hex, cascadeDown, cascadeUp)
  }

  const handleH = (clientX: number) => {
    const el = hRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 360)
    const next = { ...hsvState, h }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChange(hex, cascadeDown, cascadeUp)
  }

  const thumbLeft = `${hsvState.s * 100}%`
  const thumbTop = `${(1 - hsvState.v) * 100}%`
  const gradientColor = hsvToHex(hsvState.h, 1, 1)

  return createPortal(
    <div
      ref={overlayRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 20000, background: 'var(--recursica-brand-light-layer-layer-2-property-surface, #ffffff)', color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color, #111111)', border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, boxShadow: 'var(--recursica-brand-light-elevations-elevation-2-x-axis) var(--recursica-brand-light-elevations-elevation-2-y-axis) var(--recursica-brand-light-elevations-elevation-2-blur) var(--recursica-brand-light-elevations-elevation-2-spread) var(--recursica-brand-light-elevations-elevation-2-shadow-color)', padding: 12, display: 'grid', gap: 10, width: 300 }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const startPos = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const overlayEl = overlayRef.current
            const w = overlayEl?.offsetWidth || 300
            const h = overlayEl?.offsetHeight || 320
            const next = {
              left: Math.max(0, Math.min(window.innerWidth - w, startPos.left + dx)),
              top: Math.max(0, Math.min(window.innerHeight - h, startPos.top + dy))
            }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {(() => {
            const parts = tokenName.split('/')
            if (parts.length === 3) {
              const level = parts[2]
              const fam = displayFamilyName || parts[1]
              return `color/${toKebabCase(fam)}/${level}`
            }
            return tokenName
          })()}
        </div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div
        ref={svRef}
        onMouseDown={(e) => {
          handleSV(e.clientX, e.clientY)
          const move = (ev: MouseEvent) => handleSV(ev.clientX, ev.clientY)
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
        style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, ${gradientColor})`, cursor: 'crosshair' }}
      >
        <div style={{ position: 'absolute', left: thumbLeft, top: thumbTop, transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.5)' }} />
      </div>
      <div
        ref={hRef}
        onMouseDown={(e) => {
          handleH(e.clientX)
          const move = (ev: MouseEvent) => handleH(ev.clientX)
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
        style={{ width: '100%', height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)', cursor: 'ew-resize' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            const raw = e.currentTarget.value
            setHexInput(raw)
            const m = raw.match(/^#?[0-9a-fA-F]{6}$/)
            if (m) {
              const normalized = (raw.startsWith('#') ? raw : `#${raw}`).toLowerCase()
              setHsvState(hexToHsv(normalized))
              onChange(normalized, cascadeDown, cascadeUp)
            }
          }}
          style={{ flex: 1, fontSize: 13, padding: '6px 8px', border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color, rgba(0,0,0,0.1))', borderRadius: 6 }}
        />
        <button
          title="Name this color"
          onClick={() => {
            const parts = tokenName.split('/')
            const family = parts.length === 3 ? parts[1] : ''
            const hex = hsvToHex(hsvState.h, hsvState.s, hsvState.v)
            onNameFromHex(family, hex)
          }}
          style={{ border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color, rgba(0,0,0,0.1))', background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '6px 8px' }}
        >🏷️</button>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={cascadeUp} onChange={(e) => {
          const next = e.currentTarget.checked
          setCascadeUp(next)
          if (next) onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), cascadeDown, true)
        }} />
        Cascade colors upward
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={cascadeDown} onChange={(e) => {
          const next = e.currentTarget.checked
          setCascadeDown(next)
          if (next) onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), true, cascadeUp)
        }} />
        Cascade colors downward
      </label>
    </div>,
    document.body
  )
}

