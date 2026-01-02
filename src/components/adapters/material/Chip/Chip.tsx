/**
 * Material UI Chip Implementation
 * 
 * Material UI-specific Chip component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Chip as MaterialChip } from '@mui/material'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
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
  
  // Force re-render when CSS vars change (needed for Material UI to pick up CSS var changes)
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
    // Use explicit path building instead of parsing variant names from strings
    chipBgVar = buildVariantColorCssVar('Chip', variant, 'background', layer)
    chipBorderVar = buildVariantColorCssVar('Chip', variant, 'border', layer)
    
    // For error variant (including error-selected), use component-level error color CSS variables
    if (variant === 'error' || variant === 'error-selected') {
      chipColorVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
      chipIconColorVar = getComponentLevelCssVar('Chip', 'colors.error.icon-color')
    } else {
      chipColorVar = buildVariantColorCssVar('Chip', variant, 'text', layer)
      // Non-error variants don't have icon colors defined, so use text color for icons
      chipIconColorVar = chipColorVar
    }
  }
  
  // Get size CSS variables - Chip size properties are component-level (not layer-specific)
  // NEW STRUCTURE: properties.{property}
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon-size')
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
      paddingLeft: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingRight: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingTop: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      paddingBottom: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
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
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        return elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}
      })(),
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
  
  // Use variant as key to force Material UI to re-render when variant changes
  return <MaterialChip key={`chip-${variant}-${layer}`} {...(materialProps as any)} label={children} />
}

