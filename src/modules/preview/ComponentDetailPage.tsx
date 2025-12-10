import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ComponentCssVarsPanel from './ComponentCssVarsPanel'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { getComponentSections } from './componentSections'

type LayerOption = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3' | 'layer-alternative-high-contrast' | 'layer-alternative-primary-color' | 'layer-alternative-alert' | 'layer-alternative-warning' | 'layer-alternative-success'

// Sort layers: standard layers 0-3 first, then alternative layers
function sortLayers(layers: LayerOption[]): LayerOption[] {
  const standardLayers: LayerOption[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
  const alternativeLayers: LayerOption[] = [
    'layer-alternative-high-contrast',
    'layer-alternative-primary-color',
    'layer-alternative-alert',
    'layer-alternative-warning',
    'layer-alternative-success'
  ]
  
  const sorted: LayerOption[] = []
  
  // Add standard layers in order
  for (const layer of standardLayers) {
    if (layers.includes(layer)) {
      sorted.push(layer)
    }
  }
  
  // Add alternative layers in order
  for (const layer of alternativeLayers) {
    if (layers.includes(layer)) {
      sorted.push(layer)
    }
  }
  
  return sorted
}

// Layer section component - renders a single layer's content with that layer's styling
const LayerSection = ({ layer, children }: { layer: LayerOption; children: React.ReactNode }) => {
  const { theme } = useVars()
  const { mode } = useThemeMode()
  const isAlternativeLayer = layer.startsWith('layer-alternative-')
  const layerBase = isAlternativeLayer
    ? `--recursica-brand-${mode}-layer-layer-alternative-${layer.replace('layer-alternative-', '')}-property`
    : `--recursica-brand-${mode}-layer-${layer}-property`
  
  // For layer-0, no border; for other layers, use border-color
  const hasBorder = !isAlternativeLayer && layer !== 'layer-0'
  
  // Get elevation level from layer spec
  const elevationLevel = useMemo(() => {
    if (isAlternativeLayer) {
      // Alternative layers typically don't have elevation, use elevation-0
      return '0'
    }
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root
      const layerId = layer.replace('layer-', '')
      const layerSpec: any = themes?.[mode]?.layers?.[layer] || themes?.[mode]?.layer?.[layer] || root?.[mode]?.layers?.[layer] || root?.[mode]?.layer?.[layer] || {}
      const v: any = layerSpec?.property?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations\.(elevation-(\d+))/i)
        if (m) return m[2]
      }
    } catch {}
    // Default to layer number if elevation not found
    return layer.replace('layer-', '')
  }, [theme, layer, isAlternativeLayer, mode])
  
  // Construct box-shadow CSS variable using elevation
  const boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, var(--recursica-tokens-color-gray-1000))`
  
  const layerLabel = layer.startsWith('layer-alternative-') 
    ? layer.replace('layer-alternative-', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : layer.replace('layer-', 'Layer ')
  
  return (
    <div style={{ 
      background: `var(${layerBase}-surface)`, 
      border: hasBorder ? `1px solid var(${layerBase}-border-color)` : undefined,
      borderRadius: hasBorder ? `var(${layerBase}-border-radius, 8px)` : 8,
      padding: `var(${layerBase}-padding, 12px)`,
      boxShadow: boxShadow
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontFamily: 'var(--recursica-brand-typography-h4-font-family)',
        fontSize: 'var(--recursica-brand-typography-h4-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h4-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h4-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h4-line-height)',
        color: `var(${layerBase}-element-text-color)` 
      }}>{layerLabel}</h4>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </div>
  )
}

// Component section - renders a component with header and all layer groups
const ComponentSection = ({ title, url, children, onEditCssVars, selectedLayers }: { title: string; url: string; children: (selectedLayers: Set<LayerOption>) => React.ReactNode; onEditCssVars: () => void; selectedLayers: Set<LayerOption> }) => {
  const { mode } = useThemeMode()
  const layers = sortLayers(Array.from(selectedLayers))
  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  
  return (
    <section style={{ 
      background: `var(${layer0Base}-surface)`, 
      border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
      borderRadius: 8, 
      padding: 16,
      display: 'grid',
      gap: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ 
            margin: 0, 
            fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
            fontSize: 'var(--recursica-brand-typography-h2-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
            color: `var(${layer0Base}-element-text-color)` 
          }}>{title}</h2>
          <button
            onClick={onEditCssVars}
            aria-label="Edit CSS Variables"
            style={{
              fontSize: 14,
              color: `var(${layer0Base}-element-interactive-color)`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, textDecoration: 'none', color: `var(${layer0Base}-element-interactive-color)` }}>Docs →</a>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {layers.map((layer) => (
          <LayerSection key={layer} layer={layer}>
            {children(new Set([layer]))}
          </LayerSection>
        ))}
      </div>
    </section>
  )
}

export default function ComponentDetailPage() {
  const { componentName } = useParams<{ componentName: string }>()
  const [editingComponent, setEditingComponent] = useState<string | null>(null)
  const { mode } = useThemeMode()

  // Close panel when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setEditingComponent(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [selectedLayers, setSelectedLayers] = useState<Set<LayerOption>>(new Set(['layer-0']))
  
  // Get component sections
  const sections = useMemo(() => getComponentSections(mode), [mode])
  
  // Find the component by name
  const component = useMemo(() => {
    if (!componentName) return null
    const decodedName = decodeURIComponent(componentName)
    return sections.find(s => s.name === decodedName)
  }, [componentName, sections, mode])

  const allLayers: LayerOption[] = [
    'layer-0',
    'layer-1',
    'layer-2',
    'layer-3',
    'layer-alternative-high-contrast',
    'layer-alternative-primary-color',
    'layer-alternative-alert',
    'layer-alternative-warning',
    'layer-alternative-success',
  ]

  const toggleLayer = (layer: LayerOption) => {
    setSelectedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) {
        next.delete(layer)
        // Ensure at least one layer is selected
        if (next.size === 0) {
          next.add('layer-0')
        }
      } else {
        next.add(layer)
      }
      return next
    })
  }

  if (!component) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: `var(--recursica-brand-${mode}-layer-layer-0-element-text-low-emphasis)` }}>
        Component not found
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto', padding: 'var(--recursica-brand-dimensions-spacer-xl)' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ 
          padding: 16, 
          background: `var(--recursica-brand-${mode}-layer-layer-0-property-surface)`, 
          border: `1px solid var(--recursica-brand-${mode}-layer-layer-1-property-border-color)`, 
          borderRadius: 8,
          display: 'grid',
          gap: 12
        }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Select Layers</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Standard Layers</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['layer-0', 'layer-1', 'layer-2', 'layer-3'].map((layer) => (
                  <label key={layer} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedLayers.has(layer as LayerOption)}
                      onChange={() => toggleLayer(layer as LayerOption)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13 }}>{layer.replace('layer-', 'Layer ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Alternative Layers</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['layer-alternative-high-contrast', 'layer-alternative-primary-color', 'layer-alternative-alert', 'layer-alternative-warning', 'layer-alternative-success'].map((layer) => {
                  const label = layer.replace('layer-alternative-', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <label key={layer} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedLayers.has(layer as LayerOption)}
                        onChange={() => toggleLayer(layer as LayerOption)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13 }}>{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ComponentSection
        title={component.name}
        url={component.url}
        onEditCssVars={() => setEditingComponent(component.name)}
        selectedLayers={selectedLayers}
      >
        {component.render}
      </ComponentSection>
      <ComponentCssVarsPanel
        open={editingComponent !== null}
        componentName={editingComponent || ''}
        onClose={() => setEditingComponent(null)}
      />
    </div>
  )
}
