import { Badge } from '../../components/adapters/Badge'

interface BadgePreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "primary-color" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function BadgePreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  componentElevation,
}: BadgePreviewProps) {
  const colorVariant = (selectedVariants.color || 'primary-color') as 'primary-color' | 'warning' | 'success' | 'alert'
  const sizeVariant = (selectedVariants.size || 'large') as 'small' | 'large'
  
  // Determine the actual layer to use
  const actualLayer = selectedAltLayer
    ? (`layer-alternative-${selectedAltLayer}` as any)
    : (selectedLayer as any)

  // Format variant name for display
  const getVariantLabel = (variant: string): string => {
    if (variant === 'primary-color') return 'Primary'
    return variant.charAt(0).toUpperCase() + variant.slice(1)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--recursica-brand-dimensions-spacer-md)',
      flexWrap: 'wrap',
      paddingLeft: 24,
      paddingRight: 24,
    }}>
      {/* Badge with variant name */}
      <Badge
        variant={colorVariant}
        size={sizeVariant}
        layer={actualLayer}
        elevation={componentElevation}
      >
        {getVariantLabel(colorVariant)}
      </Badge>
      
      {/* Badge with numeric value */}
      <Badge
        variant={colorVariant}
        size={sizeVariant}
        layer={actualLayer}
        elevation={componentElevation}
      >
        10
      </Badge>
    </div>
  )
}

