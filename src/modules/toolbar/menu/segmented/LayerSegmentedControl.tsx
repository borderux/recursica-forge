import { iconNameToReactComponent } from '../../../components/iconUtils'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { useVars } from '../../../vars/VarsContext'
import { useMemo } from 'react'
import './LayerSegmentedControl.css'

interface LayerSegmentedControlProps {
  selected: string
  onSelect: (layer: string) => void
  className?: string
}

export default function LayerSegmentedControl({ selected, onSelect, className = '' }: LayerSegmentedControlProps) {
  const { mode } = useThemeMode()
  const { theme } = useVars()
  
  // Dynamically get all available layers from theme
  const layers = useMemo(() => {
    const t: any = theme
    const themeRoot: any = (t as any)?.brand ? (t as any) : ({ brand: t } as any)
    const themes = themeRoot?.themes || themeRoot
    const layersData: any = themes?.[mode]?.layers || themes?.[mode]?.layer || {}
    const layerKeys = Object.keys(layersData).filter(key => /^layer-\d+$/.test(key)).sort((a, b) => {
      const aNum = parseInt(a.replace('layer-', ''), 10)
      const bNum = parseInt(b.replace('layer-', ''), 10)
      return aNum - bNum
    })
    return layerKeys.length > 0 ? layerKeys : ['layer-0', 'layer-1', 'layer-2', 'layer-3'] // Fallback for initial load
  }, [theme, mode])
  
  const LayerIcon = iconNameToReactComponent('square-3-stack-3d')

  const getSelectedIndex = () => {
    const index = layers.indexOf(selected)
    return index >= 0 ? index : 0
  }

  return (
    <div className={`layer-segmented-control ${className}`}>
      {LayerIcon && <LayerIcon className="layer-segmented-control-icon" />}
      <span className="layer-segmented-control-label">Layer</span>
      <div 
        className="layer-segmented-control-buttons"
        style={{
          border: `1px solid var(--recursica_brand_layer_0_properties_border-color)`,
          borderRadius: `var(--recursica_brand_layer_0_properties_border-radius)`,
        }}
      >
        {layers.map((layer, index) => {
          const isSelected = selected === layer
          const layerNumber = index.toString()
          return (
            <button
              key={layer}
              className={`layer-segmented-control-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(layer)}
              style={{
                background: isSelected 
                  ? `var(--recursica_brand_layer_1_properties_surface)`
                  : 'transparent',
                color: isSelected
                  ? `var(--recursica_brand_layer_1_elements_text-color)`
                  : `var(--recursica_brand_layer_0_elements_text-color)`,
                fontWeight: isSelected ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = `var(--recursica_brand_layer_0_properties_surface-hover)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {layerNumber}
            </button>
          )
        })}
      </div>
    </div>
  )
}

