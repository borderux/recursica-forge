import '../theme/index.css'
import LayerModule from './LayerModule'
import LayerStylePanel from './LayerStylePanel'
import { useState, useEffect } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'

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
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property-element`
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="section">
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
            fontSize: 'var(--recursica-brand-typography-h1-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
            color: `var(${layer0Base}-text-color)`,
          }}>Layers</h1>
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

