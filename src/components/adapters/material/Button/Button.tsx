/**
 * Material UI Button Implementation
 * 
 * Material UI-specific Button component that uses CSS variables for theming.
 */

import { Button as MaterialButton } from '@mui/material'
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
  const buttonBgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  
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
      // For outline, use the outline-text CSS var for border color and ensure border is set
      ...(variant === 'outline' ? {
        border: `1px solid var(${buttonColorVar})`,
        borderColor: `var(${buttonColorVar})`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        border: 'none',
      } : {}),
      fontSize: `var(${fontSizeVar})`,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
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
        opacity: `var(--recursica-brand-${mode}-state-disabled)`,
        backgroundColor: `var(${buttonBgVar}) !important`,
        color: `var(${buttonColorVar}) !important`,
        ...(variant === 'outline' && {
          borderColor: `var(${buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
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
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  // Use native children prop - CSS will handle truncation
  return <MaterialButton {...materialProps}>{isIconOnly ? icon : children}</MaterialButton>
}

