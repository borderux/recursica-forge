import { useMemo } from 'react'
import { Chip } from '../../components/adapters/Chip'
import { useThemeMode } from '../theme/ThemeModeContext'

interface ChipPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "unselected", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ChipPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  componentElevation,
}: ChipPreviewProps) {
  const { mode } = useThemeMode()

  const colorVariant = selectedVariants.color || 'unselected'
  const sizeVariant = selectedVariants.size || 'default'

  // Determine the actual layer to use
  const actualLayer = useMemo(() => {
    if (selectedAltLayer) {
      return `layer-alternative-${selectedAltLayer}` as any
    }
    return selectedLayer as any
  }, [selectedAltLayer, selectedLayer])

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Default chip */}
      <Chip
        variant={colorVariant as 'unselected' | 'selected'}
        size={sizeVariant as 'default' | 'small'}
        layer={actualLayer}
        elevation={componentElevation}
      >
        Default Chip
      </Chip>
      
      {/* Deletable chip */}
      <Chip
        variant={colorVariant as 'unselected' | 'selected'}
        size={sizeVariant as 'default' | 'small'}
        layer={actualLayer}
        elevation={componentElevation}
        deletable
        onDelete={() => {}}
      >
        Deletable
      </Chip>
      
      {/* Chip with icon */}
      <Chip
        variant={colorVariant as 'unselected' | 'selected'}
        size={sizeVariant as 'default' | 'small'}
        layer={actualLayer}
        elevation={componentElevation}
        icon={
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
          </svg>
        }
      >
        With Icon
      </Chip>
      
      {/* Disabled chip */}
      <Chip
        variant={colorVariant as 'unselected' | 'selected'}
        size={sizeVariant as 'default' | 'small'}
        layer={actualLayer}
        elevation={componentElevation}
        disabled
      >
        Disabled
      </Chip>
    </div>
  )
}

