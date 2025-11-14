/**
 * Button Component Adapter
 * 
 * Unified Button component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar } from '../utils/cssVarNames'
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
  icon?: React.ReactNode
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
  icon,
  mantine,
  material,
  carbon,
}: ButtonProps) {
  const Component = useComponent('Button')
  
  if (!Component) {
    // Fallback to native button if component not available
    const sizePrefix = size === 'small' ? 'small' : 'default'
    const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
    const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
    
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        style={{
          ...getButtonStyles(variant, size, layer, disabled),
          display: 'flex',
          alignItems: 'center',
          gap: icon ? `var(${iconGapVar})` : 0,
          ...style,
        }}
      >
        {icon && (
          <span style={{
            display: 'inline-flex',
            width: `var(${iconSizeVar})`,
            height: `var(${iconSizeVar})`,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </span>
        )}
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
    icon,
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
  
  const isAlternativeLayer = layer.startsWith('layer-alternative-')
  
  // For alternative layers, use the layer's own colors directly since UIKit.json only defines layer-0 through layer-3
  // For standard layers, use UIKit.json button colors
  let bgVar: string
  let textVar: string
  
  if (isAlternativeLayer) {
    // Extract alternative key (e.g., "high-contrast" from "layer-alternative-high-contrast")
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-light-layer-layer-alternative-${altKey}-property`
    
    // Use alternative layer's interactive color and surface
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    if (variant === 'solid') {
      bgVar = `${layerBase}-element-interactive-tone`
      textVar = `${layerBase}-element-interactive-on-tone`
    } else {
      // outline and text variants use interactive-tone for text color
      bgVar = `${layerBase}-surface`
      textVar = `${layerBase}-element-interactive-tone`
    }
  } else {
    // Use UIKit.json button colors for standard layers
    bgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
    textVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  }
  
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
  
  // Apply variant styles - always use CSS variable references directly
  if (variant === 'solid') {
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    styles.border = 'none'
  } else if (variant === 'outline') {
    // For outline, use outline-specific CSS variables
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    // For outline, use text color as border color (which is the outline-text CSS var)
    styles.border = `1px solid var(${textVar})`
  } else {
    // text variant
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    styles.border = 'none'
  }
  
  // Apply size styles using CSS variable references directly
  styles.height = heightVarName ? `var(${heightVarName})` : (size === 'small' ? '32px' : '48px')
  styles.minWidth = minWidthVarName ? `var(${minWidthVarName})` : (size === 'small' ? '32px' : '48px')
  styles.paddingLeft = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.paddingRight = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.borderRadius = borderRadiusVar ? `var(${borderRadiusVar})` : '8px'
  styles.fontSize = fontSizeVar ? `var(${fontSizeVar})` : undefined
  styles.fontWeight = 'var(--recursica-brand-typography-button-font-weight)'
  
  // Apply disabled styles - use brand disabled opacity, don't change colors
  if (disabled) {
    styles.opacity = 'var(--recursica-brand-light-state-disabled)'
    styles.cursor = 'not-allowed'
  } else {
    styles.cursor = 'pointer'
  }
  
  return styles
}

function mapButtonProps(props: ButtonProps): any {
  const { mantine, material, carbon, ...rest } = props
  
  // Base props that work across libraries
  // Include variant, size, and layer so library adapters can use them
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

