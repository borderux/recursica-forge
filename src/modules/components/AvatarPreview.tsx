import { useMemo } from 'react'
import { Avatar } from '../../components/adapters/Avatar'

interface AvatarPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "ghost", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function AvatarPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: AvatarPreviewProps) {
  // Combine style variants if both are selected
  // Primary style: text, icon, image
  // Secondary style: solid, ghost (only for text and icon)
  const primaryStyle = selectedVariants.style || 'text'
  const secondaryStyle = selectedVariants['style-secondary'] || 'ghost'
  
  // Build combined variant string
  let colorVariant: string
  if (primaryStyle === 'image') {
    colorVariant = 'image'
  } else {
    colorVariant = `${primaryStyle}-${secondaryStyle}`
  }
  const sizeVariant = selectedVariants.size || 'default'

  // Use the selected layer
  const actualLayer = selectedLayer as any

  // If variant is an icon variant and no fallback is provided, the Avatar component
  // will automatically use the "user" icon from Phosphor
  // If variant is "image", the Avatar component will automatically use the placeholder image
  const fallback = colorVariant?.startsWith('icon') || colorVariant === 'image' ? undefined : 'AB'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Avatar
        colorVariant={colorVariant as any}
        sizeVariant={sizeVariant as 'small' | 'default' | 'large'}
        layer={actualLayer}
        elevation={componentElevation}
        shape="circle"
        fallback={fallback}
      />
    </div>
  )
}

