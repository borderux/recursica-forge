import '../theme/index.css'
import LayerModule from './LayerModule'
import LayerStylePanel from './LayerStylePanel'
import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'
import brandDefault from '../../../recursica_brand.json'
import { iconNameToReactComponent } from '../components/iconUtils'
import { getVarsStore } from '../../core/store/varsStore'
import { genericLayerText } from '../../core/css/cssVarBuilder'

export default function LayersPage() {
  const { theme, setTheme } = useVars()
  const { mode } = useThemeMode()
  const [selectedLayerLevels, setSelectedLayerLevels] = useState<Set<number>>(() => new Set())

  // Close panels when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setSelectedLayerLevels(new Set())
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const handleResetAll = () => {
    const root: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
    const themes = root?.themes || root
    const defaults: any = themes?.[mode]?.layers || themes?.[mode]?.layer || root?.[mode]?.layers || root?.[mode]?.layer || {}

    // Get all available layer keys dynamically
    const allLayerKeys = Object.keys(defaults).filter(key => /^layer-\d+$/.test(key))
    const allLayers = allLayerKeys.map(key => {
      const match = /^layer-(\d+)$/.exec(key)
      return match ? parseInt(match[1], 10) : null
    }).filter((lvl): lvl is number => lvl !== null).sort((a, b) => a - b)

    // Clear CSS variables for all layers so they regenerate from theme defaults
    const rootEl = document.documentElement
    allLayers.forEach((lvl) => {
      const surfaceVar = `--recursica_brand_layer_${lvl}_properties_surface`
      const borderVar = `--recursica_brand_layer_${lvl}_properties_border-color`
      const textColorVar = `--recursica_brand_layer_${lvl}_elements_text-color`
      const paddingVar = `--recursica_brand_layer_${lvl}_properties_padding`
      const borderRadiusVar = `--recursica_brand_layer_${lvl}_properties_border-radius`
      const borderThicknessVar = `--recursica_brand_layer_${lvl}_properties_border-size`
      const elevationVar = `--recursica_brand_layer_${lvl}_properties_elevation`

      rootEl.style.removeProperty(surfaceVar)
      rootEl.style.removeProperty(textColorVar)
      rootEl.style.removeProperty(paddingVar)
      rootEl.style.removeProperty(borderRadiusVar)
      rootEl.style.removeProperty(borderThicknessVar)
      rootEl.style.removeProperty(elevationVar)
      if (lvl > 0) {
        rootEl.style.removeProperty(borderVar)
      }
    })

    // Update theme JSON with defaults for all layers
    const t: any = theme
    const themeRoot: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
    const nextTheme = getVarsStore().getLatestThemeCopy()
    const target = nextTheme.brand || nextTheme
    const container = target?.themes?.[mode]?.layers || target?.themes?.[mode]?.layer || target?.[mode]?.layers || target?.[mode]?.layer

    if (!container) {
      if (!target.themes) target.themes = {}
      if (!target.themes[mode]) target.themes[mode] = {}
      if (!target.themes[mode].layers) target.themes[mode].layers = {}
      const newContainer = target.themes[mode].layers
      allLayers.forEach((lvl) => {
        const key = `layer-${lvl}`
        const def = defaults[key]
        if (def) {
          newContainer[key] = JSON.parse(JSON.stringify(def))
        }
      })
    } else {
      allLayers.forEach((lvl) => {
        const key = `layer-${lvl}`
        const def = defaults[key]
        if (def) {
          container[key] = JSON.parse(JSON.stringify(def))
        }
      })
    }

    setTheme(nextTheme)
  }

  // Dynamically get all available layers from theme
  const layerModules = useMemo(() => {
    // Try to get layers from current theme, fallback to brandDefault if theme not loaded
    const sourceTheme: any = theme || brandDefault
    // Theme structure is always { brand: { themes: { light: { layers: {...} }, dark: { layers: {...} } } } }
    const brand = sourceTheme?.brand || sourceTheme
    const themes = brand?.themes || {}
    const layersData: any = themes?.[mode]?.layers || themes?.[mode]?.layer || {}

    const layerKeys = Object.keys(layersData).filter(key => /^layer-\d+$/.test(key)).sort((a, b) => {
      const aNum = parseInt(a.replace('layer-', ''), 10)
      const bNum = parseInt(b.replace('layer-', ''), 10)
      return aNum - bNum
    })

    if (layerKeys.length === 0) {
      return null
    }

    // Build nested LayerModule components dynamically
    const buildLayerModules = (keys: string[], index: number): React.ReactElement | null => {
      if (index >= keys.length) return null
      const key = keys[index]
      const level = parseInt(key.replace('layer-', ''), 10)
      const title = level === 0 ? `Layer ${level} (Background)` : `Layer ${level}`
      const child = buildLayerModules(keys, index + 1)

      return (
        <LayerModule
          key={key}
          level={level}
          title={title}
          onSelect={() => { setSelectedLayerLevels(new Set([level])) }}
          isSelected={selectedLayerLevels.has(level)}
        >
          {child}
        </LayerModule>
      )
    }

    return buildLayerModules(layerKeys, 0)
  }, [theme, mode, selectedLayerLevels])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica_brand_layer_0_properties_surface)`, color: `var(--recursica_brand_layer_0_elements_text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica_brand_dimensions_general_xl)' }}>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
              fontSize: 'var(--recursica_brand_typography_h1-font-size)',
              fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
              letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
              lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
              color: `var(${genericLayerText(0, 'color')})`,
            }}>Layers</h1>
            <Button
              variant="outline"
              size="small"
              onClick={handleResetAll}
              icon={(() => {
                const ResetIcon = iconNameToReactComponent('arrow-path')
                return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
              })()}
              layer="layer-1"
            >
              Reset all
            </Button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {layerModules}
          </div>
        </div>
        {selectedLayerLevels.size > 0 && (
          <LayerStylePanel
            open={selectedLayerLevels.size > 0}
            selectedLevels={Array.from(selectedLayerLevels).sort((a, b) => a - b)}
            theme={theme}
            onClose={() => setSelectedLayerLevels(new Set())}
            onUpdate={(updater) => {
              const t: any = theme
              const root: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
              const nextTheme = getVarsStore().getLatestThemeCopy()
              const target = nextTheme.brand || nextTheme
              // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
              const themes = target?.themes || target
              const container = themes?.[mode]?.layers || themes?.[mode]?.layer || target?.[mode]?.layers || target?.[mode]?.layer
              if (!container) {
                // Create the structure if it doesn't exist
                if (!themes[mode]) themes[mode] = {}
                if (!themes[mode].layers) themes[mode].layers = {}
                const newContainer = themes[mode].layers
                Array.from(selectedLayerLevels).forEach((lvl) => {
                  const key = `layer-${lvl}`
                  if (!newContainer[key]) newContainer[key] = {}
                  newContainer[key] = updater(newContainer[key] || {})
                })
              } else {
                Array.from(selectedLayerLevels).forEach((lvl) => {
                  const key = `layer-${lvl}`
                  if (!container[key]) container[key] = {}
                  container[key] = updater(container[key] || {})
                })
              }
              setTheme(nextTheme)
            }}
          />
        )}
      </div>
    </div>
  )
}

