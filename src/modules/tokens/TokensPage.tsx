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
import { useVars } from '../vars/VarsContext'
// removed unused varsUtil import
import { readOverrides, setOverride } from '../theme/tokenOverrides'
import OpacityTokens from './OpacityTokens'
import EffectTokens from './EffectTokens'
import SizeTokens from './SizeTokens'
import FontFamiliesTokens from './FontFamiliesTokens'
import FontLetterSpacingTokens from './FontLetterSpacingTokens'
import FontLineHeightTokens from './FontLineHeightTokens'
import FontSizeTokens from './FontSizeTokens'
import FontWeightTokens from './FontWeightTokens'

type TokenEntry = {
  collection?: string
  mode?: string
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function TokensPage() {
  const { tokens: tokensJson } = useVars()
  const flatTokens: TokenEntry[] = useMemo(() => {
    const list: TokenEntry[] = []
    const push = (name: string, type: string, value: any) => {
      if (value == null) return
      const v = typeof value === 'object' && '$value' in value ? (value as any)['$value'] : value
      if (typeof v === 'string' || typeof v === 'number') list.push({ name, type, value: v })
    }
    try {
      const t: any = (tokensJson as any)?.tokens || {}
      // colors
      const colors = t?.color || {}
      Object.keys(colors).forEach((family) => {
        if (family === 'translucent') return
        const levels = colors[family] || {}
        Object.keys(levels).forEach((lvl) => {
          push(`color/${family}/${lvl}`, 'color', levels[lvl]?.$value)
        })
      })
      // grayscale special levels 000 and 1000 if present
      if (t?.color?.gray?.['000']) push('color/gray/000', 'color', t.color.gray['000'].$value)
      if (t?.color?.gray?.['1000']) push('color/gray/1000', 'color', t.color.gray['1000'].$value)
      // opacity
      const opacity = t?.opacity || {}
      Object.keys(opacity).forEach((k) => push(`opacity/${k}`, 'opacity', opacity[k]?.$value))
      // size
      const size = t?.size || {}
      Object.keys(size).forEach((k) => push(`size/${k}`, 'size', size[k]?.$value))
      // effect
      const effect = t?.effect || {}
      Object.keys(effect).forEach((k) => push(`effect/${k}`, 'effect', effect[k]?.$value))
      // font
      const font = t?.font || {}
      const sizes = font?.size || {}
      Object.keys(sizes).forEach((k) => push(`font/size/${k}`, 'font', sizes[k]?.$value))
      const weights = font?.weight || {}
      Object.keys(weights).forEach((k) => push(`font/weight/${k}`, 'font', weights[k]?.$value))
      const spacing = font?.['letter-spacing'] || {}
      Object.keys(spacing).forEach((k) => push(`font/letter-spacing/${k}`, 'font', spacing[k]?.$value))
    } catch {}
    return list
  }, [])

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
    // hydrate from localStorage
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setFamilyNames(parsed)
      }
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('family-friendly-names', JSON.stringify(familyNames)) } catch {}
    try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: familyNames })) } catch {}
  }, [familyNames])
  // Maintain visual column order; newly added families append to the end
  const [familyOrder, setFamilyOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('color-family-order')
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  })
  useEffect(() => {
    try { localStorage.setItem('color-family-order', JSON.stringify(familyOrder)) } catch {}
  }, [familyOrder])
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
  // size-scale-by-default is managed inside SizeTokens

  // overlay positioning handled inside ColorPickerOverlay

  const groupedByMode = useMemo(() => {
    const byMode: Record<ModeName, Array<{ key: string; entry: TokenEntry }>> = { 'Mode 1': [] }
    flatTokens.forEach((entry, idx) => {
      byMode['Mode 1'].push({ key: String(idx), entry })
    })
    byMode['Mode 1'].sort((a, b) => a.entry.name.localeCompare(b.entry.name))
    return byMode
  }, [flatTokens])

