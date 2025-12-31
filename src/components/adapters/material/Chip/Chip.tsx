/**
 * Material UI Chip Implementation
 * 
 * Material UI-specific Chip component that uses CSS variables for theming.
 */

import { Chip as MaterialChip } from '@mui/material'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Chip.css'

export default function Chip({
  children,
  variant = 'unselected',
  size = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
  disabled,
  onClick,
  onDelete,
  deletable = false,
  className,
  style,
  icon,
  material,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Map unified size to Material size
  const materialSize = size === 'small' ? 'small' : 'medium'
  
  // Check if component has alternative-layer prop set
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let chipBgVar: string
  let chipColorVar: string
  let chipIconColorVar: string
  let chipBorderVar: string
  
  if (hasComponentAlternativeLayer) {
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipIconColorVar = chipColorVar
    chipBorderVar = `var(${layerBase}-border-color)`
  } else if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipIconColorVar = chipColorVar
    chipBorderVar = `var(${layerBase}-border-color)`
  } else {
    // Use UIKit.json chip colors for standard layers
    // NEW STRUCTURE: variants.styles.{variant}.properties.colors.{layer}.{property}
    chipBgVar = getComponentCssVar('Chip', 'colors', `${variant}-background`, layer)
    chipBorderVar = getComponentCssVar('Chip', 'colors', `${variant}-border`, layer)
    
    // For error variant (including error-selected), use component-level error color CSS variables
    // NEW STRUCTURE: properties.colors.error.text-color
    if (variant === 'error' || variant === 'error-selected') {
      chipColorVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
      chipIconColorVar = getComponentLevelCssVar('Chip', 'colors.error.icon-color')
    } else {
      chipColorVar = getComponentCssVar('Chip', 'colors', `${variant}-text`, layer)
      // Get icon-color if available, otherwise use text color
      const iconColorVar = getComponentCssVar('Chip', 'colors', `${variant}-icon-color`, layer)
      chipIconColorVar = iconColorVar || chipColorVar
    }
  }
  
  // Get size CSS variables - Chip size properties are component-level (not layer-specific)
  // NEW STRUCTURE: properties.{property}
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon')
  const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
  const horizontalPaddingVar = getComponentLevelCssVar('Chip', 'horizontal-padding')
  const verticalPaddingVar = getComponentLevelCssVar('Chip', 'vertical-padding')
  const borderSizeVar = getComponentLevelCssVar('Chip', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Chip', 'border-radius')
  
  // Get text styling CSS variables - font-size is at component level (not under size)
  const fontSizeVar = getComponentLevelCssVar('Chip', 'font-size')
  
  // Use Button's max-width and height vars (same as Button component)
  // Use Chip's own min-width so toolbar can control it
  // NEW STRUCTURE: properties.min-width, properties.max-width
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const minWidthVar = getComponentLevelCssVar('Chip', 'min-width') || getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const maxWidthVar = getComponentLevelCssVar('Chip', 'max-width') || getComponentCssVar('Button', 'size', 'max-width', undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  
  // Destructure adapter-specific props to avoid passing them to the component
  const { mantine, carbon, ...restProps } = props
  
  // Merge library-specific props
  const materialProps = {
    size: materialSize,
    disabled,
    onClick: disabled ? undefined : onClick,
    onDelete: deletable && onDelete ? onDelete : undefined,
    // Use native icon prop directly - CSS will handle sizing and spacing
    icon: icon ? icon : undefined,
    className,
    sx: {
      backgroundColor: 'var(--chip-bg)',
      color: (variant === 'error' || variant === 'error-selected') ? `var(${chipColorVar})` : 'var(--chip-color)',
      borderColor: isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      borderWidth: `var(${borderSizeVar})`,
      paddingLeft: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingRight: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingTop: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      paddingBottom: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      borderRadius: `var(${borderRadiusVar})`,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      textTransform: 'none',
      // Set CSS custom properties for CSS file
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Don't set --chip-icon-text-gap here - let CSS use UIKit variable directly for real-time updates
      // Use Button's min-width and max-width vars (same as Button component)
      // Don't use fixed height - let padding and content determine height naturally
      minWidth: `var(${minWidthVar})`,
      maxWidth: `var(${maxWidthVar})`,
      ...(elevation && elevation !== 'elevation-0' ? (() => {
        const elevationMatch = elevation.match(/elevation-(\d+)/)
        if (elevationMatch) {
          const elevationLevel = elevationMatch[1]
          return {
            boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
          }
        }
        return {}
      })() : {}),
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled)`,
      }),
      ...material?.sx,
    },
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': isAlternativeLayer ? chipBgVar : `var(${chipBgVar})`,
      // For error variant (including error-selected), use chip error color CSS variable directly
      '--chip-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipColorVar})` : (isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`),
      '--chip-icon-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipIconColorVar})` : (isAlternativeLayer ? chipIconColorVar : `var(${chipIconColorVar})`),
      '--chip-border': isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Don't set --chip-icon-text-gap here - let CSS use UIKit variable directly for real-time updates
      '--chip-border-size': `var(${borderSizeVar})`,
      // Use Button's min-width and max-width vars (same as Button component)
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
      ...style,
    },
    ...material,
    ...restProps,
  }
  
  return <MaterialChip {...(materialProps as any)} label={children} />
}

