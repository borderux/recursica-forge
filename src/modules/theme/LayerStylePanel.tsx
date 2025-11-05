import React, { useMemo, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import brandDefault from '../../vars/Brand.json'

type Json = any

export default function LayerStylePanel({
  open,
  selectedLevels,
  theme,
  onClose,
  onUpdate,
}: {
  open: boolean
  selectedLevels: number[]
  theme: Json
  onClose: () => void
  onUpdate: (updater: (layerSpec: any) => any) => void
}) {
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const layerKey = useMemo(() => (selectedLevels.length ? `layer-${selectedLevels[0]}` : ''), [selectedLevels])
  const spec = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      return root?.light?.layer?.[layerKey] || {}
    } catch {
      return {}
    }
  }, [theme, layerKey])

  // Helpers: palette family mapping and contrast
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
  const hexToRgb = (hex: string) => {
    let h = (hex || '').trim()
    if (!h.startsWith('#')) h = `#${h}`
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    if (!m) return { r: 0, g: 0, b: 0 }
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  }
  const relLum = (hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    const srgb = [r, g, b].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  }
  const contrastRatio = (hex1: string, hex2: string) => {
    const L1 = relLum(hex1)
    const L2 = relLum(hex2)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }
  const pickAAOnTone = (surfaceHex: string): 'black' | 'white' => {
    const black = '#000000'
    const white = '#ffffff'
    const cBlack = contrastRatio(surfaceHex, black)
    const cWhite = contrastRatio(surfaceHex, white)
    return cBlack >= cWhite ? 'black' : 'white'
  }

  // --- Options builders ---
  const sizeOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const rec: any = (tokensJson as any)?.tokens?.size || {}
      Object.keys(rec).forEach((k) => out.push({ label: k, value: `{tokens.size.${k}}` }))
    } catch {}
    return out
  }, [tokensJson])

  const opacityOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const rec: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(rec).forEach((k) => out.push({ label: k, value: `{tokens.opacity.${k}}` }))
    } catch {}
    return out
  }, [tokensJson])

  const colorOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const light: any = root?.light?.palettes || {}
      // core-colors
      const core: any = light?.['core-colors']?.['$value'] || {}
      Object.keys(core || {}).forEach((name) => {
        out.push({ label: `core-colors/${name}`, value: `{brand.light.palettes.core-colors.${name}}` })
      })
      // neutral levels
      const neutral: any = light?.neutral || {}
      Object.keys(neutral || {}).forEach((lvl) => {
        if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `neutral/${lvl}`, value: `{brand.light.palettes.neutral.${lvl}.color.tone}` })
      })
      // palette-1, palette-2 levels
      ;['palette-1','palette-2'].forEach((pk) => {
        const group: any = light?.[pk] || {}
        Object.keys(group || {}).forEach((lvl) => {
          if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `${pk}/${lvl}`, value: `{brand.light.palettes.${pk}.${lvl}.color.tone}` })
        })
        if (group?.default?.['$value']) out.push({ label: `${pk}/default`, value: `{brand.light.palettes.${pk}.default.color.tone}` })
      })
    } catch {}
    return out
  }, [themeJson])

  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const elev: any = root?.light?.elevations || {}
      return Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
    } catch {
      return []
    }
  }, [themeJson])

  const updateValue = (path: string[], raw: string) => {
    const value: any = (() => {
      if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
      return raw
    })()
    onUpdate((layerSpec: any) => {
      const next = JSON.parse(JSON.stringify(layerSpec || {}))
      let node = next as any
      for (let i = 0; i < path.length - 1; i += 1) {
        const p = path[i]
        if (!node[p] || typeof node[p] !== 'object') node[p] = {}
        node = node[p]
      }
      const leaf = path[path.length - 1]
      const cur = node[leaf]
      if (cur && typeof cur === 'object' && ('$value' in cur)) {
        node[leaf] = { ...cur, $value: value }
      } else {
        node[leaf] = { $value: value }
      }
      return next
    })
  }

  const Field: React.FC<{ label: string; path: string[]; current: any }> = ({ label, path, current }) => {
    const val = (typeof current === 'object' && current && ('$value' in current)) ? current.$value : current
    const typeHint = (typeof current === 'object' && current && ('$type' in current)) ? String(current.$type) : undefined
    const pathKey = path.join('.')
    const isColor = typeHint === 'color' || /(color|hover-color)$/.test(pathKey)
    const isOpacity = typeHint === 'number' && /(high-emphasis|low-emphasis)$/.test(pathKey)
    const isSize = typeHint === 'number' && /(padding|border-radius|border-thickness)$/.test(pathKey)

    const options = isColor ? colorOptions : isOpacity ? opacityOptions : isSize ? sizeOptions : []
    const isSelect = options.length > 0
    return (
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        {isSelect ? (
          <select
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 6 }}
          >
            <option value="">-- select --</option>
            {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        ) : (
          <input
            type={(typeof val === 'number') ? 'number' : 'text'}
            value={val ?? ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 6 }}
          />
        )}
      </label>
    )
  }

  const RenderGroup: React.FC<{ basePath: string[]; obj: any; title?: string }> = ({ basePath, obj, title }) => {
    if (!obj || typeof obj !== 'object') return null
    const entries = Object.entries(obj)
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {title ? <div style={{ fontWeight: 600, marginTop: 4 }}>{title}</div> : null}
        {entries.map(([k, v]) => {
          if (v && typeof v === 'object' && !('$value' in (v as any))) {
            return <RenderGroup key={k} basePath={[...basePath, k]} obj={v} title={k} />
          }
          return <Field key={k} label={k} path={[...basePath, k]} current={v} />
        })}
      </div>
    )
  }

  const title = selectedLevels.length === 1 ? `Layer ${selectedLevels[0]}` : `Layers ${selectedLevels.join(', ')}`

  return (
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 34vw, 560px)', background: 'var(--layer-layer-0-property-surface, #ffffff)', borderLeft: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1200, padding: 12, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <button onClick={onClose} aria-label="Close" style={{ border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '4px 8px' }}>&times;</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Elevation dropdown */}
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Elevation</span>
          <select
            value={(() => {
              const v = (spec as any)?.property?.elevation?.$value
              const s = typeof v === 'string' ? v : ''
              const m = s.match(/elevations\.(elevation-\d+)/)
              return m ? m[1] : ''
            })()}
            onChange={(e) => {
              const name = e.currentTarget.value
              if (!name) return
              updateValue(['property','elevation'], `{brand.light.elevations.${name}}`)
            }}
            style={{ padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 6 }}
          >
            <option value="">-- select elevation --</option>
            {elevationOptions.map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </label>

        {/* Surface color via palette */}
        <PaletteColorControl
          label="Surface"
          getCurrentCssVar={() => `var(--layer-layer-${selectedLevels[0]}-property-surface)`}
          onPick={(paletteKey, level, hex) => {
            updateValue(['property','surface'], `{brand.light.palettes.${paletteKey}.${level}.color.tone}`)
            const onTone = pickAAOnTone(hex)
            const coreRef = `{brand.light.palettes.core-colors.${onTone}}`
            // apply auto text/interactive color to ensure AA
            onUpdate((layerSpec: any) => {
              const next = JSON.parse(JSON.stringify(layerSpec || {}))
              next.element = next.element || {}
              next.element.text = next.element.text || {}
              next.element.text.color = { $type: 'color', $value: coreRef }
              next.element.interactive = next.element.interactive || {}
              next.element.interactive.color = { $type: 'color', $value: coreRef }
              return next
            })
          }}
        />

        {/* Border color via palette */}
        <PaletteColorControl
          label="Border Color"
          getCurrentCssVar={() => `var(--layer-layer-${selectedLevels[0]}-property-border-color)`}
          onPick={(paletteKey, level) => {
            updateValue(['property','border-color'], `{brand.light.palettes.${paletteKey}.${level}.color.tone}`)
          }}
        />

        {/* Border thickness (integer) */}
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Border Thickness</span>
          <input
            type="number"
            step={1}
            value={(() => {
              const v = (spec as any)?.property?.['border-thickness']?.$value
              return typeof v === 'number' ? v : ''
            })()}
            onChange={(e) => {
              const n = parseInt(e.currentTarget.value || '0', 10)
              updateValue(['property','border-thickness'], String(Number.isFinite(n) ? n : 0))
            }}
            style={{ padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 6 }}
          />
        </label>

        {/* Revert button */}
        <div>
          <button
            type="button"
            onClick={() => {
              const defaults: any = (brandDefault as any)?.brand?.light?.layer || {}
              onUpdate((layerSpec: any) => {
                // this updater is called per-layer in parent; simply ignore and parent will replace
                return layerSpec
              })
              // parent wrapper applies updater per selected layer; here we set explicit defaults via a second call
              const levels = selectedLevels.slice()
              const apply = (updater: (ls: any) => any) => onUpdate(updater)
              levels.forEach((lvl) => {
                const key = `layer-${lvl}`
                const def = defaults[key]
                if (def) {
                  apply(() => JSON.parse(JSON.stringify(def)))
                }
              })
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
          >
            Revert
          </button>
        </div>
      </div>
      {/* palette picker portal component */}
      <PaletteSwatchPicker onSelect={() => { /* no-op; we use global open */ }} />
    </div>
  )
}

function PaletteColorControl({ label, getCurrentCssVar, onPick }: { label: string; getCurrentCssVar: () => string; onPick: (paletteKey: string, level: string, hex: string) => void }) {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  return (
    <div className="control-group">
      <label>{label}</label>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { const el = btnRef.current; if (el) (window as any).openPalettePicker(el) }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
      >
        <span aria-hidden style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)', background: getCurrentCssVar() }} />
        <span style={{ textTransform: 'capitalize' }}>{label}</span>
      </button>
      <PaletteSwatchPicker onSelect={({ paletteKey, level }) => {
        // derive hex for AA calc
        const fam = (() => {
          const f = localStorage.getItem(`palette-grid-family:${paletteKey}`)
          if (f) try { return JSON.parse(f || 'null') } catch {}
          if (paletteKey === 'neutral') return 'gray'
          if (paletteKey === 'palette-1') return 'salmon'
          if (paletteKey === 'palette-2') return 'mandarin'
          if (paletteKey === 'palette-3') return 'cornflower'
          if (paletteKey === 'palette-4') return 'greensheen'
          return undefined
        })()
        let hex = ''
        try {
          const tokens: any = (window as any).rfTokens || {}
          const colors: any = tokens?.tokens?.color || {}
          hex = String(colors?.[fam || '']?.[level]?.$value || '')
        } catch {}
        onPick(paletteKey, level, hex)
      }} />
    </div>
  )
}


