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
  let chipBorderVar: string
  
  if (hasComponentAlternativeLayer) {
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipBorderVar = `var(${layerBase}-border-color)`
  } else if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipBorderVar = `var(${layerBase}-border-color)`
  } else {
    // Use UIKit.json chip colors for standard layers
    chipBgVar = getComponentCssVar('Chip', 'color', `${variant}-background`, layer)
    chipColorVar = getComponentCssVar('Chip', 'color', `${variant}-text`, layer)
    chipBorderVar = getComponentCssVar('Chip', 'color', `${variant}-border`, layer)
  }
  
  // Get size CSS variables - Chip size properties are nested by layer, not by size variant
  // UIKit.json structure: chip.size.layer-0.border-radius, chip.size.layer-0.horizontal-padding, etc.
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap
  // Icon is a component-level property (not layer-specific)
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon')
  // icon-text-gap is at component level (not under size) in UIKit.json
  // getComponentCssVar treats it as component-level, which matches toolbar's parseComponentStructure
  const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
  const horizontalPaddingVar = getComponentCssVar('Chip', 'size', 'horizontal-padding', layer)
  const verticalPaddingVar = getComponentCssVar('Chip', 'size', 'vertical-padding', layer)
  const borderSizeVar = getComponentCssVar('Chip', 'size', 'border-size', layer)
  const borderRadiusVar = getComponentCssVar('Chip', 'size', 'border-radius', layer)
  
  // Get text styling CSS variables - font-size is at component level (not under size)
  const fontSizeVar = getComponentLevelCssVar('Chip', 'font-size')
  
  // Use Button's max-width and height vars (same as Button component)
  // Use Chip's own min-width so toolbar can control it
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const minWidthVar = getComponentCssVar('Chip', 'size', 'min-width', undefined) || getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
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
      color: 'var(--chip-color)',
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
      '--chip-color': isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`,
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

