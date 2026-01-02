/**
 * Material UI Button Implementation
 * 
 * Material UI-specific Button component that uses CSS variables for theming.
 */

import { Button as MaterialButton } from '@mui/material'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
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
  material,
  ...props
}: AdapterButtonProps) {
  const { mode } = useThemeMode()
  
  // Map unified variant to Material variant
  const materialVariant = variant === 'solid' ? 'contained' : variant === 'outline' ? 'outlined' : 'text'
  
  // Map unified size to Material size
  const materialSize = size === 'small' ? 'small' : 'medium'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${variant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${variant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'colors', layer, 'border')
  
  // Get icon size and gap CSS variables
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const fontSizeVar = getComponentCssVar('Button', 'size', 'font-size', undefined)
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
  
  // Get border-size CSS variable (variant-specific property)
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
  // Merge library-specific props
  const materialProps = {
    variant: materialVariant as 'contained' | 'outlined' | 'text',
    size: materialSize as 'small' | 'medium' | 'large',
    disabled,
    onClick,
    type,
    className,
    // Use Material's native startIcon prop - CSS will handle sizing and spacing
    startIcon: icon && !isIconOnly ? icon : undefined,
    sx: {
      // Use CSS variables for theming
      // Read the actual background color value - if it's transparent, set it directly to override library defaults
      ...(() => {
        const bgColorValue = readCssVar(buttonBgVar)
        return {
          backgroundColor: bgColorValue === 'transparent' ? 'transparent' : `var(${buttonBgVar})`
        }
      })(),
      color: `var(${buttonColorVar})`,
      // For solid and outline, use box-shadow for outside border (doesn't affect box model)
      // Use the reactively read border-size value to ensure updates trigger re-renders
      ...(variant === 'solid' || variant === 'outline' ? {
        border: 'none',
        boxShadow: `0 0 0 ${borderSizeValue || '1px'} var(${buttonBorderColorVar || buttonColorVar})`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        border: 'none',
      } : {}),
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${getBrandTypographyCssVar('button', 'font-weight')})`,
      height: `var(${heightVar})`,
      minWidth: `var(${minWidthVar})`,
      paddingLeft: `var(${horizontalPaddingVar})`,
      paddingRight: `var(${horizontalPaddingVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Ensure flex layout for truncation to work with icons
      display: 'flex',
      alignItems: 'center',
      // For icon-only buttons, ensure flex centering
      ...(isIconOnly && {
        justifyContent: 'center',
      }),
      // Set CSS custom properties for CSS file overrides
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--button-max-width': `var(${maxWidthVar})`,
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      // Override Material UI's default disabled styles to keep colors unchanged
      ...(disabled && {
        opacity: `var(${getBrandStateCssVar(mode, 'disabled')})`,
        backgroundColor: `var(${buttonBgVar}) !important`,
        color: `var(${buttonColorVar}) !important`,
        ...((variant === 'solid' || variant === 'outline') && {
          border: 'none !important',
          boxShadow: `0 0 0 ${borderSizeValue || '1px'} var(${buttonBorderColorVar || buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
      // Apply elevation if set, combine with border box-shadow if present
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        const borderShadow = (variant === 'solid' || variant === 'outline')
          ? `0 0 0 ${borderSizeValue || '1px'} var(${buttonBorderColorVar || buttonColorVar})`
          : ''
        if (elevationBoxShadow && borderShadow) {
          return { boxShadow: `${borderShadow}, ${elevationBoxShadow}` }
        } else if (elevationBoxShadow) {
          return { boxShadow: elevationBoxShadow }
        } else if (borderShadow) {
          return { boxShadow: borderShadow }
        }
        return {}
      })(),
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  // Use native children prop - CSS will handle truncation
  return <MaterialButton {...materialProps}>{isIconOnly ? icon : children}</MaterialButton>
}

