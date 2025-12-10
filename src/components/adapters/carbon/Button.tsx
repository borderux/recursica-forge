/**
 * Carbon Button Implementation
 * 
 * Carbon-specific Button component that uses CSS variables for theming.
 */

import { Button as CarbonButton } from '@carbon/react'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar } from '../../utils/cssVarNames'

export default function Button({
  children,
  variant = 'solid',
  size = 'default',
  layer = 'layer-0',
  disabled,
  onClick,
  type,
  className,
  style,
  icon,
  carbon,
  ...props
}: AdapterButtonProps) {
  // Map unified variant to Carbon kind
  const carbonKind = variant === 'solid' ? 'primary' : variant === 'outline' ? 'secondary' : 'tertiary'
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  // For alternative layers, use the layer's own CSS variables
  // For standard layers, use UIKit.json button CSS variables
  const isAlternativeLayer = layer.startsWith('layer-alternative-')
  let buttonBgVar: string
  let buttonColorVar: string
  
  if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-light-layer-layer-alternative-${altKey}-property`
    buttonBgVar = variant === 'solid' 
      ? `${layerBase}-element-interactive-tone`
      : `${layerBase}-surface`
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    buttonColorVar = variant === 'solid'
      ? `${layerBase}-element-interactive-on-tone`
      : `${layerBase}-element-interactive-tone`
  } else {
    // Use UIKit.json button colors for standard layers - use getComponentCssVar for correct variable names
    buttonBgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
    buttonColorVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  }
  
  // Get icon size and gap CSS variables
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  const iconPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-padding`, undefined)
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
  // Render icon with proper sizing using UIKit.json CSS variables
  const iconElement = icon ? (
    <span style={{
      display: 'inline-flex',
      width: `var(${iconSizeVar})`,
      height: `var(${iconSizeVar})`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginRight: children ? `var(${iconGapVar})` : 0,
    }}>
      {icon}
    </span>
  ) : undefined
  
  // Merge library-specific props
  const carbonProps = {
    kind: carbonKind,
    size: carbonSize,
    disabled,
    onClick,
    type,
    className,
    style: {
      // Use CSS variables for theming - supports both standard and alternative layers
      // getComponentCssVar returns just the variable name, so wrap in var()
      '--cds-button-primary': isAlternativeLayer ? `var(${buttonBgVar})` : `var(${buttonBgVar})`,
      '--cds-button-text-primary': isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar})`,
      fontSize: `var(--recursica-ui-kit-components-button-size-font-size)`,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      height: `var(--recursica-ui-kit-components-button-size-${sizePrefix}-height)`,
      minWidth: `var(--recursica-ui-kit-components-button-size-${sizePrefix}-min-width)`,
      paddingLeft: isIconOnly ? `var(${iconPaddingVar})` : `var(${horizontalPaddingVar})`,
      paddingRight: isIconOnly ? `var(${iconPaddingVar})` : `var(${horizontalPaddingVar})`,
      borderRadius: `var(--recursica-ui-kit-components-button-size-border-radius)`,
      // For icon-only buttons, ensure flex centering
      ...(isIconOnly && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      // Override Carbon's default disabled styles to keep colors unchanged
      ...(disabled && {
        opacity: 'var(--recursica-brand-light-state-disabled)',
        backgroundColor: isAlternativeLayer ? `var(${buttonBgVar})` : `var(${buttonBgVar}) !important`,
        color: isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar}) !important`,
        ...(variant === 'outline' && {
          borderColor: isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
      ...style,
    },
    ...carbon,
    ...props,
  }
  
  return (
    <CarbonButton {...carbonProps}>
      {iconElement}
      {children}
    </CarbonButton>
  )
}

