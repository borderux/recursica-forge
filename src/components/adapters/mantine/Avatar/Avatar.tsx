/**
 * Mantine Avatar Implementation
 * 
 * Mantine-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MantineAvatar } from '@mantine/core'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getComponentColorVars } from '../../../utils/getComponentColorVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Avatar.css'

export default function Avatar({
  src,
  alt,
  fallback,
  colorVariant = 'text-ghost',
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
  
  // Get color CSS variables using shared utility
  const { bgVar, borderVar, labelVar } = getComponentColorVars({
    componentName: 'Avatar',
    colorVariant,
    layer,
    mode,
    alternativeLayer,
    src,
    imageError: false,
  })
  
  // Get size and other CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  const textSizeVar = getComponentLevelCssVar('Avatar', 'text-size')
  
  // Map unified size to Mantine size
  const mantineSize = sizeVariant === 'small' ? 'xs' : sizeVariant === 'default' ? 'md' : 'lg'
  
  // Handle elevation
  let elevationBoxShadow: string | undefined
  if (elevation && elevation !== 'elevation-0') {
    const elevationMatch = elevation.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      elevationBoxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
  }
  
  return (
    <MantineAvatar
      src={src}
      alt={alt}
      size={mantineSize}
      className={className}
      style={{
        // Set CSS custom properties that reference the UIKit CSS vars directly
        '--avatar-bg': `var(${bgVar})`,
        '--avatar-border': `var(${borderVar})`,
        '--avatar-label': `var(${labelVar})`,
        '--avatar-size': `var(${sizeVar})`,
        '--avatar-text-size': `var(${textSizeVar})`,
        // Only set non-CSS-variable styles here (like borderRadius for circle shape)
        ...(shape === 'circle' ? { borderRadius: '50%' } : {}),
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

