import { useMemo } from 'react'
import { Chip } from '../../components/adapters/Chip'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from './iconUtils'

interface ChipPreviewProps {
  selectedVariants: Record<string, string> // e.g., { style: "unselected", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  activeState?: string // active interaction-state tab (base/error)
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ChipPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  activeState = 'base',
  componentElevation,
}: ChipPreviewProps) {
  const { mode } = useThemeMode()

  // Selection comes from the `selection-states` axis; the Error interaction-state tab promotes the
  // chip to its error/error-selected colour set. Chips have no disabled state — a non-interactive
  // chip is simply a default chip.
  const sel = (selectedVariants['selection-states'] || 'unselected') as 'selected' | 'unselected'
  const isError = activeState === 'error'
  const styleVariant = (isError
    ? (sel === 'selected' ? 'error-selected' : 'error')
    : sel) as 'unselected' | 'selected' | 'error' | 'error-selected'

  // Determine the actual layer to use
  const actualLayer = useMemo(() => {
    if (selectedAltLayer) {
      return `layer-alternative-${selectedAltLayer}` as any
    }
    return selectedLayer as any
  }, [selectedAltLayer, selectedLayer])

  const DiamondIcon = iconNameToReactComponent('diamond')
  const SparkleIcon = iconNameToReactComponent('sparkle')
  const ShieldIcon = iconNameToReactComponent('shield')
  const LightningIcon = iconNameToReactComponent('lightning')

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Default chip */}
      <Chip
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
      >
        Obsidian
      </Chip>

      {/* Deletable chip */}
      <Chip
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
        deletable
        onDelete={() => { }}
      >
        Moonstone
      </Chip>

      {/* Chip with icon */}
      <Chip
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={ShieldIcon ? <ShieldIcon /> : undefined}
      >
        Dragon Scale
      </Chip>

      {/* Chip with icon and deletable */}
      <Chip
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={LightningIcon ? <LightningIcon /> : undefined}
        deletable
        onDelete={() => { }}
      >
        Mithril Wire
      </Chip>
    </div>
  )
}
