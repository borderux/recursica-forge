/**
 * Carbon Button Implementation
 * 
 * Carbon-specific Button component that uses CSS variables for theming.
 */

import { Button as CarbonButton } from '@carbon/react'
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
  alternativeLayer,
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
  
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let buttonBgVar: string
  let buttonColorVar: string
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    buttonBgVar = variant === 'solid' 
      ? `${layerBase}-element-interactive-tone`
      : `${layerBase}-surface`
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    buttonColorVar = variant === 'solid'
      ? `${layerBase}-element-interactive-on-tone`
      : `${layerBase}-element-interactive-tone`
  } else if (layer.startsWith('layer-alternative-')) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
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
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const fontSizeVar = getComponentCssVar('Button', 'size', 'font-size', undefined)
  const contentMaxWidthVar = getComponentCssVar('Button', 'size', 'content-max-width', undefined)
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
  // Merge library-specific props
  const carbonProps = {
    kind: carbonKind as 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger--primary' | 'danger--ghost' | 'danger--tertiary' | 'tertiary',
    size: carbonSize as 'sm' | 'md' | 'lg' | 'xl',
    disabled,
    onClick,
    type,
    className,
    style: {
      // Use CSS variables for theming - supports both standard and alternative layers
      // Use Recursica CSS vars directly - CSS file will handle Carbon fallbacks
      backgroundColor: isAlternativeLayer ? `var(${buttonBgVar})` : `var(${buttonBgVar})`,
      color: isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
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
      '--button-bg': isAlternativeLayer ? `var(${buttonBgVar})` : `var(${buttonBgVar})`,
      '--button-color': isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar})`,
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--button-content-max-width': `var(${contentMaxWidthVar})`,
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      // Override Carbon's default disabled styles to keep colors unchanged
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled)`,
        backgroundColor: isAlternativeLayer ? `var(${buttonBgVar})` : `var(${buttonBgVar}) !important`,
        color: isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar}) !important`,
        ...(variant === 'outline' && {
          borderColor: isAlternativeLayer ? `var(${buttonColorVar})` : `var(${buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
      // Apply elevation - prioritize alt layer elevation if alt-layer is set, otherwise use component elevation
      ...(() => {
        let elevationToApply: string | undefined = elevation
        
        if (hasComponentAlternativeLayer) {
          // Read elevation from alt layer's property
          const altLayerElevationVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-elevation`
          const altLayerElevation = readCssVar(altLayerElevationVar)
          if (altLayerElevation) {
            // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
            const match = altLayerElevation.match(/elevations\.(elevation-\d+)/)
            if (match) {
              elevationToApply = match[1]
            } else if (/^elevation-\d+$/.test(altLayerElevation)) {
              elevationToApply = altLayerElevation
            }
          }
          // If alt layer doesn't have elevation, fall back to component-level elevation
          if (!elevationToApply) {
            elevationToApply = elevation
          }
        }
        
        if (elevationToApply && elevationToApply !== 'elevation-0') {
          const elevationMatch = elevationToApply.match(/elevation-(\d+)/)
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

