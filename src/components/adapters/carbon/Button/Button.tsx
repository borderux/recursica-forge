/**
 * Carbon Button Implementation
 * 
 * Carbon-specific Button component that uses CSS variables for theming.
 */

import { Button as CarbonButton } from '@carbon/react'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { getBrandTypographyCssVar, getBrandStateCssVar, getElevationBoxShadow } from '../../../utils/brandCssVars'
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
  carbon,
  ...props
}: AdapterButtonProps) {
  const { mode } = useThemeMode()
  
  // Map unified variant to Carbon kind
  const carbonKind = variant === 'solid' ? 'primary' : variant === 'outline' ? 'secondary' : 'tertiary'
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${variant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${variant}-text`, layer)
  
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
  
  // Read the actual background color value to check if it's transparent
  // If it's transparent, set it directly to override library defaults
  const bgColorValue = readCssVar(buttonBgVar)
  const backgroundColorValue = bgColorValue === 'transparent' 
    ? 'transparent' 
    : `var(${buttonBgVar})`
  
  // Merge library-specific props
  const carbonProps = {
    kind: carbonKind as 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger--primary' | 'danger--ghost' | 'danger--tertiary' | 'tertiary',
    size: carbonSize as 'sm' | 'md' | 'lg' | 'xl',
    disabled,
    onClick,
    type,
    className,
    style: {
      // Use CSS variables for theming
      // If the value is transparent, set it directly to override library defaults
      backgroundColor: backgroundColorValue,
      color: `var(${buttonColorVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${getBrandTypographyCssVar('button', 'font-weight')})`,
      height: `var(${heightVar})`,
      minWidth: `var(${minWidthVar})`,
      paddingLeft: `var(${horizontalPaddingVar})`,
      paddingRight: `var(${horizontalPaddingVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // For outline, use the outline-text CSS var for border color and ensure border is set
      ...(variant === 'outline' ? {
        border: `1px solid var(${buttonColorVar})`,
        borderColor: `var(${buttonColorVar})`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        border: 'none',
      } : {}),
      // Ensure flex layout for truncation to work with icons
      display: 'flex',
      alignItems: 'center',
      // For icon-only buttons, ensure flex centering
      ...(isIconOnly && {
        justifyContent: 'center',
      }),
      // Set CSS custom properties for CSS file overrides
      '--button-bg': `var(${buttonBgVar})`,
      '--button-color': `var(${buttonColorVar})`,
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--button-max-width': `var(${maxWidthVar})`,
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      // Override Carbon's default disabled styles to keep colors unchanged
      ...(disabled && {
        opacity: `var(${getBrandStateCssVar(mode, 'disabled')})`,
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
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        return elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}
      })(),
      ...style,
    },
    ...carbon,
    ...props,
  }
  
  // Use native children prop - CSS will handle icon placement and text truncation
  return (
    <CarbonButton {...carbonProps}>
      {isIconOnly ? icon : children}
    </CarbonButton>
  )
}

