/**
 * Material UI Avatar Implementation
 * 
 * Material UI-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MaterialAvatar } from '@mui/material'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Avatar.css'

export default function Avatar({
  src,
  alt,
  fallback,
  colorVariant = 'ghost-text',
  sizeVariant = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
  shape = 'circle',
  className,
  style,
  material,
  ...props
}: AdapterAvatarProps) {
  const { mode } = useThemeMode()
  
  // Check if component has alternative-layer prop set (overrides layer-based alt layer)
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  // Build CSS variable names for colors
  let bgVar: string
  let borderVar: string
  let labelVar: string
  
  // Extract base variant (primary or ghost) from colorVariant (e.g., "primary-icon" -> "primary")
  const baseVariant = colorVariant?.startsWith('primary') ? 'primary' : 
                      colorVariant?.startsWith('ghost') ? 'ghost' : 'ghost'
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    
    if (baseVariant === 'primary') {
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-element-text-color`
      labelVar = `${layerBase}-element-text-color`
    } else {
      // ghost variant
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-property-border-color`
      labelVar = `${layerBase}-element-text-color`
    }
  } else if (layer.startsWith('layer-alternative-')) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    
    if (baseVariant === 'primary') {
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-element-text-color`
      labelVar = `${layerBase}-element-text-color`
    } else {
      // ghost variant
      bgVar = `${layerBase}-surface`
      borderVar = `${layerBase}-property-border-color`
      labelVar = `${layerBase}-element-text-color`
    }
  } else {
    // Use UIKit.json avatar colors for standard layers
    // Pattern: {variant}-{property} (e.g., "primary-icon-background", "ghost-text-background")
    // This matches UIKit.json structure: variant.primary-icon.background
    bgVar = getComponentCssVar('Avatar', 'color', `${colorVariant}-background`, layer)
    borderVar = getComponentCssVar('Avatar', 'color', `${colorVariant}-border`, layer)
    labelVar = getComponentCssVar('Avatar', 'color', `${colorVariant}-label`, layer)
    
    // For images, use border-image instead of variant border
    const borderImageVar = getComponentCssVar('Avatar', 'color', 'border-image', layer)
    // Use border-image when src is provided, or when variant is "image"
    if (src || colorVariant === 'image') {
      borderVar = borderImageVar
    }
  }
  
  // Get size CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  const iconSizeVar = getComponentCssVar('Avatar', 'size', 'icon', undefined)
  
  // Map unified size to Material UI size
  // Material UI Avatar sizes: 'small' (24px), 'medium' (40px), 'large' (56px)
  // Our sizes: small (24px), default (32px), large (40px)
  const materialSize = sizeVariant === 'small' ? 'small' : sizeVariant === 'large' ? 'medium' : undefined
  
  // Determine border radius based on shape
  const borderRadius = shape === 'circle' ? '50%' : '0px'
  
  // Handle elevation
  let elevationBoxShadow: string | undefined
  if (elevation && elevation !== 'elevation-0') {
    const elevationMatch = elevation.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      elevationBoxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
  }
  
  // Get color references (wrap in var() if not already wrapped)
  const bgRef = isAlternativeLayer ? `var(${bgVar})` : `var(${bgVar})`
  const borderRef = isAlternativeLayer ? `var(${borderVar})` : `var(${borderVar})`
  const labelRef = isAlternativeLayer ? `var(${labelVar})` : `var(${labelVar})`
  
  return (
    <MaterialAvatar
      src={src}
      alt={alt}
      sx={{
        width: materialSize ? undefined : `var(${sizeVar})`,
        height: materialSize ? undefined : `var(${sizeVar})`,
        backgroundColor: bgRef,
        color: labelRef,
        border: `1px solid ${borderRef}`,
        borderRadius: borderRadius,
        fontSize: `var(${iconSizeVar})`,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...material?.sx,
      }}
      className={className}
      style={style}
      {...material}
      {...props}
    >
      {fallback}
    </MaterialAvatar>
  )
}

