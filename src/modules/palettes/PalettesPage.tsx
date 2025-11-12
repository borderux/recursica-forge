import '../theme/index.css'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import PaletteGrid from './PaletteGrid'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'

type PaletteEntry = { key: string; title: string; defaultLevel: number; initialFamily?: string }

export default function PalettesPage() {
  const { tokens: tokensJson, theme: themeJson, palettes: palettesState, setPalettes } = useVars()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const allFamilies = useMemo(() => {
    const fams = new Set<string>(Object.keys((tokensJson as any)?.tokens?.color || {}))
    fams.delete('translucent')
    return Array.from(fams).sort()
  }, [tokensJson])
  const palettes = palettesState.dynamic
  const writePalettes = (next: PaletteEntry[]) => setPalettes({ ...palettesState, dynamic: next })
  const getPersistedFamily = (key: string): string | undefined => {
    try {
      const raw = localStorage.getItem(`palette-grid-family:${key}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (key === 'neutral') return 'gray'
    if (key === 'palette-1') return 'salmon'
    if (key === 'palette-2') return 'mandarin'
    return undefined
  }
  const usedFamilies = useMemo(() => {
    const set = new Set<string>()
    palettes.forEach((p) => {
      const fam = p.initialFamily || getPersistedFamily(p.key)
      if (fam) set.add(fam)
    })
    return set
  }, [palettes])
  const unusedFamilies = useMemo(() => allFamilies.filter((f) => !usedFamilies.has(f)), [allFamilies, usedFamilies])
  const canAddPalette = unusedFamilies.length > 0
  const addPalette = () => {
    if (!canAddPalette) return
    const family = unusedFamilies[0]
    const existing = new Set(palettes.map((p) => p.key))
    let i = 1
    while (existing.has(`palette-${i}`)) i += 1
    const nextKey = `palette-${i}`
    try { localStorage.setItem(`palette-grid-family:${nextKey}`, JSON.stringify(family)) } catch {}
    writePalettes([...palettes, { key: nextKey, title: `Palette ${i}`, defaultLevel: 500, initialFamily: family }])
  }
  const deletePalette = (key: string) => {
    if (key === 'neutral' || key === 'palette-1') return
    try { localStorage.removeItem(`palette-grid-family:${key}`) } catch {}
    writePalettes(palettes.filter((p) => p.key !== key))
  }
  const paletteBindings = palettesState.bindings
  const writeBindings = (next: Record<string, { token: string; hex: string }>) => setPalettes({ ...palettesState, bindings: next })

  type OpacityBindingKey = 'disabled' | 'overlay' | 'text-high' | 'text-low'
  const opacityBindings = palettesState.opacity as Record<OpacityBindingKey, { token: string; value: number }>
  const writeOpacityBindings = (next: Record<OpacityBindingKey, { token: string; value: number }>) => setPalettes({ ...palettesState, opacity: next as any })

  const applyAliasOnTones = () => { /* no-op with new core var scheme */ }

  const themeIndex = useMemo(() => {
    const out: Record<string, { value: any }> = {}
    const visit = (node: any, prefix: string, mode: 'Light' | 'Dark') => {
      if (!node || typeof node !== 'object') return
      if (Object.prototype.hasOwnProperty.call(node, '$value')) {
        out[`${mode}::${prefix}`] = { value: (node as any)['$value'] }
        return
      }
      Object.keys(node).forEach((k) => visit((node as any)[k], prefix ? `${prefix}/${k}` : k, mode))
    }
    const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
    if (root?.light?.palette) visit(root.light.palette, 'palette', 'Light')
    if (root?.dark?.palette) visit(root.dark.palette, 'palette', 'Dark')
    return out
  }, [])

  const getTokenValue = (name: string): string | number | undefined => {
    const normalized = (name || '').replace(/^token\./, '').replace(/\./g, '/')
    const parts = normalized.split('/')
    if (parts[0] === 'color' && parts.length >= 3) return (tokensJson as any)?.tokens?.color?.[parts[1]]?.[parts[2]]?.$value
    if (parts[0] === 'opacity' && parts[1]) return (tokensJson as any)?.tokens?.opacity?.[parts[1]]?.$value
    if (parts[0] === 'font' && parts[1] === 'weight' && parts[2]) return (tokensJson as any)?.tokens?.font?.weight?.[parts[2]]?.$value
    if (parts[0] === 'font' && parts[1] === 'size' && parts[2]) return (tokensJson as any)?.tokens?.font?.size?.[parts[2]]?.$value
    return undefined
  }

  const resolveThemeRef = (ref: any, modeLabel: 'Light' | 'Dark'): string | number | undefined => {
    if (ref == null) return undefined
    if (typeof ref === 'number') return ref
    if (typeof ref === 'string') {
      const s = ref.trim()
      if (!s.startsWith('{')) return s
      const inner = s.slice(1, -1)
      if (inner.startsWith('token.')) return getTokenValue(inner)
      if (inner.startsWith('theme.')) {
        const parts = inner.split('.')
        const mode = (parts[1] || '').toLowerCase() === 'dark' ? 'Dark' : 'Light'
        const path = parts.slice(2).join('/')
        let entry = themeIndex[`${mode}::${path}`]
        if (!entry && /\/high-emphasis$/.test(path)) {
          const alt = path.replace(/\/high-emphasis$/, '/text/high-emphasis')
          entry = themeIndex[`${mode}::${alt}`]
        }
        if (!entry && /\/low-emphasis$/.test(path)) {
          const alt = path.replace(/\/low-emphasis$/, '/text/low-emphasis')
          entry = themeIndex[`${mode}::${alt}`]
        }
        return resolveThemeRef(entry?.value, mode)
      }
      return s
    }
    if (typeof ref === 'object') {
      const coll = (ref as any).collection
      const name = (ref as any).name
      if (coll === 'Tokens' && typeof name === 'string') return getTokenValue(name)
      if (coll === 'Theme' && typeof name === 'string') {
        const entry = themeIndex[`${modeLabel}::${name}`]
        return resolveThemeRef(entry?.value, modeLabel)
      }
    }
    return undefined
  }

  useEffect(() => {
    try { applyAliasOnTones() } catch {}
  }, [])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--recursica-brand-light-layer-layer-0-property-surface, #ffffff)', color: 'var(--recursica-brand-light-layer-layer-0-property-element-text-color, #111111)' }}>
      <div className="container-padding">
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="theme-mode-label" style={{ margin: 0 }}>Palettes</h2>
          <div style={{ display: 'inline-flex', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setIsDarkMode(false)}
              style={{ padding: '6px 10px', border: 'none', background: !isDarkMode ? 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: !isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Light</button>
            <button
              onClick={() => setIsDarkMode(true)}
              style={{ padding: '6px 10px', border: 'none', borderLeft: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: isDarkMode ? 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)' : 'transparent', color: isDarkMode ? '#fff' : 'inherit', cursor: 'pointer' }}
            >Dark</button>
          </div>
        </div>

        <div className="section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Core</h3>
          <button type="button" onClick={addPalette} disabled={!canAddPalette} style={{ padding: '6px 10px', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, cursor: canAddPalette ? 'pointer' : 'not-allowed', opacity: canAddPalette ? 1 : 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>Add Palette</button>
          </div>

          <table className="color-swatches">
            <thead>
              <tr>
                <th>Black</th>
                <th>White</th>
                <th>Alert</th>
                <th>Warn</th>
                <th>Success</th>
                <th>Interactive</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-black']?.hex || 'var(--recursica-brand-light-palettes-core-black)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-black')} />
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-white']?.hex || 'var(--recursica-brand-light-palettes-core-white)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-white')} />
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-alert']?.hex || 'var(--recursica-brand-light-palettes-core-alert)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-alert')} />
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-warning']?.hex || 'var(--recursica-brand-light-palettes-core-warning)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-warning')} />
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-success']?.hex || 'var(--recursica-brand-light-palettes-core-success)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-success')} />
                <td className="swatch-box" style={{ backgroundColor: paletteBindings['--recursica-brand-light-palettes-core-interactive']?.hex || 'var(--recursica-brand-light-palettes-core-interactive)', cursor: 'pointer' }} onClick={(e) => (window as any).openPicker?.(e.currentTarget, '--recursica-brand-light-palettes-core-interactive')} />
              </tr>
              {/* Removed hex values row under swatches per request */}
            </tbody>
          </table>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Opacity</h3>
            <table className="color-swatches">
              <thead>
                <tr>
                  <th>Overlay</th>
                  <th>High Emphasis</th>
                  <th>Low Emphasis</th>
                  <th>Disabled</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(() => {
                    const modeVar = isDarkMode ? 'dark' : 'light'
                    const layer0Surface = `var(--recursica-brand-${modeVar}-layer-layer-0-property-surface)`
                    const layer0TextColor = `var(--recursica-brand-${modeVar}-layer-layer-0-property-element-text-color)`
                    return (
                      <>
                        <td className="swatch-box overlay" style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', padding: 'var(--recursica-brand-light-layer-layer-0-property-padding)', cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'overlay')}>
                          <div style={{ width: '100%', height: '100%', minHeight: '30px', background: 'var(--recursica-brand-light-palettes-core-black)', opacity: `var(--recursica-brand-${modeVar}-opacity-overlay)` }} />
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'text-high')}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-font-body-1-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-font-body-1-font-size, 16px)`, fontWeight: `var(--recursica-font-body-1-font-weight, 400)`, letterSpacing: `var(--recursica-font-body-1-font-letter-spacing, 0)`, lineHeight: `var(--recursica-font-body-1-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-text-emphasis-high)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box text-emphasis" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'text-low')}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-font-body-1-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-font-body-1-font-size, 16px)`, fontWeight: `var(--recursica-font-body-1-font-weight, 400)`, letterSpacing: `var(--recursica-font-body-1-font-letter-spacing, 0)`, lineHeight: `var(--recursica-font-body-1-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-text-emphasis-low)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                        <td className="swatch-box disabled" style={{ position: 'relative', background: layer0Surface, cursor: 'pointer' }} onClick={(e) => (window as any).openOpacityPicker?.(e.currentTarget, 'disabled')}>
                          <p aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: `var(--recursica-font-body-1-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial)`, fontSize: `var(--recursica-font-body-1-font-size, 16px)`, fontWeight: `var(--recursica-font-body-1-font-weight, 400)`, letterSpacing: `var(--recursica-font-body-1-font-letter-spacing, 0)`, lineHeight: `var(--recursica-font-body-1-line-height, normal)`, color: layer0TextColor, opacity: `var(--recursica-brand-${modeVar}-opacity-disabled)`, whiteSpace: 'nowrap' }}>Text / Icons</p>
                        </td>
                      </>
                    )
                  })()}
                </tr>
              </tbody>
            </table>
          </div>

          {palettes.map((p) => (
            <PaletteGrid
              key={p.key}
              paletteKey={p.key}
              title={p.title}
              defaultLevel={p.defaultLevel}
              mode={isDarkMode ? 'Dark' : 'Light'}
              deletable={!(p.key === 'neutral' || p.key === 'palette-1')}
              onDelete={() => deletePalette(p.key)}
              initialFamily={p.initialFamily}
            />
          ))}
        </div>

        <SwatchPicker onSelect={(cssVar: string, tokenName: string, hex: string) => {
          document.documentElement.style.setProperty(cssVar, hex)
          writeBindings({ ...paletteBindings, [cssVar]: { token: tokenName, hex } })
          applyAliasOnTones()
        }} />

        <OpacityPicker onSelect={(slot: 'disabled' | 'overlay' | 'text-high' | 'text-low', tokenName: string, value: number) => {
          const next = { ...opacityBindings, [slot]: { token: tokenName, value } } as any
          writeOpacityBindings(next)
        }} />
      </div>
    </div>
  )
}

function SwatchPicker({ onSelect }: { onSelect: (cssVar: string, tokenName: string, hex: string) => void }) {
  const { tokens: tokensJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetVar, setTargetVar] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  useEffect(() => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) setFamilyNames(JSON.parse(raw))
    } catch {}
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          return
        }
        const raw = localStorage.getItem('family-friendly-names')
        setFamilyNames(raw ? JSON.parse(raw) : {})
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])
  const options = useMemo(() => {
    const byFamily: Record<string, Array<{ level: string; name: string; value: string }>> = {}
    const jsonColors: any = (tokensJson as any)?.tokens?.color || {}
    const overrideMap = readOverrides()
    const jsonFamilies = Object.keys(jsonColors).filter((f) => f !== 'translucent')
    const overrideFamilies = Array.from(new Set(Object.keys(overrideMap)
      .filter((k) => k.startsWith('color/'))
      .map((k) => k.split('/')[1])
      .filter((f) => f && f !== 'translucent')))
    const families = Array.from(new Set([...jsonFamilies, ...overrideFamilies])).sort((a, b) => {
      if (a === 'gray' && b !== 'gray') return -1
      if (b === 'gray' && a !== 'gray') return 1
      return a.localeCompare(b)
    })
    families.forEach((fam) => {
      const jsonLevels = Object.keys(jsonColors?.[fam] || {})
      const overrideLevels = Object.keys(overrideMap)
        .filter((k) => k.startsWith(`color/${fam}/`))
        .map((k) => k.split('/')[2])
        .filter((lvl) => /^(\d{2,4})$/.test(lvl))
      const levelSet = new Set<string>([...jsonLevels, ...overrideLevels])
      const levels = Array.from(levelSet)
      byFamily[fam] = levels.map((lvl) => {
        const name = `color/${fam}/${lvl}`
        const val = (overrideMap as any)[name] ?? (jsonColors?.[fam]?.[lvl]?.$value)
        return { level: lvl, name, value: String(val ?? '') }
      }).filter((it) => it.value && /^#?[0-9a-fA-F]{6}$/.test(String(it.value).trim()))
      byFamily[fam].sort((a, b) => Number(b.level) - Number(a.level))
    })
    return byFamily
  }, [tokensJson])

  ;(window as any).openPicker = (el: HTMLElement, cssVar: string) => {
    setAnchor(el)
    setTargetVar(cssVar)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 420)
    setPos({ top, left })
  }

  if (!anchor || !targetVar) return null
  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()
  const getFriendly = (family: string) => {
    const fromMap = (familyNames || {})[family]
    if (typeof fromMap === 'string' && fromMap.trim()) return fromMap
    return toTitle(family)
  }
  const maxCount = Math.max(...Object.values(options).map((arr) => arr.length || 0))
  const labelCol = 110
  const swatch = 18
  const gap = 1
  const overlayWidth = labelCol + maxCount * (swatch + gap) + 32
  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: overlayWidth, background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', color: 'var(--recursica-brand-light-layer-layer-0-property-element-text-color)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 9999 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { left: Math.max(0, Math.min(window.innerWidth - overlayWidth, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick color</div>
        <button onClick={() => { setAnchor(null); setTargetVar(null) }} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {Object.entries(options).map(([family, items]) => (
          <div key={family} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'capitalize' }}>{getFriendly(family)}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap, overflow: 'auto' }}>
              {items.map((it) => (
                <div key={it.name} title={it.name} onClick={() => {
                  onSelect(targetVar!, it.name, it.value)
                  setAnchor(null); setTargetVar(null)
                }} style={{ width: swatch, height: swatch, background: it.value, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flex: '0 0 auto' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}

function OpacityPicker({ onSelect }: { onSelect: (slot: 'disabled' | 'overlay' | 'text-high' | 'text-low', tokenName: string, value: number) => void }) {
  const { tokens: tokensJson } = useVars()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [slot, setSlot] = useState<'disabled' | 'overlay' | 'text-high' | 'text-low' | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const options = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ name: string; value: number }> = Object.keys(src).map((k) => ({ name: `opacity/${k}`, value: Number(src[k]?.$value) }))
    list.sort((a, b) => a.value - b.value)
    return list
  }, [])

  ;(window as any).openOpacityPicker = (el: HTMLElement, s: 'disabled' | 'overlay' | 'text-high' | 'text-low') => {
    setAnchor(el)
    setSlot(s)
    const rect = el.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.min(rect.left, window.innerWidth - 260)
    setPos({ top, left })
  }

  if (!anchor || !slot) return null
  return (
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: 240, background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 10, zIndex: 1100 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'move' }}
        onMouseDown={(e) => {
          const startX = e.clientX
          const startY = e.clientY
          const start = { ...pos }
          const move = (ev: MouseEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            const next = { left: Math.max(0, Math.min(window.innerWidth - 240, start.left + dx)), top: Math.max(0, Math.min(window.innerHeight - 120, start.top + dy)) }
            setPos(next)
          }
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div style={{ fontWeight: 600 }}>Pick opacity</div>
        <button onClick={() => { setAnchor(null); setSlot(null) }} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {options.map((opt) => (
          <button key={opt.name} onClick={() => { onSelect(slot, opt.name, opt.value); setAnchor(null); setSlot(null) }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', background: 'transparent', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
            <span style={{ textTransform: 'capitalize' }}>{opt.name.replace('opacity/','')}</span>
            <span>{`${Math.round(opt.value <= 1 ? opt.value * 100 : opt.value)}%`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


