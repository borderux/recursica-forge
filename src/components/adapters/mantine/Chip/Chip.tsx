/**
 * Mantine Chip Implementation
 * 
 * Mantine-specific Chip component that uses CSS variables for theming.
 * Note: Mantine doesn't have a native Chip component, so we use Badge as the base.
 */

import { Badge, ActionIcon } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : 'md'
  
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
  
  // Handle delete functionality - use ActionIcon in rightSection
  const deleteIcon = deletable && onDelete ? (
    <ActionIcon
      size="xs"
      radius="xl"
      variant="transparent"
      disabled={disabled}
      onClick={disabled ? undefined : (e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete(e)
      }}
      className="recursica-chip-delete"
      style={{
        color: 'inherit',
      }}
    >
      ×
    </ActionIcon>
  ) : undefined
  
  // Merge library-specific props
  const mantineProps = {
    size: mantineSize,
    disabled,
    'data-disabled': disabled ? true : undefined,
    onClick: disabled ? undefined : onClick,
    // Use native leftSection prop for icon - CSS will handle sizing and spacing
    leftSection: icon ? icon : undefined,
    // Use native rightSection prop for delete button - CSS will handle styling
    rightSection: deleteIcon,
    className,
    classNames: {
      root: 'recursica-chip-root',
      leftSection: 'recursica-chip-left-section',
      rightSection: 'recursica-chip-right-section',
      ...mantine?.classNames,
    },
    styles: {
      root: {
        ...mantine?.styles?.root,
      },
      ...mantine?.styles,
    },
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
    ...mantine,
    ...props,
  }
  
  // Use native children prop - CSS will handle icon and delete button styling
  return <Badge {...mantineProps}>{children}</Badge>
}

