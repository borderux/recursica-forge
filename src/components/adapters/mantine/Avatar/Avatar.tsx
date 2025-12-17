/**
 * Mantine Avatar Implementation
 * 
 * Mantine-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MantineAvatar } from '@mantine/core'
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
  mantine,
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
  
  // Map unified size to Mantine size
  const mantineSize = sizeVariant === 'small' ? 'xs' : sizeVariant === 'default' ? 'md' : 'lg'
  
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
    <MantineAvatar
      src={src}
      alt={alt}
      size={mantineSize}
      radius={shape === 'circle' ? 'xl' : 'xs'}
      className={className}
      style={{
        // Set CSS custom properties for CSS file to use
        ['--avatar-bg' as string]: bgRef,
        ['--avatar-border' as string]: borderRef,
        ['--avatar-label' as string]: labelRef,
        ['--avatar-size' as string]: `var(${sizeVar})`,
        ['--avatar-icon-size' as string]: `var(${iconSizeVar})`,
        ['--avatar-border-radius' as string]: borderRadius,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {fallback}
    </MantineAvatar>
  )
}

