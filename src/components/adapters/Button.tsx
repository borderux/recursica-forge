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
          ...getButtonStyles(variant, size, layer, disabled),
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
  layer: ComponentLayer,
  disabled: boolean
): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // New UIKit.json structure: color.layer-X.{variant}.{property}
  // Get CSS variables for button using variant in the path
  const bgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  
  const heightVar = getComponentCssVar('Button', 'size', 'height', undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', 'min-width', undefined)
  const paddingVar = getComponentCssVar('Button', 'size', 'horizontal-padding', undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const fontSizeVar = getComponentCssVar('Button', 'size', 'font-size', undefined)
  
  // Size-specific vars - UIKit.json structure: size.default.height, size.small.height
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const sizeHeightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const sizeMinWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const sizePaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  
  // Use CSS variable references directly instead of reading values
  // This allows dynamic updates and proper CSS variable resolution
  const heightVarName = sizeHeightVar || heightVar
  const minWidthVarName = sizeMinWidthVar || minWidthVar
  const paddingVarName = sizePaddingVar || paddingVar
  
  // Read CSS variables for colors (these may need fallbacks)
  const backgroundColor = readCssVar(bgVar)
  const textColor = readCssVar(textVar)
  
  // Apply variant styles
  if (variant === 'solid') {
    styles.backgroundColor = backgroundColor ? `var(${bgVar})` : `var(--recursica-ui-kit-components-button-color-${layer}-solid-background)`
    styles.color = textColor ? `var(${textVar})` : `var(--recursica-ui-kit-components-button-color-${layer}-solid-text)`
    styles.border = 'none'
  } else if (variant === 'outline') {
    styles.backgroundColor = backgroundColor ? `var(${bgVar})` : 'transparent'
    styles.color = textColor ? `var(${textVar})` : `var(--recursica-ui-kit-components-button-color-${layer}-outline-text)`
    // For outline, use text color as border color
    const borderColor = textColor ? `var(${textVar})` : `var(--recursica-ui-kit-components-button-color-${layer}-outline-text)`
    styles.border = `1px solid ${borderColor}`
  } else {
    // text variant
    styles.backgroundColor = backgroundColor ? `var(${bgVar})` : 'transparent'
    styles.color = textColor ? `var(${textVar})` : `var(--recursica-ui-kit-components-button-color-${layer}-text-text)`
    styles.border = 'none'
  }
  
  // Apply size styles using CSS variable references directly
  styles.height = heightVarName ? `var(${heightVarName})` : (size === 'small' ? '32px' : '48px')
  styles.minWidth = minWidthVarName ? `var(${minWidthVarName})` : (size === 'small' ? '32px' : '48px')
  styles.paddingLeft = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.paddingRight = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.borderRadius = borderRadiusVar ? `var(${borderRadiusVar})` : '8px'
  styles.fontSize = fontSizeVar ? `var(${fontSizeVar})` : undefined
  
  // Apply disabled styles
  if (disabled) {
    styles.opacity = '0.5'
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

