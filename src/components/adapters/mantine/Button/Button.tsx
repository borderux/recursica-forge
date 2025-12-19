/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Button.css'

export default function Button({
  children,
  variant = 'solid',
  size = 'default',
  layer = 'layer-0',
  elevation,
  disabled,
  onClick,
  type,
  className,
  style,
  icon,
  mantine,
  ...props
}: AdapterButtonProps) {
  const { mode } = useThemeMode()
  
  // Map unified variant to Mantine variant
  const mantineVariant = variant === 'solid' ? 'filled' : variant === 'outline' ? 'outline' : 'subtle'
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : size === 'default' ? 'md' : 'lg'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
  const buttonHoverVar = getComponentCssVar('Button', 'color', `${variant}-background-hover`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  
  // Get the correct CSS variable reference for button color (used for text and border)
  const buttonColorRef = `var(${buttonColorVar})`
  
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
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
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
    // Use Mantine's native leftSection prop - CSS will handle sizing and spacing
    leftSection: icon && !isIconOnly ? icon : undefined,
    // Use Mantine's styles prop to override leftSection margin-inline-end and disabled state
    styles: {
      root: {
        // Ensure button root uses flex layout for all buttons with content
        // Use space-around to center content when button is wider than content
        ...(children || icon ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        } : {}),
        // Override disabled state to keep colors unchanged, only apply opacity
        ...(disabled && {
          backgroundColor: `var(${buttonBgVar}) !important`,
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
        // CSS file handles marginInlineEnd override
        flexShrink: 0, // Prevent icon from shrinking when content is truncated
      } : undefined,
      label: children ? {
        // CSS file handles truncation styles - only set line-height here for vertical centering
        lineHeight: `var(${heightVar})`, // Match button height for vertical centering
      } : undefined,
      ...mantine?.styles,
    },
    style: {
      // Use CSS variables for theming
      // getComponentCssVar returns CSS variable names, so wrap in var() for standard layers
      // Read the actual background color value - if it's transparent, set it directly to override library defaults
      ...(() => {
        const bgColorValue = readCssVar(buttonBgVar)
        if (bgColorValue === 'transparent') {
          return { 
            backgroundColor: 'transparent',
            '--button-bg': 'transparent'
          }
        }
        return { '--button-bg': `var(${buttonBgVar})` }
      })(),
      '--button-hover': `var(${buttonHoverVar})`,
      // Set button color without fallback to Mantine colors
      '--button-color': buttonColorRef,
      // Set icon-text-gap CSS variable for CSS file override
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      // Set icon size CSS variable for CSS file override
      // Always set it, even for icon-only buttons, so CSS can use it
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Set content max width CSS variable for CSS file override
      '--button-max-width': `var(${maxWidthVar})`,
      // For outline buttons, override Mantine's border color CSS variable
      // Mantine uses: calc(0.0625rem * var(--mantine-scale)) solid var(--mantine-color-blue-outline)
      // We override to use our recursica CSS var
      ...(variant === 'outline' && buttonBorderColor ? {
        '--button-bd': `calc(0.0625rem * var(--mantine-scale, 1)) solid ${buttonBorderColor}`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        '--button-bd': 'none',
      } : {}),
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
      // For icon-only buttons, ensure flex centering with space-around
      ...(isIconOnly && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }),
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled)`,
      }),
      minWidth: `var(${minWidthVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Apply elevation if set
      ...(() => {
        if (elevation && elevation !== 'elevation-0') {
          const elevationMatch = elevation.match(/elevation-(\d+)/)
          if (elevationMatch) {
            const elevationLevel = elevationMatch[1]
            return {
              boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
            }
          }
        }
        return {}
      })(),
      // Don't apply maxWidth to root - it will be applied to label element only
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  // For icon-only buttons, render icon as children - CSS will handle centering
  return <MantineButton {...mantineProps}>{isIconOnly ? icon : children}</MantineButton>
}

