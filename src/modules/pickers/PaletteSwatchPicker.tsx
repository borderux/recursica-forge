import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'

export default function PaletteSwatchPicker({ onSelect }: { onSelect?: (cssVarName: string) => void }) {
  const { palettes, theme: themeJson, tokens: tokensJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [targetCssVars, setTargetCssVars] = useState<string[]>([])
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const lightPal: any = root?.light?.palettes || {}
      Object.keys(lightPal).forEach((k) => {
        // Only show palettes, exclude core and core-colors
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
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
          // Get all numeric levels including 000 and 1000 - no normalization or deduplication
          const levels = Object.keys(paletteData).filter((k) => /^(\d{2,4}|000|1000)$/.test(k))
          // Sort: 1000, 900, 800, ..., 100, 050, 000
          levels.sort((a, b) => {
            const aNum = a === '000' ? 0 : a === '050' ? 50 : a === '1000' ? 1000 : Number(a)
            const bNum = b === '000' ? 0 : b === '050' ? 50 : b === '1000' ? 1000 : Number(b)
            return bNum - aNum
          })
          levelsByPalette[pk] = levels
        }
      } catch {}
      // Fallback to standard levels if not found (including 000 and 1000)
      if (!levelsByPalette[pk]) {
        levelsByPalette[pk] = ['1000', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050', '000']
      }
    })
    return levelsByPalette
  }, [paletteKeys, themeJson])

  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    // Use actual level - no normalization (000 stays 000, 1000 stays 1000)
    return `--recursica-brand-light-palettes-${paletteKey}-${level}-tone`
  }

  // Get the resolved value of the target CSS var to compare with palette swatches
  // This hook must be called before any early returns to follow Rules of Hooks
  const targetResolvedValue = useMemo(() => {
    if (!targetCssVar) return null
    const resolved = readCssVarResolved(targetCssVar)
    const directValue = readCssVar(targetCssVar)
    return { resolved, direct: directValue }
  }, [targetCssVar])

  // Check if a palette swatch is currently selected
  const isSwatchSelected = (paletteCssVar: string): boolean => {
    if (!targetResolvedValue || !targetCssVar) return false
    
    // Check if target CSS var directly references this palette var
    const directValue = readCssVar(targetCssVar)
    if (directValue) {
      const trimmed = directValue.trim()
      const expectedValue = `var(${paletteCssVar})`
      if (trimmed === expectedValue) {
        return true
      }
      // If target is a CSS var reference (not hex), only match exact references
      if (trimmed.startsWith('var(')) {
        return false
      }
    }
    
    // Fallback: compare resolved hex values (only if target is a direct hex, not a var reference)
    if (targetResolvedValue.direct && !targetResolvedValue.direct.trim().startsWith('var(')) {
      const paletteResolved = readCssVarResolved(paletteCssVar)
      if (targetResolvedValue.resolved && paletteResolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
        const targetHex = targetResolvedValue.resolved.toLowerCase().trim()
        const paletteHex = paletteResolved.toLowerCase().trim()
        return targetHex === paletteHex
      }
    }
    
    return false
  }

  ;(window as any).openPalettePicker = (el: HTMLElement, cssVar: string, cssVarsArray?: string[]) => {
    setAnchor(el)
    setTargetCssVar(cssVar || null)
    setTargetCssVars(cssVarsArray && cssVarsArray.length > 0 ? cssVarsArray : [])
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
                const isSelected = isSwatchSelected(paletteCssVar)
                return (
                  <div
                    key={`${pk}-${level}`}
                    title={`${pk}/${level}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        // Get all CSS vars to update (use array if provided, otherwise just the single target)
                        const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                        
                        // Update all CSS variables - only update CSS vars, never JSON
                        cssVarsToUpdate.forEach((cssVar) => {
                          // Ensure target CSS var has --recursica- prefix if it doesn't already
                          const prefixedTarget = cssVar.startsWith('--recursica-')
                            ? cssVar
                            : cssVar.startsWith('--')
                              ? `--recursica-${cssVar.slice(2)}`
                              : `--recursica-${cssVar}`

                          // Set the target CSS variable to reference the selected palette CSS variable
                          updateCssVar(prefixedTarget, `var(${paletteCssVar})`, tokensJson)
                        })
                        
                        onSelect?.(paletteCssVar)
                      } catch (err) {
                        console.error('Failed to set palette CSS variable:', err)
                      }
                      setAnchor(null)
                      setTargetCssVar(null)
                      setTargetCssVars([])
                    }}
                    style={{
                      position: 'relative',
                      width: swatch,
                      height: swatch,
                      background: `var(${paletteCssVar})`,
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.15)',
                      flex: '0 0 auto',
                    }}
                  >
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        {/* White checkmark with dark shadow for visibility on any background */}
                        <path
                          d="M2 6L5 9L10 2"
                          stroke="#000"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.4"
                        />
                        <path
                          d="M2 6L5 9L10 2"
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
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
