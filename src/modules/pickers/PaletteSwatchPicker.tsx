import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'

type Selection = { paletteKey: string; level: string }

export default function PaletteSwatchPicker({ onSelect }: { onSelect: (sel: Selection) => void }) {
  const { tokens: tokensJson, palettes } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })

  const getPersistedFamily = (key: string): string | undefined => {
    try {
      const raw = localStorage.getItem(`palette-grid-family:${key}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (key === 'neutral') return 'gray'
    if (key === 'palette-1') return 'salmon'
    if (key === 'palette-2') return 'mandarin'
    if (key === 'palette-3') return 'cornflower'
    if (key === 'palette-4') return 'greensheen'
    return undefined
  }

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    return Array.from(new Set(dynamic))
  }, [palettes])

  const options = useMemo(() => {
    const out: Record<string, Array<{ level: string; hex: string }>> = {}
    const jsonColors: any = (tokensJson as any)?.tokens?.color || {}
    const overrideMap = readOverrides()
    paletteKeys.forEach((pk) => {
      const fam = getPersistedFamily(pk)
      if (!fam) return
      const levels = Object.keys(jsonColors?.[fam] || {}).filter((k) => /^\d{2,4}|000$/.test(k))
      const row: Array<{ level: string; hex: string }> = levels.map((lvl) => {
        const name = `color/${fam}/${lvl}`
        const hex = (overrideMap as any)[name] ?? (jsonColors?.[fam]?.[lvl]?.$value)
        return { level: lvl, hex: String(hex || '') }
      }).filter((i) => /^#?[0-9a-fA-F]{6}$/.test(i.hex))
      row.sort((a,b) => Number(b.level.replace(/^0+/,'')) - Number(a.level.replace(/^0+/,'')))
      out[pk] = row
    })
    return out
  }, [tokensJson, paletteKeys])

  ;(window as any).openPalettePicker = (el: HTMLElement) => {
    setAnchor(el)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor) return null
  const labelCol = 120
  const swatch = 18
  const gap = 1
  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: 'var(--layer-layer-0-property-surface, #ffffff)', color: 'var(--layer-layer-0-property-element-text-color, #111111)', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 9999 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Pick palette color</div>
        <button onClick={() => setAnchor(null)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {paletteKeys.map((pk) => (
          <div key={pk} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{toTitle(pk)}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
              {(options[pk] || []).map((it) => (
                <div key={`${pk}-${it.level}`} title={`${pk}/${it.level}`} onClick={() => {
                  try { onSelect({ paletteKey: pk, level: it.level }) } catch {}
                  try { (window as any).__onPalettePick && (window as any).__onPalettePick({ paletteKey: pk, level: it.level }) } catch {}
                  setAnchor(null)
                }} style={{ width: swatch, height: swatch, background: it.hex, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flex: '0 0 auto' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}


