import { useMemo } from 'react'
import { Toast } from '../../components/adapters/Toast'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from './iconUtils'

interface ToastPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer: string | null // e.g., "high-contrast" or null
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ToastPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  componentElevation,
}: ToastPreviewProps) {
  // Use 'style' instead of 'color' to match the new toolbar structure
  const styleVariant = (selectedVariants.style || 'default') as 'default' | 'success' | 'error'

  // Determine the actual layer to use
  const actualLayer = useMemo(() => {
    if (selectedAltLayer) {
      return `layer-alternative-${selectedAltLayer}` as any
    }
    return selectedLayer as any
  }, [selectedAltLayer, selectedLayer])

  // Icon components for success and error variants
  const CheckIcon = iconNameToReactComponent('check')
  const XIcon = iconNameToReactComponent('x-mark')

  // Show only the selected variant (primary variant)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      width: '100%',
      maxWidth: 600,
      alignItems: 'center',
      padding: 24,
    }}>
      <Toast
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={styleVariant === 'success' ? (CheckIcon ? <CheckIcon /> : <span>✓</span>) : styleVariant === 'error' ? (XIcon ? <XIcon /> : <span>✕</span>) : undefined}
        onClose={styleVariant === 'success' || styleVariant === 'error' ? () => { } : undefined}
      >
        {styleVariant === 'default' ? 'The goblin forge is heating up — new runes detected in the chamber.' :
          styleVariant === 'success' ? 'Enchantment applied to the forge hammer successfully!' :
            'The rune inscription failed — the obsidian shard was impure.'}
      </Toast>
      <Toast
        variant={styleVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={styleVariant === 'success' ? (CheckIcon ? <CheckIcon /> : <span>✓</span>) : styleVariant === 'error' ? (XIcon ? <XIcon /> : <span>✕</span>) : undefined}
        onClose={styleVariant === 'success' || styleVariant === 'error' ? () => { } : undefined}
        action={
          <Button
            variant="text"
            size="small"
            layer={actualLayer}
            onClick={() => { }}
          >
            Undo
          </Button>
        }
      >
        {styleVariant === 'default' ? 'The goblin council has approved your request to enter the deep mines.' :
          styleVariant === 'success' ? 'Mithril ore successfully smelted into three ingots.' :
            'Crystal shard shattered during extraction — salvage recommended.'}
      </Toast>
    </div>
  )
}
