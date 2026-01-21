/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getBrandTypographyCssVar, getBrandStateCssVar, getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { useCssVar } from '../../../hooks/useCssVar'
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
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${variant}-background`, layer)
  const buttonHoverVar = getComponentCssVar('Button', 'colors', `${variant}-background-hover`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${variant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'colors', layer, 'border')
  
  // Get the correct CSS variable reference for button color (used for text and border)
  const buttonColorRef = `var(${buttonColorVar})`
  const buttonBorderColorRef = buttonBorderColorVar ? `var(${buttonBorderColorVar})` : buttonColorRef
  
  // For solid and outline buttons, set the border color using the border CSS var
  // Mantine uses --button-bd for border, which has format: calc(0.0625rem * var(--mantine-scale)) solid <color>
  const buttonBorderColor = (variant === 'solid' || variant === 'outline')
    ? buttonBorderColorRef 
    : undefined
  
  // Get icon size and gap CSS variables
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
  
  // Get all typography properties from the typography style
  const fontFamilyVar = getBrandTypographyCssVar('button', 'font-family')
  const fontSizeVar = getBrandTypographyCssVar('button', 'font-size')
  const fontWeightVar = getBrandTypographyCssVar('button', 'font-weight')
  const letterSpacingVar = getBrandTypographyCssVar('button', 'font-letter-spacing')
  const lineHeightVar = getBrandTypographyCssVar('button', 'line-height')
  
  // Get border-size CSS variable (variant-specific property)
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  
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
          ...((variant === 'solid' || variant === 'outline') && buttonBorderColor && {
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
      // Set button border color CSS variable for CSS file override
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColorRef ? {
        '--button-border-color': buttonBorderColorRef,
      } : {}),
      // Set icon-text-gap CSS variable for CSS file override
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      // Set icon size CSS variable for CSS file override
      // Always set it, even for icon-only buttons, so CSS can use it
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Set content max width CSS variable for CSS file override
      '--button-max-width': `var(${maxWidthVar})`,
      // Use actual CSS border instead of box-shadow
      // Mantine uses --button-bd CSS variable for border
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColor ? {
        '--button-bd': `${borderSizeValue || '1px'} solid ${buttonBorderColor}`,
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
      '--button-font-family': `var(${fontFamilyVar})`,
      '--button-font-size': `var(${fontSizeVar})`,
      '--button-fz': `var(${fontSizeVar})`,
      '--button-font-weight': `var(${fontWeightVar})`,
      '--button-letter-spacing': `var(${letterSpacingVar})`,
      '--button-line-height': `var(${lineHeightVar})`,
      // Directly set color to override Mantine's fallback (var(--button-color, var(--mantine-color-white)))
      color: buttonColorRef,
      fontFamily: `var(${fontFamilyVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${fontWeightVar})`,
      letterSpacing: `var(${letterSpacingVar})`,
      lineHeight: `var(${lineHeightVar})`,
      // For icon-only buttons, ensure flex centering with space-around
      ...(isIconOnly && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }),
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      ...(disabled && {
        opacity: `var(${getBrandStateCssVar(mode, 'disabled')})`,
      }),
      minWidth: `var(${minWidthVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Apply elevation if set
      // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        if (elevationBoxShadow) {
          return { boxShadow: elevationBoxShadow }
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

