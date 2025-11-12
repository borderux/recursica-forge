import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'

export default function PaletteSwatchPicker({ onSelect }: { onSelect: (cssVarName: string) => void }) {
  const { tokens: tokensJson, palettes } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
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

  ;(window as any).openPalettePicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetCssVar(cssVar || null)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetCssVar) return null
  
  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    // Normalize level (000 -> 050, 1000 -> 900)
    let normalizedLevel = level
    if (level === '000') normalizedLevel = '050'
    else if (level === '1000') normalizedLevel = '900'
    else if (level === 'default') normalizedLevel = 'primary'
    
    return `--recursica-brand-light-palettes-${paletteKey}-${normalizedLevel}-tone`
  }
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
              {(options[pk] || []).map((it) => {
                const paletteCssVar = buildPaletteCssVar(pk, it.level)
                return (
                  <div 
                    key={`${pk}-${it.level}`} 
                    title={`${pk}/${it.level}`} 
                    onClick={() => {
                      try {
                        // Ensure target CSS var has --recursica- prefix if it doesn't already
                        const prefixedTarget = targetCssVar!.startsWith('--recursica-') 
                          ? targetCssVar! 
                          : targetCssVar!.startsWith('--') 
                            ? `--recursica-${targetCssVar!.slice(2)}`
                            : `--recursica-${targetCssVar!}`
                        
                        // Set the target CSS variable to reference the selected palette CSS variable
                        const root = document.documentElement
                        root.style.setProperty(prefixedTarget, `var(${paletteCssVar})`)
                        // Return the CSS var name that was set (palette CSS var already has correct prefix)
                        onSelect(paletteCssVar)
                      } catch (err) {
                        console.error('Failed to set palette CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                    }} 
                    style={{ width: swatch, height: swatch, background: it.hex, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flex: '0 0 auto' }} 
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}


