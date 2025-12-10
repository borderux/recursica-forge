/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar } from '../../utils/cssVarNames'
import './Button.css'

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
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const fontSizeVar = getComponentCssVar('Button', 'size', 'font-size', undefined)
  const contentMaxWidthVar = getComponentCssVar('Button', 'size', 'content-max-width', undefined)
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
  // Render icon with proper sizing using UIKit.json CSS variables
  // Set marginInlineEnd directly on the icon element to override Mantine's default spacing
  const iconElement = icon ? (
    <span 
      className="recursica-button-icon"
      data-icon-gap-var={iconGapVar}
      style={{
        display: 'inline-flex',
        width: `var(${iconSizeVar})`,
        height: `var(${iconSizeVar})`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginInlineEnd: children ? `var(${iconGapVar})` : 0,
      }}
    >
      <span style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </span>
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
    // Add custom class names for CSS targeting
    classNames: {
      leftSection: 'recursica-button-left-section',
      ...mantine?.classNames,
    },
    // For icon-only buttons, don't use leftSection - render icon as children for better centering
    leftSection: isIconOnly ? undefined : iconElement,
    // Use Mantine's styles prop to override leftSection margin-inline-end and disabled state
    styles: {
      root: {
        ...(isIconOnly && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }),
        // Override disabled state to keep colors unchanged, only apply opacity
        ...(disabled && {
          backgroundColor: isAlternativeLayer ? buttonBgVar : `var(${buttonBgVar}) !important`,
          color: `${buttonColorRef} !important`,
          ...(variant === 'outline' && buttonBorderColor && {
            borderColor: `${buttonBorderColor} !important`,
          }),
          ...(variant === 'text' && {
            border: 'none !important',
          }),
        }),
      },
      leftSection: icon && children ? {
        // marginInlineEnd is overridden via CSS file with !important to override Mantine defaults
        // Also set via styles prop as backup
        marginInlineEnd: `var(${iconGapVar})`,
        flexShrink: 0, // Prevent icon from shrinking when content is truncated
      } : undefined,
      ...mantine?.styles,
    },
    style: {
      // Use CSS variables for theming - supports both standard and alternative layers
      // getComponentCssVar returns CSS variable names, so wrap in var() for standard layers
      '--button-bg': isAlternativeLayer ? buttonBgVar : `var(${buttonBgVar})`,
      '--button-hover': isAlternativeLayer ? buttonHoverVar : `var(${buttonHoverVar})`,
      // Set button color without fallback to Mantine colors
      '--button-color': buttonColorRef,
      // Set icon-text-gap CSS variable for CSS file override
      '--button-icon-text-gap': `var(${iconGapVar})`,
      // For outline buttons, override Mantine's border color CSS variable
      // Mantine uses: calc(0.0625rem * var(--mantine-scale)) solid var(--mantine-color-blue-outline)
      // We override to use our recursica CSS var
      ...(buttonBorderColor && {
        '--button-bd': `calc(0.0625rem * var(--mantine-scale, 1)) solid ${buttonBorderColor}`,
      }),
      '--button-height': `var(${heightVar})`,
      '--button-min-width': `var(${minWidthVar})`,
      '--button-padding': `var(${horizontalPaddingVar})`,
      '--button-padding-x': `var(${horizontalPaddingVar})`,
      '--button-border-radius': `var(${borderRadiusVar})`,
      '--button-font-size': `var(${fontSizeVar})`,
      '--button-fz': `var(${fontSizeVar})`,
      '--button-font-weight': 'var(--recursica-brand-typography-button-font-weight)',
      // Directly set color to override Mantine's fallback (var(--button-color, var(--mantine-color-white)))
      color: buttonColorRef,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      // For icon-only buttons, ensure flex centering
      ...(isIconOnly && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      ...(disabled && {
        opacity: 'var(--recursica-brand-light-state-disabled)',
      }),
      minWidth: `var(${minWidthVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Content max width with text truncation
      maxWidth: `var(${contentMaxWidthVar})`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  // For icon-only buttons, render icon as children for proper centering
  return <MantineButton {...mantineProps}>{isIconOnly ? iconElement : children}</MantineButton>
}

