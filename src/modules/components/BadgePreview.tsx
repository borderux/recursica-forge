import { Badge } from '../../components/adapters/Badge'

interface BadgePreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "primary-color" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function BadgePreview({
  selectedVariants,
  selectedLayer,
}: BadgePreviewProps) {
  // Use 'style' instead of 'color' to match the new toolbar structure
  const styleVariant = (selectedVariants.style || 'primary-color') as 'primary-color' | 'warning' | 'success' | 'alert'

  // Show only the selected style variant (primary variant)
  const getVariantLabel = (variant: string) => {
    if (variant === 'primary-color') return 'New'
    return variant.charAt(0).toUpperCase() + variant.slice(1)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--recursica-brand-dimensions-spacers-md)',
      flexWrap: 'wrap',
      padding: 24,
    }}>
      <Badge
        variant={styleVariant}
        layer={selectedLayer as any}
      >
        {getVariantLabel(styleVariant)}
      </Badge>
      <Badge
        variant={styleVariant}
        layer={selectedLayer as any}
      >
        99
      </Badge>
    </div>
  )
}

