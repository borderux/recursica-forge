/**
 * Carbon Chip Implementation
 * 
 * Carbon-specific Chip component that uses CSS variables for theming.
 * Note: Carbon uses Tag component for chip-like functionality.
 */

import { useState, useEffect } from 'react'
import { Tag } from '@carbon/react'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentCssVar } from '../../../utils/cssVarNames'
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
  
  // Force re-render when CSS vars change (needed for Carbon to pick up CSS var changes)
  const [, setUpdateKey] = useState(0)
  
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Only re-render if chip CSS vars were updated, or if no specific vars were mentioned (global update)
      if (updatedVars.length === 0 || updatedVars.some((v: string) => v.includes('chip') || v.includes('components-chip'))) {
        setUpdateKey(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [])
  
  // Map unified size to Carbon size
  const carbonSize = size === 'small' ? 'sm' : 'md'
  
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
    // Use explicit path building instead of parsing variant names from strings
    chipBgVar = buildVariantColorCssVar('Chip', variant, 'background', layer)
    chipBorderVar = buildVariantColorCssVar('Chip', variant, 'border', layer)
    
    // For error variant (including error-selected), use component-level error color CSS variables
    if (variant === 'error' || variant === 'error-selected') {
      chipColorVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
      chipIconColorVar = getComponentLevelCssVar('Chip', 'colors.error.icon-color')
    } else {
      chipColorVar = buildVariantColorCssVar('Chip', variant, 'text', layer)
      // Get icon-color if available, otherwise use text color
      const iconColorVar = buildVariantColorCssVar('Chip', variant, 'icon-color', layer)
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
      // For error variant (including error-selected), use chip error color CSS variable directly
      '--chip-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipColorVar})` : (isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`),
      '--chip-icon-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipIconColorVar})` : (isAlternativeLayer ? chipIconColorVar : `var(${chipIconColorVar})`),
      '--chip-border': isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      // For error variant (including error-selected), also set color directly to ensure it's applied
      ...((variant === 'error' || variant === 'error-selected') ? {
        color: `var(${chipColorVar})`,
      } : {}),
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Don't set --chip-icon-text-gap here - let CSS use UIKit variable directly for real-time updates
      '--chip-padding-x': `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      '--chip-padding-y': `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      '--chip-border-size': `var(${borderSizeVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
      '--chip-font-size': fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      textTransform: 'none',
      // Use Button's min-width and max-width vars (same as Button component)
      // Don't use fixed height - let padding and content determine height naturally
      minWidth: `var(${minWidthVar})`,
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
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
  // Use variant as key to force Carbon to re-render when variant changes
  return <Tag key={`chip-${variant}-${layer}`} {...(carbonProps as any)}>{children}</Tag>
}

