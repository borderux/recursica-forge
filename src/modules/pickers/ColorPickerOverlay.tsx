import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { hexToHsv, hsvToHex, toKebabCase } from '../tokens/colors/colorUtils'

import { useVars } from '../vars/VarsContext'
import { TextField } from '../../components/adapters/TextField'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { Button } from '../../components/adapters/Button'
import FloatingPalette from '../toolbar/menu/floating-palette/FloatingPalette'
import { Tag } from '@phosphor-icons/react'

export type ColorPickerOverlayProps = {
  tokenName: string
  currentHex: string
  anchorElement: HTMLElement | null
  onClose: () => void
  onChange: (hex: string, cascadeDown: boolean, cascadeUp: boolean) => void
  onNameFromHex: (family: string, hex: string) => void
  displayFamilyName?: string
}

export function ColorPickerOverlay({
  tokenName,
  currentHex,
  anchorElement,
  onClose,
  onChange,
  onNameFromHex,
  displayFamilyName,
}: ColorPickerOverlayProps) {
  const svRef = useRef<HTMLDivElement | null>(null)
  const hRef = useRef<HTMLDivElement | null>(null)
  const [hsvState, setHsvState] = useState<{ h: number; s: number; v: number }>(() => hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
  const [cascadeDown, setCascadeDown] = useState<boolean>(false)
  const [cascadeUp, setCascadeUp] = useState<boolean>(false)
  const [hexInput, setHexInput] = useState<string>(() => (/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : hsvToHex(hsvState.h, hsvState.s, hsvState.v)).toLowerCase())

  // Keep refs to state so mousemove handlers always see the latest values
  const hsvRef = useRef(hsvState)
  hsvRef.current = hsvState
  const cascadeDownRef = useRef(cascadeDown)
  cascadeDownRef.current = cascadeDown
  const cascadeUpRef = useRef(cascadeUp)
  cascadeUpRef.current = cascadeUp
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    setHsvState(hexToHsv(/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'))
    setHexInput((/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000').toLowerCase())
  }, [currentHex])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const updateSV = useCallback((clientX: number, clientY: number) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = clamp((clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
    const next = { ...hsvRef.current, s, v }
    setHsvState(next)
    hsvRef.current = next
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChangeRef.current(hex, cascadeDownRef.current, cascadeUpRef.current)
  }, [])

  const updateH = useCallback((clientX: number) => {
    const el = hRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 360)
    const next = { ...hsvRef.current, h }
    setHsvState(next)
    hsvRef.current = next
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChangeRef.current(hex, cascadeDownRef.current, cascadeUpRef.current)
  }, [])

  const thumbLeft = `${hsvState.s * 100}%`
  const thumbTop = `${(1 - hsvState.v) * 100}%`
  const hueThumbLeft = `${(hsvState.h / 360) * 100}%`
  const gradientColor = hsvToHex(hsvState.h, 1, 1)

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
    <FloatingPalette
      anchorElement={anchorElement}
      title={scaleDisplayName}
      onClose={onClose}
      draggable={true}
      className="color-picker-overlay"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_default)' }}>
        <div
          ref={svRef}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            updateSV(e.clientX, e.clientY)
            const move = (ev: MouseEvent) => {
              ev.preventDefault()
              updateSV(ev.clientX, ev.clientY)
            }
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          }}
          style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, ${gradientColor})`, cursor: 'crosshair' }}
        >
          <div style={{ position: 'absolute', left: thumbLeft, top: thumbTop, transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
        </div>
        <div
          ref={hRef}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            updateH(e.clientX)
            const move = (ev: MouseEvent) => {
              ev.preventDefault()
              updateH(ev.clientX)
            }
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          }}
          style={{ position: 'relative', width: '100%', height: 12, borderRadius: 6, background: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)', cursor: 'ew-resize' }}
        >
          <div style={{ position: 'absolute', left: hueThumbLeft, top: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
        </div>
      </div>
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
        <Button
          title="Name this color"
          variant="outline"
          size="small"
          layer="layer-3"
          icon={<Tag size={16} />}
          onClick={() => {
            const parts = tokenName.split('/')
            const family = parts.length === 3 ? parts[1] : ''
            const hex = hsvToHex(hsvState.h, hsvState.s, hsvState.v)
            onNameFromHex(family, hex)
          }}
        />
      </div>
      <CheckboxItem
        checked={cascadeUp}
        onChange={(next: boolean) => {
          setCascadeUp(next)
          onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), cascadeDown, next)
        }}
        label="Cascade colors upward"
        layer="layer-3"
      />
      <CheckboxItem
        checked={cascadeDown}
        onChange={(next: boolean) => {
          setCascadeDown(next)
          onChange(hsvToHex(hsvState.h, hsvState.s, hsvState.v), next, cascadeUp)
        }}
        label="Cascade colors downward"
        layer="layer-3"
      />
    </FloatingPalette>
  )
}
