import { useEffect, useRef, useState, useMemo } from 'react'
import { hexToHsv, hsvToHex, toKebabCase } from '../tokens/colors/colorUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { TextField } from '../../components/adapters/TextField'
import { Modal } from '../../components/adapters/Modal'

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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [hsvState, setHsvState] = useState<{ h: number; s: number; v: number }>(() => hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
  const [cascadeDown, setCascadeDown] = useState<boolean>(false)
  const [cascadeUp, setCascadeUp] = useState<boolean>(false)
  const [hexInput, setHexInput] = useState<string>(() => (/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : hsvToHex(hsvState.h, hsvState.s, hsvState.v)).toLowerCase())

  useEffect(() => {
    setHsvState(hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
    setHexInput((/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000').toLowerCase())
  }, [currentHex])

  useEffect(() => {
    const calculatePosition = () => {
      const overlayW = 300 // fixed width
      const overlayH = overlayRef.current?.offsetHeight || 320

      // Calculate positions relative to the viewport (for Modal's fixed positioning)
      const candidates = [
        { y: swatchRect.bottom + 8, x: swatchRect.left },
        { y: swatchRect.top - overlayH - 8, x: swatchRect.left },
        { y: swatchRect.bottom + 8, x: swatchRect.left - overlayW + swatchRect.width },
        { y: swatchRect.top - overlayH - 8, x: swatchRect.left - overlayW + swatchRect.width },
      ]

      // Check if position fits in viewport
      const fits = (p: { y: number; x: number }) => {
        return p.x >= 0 && p.x + overlayW <= window.innerWidth && p.y >= 0 && p.y + overlayH <= window.innerHeight
      }

      const chosen = candidates.find(fits) || candidates[0]
      setPos({ top: chosen.y, left: chosen.x })
    }

    // Initial calculation
    calculatePosition()

    // Handle resize
    window.addEventListener('resize', calculatePosition)
    return () => window.removeEventListener('resize', calculatePosition)
  }, [swatchRect.top, swatchRect.left, swatchRect.width, swatchRect.height]) // Re-calc if swatch moves, but NOT on hex change

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
  const { mode } = useThemeMode()
  const { tokens } = useVars()

  // Extract scale number and level from token name to display "Scale n / level"
  const scaleDisplayName = useMemo(() => {
    const parts = tokenName.split('/')
    if (parts.length !== 3) return tokenName

    const category = parts[0] // "color" or "colors"
    const familyOrScale = parts[1] // family alias (e.g., "gray") or scale key (e.g., "scale-06")
    const level = parts[2] // level (e.g., "700")

    try {
      const tokensRoot: any = (tokens as any)?.tokens || {}
      const colorsRoot: any = tokensRoot?.colors || {}

      let scaleKey: string | null = null

      if (familyOrScale.startsWith('scale-')) {
        // Direct scale reference: colors/scale-06/700
        scaleKey = familyOrScale
      } else if (category === 'colors') {
        // Alias-based reference: colors/gray/700 - find the scale that has this alias
        scaleKey = Object.keys(colorsRoot).find(key => {
          if (!key.startsWith('scale-')) return false
          const scale = colorsRoot[key]
          return scale && typeof scale === 'object' && scale.alias === familyOrScale
        }) || null
      } else if (category === 'color') {
        // Old format: color/gray/700 - try to find in new structure
        scaleKey = Object.keys(colorsRoot).find(key => {
          if (!key.startsWith('scale-')) return false
          const scale = colorsRoot[key]
          return scale && typeof scale === 'object' && scale.alias === familyOrScale
        }) || null
      }

      if (scaleKey && scaleKey.startsWith('scale-')) {
        const match = scaleKey.match(/scale-(\d+)/)
        if (match) {
          const scaleNum = parseInt(match[1], 10)
          return `Scale ${scaleNum} / ${level}`
        }
      }
    } catch { }

    // Fallback to original display if we can't find scale
    return tokenName
  }, [tokenName, tokens])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={scaleDisplayName}
      size={300}
      withOverlay={false}
      centered={false}
      position={pos ? { x: pos.left, y: pos.top } : { x: 0, y: 0 }}
      onPositionChange={(newPos) => setPos({ top: newPos.y, left: newPos.x })}
      draggable={true}
      showHeader={true}
      showFooter={false}
      padding={true}
      layer="layer-3"
      zIndex={20000}
      className="color-picker-overlay"
      style={{
        overflow: 'visible',
        visibility: pos ? 'visible' : 'hidden'
      }}
    >
      <div
        ref={overlayRef}
        style={{ display: 'grid', gap: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <TextField
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
            style={{ flex: 1, fontSize: 13 }}
            layer="layer-3"
          />
          <button
            title="Name this color"
            onClick={() => {
              const parts = tokenName.split('/')
              const family = parts.length === 3 ? parts[1] : ''
              const hex = hsvToHex(hsvState.h, hsvState.s, hsvState.v)
              onNameFromHex(family, hex)
            }}
            style={{
              border: `1px solid var(--recursica-brand-themes-${mode}-layers-layer-3-properties-border-color, rgba(0,0,0,0.1))`,
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 6,
              padding: '6px 8px',
              color: `var(--recursica-brand-themes-${mode}-layers-layer-3-elements-text-color)`
            }}
          >🏷️</button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={cascadeUp} onChange={(e) => {
            const next = e.currentTarget.checked
            setCascadeUp(next)
            // Always call onChange when checkbox state changes to trigger cascade
            onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), cascadeDown, next)
          }} />
          Cascade colors upward
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={cascadeDown} onChange={(e) => {
            const next = e.currentTarget.checked
            setCascadeDown(next)
            // Always call onChange when checkbox state changes to trigger cascade
            onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), next, cascadeUp)
          }} />
          Cascade colors downward
        </label>
      </div>
    </Modal>
  )
}
