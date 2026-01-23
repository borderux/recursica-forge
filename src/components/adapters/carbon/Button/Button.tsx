/**
 * Carbon Button Implementation
 * 
 * Carbon-specific Button component that uses CSS variables for theming.
 */

import { Button as CarbonButton } from '@carbon/react'
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
  
  const cssVarVariant = variant
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'colors', layer, 'border')
  
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
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  // We read the value to force React re-renders, but use it directly in the style
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  
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
      fontFamily: `var(${fontFamilyVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${fontWeightVar})`,
      letterSpacing: `var(${letterSpacingVar})`,
      lineHeight: `var(${lineHeightVar})`,
      height: `var(${heightVar})`,
      minWidth: `var(${minWidthVar})`,
      paddingLeft: `var(${horizontalPaddingVar})`,
      paddingRight: `var(${horizontalPaddingVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Set button border color CSS variable for CSS file override
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColorVar ? {
        '--button-border-color': `var(${buttonBorderColorVar})`,
      } : {}),
      // Use actual CSS border instead of box-shadow
      ...(variant === 'solid' || variant === 'outline' ? {
        border: `${borderSizeValue || '1px'} solid var(${buttonBorderColorVar || buttonColorVar})`,
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
        ...((variant === 'solid' || variant === 'outline') && {
          border: `${borderSizeValue || '1px'} solid var(${buttonBorderColorVar || buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
      // Apply elevation if set
      // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        if (elevationBoxShadow) {
          return { boxShadow: elevationBoxShadow }
        }
        return {}
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

