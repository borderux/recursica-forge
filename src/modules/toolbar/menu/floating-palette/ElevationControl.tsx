import TokenSlider from '../../../forms/TokenSlider'
import FloatingPalette from './FloatingPalette'

export interface ElevationOption {
  name: string
  label: string
}

export interface ElevationControlProps {
  anchorElement: HTMLElement | null
  elevationOptions: ElevationOption[]
  currentElevation: string
  onElevationChange: (elevation: string) => void
  onClose: () => void
}

export default function ElevationControl({
  anchorElement,
  elevationOptions,
  currentElevation,
  onElevationChange,
  onClose,
}: ElevationControlProps) {
  if (!anchorElement) {
    return null
  }

  return (
    <FloatingPalette
      anchorElement={anchorElement}
      title="Elevation"
      onClose={onClose}
    >
      <TokenSlider
        label="Elevation"
        tokens={elevationOptions.map(opt => ({ name: opt.name, label: opt.label }))}
        currentToken={currentElevation}
        onChange={onElevationChange}
        getTokenLabel={(token) => {
          const opt = elevationOptions.find((o) => o.name === token.name)
          return opt?.label || token.label || token.name
        }}
      />
    </FloatingPalette>
  )
}

