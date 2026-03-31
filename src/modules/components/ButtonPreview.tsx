import { Button } from '../../components/adapters/Button'
import { getComponentCssVar, buildComponentCssVarPath } from '../../components/utils/cssVarNames'
import { iconNameToReactComponent } from './iconUtils'
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

  // Content variant horizontal padding CSS vars (cross-variant: content × size)
  const labelPaddingVar = buildComponentCssVarPath(
    'Button', 'variants', 'content', 'label', 'sizes', sizePrefix, 'properties', 'horizontal-padding'
  )
  const iconOnlyPaddingVar = buildComponentCssVarPath(
    'Button', 'variants', 'content', 'icon-only', 'sizes', sizePrefix, 'properties', 'horizontal-padding'
  )

  // Style overrides for each content mode
  const labelPaddingStyle: React.CSSProperties = {
    paddingLeft: `var(${labelPaddingVar})`,
    paddingRight: `var(${labelPaddingVar})`,
  }
  const iconOnlyPaddingStyle: React.CSSProperties = {
    paddingLeft: `var(${iconOnlyPaddingVar})`,
    paddingRight: `var(${iconOnlyPaddingVar})`,
  }

  // Phosphor icon elements
  const SwordIcon = iconNameToReactComponent('sword')
  const HammerIcon = iconNameToReactComponent('hammer')
  const leadingIcon = SwordIcon ? <SwordIcon /> : undefined
  const trailingIconElement = HammerIcon ? <HammerIcon /> : undefined

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
        {trailingIconElement}
      </span>
    </span>
  )

  const contentVariant = selectedVariants.content || 'label'

  return (
    <div className="button-preview">
      <div className="button-preview-row">
        {contentVariant === 'icon-only' ? (
          <>
            {/* Icon-only button */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              icon={leadingIcon}
              style={iconOnlyPaddingStyle}
            />

            {/* Disabled icon-only button */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              icon={leadingIcon}
              disabled
              style={iconOnlyPaddingStyle}
            />
          </>
        ) : (
          <>
            {/* Button with text */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              style={labelPaddingStyle}
            >
              Enter Forge
            </Button>

            {/* Button with icon on left */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              icon={leadingIcon}
              style={labelPaddingStyle}
            >
              Draw Sword
            </Button>

            {/* Button with icon on right */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              material={{
                endIcon: trailingIconElement
              }}
              mantine={{
                rightSection: trailingIconElement
              }}
              style={{
                ...labelPaddingStyle,
                '--button-icon-text-gap': `var(${iconGapVar})`,
                '--button-icon-size': `var(${iconSizeVar})`,
              } as React.CSSProperties}
            >
              Forge Hammer
              {rightIconElement}
            </Button>

            {/* Disabled button */}
            <Button
              variant={styleVariant as any}
              size={sizeVariant as any}
              layer={actualLayer}
              elevation={componentElevation}
              disabled
              style={labelPaddingStyle}
            >
              Sealed Gate
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
