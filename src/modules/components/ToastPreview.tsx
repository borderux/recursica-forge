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

  // Get toast button color for each variant
  const defaultToastButtonColorVar = null // Default variant doesn't have a button color
  const successToastButtonColorVar = useMemo(() => {
    return getComponentCssVar('Toast', 'color', 'success-button', actualLayer)
  }, [actualLayer])
  const errorToastButtonColorVar = useMemo(() => {
    return getComponentCssVar('Toast', 'color', 'error-button', actualLayer)
  }, [actualLayer])
  
  // For the bottom toast that changes with variant selection
  const toastButtonColorVar = useMemo(() => {
    if (colorVariant === 'success' || colorVariant === 'error') {
      return getComponentCssVar('Toast', 'color', `${colorVariant}-button`, actualLayer)
    }
    return null
  }, [colorVariant, actualLayer])

  // Icon components for all variants
  const InfoIcon = iconNameToReactComponent('info')
  const CheckIcon = iconNameToReactComponent('check')
  const XIcon = iconNameToReactComponent('x-mark')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      width: '100%',
      maxWidth: 600,
    }}>
      {/* Default variant toast */}
      <Toast
        variant="default"
        layer={actualLayer}
        elevation={componentElevation}
        icon={InfoIcon ? <InfoIcon /> : <span>ℹ</span>}
        action={
          <Button
            variant="text"
            size="small"
            layer={actualLayer}
            onClick={() => {}}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
            } as React.CSSProperties}
          >
            Action
          </Button>
        }
        onClose={() => {}}
      >
        Default toast message
      </Toast>

      {/* Success variant toast */}
      <Toast
        variant="success"
        layer={actualLayer}
        elevation={componentElevation}
        icon={CheckIcon ? <CheckIcon /> : <span>✓</span>}
        action={
          <Button
            variant="text"
            size="small"
            layer={actualLayer}
            onClick={() => {}}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
              ...(successToastButtonColorVar
                ? {
                    color: `var(${successToastButtonColorVar})`,
                    '--button-color': `var(${successToastButtonColorVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            Action
          </Button>
        }
        onClose={() => {}}
      >
        Success toast message
      </Toast>

      {/* Error variant toast */}
      <Toast
        variant="error"
        layer={actualLayer}
        elevation={componentElevation}
        icon={XIcon ? <XIcon /> : <span>✕</span>}
        action={
          <Button
            variant="text"
            size="small"
            layer={actualLayer}
            onClick={() => {}}
            style={{
              backgroundColor: 'transparent',
              '--button-bg': 'transparent',
              ...(errorToastButtonColorVar
                ? {
                    color: `var(${errorToastButtonColorVar})`,
                    '--button-color': `var(${errorToastButtonColorVar})`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            Action
          </Button>
        }
        onClose={() => {}}
      >
        Error toast message
      </Toast>

      {/* Toast with action button */}
      <Toast
        variant={colorVariant}
        layer={actualLayer}
        elevation={componentElevation}
        icon={colorVariant === 'success' ? (CheckIcon ? <CheckIcon /> : <span>✓</span>) : colorVariant === 'error' ? (XIcon ? <XIcon /> : <span>✕</span>) : colorVariant === 'default' ? (InfoIcon ? <InfoIcon /> : <span>ℹ</span>) : undefined}
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
        Toast with action button
      </Toast>
    </div>
  )
}
