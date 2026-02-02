import { Button } from '../../components/adapters/Button'
import { readCssVar } from '../../core/css/readCssVar'
import { getComponentCssVar } from '../../components/utils/cssVarNames'
import './ButtonPreview.css'

interface ButtonPreviewProps {
  selectedVariants: Record<string, string> // e.g., { color: "solid", size: "default" }
  selectedLayer: string // e.g., "layer-0"
  componentElevation?: string // e.g., "elevation-0", "elevation-1", etc.
}

export default function ButtonPreview({
  selectedVariants,
  selectedLayer,
  componentElevation,
}: ButtonPreviewProps) {
  // Use 'style' instead of 'color' to match the new toolbar structure
  const styleVariant = selectedVariants.style || 'solid'
  const sizeVariant = selectedVariants.size || 'default'

  // Use the selected layer
  const actualLayer = selectedLayer as any

  // Get icon size and gap CSS variables for proper sizing
  const sizePrefix = sizeVariant === 'small' ? 'small' : 'default'
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  

  // Icon SVG element
  const iconSvg = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  )

  // Icon element with proper container for left-side icons (used by Button component)
  const iconElement = iconSvg

  // Icon element with proper container for right-side icons
  const rightIconElement = (
    <span 
      className="recursica-button-trailing-icon"
      style={{
        display: 'inline-flex',
        width: `var(${iconSizeVar})`,
        height: `var(${iconSizeVar})`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginLeft: `var(${iconGapVar})`,
      }}>
      <span style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {iconSvg}
      </span>
    </span>
  )

  return (
    <div className="button-preview">
      <div className="button-preview-row">
        {/* Button with text */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
        >
          Button
        </Button>
        
        {/* Button with icon on left */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          icon={iconElement}
        >
          Button
        </Button>
        
        {/* Icon-only button */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          icon={iconElement}
        />
        
        {/* Button with icon on right */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          material={{
            endIcon: iconSvg
          }}
          mantine={{
            rightSection: iconSvg
          }}
        >
          Button
          {/* Only add rightIconElement for Carbon - Mantine uses rightSection prop, Material uses endIcon */}
          {rightIconElement}
        </Button>
        
        {/* Disabled button */}
        <Button
          variant={styleVariant as any}
          size={sizeVariant as any}
          layer={actualLayer}
          elevation={componentElevation}
          disabled
        >
          Button
        </Button>
      </div>
    </div>
  )
}
