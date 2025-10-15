import { useEffect, useMemo, useRef, useState } from 'react'

// --- Color utilities ---
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = (hex || '').trim()
  if (!h.startsWith('#')) h = '#' + h
  if (h.length === 4) {
    const r = h[1], g = h[2], b = h[3]
    h = `#${r}${r}${g}${g}${b}${b}`
  }
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
// rgbToHex unused (prefer rgbToHexSafe)
function rgbToHexSafe(r: number, g: number, b: number): string {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d === 0) h = 0
  else if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r1 = 0, g1 = 0, b1 = 0
  if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0 }
  else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x }
  else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c }
  else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const r = (r1 + m) * 255
  const g = (g1 + m) * 255
  const b = (b1 + m) * 255
  return { r, g, b }
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}
function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHexSafe(r, g, b)
}

function toTitleCase(label: string): string {
  return (label || '').replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

function toKebabCase(label: string): string {
  return (label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

// --- Color naming via NTC (loaded on demand) ---
let ntcReadyPromise: Promise<void> | null = null
function ensureNtcLoaded(): Promise<void> {
  if ((window as any).ntc) return Promise.resolve()
  if (ntcReadyPromise) return ntcReadyPromise
  ntcReadyPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://chir.ag/projects/ntc/ntc.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load ntc.js'))
    document.head.appendChild(s)
  })
  return ntcReadyPromise
}
async function getNtcName(hex: string): Promise<string> {
  try {
    await ensureNtcLoaded()
    const res = (window as any).ntc.name(hex)
    if (Array.isArray(res) && typeof res[1] === 'string') return res[1]
  } catch {}
  return hex.toUpperCase()
}

// HueGradient unused

function ColorPickerOverlay({ tokenName, currentHex, swatchRect, onClose, onChange, onNameFromHex, displayFamilyName }: { tokenName: string; currentHex: string; swatchRect: DOMRect; onClose: () => void; onChange: (hex: string, cascadeDown: boolean, cascadeUp: boolean) => void; onNameFromHex: (family: string, hex: string) => void; displayFamilyName?: string }) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
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

  const handleSV = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
    const next = { ...hsvState, s, v }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChange(hex, cascadeDown, cascadeUp)
  }

  const handleH = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const h = clamp(((e.clientX - rect.left) / rect.width) * 360, 0, 360)
    const next = { ...hsvState, h }
    setHsvState(next)
    const hex = hsvToHex(next.h, next.s, next.v).toLowerCase()
    setHexInput(hex)
    onChange(hex, cascadeDown, cascadeUp)
  }

  const thumbLeft = `${hsvState.s * 100}%`
  const thumbTop = `${(1 - hsvState.v) * 100}%`
  const gradientColor = hsvToHex(hsvState.h, 1, 1)

  return (
    <div
      ref={overlayRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000, background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: 12, display: 'grid', gap: 10, width: 300 }}
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
        onMouseDown={(e) => {
          handleSV(e)
          const move = (ev: MouseEvent) => handleSV(ev as any)
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
        style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, ${gradientColor})`, cursor: 'crosshair' }}
      >
        <div style={{ position: 'absolute', left: thumbLeft, top: thumbTop, transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.5)' }} />
      </div>
      <div
        onMouseDown={(e) => {
          handleH(e)
          const move = (ev: MouseEvent) => handleH(ev as any)
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
          style={{ flex: 1, fontSize: 13, padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6 }}
        />
        <button
          title="Name this color"
          onClick={() => {
            const parts = tokenName.split('/')
            const family = parts.length === 3 ? parts[1] : ''
            const hex = hsvToHex(hsvState.h, hsvState.s, hsvState.v)
            onNameFromHex(family, hex)
          }}
          style={{ border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '6px 8px' }}
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
    </div>
  )
}
import tokensJson from '../../vars/Tokens.json'
// removed unused varsUtil import
import { readOverrides, setOverride } from '../theme/tokenOverrides'
import OpacityTokens from '../theme/OpacityTokens'
import EffectTokens from '../theme/EffectTokens'

type TokenEntry = {
  collection?: string
  mode?: string
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function TokensPage() {
  const [values, setValues] = useState<Record<string, string | number>>(() => readOverrides())
  const [hoveredSwatch, setHoveredSwatch] = useState<string | null>(null)
  const [openPicker, setOpenPicker] = useState<{
    tokenName: string
    swatchRect: DOMRect
    baseline?: {
      base: { h: number; s: number; v: number }
      deltas: Record<string, { dh: number; ds: number; dv: number }>
    }
  } | null>(null)
  const [deletedFamilies, setDeletedFamilies] = useState<Record<string, true>>({})
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  // Effect scale state managed inside EffectTokens module
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, name, value, reset } = detail
      if (all && typeof all === 'object') {
        setValues(all)
        if (reset) {
          setDeletedFamilies({})
        }
        return
      }
      if (typeof name === 'string') {
        const coerced = name === 'effect/none' ? 0 : value
        setValues((prev) => ({ ...prev, [name]: coerced }))
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])
  const [selected, setSelected] = useState<'color' | 'effect' | 'font' | 'opacity' | 'size'>('color')
  const [scaleSizesByDefault, setScaleSizesByDefault] = useState<boolean>(() => {
    const v = localStorage.getItem('size-scale-by-default')
    return v === null ? true : v === 'true'
  })

  // overlay positioning handled inside ColorPickerOverlay

  const groupedByMode = useMemo(() => {
    const byMode: Record<ModeName, Array<{ key: string; entry: TokenEntry }>> = {}
    Object.entries(tokensJson as Record<string, any>).forEach(([key, entry]) => {
      if (!entry || !entry.name) return
      const mode = entry.mode as ModeName || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = []
      byMode[mode].push({ key, entry })
    })
    // Stable sort by token name
    Object.values(byMode).forEach((arr) => arr.sort((a, b) => a.entry.name.localeCompare(b.entry.name)))
    return byMode
  }, [])

// parseEffectMultiplier removed (handled in EffectTokens)

  const colorFamiliesByMode = useMemo(() => {
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    Object.values(groupedByMode).forEach(() => {}) // force dependency for TS
    Object.entries(tokensJson as Record<string, any>).forEach(([_, entry]) => {
      if (!entry || entry.type !== 'color') return
      if (!entry.name.startsWith('color/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      if (family === 'translucent') return
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode = (entry.mode as ModeName) || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    // Include any families/levels present only in overrides/values so new columns appear
    Object.keys(values).forEach((name) => {
      if (!name.startsWith('color/')) return
      const parts = name.split('/')
      if (parts.length !== 3) return
      const family = parts[1]
      if (family === 'translucent') return
      const rawLevel = parts[2]
      if (!/^\d+$/.test(rawLevel)) return
      const level = rawLevel.length === 2 ? `0${rawLevel}` : rawLevel.length === 1 ? `00${rawLevel}` : rawLevel
      const mode: ModeName = 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      if (!byMode[mode][family].some((l) => l.level === level)) byMode[mode][family].push({ level, entry: { name, value: String(values[name]) } as any })
    })
    // sort each family numerically descending (e.g., 1000, 900 ... 050, 000)
    const levelToNum = (lvl: string) => Number(lvl)
    Object.values(byMode).forEach((fam) => {
      Object.keys(fam).forEach((k) => {
        fam[k] = fam[k].sort((a, b) => levelToNum(b.level) - levelToNum(a.level))
      })
    })
    return byMode
  }, [groupedByMode, values])

  useEffect(() => {
    // Initialize form values from tokens JSON, then overlay any persisted overrides
    const init: Record<string, string | number> = {}
    Object.entries(tokensJson as Record<string, any>).forEach(([_, entry]) => {
      if (!entry || !entry.name) return
      init[entry.name] = entry.value
    })
    const overrides = readOverrides()
    const merged: Record<string, string | number> = { ...init, ...overrides }
    if (typeof merged['effect/none'] !== 'undefined') merged['effect/none'] = 0
    setValues(merged)
  }, [])

  const handleChange = (tokenName: string, next: string) => {
    setValues((prev) => ({ ...prev, [tokenName]: next }))
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Tokens</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
        <nav style={{ alignSelf: 'start', position: 'sticky', top: 8 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              { key: 'color', label: 'Color' },
              { key: 'effect', label: 'Effect' },
              { key: 'font', label: 'Font' },
              { key: 'opacity', label: 'Opacity' },
              { key: 'size', label: 'Size' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSelected(item.key as any)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--layer-layer-1-property-border-color)',
                  background: selected === (item.key as any) ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent',
                  color: selected === (item.key as any) ? '#fff' : 'inherit',
                  cursor: 'pointer'
                }}
              >{item.label}</button>
            ))}
          </div>
        </nav>
        <div style={{ display: 'grid', gap: 12 }}>
      {Object.entries(groupedByMode).map(([mode, items]) => {
        const colorSection = (
          <section key={mode + '-color'} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
            {colorFamiliesByMode[mode as ModeName] && (() => {
              const families = Object.entries(colorFamiliesByMode[mode as ModeName]).filter(([family]) => family !== 'translucent' && !deletedFamilies[family]).sort(([a], [b]) => {
                if (a === 'gray' && b !== 'gray') return -1
                if (b === 'gray' && a !== 'gray') return 1
                return a.localeCompare(b)
              })
              const presentLevels = new Set<string>(families.flatMap(([_, lvls]) => lvls.map((l) => l.level)))
              const standardLevels = ['900','800','700','600','500','400','300','200','100','050']
              standardLevels.forEach((lvl) => presentLevels.add(lvl))
              const levelOrder = Array.from(presentLevels).sort((a, b) => Number(b) - Number(a))
              return (
                <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${families.length}, 1fr)`, columnGap: 12, rowGap: 0, alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={async () => {
                        setOpenPicker(null)
                        if (!families.length) return
                        // Pick a completely random base color (HSV)
                        const baseHSV = { h: Math.random() * 360, s: 0.6 + Math.random() * 0.35, v: 0.6 + Math.random() * 0.35 }
                        const newHue = baseHSV.h
                        const newFamily = `custom-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`
                        const write = (name: string, hex: string) => { handleChange(name, hex); setOverride(name, hex) }
                        const seedHex = hsvToHex(newHue, Math.max(0.6, baseHSV.s), Math.max(0.6, baseHSV.v))
                        write(`color/${newFamily}/500`, seedHex)
                        // name the column
                        const name = await getNtcName(seedHex)
                        setFamilyNames((prev) => ({ ...prev, [newFamily]: toTitleCase(name) }))
                        // cascade down from 500
                        ;[400,300,200,100,50].forEach((lvl) => {
                          const t = (500 - lvl) / 450
                          const nextV = clamp(baseHSV.v + (1 - baseHSV.v) * t, 0, 1)
                          const nextS = clamp(baseHSV.s * (1 - 0.35 * t), 0, 1)
                          write(`color/${newFamily}/${String(lvl).padStart(3,'0')}`, hsvToHex(newHue, nextS, nextV))
                        })
                        // cascade up to 900 (no 1000 for non-gray)
                        ;[600,700,800,900].forEach((lvl) => {
                          const t = (lvl - 500) / 500
                          const nextV = clamp(baseHSV.v * (1 - 0.6 * t), 0, 1)
                          const nextS = clamp(baseHSV.s * (1 + 0.15 * t), 0, 1)
                          write(`color/${newFamily}/${String(lvl).padStart(3,'0')}`, hsvToHex(newHue, nextS, nextV))
                        })
                      }}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
                    >+Color</button>
                  </div>
                  {families.map(([family]) => (
                    <div key={family + '-name'} style={{ display: 'grid', gap: 4 }}>
                      <input
                        required
                        value={toTitleCase(familyNames[family] ?? family)}
                        onChange={(e) => setFamilyNames((prev) => ({ ...prev, [family]: toTitleCase(e.currentTarget.value) }))}
                        style={{ fontSize: 13, padding: '4px 8px', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, width: '100%' }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: `1 / span ${families.length + 1}`, height: 20 }} />
                  {levelOrder.map((level) => (
                    <>
                      <div key={'label-' + level} style={{ textAlign: 'center', fontSize: 12, opacity: 0.8, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{level === '1000' ? 'Black' : level === '000' ? 'White' : level}</div>
                      {families.map(([family, lvls]) => {
                        const match = lvls.find((l) => l.level === level)
                        const entry = match?.entry
                        const isGrayFamily = family === 'gray'
                        const isEdgeLevel = level === '1000' || level === '000'
                        const tokenName = entry?.name || (isEdgeLevel && !isGrayFamily ? undefined : `color/${family}/${level}`)
                        const current = tokenName ? String(values[tokenName] ?? (entry ? entry.value : '')) : ''
                        
                        const lvlNum = Number(level)
                        const isDark = lvlNum >= 500
                        const isLight = lvlNum <= 400
                        const isHovered = hoveredSwatch === tokenName
                        const isActive = !!openPicker && openPicker.tokenName === tokenName
                        const hoverShadow = isHovered ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.5)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.5)' : undefined) : undefined
                        const activeShadow = isActive ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.8)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.8)' : undefined) : undefined
                        const boxShadow = activeShadow || hoverShadow || undefined
                        return (
                          <div key={family + '-' + level}>
                            <div
                              onMouseEnter={() => tokenName && setHoveredSwatch(tokenName)}
                              onMouseLeave={() => setHoveredSwatch((prev) => (prev === tokenName ? null : prev))}
                              onClick={(ev) => {
                                if (!tokenName) return
                                const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
                                setOpenPicker({ tokenName, swatchRect: rect })
                              }}
                              role="button"
                              title={tokenName ? `${tokenName} ${current}` : ''}
                              style={{ height: 40, background: tokenName ? current : 'transparent', cursor: tokenName ? 'pointer' : 'default', boxShadow }}
                            />
                            {tokenName && openPicker && openPicker.tokenName === tokenName && (
                              <ColorPickerOverlay
                                tokenName={tokenName}
                                currentHex={/^#([0-9a-f]{6})$/i.test(current) ? current : '#000000'}
                                swatchRect={openPicker.swatchRect}
                                onClose={() => setOpenPicker(null)}
                                onNameFromHex={async (family, hex) => {
                                  if (!family) return
                                  const label = await getNtcName(hex)
                                  setFamilyNames((prev) => ({ ...prev, [family]: toTitleCase(label) }))
                                }}
                                displayFamilyName={toTitleCase(familyNames[family] ?? family)}
                                onChange={(hex, cascadeDown, cascadeUp) => {
                                  handleChange(tokenName, hex)
                                  setOverride(tokenName, hex)

                                  // tokenName format: color/<family>/<level>
                                  const parts = tokenName.split('/')
                                  if (parts.length === 3) {
                                    const family = parts[1]
                                    const levelStr = parts[2]
                                    const startLevel = Number(levelStr)
                                    if (!isNaN(startLevel)) {
                                      const baseHsv = hexToHsv(hex)
                                      const allLevels = [900, 800, 700, 600, 500, 400, 300, 200, 100, 50]
                                      const minRef = 50
                                      const maxRef = 900
                                      const denomDown = Math.max(1, startLevel - minRef)
                                      const denomUp = Math.max(1, maxRef - startLevel)

                                      const hasToken = (lvl: number) => {
                                        const lvlStr = String(lvl).padStart(3, '0')
                                        // Always allow 050 to be set; otherwise require an existing token entry
                                        if (lvl === 50) return true
                                        for (const entry of Object.values(tokensJson as Record<string, any>)) {
                                          if (entry && (entry as any).type === 'color' && (entry as any).name === `color/${family}/${lvlStr}`) return true
                                        }
                                        return false
                                      }

                                      if (cascadeDown) {
                                        let targetsDown = allLevels.filter((lvl) => lvl < startLevel && hasToken(lvl))
                                        if (!targetsDown.includes(50) && startLevel > 50) targetsDown = [...targetsDown, 50]
                                        targetsDown.forEach((lvl) => {
                                          const name = `color/${family}/${String(lvl).padStart(3, '0')}`
                                          const t = clamp((startLevel - lvl) / denomDown, 0, 1)
                                          // lighter downward: increase V, reduce S
                                          const nextV = clamp(baseHsv.v + (1 - baseHsv.v) * t, 0, 1)
                                          const nextS = clamp(baseHsv.s * (1 - 0.35 * t), 0, 1)
                                          const nextHex = hsvToHex(baseHsv.h, nextS, nextV)
                                          handleChange(name, nextHex)
                                          setOverride(name, nextHex)
                                        })
                                        // Extra safety: explicitly update 050
                                        if (startLevel > 50) {
                                          const lvl = 50
                                          const name050 = `color/${family}/050`
                                          const t050 = clamp((startLevel - lvl) / denomDown, 0, 1)
                                          const nextV050 = clamp(baseHsv.v + (1 - baseHsv.v) * t050, 0, 1)
                                          const nextS050 = clamp(baseHsv.s * (1 - 0.35 * t050), 0, 1)
                                          const nextHex050 = hsvToHex(baseHsv.h, nextS050, nextV050)
                                          handleChange(name050, nextHex050)
                                          setOverride(name050, nextHex050)
                                        }
                                      }

                                      if (cascadeUp) {
                                        const targetsUp = allLevels.filter((lvl) => lvl > startLevel && hasToken(lvl))
                                        targetsUp.forEach((lvl) => {
                                          const name = `color/${family}/${String(lvl).padStart(3, '0')}`
                                          const t = clamp((lvl - startLevel) / denomUp, 0, 1)
                                          // darker upward: decrease V, optionally boost S slightly
                                          const nextV = clamp(baseHsv.v * (1 - 0.6 * t), 0, 1)
                                          const nextS = clamp(baseHsv.s * (1 + 0.15 * t), 0, 1)
                                          const nextHex = hsvToHex(baseHsv.h, nextS, nextV)
                                          handleChange(name, nextHex)
                                          setOverride(name, nextHex)
                                        })
                                      }
                                    }
                                  }
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}
                  {/* bottom-row delete buttons, gray cannot be deleted */}
                  <div />
                  {families.map(([family]) => (
                    <div key={family + '-delete'} style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                      {family === 'gray' ? (
                        <div style={{ height: 24 }} />
                      ) : (
                        <button
                          onClick={() => { setDeletedFamilies((prev) => ({ ...prev, [family]: true })); setOpenPicker(null) }}
                          title="Delete color column"
                          style={{ border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '6px 8px', width: '100%' }}
                        >🗑️</button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>
        )

        const measurementSection = (() => {
          const measurementItems = items.filter(({ entry }) => entry.type !== 'color' && (typeof entry.value === 'number' || typeof entry.value === 'string'))
          if (!measurementItems.length) return null
          const groups: Record<string, typeof measurementItems> = {
            Effects: measurementItems.filter(({ entry }) => entry.name.startsWith('effect/')),
            Font: measurementItems.filter(({ entry }) => entry.name.startsWith('font/')),
            Opacity: measurementItems.filter(({ entry }) => entry.name.startsWith('opacity/')),
            Size: measurementItems.filter(({ entry }) => entry.name.startsWith('size/')),
          }
          const groupKeyMap: Record<'effect'|'font'|'opacity'|'size', keyof typeof groups> = {
            effect: 'Effects',
            font: 'Font',
            opacity: 'Opacity',
            size: 'Size',
          }
          const activeGroup = selected === 'color' ? null : groups[groupKeyMap[selected]]
          if (!activeGroup) return null
          const sortedActive = selected === 'effect'
            ? [...activeGroup].sort((a, b) => {
                const weight = (full: string) => {
                  const n = full.replace('effect/', '').replace('-', '.')
                  if (n === 'none') return [0, 0]
                  if (n === '0.5x') return [1, 0]
                  if (n === 'default') return [2, 0]
                  const asNum = parseFloat(n.replace('x', ''))
                  return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum]
                }
                const wa = weight(a.entry.name)
                const wb = weight(b.entry.name)
                if (wa[0] !== wb[0]) return wa[0] - wb[0]
                return wa[1] - wb[1]
              })
            : selected === 'size'
            ? [...activeGroup].sort((a, b) => {
                const weight = (full: string) => {
                  const n = full.replace('size/', '').replace('-', '.')
                  if (n === 'none') return [0, 0]
                  if (n === '0.5x') return [1, 0]
                  if (n === 'default') return [2, 0]
                  const asNum = parseFloat(n.replace('x', ''))
                  return [3, isNaN(asNum) ? Number.POSITIVE_INFINITY : asNum]
                }
                const wa = weight(a.entry.name)
                const wb = weight(b.entry.name)
                if (wa[0] !== wb[0]) return wa[0] - wb[0]
                return wa[1] - wb[1]
              })
            : activeGroup
          return (
            <section key={mode + '-measurements'} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
              {selected === 'effect' ? (
                <EffectTokens />
              ) : selected === 'opacity' ? (
                <OpacityTokens />
              ) : selected === 'size' ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>Size</div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={scaleSizesByDefault} onChange={(e) => {
                        const next = e.currentTarget.checked
                        setScaleSizesByDefault(next)
                        localStorage.setItem('size-scale-by-default', String(next))
                      }} />
                      Scale based on default
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 50px auto', gap: 8, alignItems: 'center' }}>
                    {sortedActive.map(({ entry }) => {
                      const raw = entry.name.replace('size/', '')
                      const display = (() => {
                        const n = raw.replace('-', '.')
                        if (n === 'default' || n === 'none') return n.charAt(0).toUpperCase() + n.slice(1)
                        return n
                      })()
                      const numeric = typeof entry.value === 'number'
                      const isNone = raw === 'none'
                      const isDefault = raw === 'default'
                      const currentDefault = Number((values['size/default'] as any) ?? (sortedActive.find(({ entry: e }) => e.name === 'size/default')?.entry.value as any) ?? 0)
                      const mul = (() => {
                        if (raw === 'default') return 1
                        if (raw === 'none') return 0
                        const n = parseFloat(raw.replace('-', '.').replace('x', ''))
                        return Number.isFinite(n) ? n : 1
                      })()
                      const computed = Math.round(currentDefault * mul)
                      const current: any = isNone ? 0 : (scaleSizesByDefault && !isDefault) ? computed : ((values[entry.name] as any) ?? (entry.value as any))
                      const disabled = isNone || (scaleSizesByDefault && !isDefault)
                      return (
                        <>
                          <label key={entry.name + '-label'} htmlFor={entry.name} style={{ fontSize: 13, opacity: 0.9 }}>{display}</label>
                          <input
                            type="range"
                            min={0}
                            max={200}
                            step={1}
                            disabled={disabled}
                            value={Number(current)}
                            onChange={(e) => {
                              const next = Number(e.currentTarget.value)
                              setValues((prev) => ({ ...prev, [entry.name]: next }))
                              setOverride(entry.name, next as any)
                            }}
                            style={{ width: '100%', maxWidth: 300, justifySelf: 'end' }}
                          />
                          <input
                            id={entry.name}
                            type={numeric ? 'number' : 'text'}
                            value={Number(current)}
                            disabled={disabled}
                            onChange={(e) => {
                              const next = numeric ? Number(e.currentTarget.value) : e.currentTarget.value
                              setValues((prev) => ({ ...prev, [entry.name]: next }))
                              setOverride(entry.name, next as any)
                            }}
                            style={{ width: 50 }}
                          />
                          <span style={{ fontSize: 12, opacity: 0.8 }}>px</span>
                        </>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8, alignItems: 'center' }}>
                      {sortedActive.map(({ entry }) => {
                        const label = entry.name
                        const numeric = typeof entry.value === 'number'
                        const current: any = (values[entry.name] as any) ?? (entry.value as any)
                        return (
                          <>
                            <label key={entry.name + '-label'} htmlFor={entry.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
                            <input
                              key={entry.name}
                              id={entry.name}
                              type={numeric ? 'number' : 'text'}
                              value={current}
                              onChange={(e) => {
                                const next = numeric ? Number(e.currentTarget.value) : e.currentTarget.value
                                setValues((prev) => ({ ...prev, [entry.name]: next }))
                                setOverride(entry.name, next as any)
                              }}
                            />
                          </>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )
        })()

        return (
          <div key={mode} style={{ display: 'grid', gap: 12 }}>
            {selected === 'color' ? colorSection : measurementSection}
          </div>
        )
      })}
        </div>
      </div>
    </div>
  )
}


