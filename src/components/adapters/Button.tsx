/**
 * Button Component Adapter
 * 
 * Unified Button component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar } from '../utils/cssVarNames'
import { readCssVar } from '../hooks/useCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

// Import registry types
import type { ComponentName } from '../registry/types'

export type ButtonProps = {
  children?: React.ReactNode
  variant?: 'solid' | 'outline' | 'text'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Button({
  children,
  variant = 'solid',
  size = 'default',
  layer = 'layer-0',
  disabled = false,
  onClick,
  type = 'button',
  className,
  style,
  mantine,
  material,
  carbon,
}: ButtonProps) {
  const Component = useComponent('Button')
  
  if (!Component) {
    // Fallback to native button if component not available
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        style={{
          ...getButtonStyles(variant, size, layer),
          ...style,
        }}
      >
        {children}
      </button>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapButtonProps({
    variant,
    size,
    layer,
    disabled,
    onClick,
    type,
    className,
    style,
    mantine,
    material,
    carbon,
  })
  
  return (
    <Suspense fallback={<button disabled>Loading...</button>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function getButtonStyles(
  variant: 'solid' | 'outline' | 'text',
  size: 'default' | 'small',
  layer: ComponentLayer
): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // Get CSS variables for button
  const bgVar = getComponentCssVar('Button', 'color', 'background-solid', layer)
  const bgHoverVar = getComponentCssVar('Button', 'color', 'background-solid-hover', layer)
  const textVar = getComponentCssVar('Button', 'color', 'text-solid', layer)
  const outlineVar = getComponentCssVar('Button', 'color', 'outline', layer)
  const outlineHoverVar = getComponentCssVar('Button', 'color', 'outline-hover', layer)
  const disabledVar = getComponentCssVar('Button', 'color', 'disabled', layer)
  
  const heightVar = getComponentCssVar('Button', 'size', 'height', undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', 'min-width', undefined)
  const paddingVar = getComponentCssVar('Button', 'size', 'horizontal-padding', undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  
  // Size-specific vars - UIKit.json structure: size.default.height, size.small.height
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const sizeHeightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const sizeMinWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const sizePaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  
  // Read CSS variables
  const backgroundColor = readCssVar(bgVar)
  const textColor = readCssVar(textVar)
  const borderColor = readCssVar(outlineVar)
  const height = readCssVar(sizeHeightVar || heightVar, size === 'small' ? '32px' : '48px')
  const minWidth = readCssVar(sizeMinWidthVar || minWidthVar, size === 'small' ? '32px' : '48px')
  const padding = readCssVar(sizePaddingVar || paddingVar, '12px')
  const borderRadius = readCssVar(borderRadiusVar, '8px')
  const disabledOpacity = readCssVar(disabledVar, '0.5')
  
  // Apply variant styles
  if (variant === 'solid') {
    styles.backgroundColor = backgroundColor || 'var(--recursica-ui-kit-components-button-color-layer-0-background-solid)'
    styles.color = textColor || 'var(--recursica-ui-kit-components-button-color-layer-0-text-solid)'
    styles.border = 'none'
  } else if (variant === 'outline') {
    styles.backgroundColor = 'transparent'
    styles.color = borderColor || 'var(--recursica-ui-kit-components-button-color-layer-0-outline)'
    styles.border = `1px solid ${borderColor || 'var(--recursica-ui-kit-components-button-color-layer-0-outline)'}`
  } else {
    styles.backgroundColor = 'transparent'
    styles.color = borderColor || 'var(--recursica-ui-kit-components-button-color-layer-0-outline)'
    styles.border = 'none'
  }
  
  // Apply size styles
  styles.height = height
  styles.minWidth = minWidth
  styles.paddingLeft = padding
  styles.paddingRight = padding
  styles.borderRadius = borderRadius
  
  // Apply disabled styles
  if (disabled) {
    styles.opacity = disabledOpacity
    styles.cursor = 'not-allowed'
  } else {
    styles.cursor = 'pointer'
  }
  
  return styles
}

function mapButtonProps(props: ButtonProps): any {
  const { variant, size, layer, mantine, material, carbon, ...rest } = props
  
  // Base props that work across libraries
  const baseProps: any = {
    ...rest,
    disabled: props.disabled,
  }
  
  // Library-specific prop mapping
  // This will be handled by the individual library adapters
  // For now, we'll pass through the library-specific props
  
  return {
    ...baseProps,
    // Mantine-specific
    ...(mantine && { mantine }),
    // Material-specific
    ...(material && { material }),
    // Carbon-specific
    ...(carbon && { carbon }),
  }
}

