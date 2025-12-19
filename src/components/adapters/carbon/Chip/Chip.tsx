/**
 * Carbon Chip Implementation
 * 
 * Carbon-specific Chip component that uses CSS variables for theming.
 * Note: Carbon uses Tag component for chip-like functionality.
 */

import { Tag } from '@carbon/react'
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
  carbon,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
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
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon
  const iconSizeVar = getComponentCssVar('Chip', 'size', 'icon', layer)
  const iconGapVar = getComponentCssVar('Chip', 'size', 'icon-text-gap', layer)
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
  const { mantine, material, ...restProps } = props
  
  // Merge library-specific props
  const carbonProps = {
    size: carbonSize,
    disabled,
    onClick: disabled ? undefined : onClick,
    onClose: deletable && onDelete && !disabled ? onDelete : undefined,
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
      '--chip-padding-x': `var(${horizontalPaddingVar})`,
      '--chip-padding-y': `var(${verticalPaddingVar})`,
      '--chip-border-size': `var(${borderSizeVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
      '--chip-font-size': fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      textTransform: 'none',
      // Use Button's min-width, max-width, and height vars (same as Button component)
      minWidth: `var(${minWidthVar})`,
      height: `var(${heightVar})`,
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
      '--chip-height': `var(${heightVar})`,
      // Set disabled opacity dynamically based on mode
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled, 0.5)`,
      }),
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
    ...restProps,
  }
  
  // Use native children prop - CSS will handle icon styling
  return <Tag {...(carbonProps as any)}>{children}</Tag>
}

