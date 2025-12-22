import { useMemo } from 'react'
import { Toast } from '../../components/adapters/Toast'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from './iconUtils'
import { getComponentCssVar } from '../../components/utils/cssVarNames'

interface ToastPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "default" }
  selectedLayer: string // e.g., "layer-0"
  selectedAltLayer?: string | null // e.g., "high-contrast" or null (deprecated, no longer used)
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ToastPreview({
  selectedVariants,
  selectedLayer,
  selectedAltLayer,
  componentElevation,
}: ToastPreviewProps) {
  const colorVariant = (selectedVariants.color || 'default') as 'default' | 'success' | 'error'

  // Use selectedLayer directly (no alt-layer support)
  const actualLayer = selectedLayer as any

  // Get toast button color for the selected variant
  const toastButtonColorVar = useMemo(() => {
    if (colorVariant === 'success' || colorVariant === 'error') {
      return getComponentCssVar('Toast', 'color', `${colorVariant}-button`, actualLayer)
    }
    return null
  }, [colorVariant, actualLayer])

  // Icon components - select based on variant
  const InfoIcon = iconNameToReactComponent('info')
  const CheckIcon = iconNameToReactComponent('check')
  const XIcon = iconNameToReactComponent('x-mark')

  // Select icon based on variant
  const icon = colorVariant === 'success' 
    ? (CheckIcon ? <CheckIcon /> : <span>✓</span>)
    : colorVariant === 'error' 
    ? (XIcon ? <XIcon /> : <span>✕</span>)
    : (InfoIcon ? <InfoIcon /> : <span>ℹ</span>)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      width: '100%',
      maxWidth: 600,
    }}>
      <Toast
        variant={colorVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={icon}
        action={
          <Button
            variant="text"
            size="small"
            layer={actualLayer}
            onClick={() => {}}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
              ...(toastButtonColorVar
                ? {
                    color: `var(${toastButtonColorVar})`,
                    '--button-color': `var(${toastButtonColorVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            Action
          </Button>
        }
        onClose={() => {}}
      >
        {colorVariant === 'default' 
          ? 'Default toast message'
          : colorVariant === 'success'
          ? 'Success toast message'
          : 'Error toast message'}
      </Toast>
    </div>
  )
}
