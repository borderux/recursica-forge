import { Badge } from '../../components/adapters/Badge'

interface BadgePreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "primary-color" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function BadgePreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: BadgePreviewProps) {
  const colorVariant = selectedVariants.color || 'primary-color'

  // Show all variants in the preview
  const variants: Array<'primary-color' | 'warning' | 'success' | 'alert'> = [
    'primary-color',
    'warning',
    'success',
    'alert',
  ]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--recursica-brand-dimensions-spacer-md)',
      flexWrap: 'wrap',
      padding: 24,
    }}>
      {variants.map((variant) => (
        <Badge
          key={variant}
          variant={variant}
          layer={selectedLayer as any}
          elevation={componentElevation}
        >
          {variant === 'primary-color' ? 'New' : variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Badge>
      ))}
    </div>
  )
}

