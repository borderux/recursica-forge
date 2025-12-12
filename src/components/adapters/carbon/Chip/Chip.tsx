/**
 * Carbon Chip Implementation
 * 
 * Carbon-specific Chip component that uses CSS variables for theming.
 * Note: Carbon uses Tag component for chip-like functionality.
 */

import { Tag } from '@carbon/react'
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
  carbon,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
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
  const carbonProps = {
    size: carbonSize,
    disabled,
    onClick: disabled ? undefined : onClick,
    onClose: deletable && onDelete ? onDelete : undefined,
    // Use native renderIcon prop - CSS will handle sizing and spacing
    renderIcon: icon ? () => icon : undefined,
    className,
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': isAlternativeLayer ? chipBgVar : `var(${chipBgVar})`,
      '--chip-color': isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`,
      '--chip-border': isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--chip-height': `var(${heightVar})`,
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-padding-x': `var(${paddingVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
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
      ...style,
    },
    ...carbon,
    ...props,
  }
  
  // Use native children prop - CSS will handle icon styling
  return <Tag {...carbonProps}>{children}</Tag>
}

