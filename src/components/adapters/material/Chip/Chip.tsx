/**
 * Material UI Chip Implementation
 * 
 * Material UI-specific Chip component that uses CSS variables for theming.
 */

import { Chip as MaterialChip } from '@mui/material'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
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
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
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
  
  // Get size CSS variables
  const iconSizeVar = getComponentCssVar('Chip', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Chip', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  const heightVar = getComponentCssVar('Chip', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Chip', 'size', `${sizePrefix}-min-width`, undefined)
  const paddingVar = getComponentCssVar('Chip', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const borderRadiusVar = getComponentCssVar('Chip', 'size', 'border-radius', undefined)
  
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
      backgroundColor: isAlternativeLayer ? chipBgVar : `var(${chipBgVar})`,
      color: isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`,
      borderColor: isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      height: `var(${heightVar})`,
      minWidth: `var(${minWidthVar})`,
      paddingLeft: `var(${paddingVar})`,
      paddingRight: `var(${paddingVar})`,
      borderRadius: `var(${borderRadiusVar})`,
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
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      ...style,
    },
    ...material,
    ...props,
  }
  
  return <MaterialChip {...materialProps} label={children} />
}

