import '../theme/index.css'
import LayerModule from './LayerModule'
import LayerStylePanel from './LayerStylePanel'
import { useState, useEffect } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'
import brandDefault from '../../vars/Brand.json'
import { iconNameToReactComponent } from '../components/iconUtils'

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
    
    // Clear CSS variables for all layers so they regenerate from theme defaults
    const rootEl = document.documentElement
    const allLayers = [0, 1, 2, 3]
    allLayers.forEach((lvl) => {
      const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-surface`
      const borderVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-border-color`
      const textColorVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-element-text-color`
      const paddingVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-padding`
      const borderRadiusVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-border-radius`
      const borderThicknessVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-border-thickness`
      const elevationVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-elevation`
      
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
    const nextTheme = JSON.parse(JSON.stringify(themeRoot))
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

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property-element`
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
              fontSize: 'var(--recursica-brand-typography-h1-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
              letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
              lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
              color: `var(${layer0Base}-text-color)`,
            }}>Layers</h1>
            <Button
              variant="outline"
              size="small"
              onClick={handleResetAll}
              icon={(() => {
                const ResetIcon = iconNameToReactComponent('arrow-path')
                return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
              })()}
              layer="layer-1"
            >
              Reset all
            </Button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <LayerModule level={0} title="Layer 0 (Background)" onSelect={() => { setSelectedLayerLevels(new Set([0])) }} isSelected={selectedLayerLevels.has(0)}>
              <LayerModule level={1} title="Layer 1" onSelect={() => { setSelectedLayerLevels(new Set([1])) }} isSelected={selectedLayerLevels.has(1)}>
                <LayerModule level={2} title="Layer 2" onSelect={() => { setSelectedLayerLevels(new Set([2])) }} isSelected={selectedLayerLevels.has(2)}>
                  <LayerModule level={3} title="Layer 3" onSelect={() => { setSelectedLayerLevels(new Set([3])) }} isSelected={selectedLayerLevels.has(3)} />
                </LayerModule>
              </LayerModule>
            </LayerModule>
          </div>
        </div>
        {selectedLayerLevels.size > 0 && (
          <LayerStylePanel
            open={selectedLayerLevels.size > 0}
            selectedLevels={Array.from(selectedLayerLevels).sort((a,b) => a-b)}
            theme={theme}
            onClose={() => setSelectedLayerLevels(new Set())}
            onUpdate={(updater) => {
              const t: any = theme
              const root: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
              const nextTheme = JSON.parse(JSON.stringify(root))
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

