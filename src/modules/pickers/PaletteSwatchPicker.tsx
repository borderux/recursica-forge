import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'

export default function PaletteSwatchPicker({ onSelect }: { onSelect: (cssVarName: string) => void }) {
  const { palettes, theme: themeJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const lightPal: any = root?.light?.palettes || {}
      Object.keys(lightPal).forEach((k) => {
        if (k !== 'core' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch {}
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])

  const paletteLevels = useMemo(() => {
    const levelsByPalette: Record<string, string[]> = {}
    paletteKeys.forEach((pk) => {
      try {
        const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
        const paletteData: any = root?.light?.palettes?.[pk]
        if (paletteData) {
          // Get all numeric levels (excluding 'default' and other non-level keys)
          const levels = Object.keys(paletteData).filter((k) => /^\d{2,4}|000$/.test(k))
          // Normalize and deduplicate: 000 -> 050, 1000 -> 900
          // Prefer canonical levels (050 over 000, 900 over 1000)
          const normalizeLevel = (lvl: string) => {
            if (lvl === '000') return '050'
            if (lvl === '1000') return '900'
            return lvl
          }
          // Map to normalized levels and deduplicate, preferring canonical levels
          const normalizedMap = new Map<string, string>() // normalized -> original
          levels.forEach((lvl) => {
            const normalized = normalizeLevel(lvl)
            // Prefer canonical levels: if we already have 050, don't replace with 000
            // If we already have 900, don't replace with 1000
            if (!normalizedMap.has(normalized)) {
              normalizedMap.set(normalized, lvl)
            } else {
              // Prefer canonical: 050 over 000, 900 over 1000
              if ((normalized === '050' && lvl === '050') || (normalized === '900' && lvl === '900')) {
                normalizedMap.set(normalized, lvl)
              }
            }
          })
          const uniqueLevels = Array.from(normalizedMap.values())
          // Sort: 1000, 900, 800, ..., 100, 050, 000
          uniqueLevels.sort((a, b) => {
            const aNum = a === '000' ? 0 : a === '050' ? 50 : a === '1000' ? 1000 : Number(a)
            const bNum = b === '000' ? 0 : b === '050' ? 50 : b === '1000' ? 1000 : Number(b)
            return bNum - aNum
          })
          levelsByPalette[pk] = uniqueLevels
        }
      } catch {}
      // Fallback to standard levels if not found (already deduplicated)
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson])

  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    // Normalize level (000 -> 050, 1000 -> 900)
    let normalizedLevel = level
    if (level === '000') normalizedLevel = '050'
    else if (level === '1000') normalizedLevel = '900'
    return `--recursica-brand-light-palettes-${paletteKey}-${normalizedLevel}-tone`
  }

  ;(window as any).openPalettePicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetCssVar(cssVar || null)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetCssVar) return null

  const labelCol = 120
  const swatch = 18
  const gap = 1
  const maxLevelCount = Math.max(...Object.values(paletteLevels).map((levels) => levels.length), 0)
  const overlayWidth = labelCol + maxLevelCount * (swatch + gap) + 32
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
              {(paletteLevels[pk] || []).map((level) => {
                const paletteCssVar = buildPaletteCssVar(pk, level)
                return (
                  <div
                    key={`${pk}-${level}`}
                    title={`${pk}/${level}`}
                    onClick={() => {
                      try {
                        // Ensure target CSS var has --recursica- prefix if it doesn't already
                        const prefixedTarget = targetCssVar!.startsWith('--recursica-')
                          ? targetCssVar!
                          : targetCssVar!.startsWith('--')
                            ? `--recursica-${targetCssVar!.slice(2)}`
                            : `--recursica-${targetCssVar!}`

                        // Set the target CSS variable to reference the selected palette CSS variable
                        document.documentElement.style.setProperty(prefixedTarget, `var(${paletteCssVar})`)
                        onSelect(paletteCssVar)
                      } catch (err) {
                        console.error('Failed to set palette CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                    }}
                    style={{
                      width: swatch,
                      height: swatch,
                      background: `var(${paletteCssVar})`,
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.15)',
                      flex: '0 0 auto',
                    }}
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