// parseEffectMultiplier removed (handled in EffectTokens)

  const colorFamiliesByMode = useMemo(() => {
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    Object.values(groupedByMode).forEach(() => {})
    flatTokens.forEach((entry) => {
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

  // Auto-fill missing friendly names using color values
  useEffect(() => {
    (async () => {
      try {
        const allFamilies = new Set<string>()
        Object.values(colorFamiliesByMode).forEach((famMap) => {
          Object.keys(famMap).forEach((f) => allFamilies.add(f))
        })
        if (!allFamilies.size) return
        let changed = false
        const next: Record<string, string> = { ...familyNames }
        for (const fam of allFamilies) {
          if (fam === 'translucent') continue
          if (next[fam] && next[fam].trim()) continue
          // Prefer 500 level; otherwise pick the closest available
          const levels = (colorFamiliesByMode['Mode 1']?.[fam] || [])
          const preferred = levels.find((l) => l.level === '500') || levels[Math.floor(levels.length / 2)] || levels[0]
          const hex = preferred?.entry?.value as string | undefined
          if (typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex.trim())) {
            const normalized = hex.startsWith('#') ? hex : `#${hex}`
            const label = await getNtcName(normalized)
            if (label && label.trim()) {
              next[fam] = toTitleCase(label.trim())
              changed = true
            }
          }
        }
        if (changed) setFamilyNames(next)
      } catch {}
    })()
  }, [colorFamiliesByMode])

  useEffect(() => {
    // Initialize form values from tokens JSON, then overlay any persisted overrides
    const init: Record<string, string | number> = {}
    flatTokens.forEach((entry) => { init[entry.name] = entry.value })
    const overrides = readOverrides()
    const merged: Record<string, string | number> = { ...init, ...overrides }
    if (typeof merged['effect/none'] !== 'undefined') merged['effect/none'] = 0
    setValues(merged)
  }, [flatTokens])

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
              let families = Object.entries(colorFamiliesByMode[mode as ModeName]).filter(([family]) => family !== 'translucent' && !deletedFamilies[family]).sort(([a], [b]) => {
                if (a === 'gray' && b !== 'gray') return -1
                if (b === 'gray' && a !== 'gray') return 1
                return a.localeCompare(b)
              })
              // Reorder to ensure newly added families appear as right-most columns
              const existing = families.filter(([fam]) => !familyOrder.includes(fam))
              const appended = familyOrder.map((fam) => families.find(([f]) => f === fam)).filter((v): v is typeof families[number] => Array.isArray(v))
              families = [...existing, ...appended]
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
                        setFamilyOrder((prev) => (prev.includes(newFamily) ? prev : [...prev, newFamily]))
                        // Evenly step the scale from 000 → 500 → 1000, with 500 fixed to seed
                        const idxMap: Record<number, number> = { 0:0, 50:1, 100:2, 200:3, 300:4, 400:5, 500:6, 600:7, 700:8, 800:9, 900:10, 1000:11 }
                        const levelsAsc = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
                        const seedS = baseHSV.s
                        const seedV = baseHSV.v
                        // Set near-white and near-black endpoints
                        // Make 000 almost achromatic near-white (very low saturation), just darker than white
                        const endS000 = 0.02
                        const endV000 = 0.98 // slightly below pure white
                        const endS1000 = clamp(seedS * 1.2, 0, 1)
                        const endV1000 = clamp(Math.max(0.03, seedV * 0.08), 0, 1) // near-black but not pure
                        const lerp = (a: number, b: number, t: number) => (a + (b - a) * t)
                        levelsAsc.forEach((lvl) => {
                          const idx = idxMap[lvl]
                          if (idx === 6) { // 500 stays seed
                            write(`color/${newFamily}/500`, seedHex)
                            return
                          }
                          if (idx < 6) {
                            const t = idx / 6
                            const s = clamp(lerp(endS000, seedS, t), 0, 1)
                            const v = clamp(lerp(endV000, seedV, t), 0, 1)
                            write(`color/${newFamily}/${String(lvl).padStart(3,'0')}`, hsvToHex(newHue, s, v))
                            return
                          }
                          const t = (idx - 6) / (11 - 6)
                          const s = clamp(lerp(seedS, endS1000, t), 0, 1)
                          const v = clamp(lerp(seedV, endV1000, t), 0, 1)
                          write(`color/${newFamily}/${String(lvl).padStart(3,'0')}`, hsvToHex(newHue, s, v))
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
                      <div key={'label-' + level} style={{ textAlign: 'center', fontSize: 12, opacity: 0.8, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{level}</div>
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
                                  if (parts.length !== 3) return
                                  const family = parts[1]
                                  const levelStrRaw = parts[2]
                                  const levelNum = (() => {
                                    if (levelStrRaw === '000') return 0
                                    if (levelStrRaw === '050') return 50
                                    const n = Number(levelStrRaw)
                                    return Number.isFinite(n) ? n : NaN
                                  })()
                                  if (!Number.isFinite(levelNum)) return

                                  const baseHsv = hexToHsv(hex)
                                  const idxMap: Record<number, number> = { 0:0, 50:1, 100:2, 200:3, 300:4, 400:5, 500:6, 600:7, 700:8, 800:9, 900:10, 1000:11 }
                                  const levelsAsc = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
                                  const startIdx = idxMap[levelNum]
                                  const endS000 = 0.02
                                  const endV000 = 0.98
                                  const endS1000 = clamp(baseHsv.s * 1.2, 0, 1)
                                  const endV1000 = clamp(Math.max(0.03, baseHsv.v * 0.08), 0, 1)
                                  const lerp = (a: number, b: number, t: number) => (a + (b - a) * t)

                                  if (cascadeDown && startIdx > 0) {
                                    const span = startIdx
                                    for (let i = startIdx - 1; i >= 0; i -= 1) {
                                      const t = i / span
                                      const s = clamp(lerp(endS000, baseHsv.s, t), 0, 1)
                                      const v = clamp(lerp(endV000, baseHsv.v, t), 0, 1)
                                      const name = `color/${family}/${String(levelsAsc[i]).padStart(3, '0')}`
                                      const nextHex = hsvToHex(baseHsv.h, s, v)
                                      handleChange(name, nextHex)
                                      setOverride(name, nextHex)
                                    }
                                  }

                                  if (cascadeUp && startIdx < levelsAsc.length - 1) {
                                    const span = (levelsAsc.length - 1) - startIdx
                                    for (let i = startIdx + 1; i < levelsAsc.length; i += 1) {
                                      const t = (i - startIdx) / span
                                      const s = clamp(lerp(baseHsv.s, endS1000, t), 0, 1)
                                      const v = clamp(lerp(baseHsv.v, endV1000, t), 0, 1)
                                      const name = `color/${family}/${String(levelsAsc[i]).padStart(3, '0')}`
                                      const nextHex = hsvToHex(baseHsv.h, s, v)
                                      handleChange(name, nextHex)
                                      setOverride(name, nextHex)
                                    }
                                  }

                                  // Update friendly family name using the 500 level hex
                                  ;(async () => {
                                    const fiveKey = `color/${family}/500`
                                    let fiveHex: string | undefined
                                    const normHex = (h: string | undefined) => {
                                      if (!h) return undefined
                                      const m = h.match(/^#?[0-9a-fA-F]{6}$/)
                                      if (!m) return undefined
                                      return h.startsWith('#') ? h.toLowerCase() : (`#${h}`).toLowerCase()
                                    }
                                    if (levelNum === 500) {
                                      fiveHex = normHex(hex)
                                    } else {
                                      // If cascade touched 500, compute it consistently with the interpolation
                                      const targetIdx = 6
                                      if (cascadeDown && targetIdx < startIdx) {
                                        const t = targetIdx / startIdx
                                        const s = clamp(lerp(0.02, baseHsv.s, t), 0, 1)
                                        const v = clamp(lerp(0.98, baseHsv.v, t), 0, 1)
                                        fiveHex = hsvToHex(baseHsv.h, s, v)
                                      } else if (cascadeUp && targetIdx > startIdx) {
                                        const span = (levelsAsc.length - 1) - startIdx
                                        const t = (targetIdx - startIdx) / span
                                        const s = clamp(lerp(baseHsv.s, clamp(baseHsv.s * 1.2, 0, 1), t), 0, 1)
                                        const v = clamp(lerp(baseHsv.v, clamp(Math.max(0.03, baseHsv.v * 0.08), 0, 1), t), 0, 1)
                                        fiveHex = hsvToHex(baseHsv.h, s, v)
                                      } else {
                                        fiveHex = normHex(String(values[fiveKey] as any))
                                      }
                                    }
                                    const finalHex = normHex(fiveHex)
                                    if (finalHex) {
                                      const label = await getNtcName(finalHex)
                                      setFamilyNames((prev) => ({ ...prev, [family]: toTitleCase(label) }))
                                    }
                                  })()
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
                          onClick={() => { setDeletedFamilies((prev) => ({ ...prev, [family]: true })); setOpenPicker(null); setFamilyOrder((prev) => prev.filter((f) => f !== family)) }}
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
          // sortedActive no longer needed: effect/size handled by modules
          if (selected === 'font') {
            return (
              <div key={mode + '-font'} style={{ display: 'grid', gap: 16 }}>
                <FontFamiliesTokens />
                <FontSizeTokens />
                <FontWeightTokens />
                <FontLetterSpacingTokens />
                <FontLineHeightTokens />
              </div>
            )
          }
          return (
            <section key={mode + '-measurements'} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
              {selected === 'effect' ? (
                <EffectTokens />
              ) : selected === 'opacity' ? (
                <OpacityTokens />
              ) : selected === 'size' ? (
                <SizeTokens />
              ) : null}
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


