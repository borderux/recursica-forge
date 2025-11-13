import React, { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import TokenSlider from '../forms/TokenSlider'
import brandDefault from '../../vars/Brand.json'

type Json = any

function toTitleCase(str: string): string {
  return str.replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

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
      const core: any = light?.['core']?.['$value'] || light?.['core'] || {}
      Object.keys(core || {}).forEach((name) => {
        out.push({ label: `core/${name}`, value: `{brand.light.palettes.core.${name}}` })
      })
      const neutral: any = light?.neutral || {}
      Object.keys(neutral || {}).forEach((lvl) => {
        if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `neutral/${lvl}`, value: `{brand.light.palettes.neutral.${lvl}.color.tone}` })
      })
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
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])
  const isOnlyLayer0 = selectedLevels.length === 1 && selectedLevels[0] === 0
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
  const renderPaletteButton = (target: 'surface' | 'border-color', title: string) => {
    // Build CSS variables for all selected layers
    const targetCssVars = selectedLevels.map(level => 
      `--recursica-brand-light-layer-layer-${level}-property-${target}`
    )
    const targetCssVar = targetCssVars[0] || `--recursica-brand-light-layer-layer-${layerKey}-property-${target}`
    
    return (
      <PaletteColorControl
        label={title}
        targetCssVar={targetCssVar}
        targetCssVars={targetCssVars.length > 1 ? targetCssVars : undefined}
        currentValueCssVar={targetCssVar}
        swatchSize={14}
        fontSize={13}
      />
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
        {/* Palette color pickers: Surface (all layers, including 0) and Border Color (non-0 layers) */}
        {renderPaletteButton('surface', 'Surface Color')}
        {!isOnlyLayer0 && renderPaletteButton('border-color', 'Border Color')}
        {!isOnlyLayer0 && (
          <TokenSlider
            label="Elevation"
            tokens={elevationOptions.map((o) => ({ name: o.name, label: o.label }))}
            currentToken={(() => {
              const v = (spec as any)?.property?.elevation?.$value
              const s = typeof v === 'string' ? v : ''
              const m = s.match(/elevations\.(elevation-\d+)/)
              return m ? m[1] : undefined
            })()}
            onChange={(tokenName) => {
              updateValue(['property','elevation'], `{brand.light.elevations.${tokenName}}`)
            }}
            getTokenLabel={(token) => {
              const opt = elevationOptions.find((o) => o.name === token.name)
              return opt?.label || token.label || token.name
            }}
          />
        )}
        <TokenSlider
          label="Padding"
          tokens={sizeOptions.map((o) => ({ name: o.label, label: o.label }))}
          currentToken={(() => {
            const v = (spec as any)?.property?.padding?.$value
            const s = typeof v === 'string' ? v : ''
            const m = s.match(/\{tokens\.size\.([^}]+)\}/)
            return m ? m[1] : undefined
          })()}
          onChange={(tokenName) => {
            const sel = sizeOptions.find((o) => o.label === tokenName)
            if (sel) updateValue(['property','padding'], sel.value)
          }}
          getTokenLabel={(token) => toTitleCase(token.name)}
        />
        {!isOnlyLayer0 && (
          <TokenSlider
            label="Border Radius"
            tokens={sizeOptions.map((o) => ({ name: o.label, label: o.label }))}
            currentToken={(() => {
              const v = (spec as any)?.property?.['border-radius']?.$value
              const s = typeof v === 'string' ? v : ''
              const m = s.match(/\{tokens\.size\.([^}]+)\}/)
              return m ? m[1] : undefined
            })()}
            onChange={(tokenName) => {
              const sel = sizeOptions.find((o) => o.label === tokenName)
              if (sel) updateValue(['property','border-radius'], sel.value)
            }}
            getTokenLabel={(token) => toTitleCase(token.name)}
          />
        )}
        {!isOnlyLayer0 && (
          <div className="control-group">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Border Thickness</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {(() => {
                    const v = (spec as any)?.property?.['border-thickness']?.$value
                    return typeof v === 'number' ? `${v}px` : '0px'
                  })()}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={(() => {
                  const v = (spec as any)?.property?.['border-thickness']?.$value
                  return typeof v === 'number' ? v : 0
                })()}
                onChange={(e) => {
                  const n = parseInt(e.currentTarget.value || '0', 10)
                  updateValue(['property','border-thickness'], String(Number.isFinite(n) ? n : 0))
                }}
              />
            </label>
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => {
              const defaults: any = (brandDefault as any)?.brand?.light?.layer || {}
              onUpdate((layerSpec: any) => {
                return layerSpec
              })
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
    </div>
  )
}

