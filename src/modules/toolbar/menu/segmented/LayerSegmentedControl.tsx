import { iconNameToReactComponent } from '../../../components/iconUtils'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import './LayerSegmentedControl.css'

interface LayerSegmentedControlProps {
  selected: string
  onSelect: (layer: string) => void
  className?: string
}

export default function LayerSegmentedControl({ selected, onSelect, className = '' }: LayerSegmentedControlProps) {
  const { mode } = useThemeMode()
  const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
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
          border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-color)`,
          borderRadius: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-border-radius)`,
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
                  ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`
                  : 'transparent',
                color: isSelected
                  ? `var(--recursica-brand-themes-${mode}-layer-layer-1-property-element-text-color)`
                  : `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
                fontWeight: isSelected ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface-hover)`
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

