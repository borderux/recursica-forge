import { Badge } from '../../components/adapters/Badge'

interface BadgePreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "primary-color" }
  selectedLayer: string // e.g., "layer-0"
}

export default function BadgePreview({
  selectedVariants,
  selectedLayer,
}: BadgePreviewProps) {
  const colorVariant = (selectedVariants.color || 'primary-color') as 'primary-color' | 'warning' | 'success' | 'alert'
  const sizeVariant = selectedVariants.size as 'small' | 'default' | 'large' | undefined

  // Show only the selected color variant
  const getVariantLabel = (variant: string) => {
    if (variant === 'primary-color') return 'New'
    return variant.charAt(0).toUpperCase() + variant.slice(1)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--recursica-brand-dimensions-spacer-md)',
      flexWrap: 'wrap',
      padding: 24,
    }}>
      <Badge
        variant={colorVariant}
        size={sizeVariant}
        layer={selectedLayer as any}
      >
        {getVariantLabel(colorVariant)}
      </Badge>
    </div>
  )
}

