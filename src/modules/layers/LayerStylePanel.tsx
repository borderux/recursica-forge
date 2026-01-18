import React, { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import TokenSlider from '../forms/TokenSlider'
import BrandSpacerSlider from '../toolbar/utils/BrandSpacerSlider'
import BrandBorderRadiusSlider from '../toolbar/utils/BrandBorderRadiusSlider'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar as updateCssVarFn } from '../../core/css/updateCssVar'
import brandDefault from '../../vars/Brand.json'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'

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
  const { mode } = useThemeMode()
  const layerKey = useMemo(() => (selectedLevels.length ? `layer-${selectedLevels[0]}` : ''), [selectedLevels])
  const spec = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
      const themes = root?.themes || root
      // For regular layers
      return themes?.[mode]?.layers?.[layerKey] || themes?.[mode]?.layer?.[layerKey] || root?.[mode]?.layers?.[layerKey] || root?.[mode]?.layer?.[layerKey] || {}
    } catch {
      return {}
    }
  }, [theme, layerKey, mode])
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
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const light: any = themes?.light?.palettes || root?.light?.palettes || {}
      const core: any = light?.['core-colors']?.['$value'] || light?.['core-colors'] || light?.['core']?.['$value'] || light?.['core'] || {}
      Object.keys(core || {}).forEach((name) => {
        // Skip interactive since it has nested structure
        if (name === 'interactive' && typeof core[name] === 'object' && !core[name].$value) return
        out.push({ label: `core/${name}`, value: `{brand.themes.light.palettes.core-colors.${name}}` })
      })
      const neutral: any = light?.neutral || {}
      Object.keys(neutral || {}).forEach((lvl) => {
        if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `neutral/${lvl}`, value: `{brand.themes.light.palettes.neutral.${lvl}.color.tone}` })
      })
      ;['palette-1','palette-2'].forEach((pk) => {
        const group: any = light?.[pk] || {}
        Object.keys(group || {}).forEach((lvl) => {
          if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `${pk}/${lvl}`, value: `{brand.themes.light.palettes.${pk}.${lvl}.color.tone}` })
        })
        if (group?.default?.['$value']) out.push({ label: `${pk}/default`, value: `{brand.themes.light.palettes.${pk}.default.color.tone}` })
      })
    } catch {}
    return out
  }, [themeJson])
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
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
    
    // Build CSS variable name for this field
    const fieldCssVar = selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-${pathKey.replace(/\./g, '-')}`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-${pathKey.replace(/\./g, '-')}`
    
    // For element-text-color, check contrast against surface
    // For surface, check contrast against element-text-color
    let contrastColorCssVar: string | undefined
    // Check if this is element-text-color (pathKey might be "element.text.color" with dots)
    const isElementTextColor = pathKey.includes('element-text-color') || pathKey.includes('element.text.color')
    if (isColor && isElementTextColor) {
      const surfaceVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-surface`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-surface`
      contrastColorCssVar = surfaceVar
    } else if (isColor && (pathKey === 'surface' || pathKey.includes('surface'))) {
      const textColorVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-element-text-color`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-element-text-color`
      contrastColorCssVar = textColorVar
    }
    
    // For color fields, use PaletteColorControl instead of select
    if (isColor && !isSelect) {
      return (
        <PaletteColorControl
          label={label}
          targetCssVar={fieldCssVar}
          currentValueCssVar={fieldCssVar}
          swatchSize={14}
          fontSize={13}
          contrastColorCssVar={contrastColorCssVar}
        />
      )
    }
    
    return (
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        {isSelect ? (
          <select
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 6 }}
          >
            <option value="">-- select --</option>
            {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        ) : (
          <input
            type={(typeof val === 'number') ? 'number' : 'text'}
            value={val ?? ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 6 }}
          />
        )}
      </label>
    )
  }
  const renderPaletteButton = (target: 'surface' | 'border-color', title: string) => {
    // Build CSS variables for all selected layers
    const targetCssVar = selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-${target}`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-${target}`
    const targetCssVars = selectedLevels.map(level => 
        `--recursica-brand-themes-${mode}-layer-layer-${level}-property-${target}`
      )
    
    // For surface color, check contrast against element-text-color (the label text color)
    // For element-text-color, check contrast against surface
    let contrastColorCssVar: string | undefined
    if (target === 'surface') {
      const textColorVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-element-text-color`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-element-text-color`
      contrastColorCssVar = textColorVar
    }
    
    return (
      <PaletteColorControl
        label={title}
        targetCssVar={targetCssVar}
        targetCssVars={targetCssVars.length > 1 ? targetCssVars : undefined}
        currentValueCssVar={targetCssVar}
        swatchSize={14}
        fontSize={13}
        contrastColorCssVar={contrastColorCssVar}
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
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(260px, 34vw, 560px)', background: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-element-text-color)`, borderLeft: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-thickness) solid var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-color)`, borderRadius: `0 var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-radius) var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-radius) 0`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-3-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-shadow-color, rgba(0, 0, 0, 0.1))`, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 10000, padding: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-padding)`, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
        <button onClick={onClose} aria-label="Close" style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-color)`, background: 'transparent', cursor: 'pointer', borderRadius: 6, padding: '4px 8px' }}>&times;</button>
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
              const v = (spec as any)?.properties?.elevation?.$value
              const s = typeof v === 'string' ? v : ''
              // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
              const m = s.match(/elevations\.(elevation-\d+)/)
              return m ? m[1] : undefined
            })()}
            onChange={(tokenName) => {
              updateValue(['properties','elevation'], `{brand.themes.${mode}.elevations.${tokenName}}`)
            }}
            getTokenLabel={(token) => {
              const opt = elevationOptions.find((o) => o.name === token.name)
              return opt?.label || token.label || token.name
            }}
          />
        )}
        {(() => {
          const paddingCssVar = selectedLevels.length > 0
            ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-padding`
            : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-padding`
          
          // Listen for CSS variable updates and sync to theme JSON
          React.useEffect(() => {
            const handleCssVarUpdate = (e: CustomEvent) => {
              if (e.detail?.cssVars?.includes(paddingCssVar)) {
                const cssValue = readCssVar(paddingCssVar)
                if (cssValue && cssValue.trim().startsWith('var(')) {
                  // Extract spacer name from CSS var (e.g., "--recursica-brand-dimensions-spacers-sm" -> "sm")
                  const match = cssValue.match(/--recursica-brand-dimensions-spacers-([^)]+)/)
                  if (match) {
                    const spacerName = match[1]
                    // Convert to brand dimension token reference
                    const tokenRef = `{brand.dimensions.spacers.${spacerName}}`
                    onUpdate((layerSpec: any) => {
                      const next = JSON.parse(JSON.stringify(layerSpec || {}))
                      if (!next.properties) next.properties = {}
                      next.properties.padding = { $type: 'number', $value: tokenRef }
                      return next
                    })
                  }
                }
              }
            }
            window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
            return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
          }, [paddingCssVar, onUpdate])
          
          return (
            <BrandSpacerSlider
              targetCssVar={paddingCssVar}
              label="Padding"
            />
          )
        })()}
        {!isOnlyLayer0 && (() => {
          const borderRadiusCssVar = selectedLevels.length > 0
            ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-border-radius`
            : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-border-radius`
          
          // Listen for CSS variable updates and sync to theme JSON
          React.useEffect(() => {
            const handleCssVarUpdate = (e: CustomEvent) => {
              if (e.detail?.cssVars?.includes(borderRadiusCssVar)) {
                const cssValue = readCssVar(borderRadiusCssVar)
                if (cssValue && cssValue.trim().startsWith('var(')) {
                  // Extract border radius name from CSS var (e.g., "--recursica-brand-dimensions-border-radius-sm" -> "sm")
                  const match = cssValue.match(/--recursica-brand-dimensions-border-radius-([^)]+)/)
                  if (match) {
                    const radiusName = match[1]
                    // Convert to brand dimension token reference
                    const tokenRef = `{brand.dimensions.border-radius.${radiusName}}`
                    onUpdate((layerSpec: any) => {
                      const next = JSON.parse(JSON.stringify(layerSpec || {}))
                      if (!next.properties) next.properties = {}
                      next.properties['border-radius'] = { $type: 'number', $value: tokenRef }
                      return next
                    })
                  }
                }
              }
            }
            window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
            return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
          }, [borderRadiusCssVar, onUpdate])
          
          return (
            <BrandBorderRadiusSlider
              targetCssVar={borderRadiusCssVar}
              label="Border Radius"
            />
          )
        })()}
        {!isOnlyLayer0 && (() => {
          const borderThicknessCssVar = selectedLevels.length > 0
            ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-border-thickness`
            : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-border-thickness`
          
          const currentValue = (() => {
            const v = (spec as any)?.properties?.['border-thickness']?.$value
            return typeof v === 'number' ? v : 0
          })()
          
          // Listen for CSS variable updates and sync to theme JSON
          React.useEffect(() => {
            const handleCssVarUpdate = (e: CustomEvent) => {
              if (e.detail?.cssVars?.includes(borderThicknessCssVar)) {
                const cssValue = readCssVar(borderThicknessCssVar)
                if (cssValue) {
                  // Extract numeric value from CSS (e.g., "2px" -> 2)
                  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/)
                  if (match) {
                    const pxValue = parseFloat(match[1])
                    onUpdate((layerSpec: any) => {
                      const next = JSON.parse(JSON.stringify(layerSpec || {}))
                      if (!next.properties) next.properties = {}
                      next.properties['border-thickness'] = { $type: 'number', $value: pxValue }
                      return next
                    })
                  }
                }
              }
            }
            window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
            return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
          }, [borderThicknessCssVar, onUpdate])
          
          return (
            <Slider
              value={currentValue}
              onChange={(value) => {
                const numValue = typeof value === 'number' ? value : value[0]
                updateValue(['properties','border-thickness'], String(Number.isFinite(numValue) ? numValue : 0))
                // Also update CSS var directly
                updateCssVarFn(borderThicknessCssVar, `${numValue}px`, tokensJson)
              }}
              min={0}
              max={20}
              step={1}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={(val) => `${val}px`}
              label={<Label layer="layer-3" layout="stacked">Border Thickness</Label>}
            />
          )
        })()}
        <div>
          <Button
            variant="outline"
            onClick={() => {
              const root: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
              // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
              const themes = root?.themes || root
              
              // For regular layers
              const defaults: any = themes?.[mode]?.layers || themes?.[mode]?.layer || root?.[mode]?.layers || root?.[mode]?.layer || {}
              const levels = selectedLevels.slice()
              
              // Clear CSS variables for surface, border-color, and text-color so they regenerate from theme defaults
              // This is necessary because varsStore preserves existing CSS variables
              const rootEl = document.documentElement
              levels.forEach((lvl) => {
                const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-surface`
                const borderVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-border-color`
                const textColorVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-element-text-color`
                rootEl.style.removeProperty(surfaceVar)
                rootEl.style.removeProperty(textColorVar)
                if (lvl > 0) {
                  rootEl.style.removeProperty(borderVar)
                }
              })
              
              // Update theme JSON with defaults
              levels.forEach((lvl) => {
                const key = `layer-${lvl}`
                const def = defaults[key]
                if (def) {
                  onUpdate(() => JSON.parse(JSON.stringify(def)))
                }
              })
            }}
            layer="layer-2"
          >
            Revert
          </Button>
        </div>
      </div>
    </div>
  )
}

