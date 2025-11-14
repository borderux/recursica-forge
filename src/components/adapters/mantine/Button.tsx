/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterButtonProps) {
  // Map unified variant to Mantine variant
  const mantineVariant = variant === 'solid' ? 'filled' : variant === 'outline' ? 'outline' : 'subtle'
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : size === 'default' ? 'md' : 'lg'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  // For alternative layers, use the layer's own CSS variables
  // For standard layers, use UIKit.json button CSS variables
  const isAlternativeLayer = layer.startsWith('layer-alternative-')
  let buttonBgVar: string
  let buttonHoverVar: string
  let buttonColorVar: string
  
  if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-light-layer-layer-alternative-${altKey}-property`
    buttonBgVar = variant === 'solid' 
      ? `var(${layerBase}-element-interactive-tone)`
      : `var(${layerBase}-surface)`
    buttonHoverVar = variant === 'solid'
      ? `var(${layerBase}-element-interactive-tone-hover)`
      : `var(${layerBase}-surface)`
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    buttonColorVar = variant === 'solid'
      ? `var(${layerBase}-element-interactive-on-tone)`
      : `var(${layerBase}-element-interactive-tone)`
  } else {
    // Use UIKit.json button colors for standard layers - use getComponentCssVar for correct variable names
    buttonBgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
    buttonHoverVar = getComponentCssVar('Button', 'color', `${variant}-background-hover`, layer)
    buttonColorVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  }
  
  // Get the correct CSS variable reference for button color (used for text and border)
  const buttonColorRef = isAlternativeLayer ? buttonColorVar : `var(${buttonColorVar})`
  
  // For outline buttons, set the border color using the outline-text CSS var
  // Mantine uses --button-bd for border, which has format: calc(0.0625rem * var(--mantine-scale)) solid <color>
  const buttonBorderColor = variant === 'outline' 
    ? buttonColorRef 
    : undefined
  
  // Get icon size and gap CSS variables
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  
  // Render icon with proper sizing using UIKit.json CSS variables
  const iconElement = icon ? (
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
  ) : undefined
  
  // Merge library-specific props
  const mantineProps = {
    variant: mantineVariant,
    size: mantineSize,
    disabled,
    onClick,
    type,
    className,
    leftSection: iconElement,
    // Use Mantine's styles prop to override leftSection margin-inline-end and disabled state
    styles: {
      leftSection: icon ? {
        marginInlineEnd: `var(${iconGapVar})`,
      } : undefined,
      // Override disabled state to keep colors unchanged, only apply opacity
      root: disabled ? {
        backgroundColor: isAlternativeLayer ? buttonBgVar : `var(${buttonBgVar}) !important`,
        color: `${buttonColorRef} !important`,
        ...(variant === 'outline' && buttonBorderColor && {
          borderColor: `${buttonBorderColor} !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      } : undefined,
      ...mantine?.styles,
    },
    style: {
      // Use CSS variables for theming - supports both standard and alternative layers
      '--button-bg': isAlternativeLayer ? buttonBgVar : `var(${buttonBgVar})`,
      '--button-hover': isAlternativeLayer ? buttonHoverVar : `var(${buttonHoverVar})`,
      // Set button color without fallback to Mantine colors
      '--button-color': buttonColorRef,
      // For outline buttons, override Mantine's border color CSS variable
      // Mantine uses: calc(0.0625rem * var(--mantine-scale)) solid var(--mantine-color-blue-outline)
      // We override to use our recursica CSS var
      ...(buttonBorderColor && {
        '--button-bd': `calc(0.0625rem * var(--mantine-scale, 1)) solid ${buttonBorderColor}`,
      }),
      '--button-height': `var(--recursica-ui-kit-components-button-size-${sizePrefix}-height)`,
      '--button-min-width': `var(--recursica-ui-kit-components-button-size-${sizePrefix}-min-width)`,
      '--button-padding': `var(--recursica-ui-kit-components-button-size-${sizePrefix}-horizontal-padding)`,
      '--button-padding-x': `var(--recursica-ui-kit-components-button-size-${sizePrefix}-horizontal-padding)`,
      '--button-border-radius': `var(--recursica-ui-kit-components-button-size-border-radius)`,
      '--button-font-size': `var(--recursica-ui-kit-components-button-size-font-size)`,
      '--button-fz': `var(--recursica-ui-kit-components-button-size-font-size)`,
      '--button-font-weight': 'var(--recursica-brand-typography-button-font-weight)',
      // Directly set color to override Mantine's fallback (var(--button-color, var(--mantine-color-white)))
      color: buttonColorRef,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      ...(disabled && {
        opacity: 'var(--recursica-brand-light-state-disabled)',
      }),
      minWidth: `var(--recursica-ui-kit-components-button-size-${sizePrefix}-min-width)`,
      borderRadius: `var(--recursica-ui-kit-components-button-size-border-radius)`,
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  return <MantineButton {...mantineProps}>{children}</MantineButton>
}

