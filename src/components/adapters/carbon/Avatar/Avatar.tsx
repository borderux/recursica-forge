/**
 * Carbon Avatar Implementation
 * 
 * Carbon-specific Avatar component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Avatar component, so we'll create a custom implementation.
 */

import { useState } from 'react'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getComponentColorVars } from '../../../utils/getComponentColorVars'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { useCssVar } from '../../../hooks/useCssVar'
import './Avatar.css'

export default function Avatar({
  src,
  alt,
  fallback,
  colorVariant = 'text-ghost',
  sizeVariant = 'default',
  layer = 'layer-0',
  elevation,
  shape = 'circle',
  className,
  style,
  carbon,
  ...props
}: AdapterAvatarProps) {
  const { mode } = useThemeMode()
  const [imageError, setImageError] = useState(false)
  
  // Get color CSS variables using shared utility
  const { bgVar, borderVar, labelVar } = getComponentColorVars({
    componentName: 'Avatar',
    colorVariant,
    layer,
    mode,
    src,
    imageError,
  })
  
  // Reactively read border color to trigger re-renders when it changes
  const borderColorValue = useCssVar(borderVar, '')
  
  // Get size and other CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  // Get text-size from size variant (e.g., variants.sizes.default.properties.text-size)
  const textSizeVar = getComponentCssVar('Avatar', 'size', `${sizeVariant}-text-size`, undefined)
  // Reactively read text-size to trigger re-renders when it changes
  const textSizeValue = useCssVar(textSizeVar, '')
  const paddingVar = getComponentLevelCssVar('Avatar', 'padding')
  const borderSizeVar = getComponentLevelCssVar('Avatar', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Avatar', 'border-radius')
  
  // Handle elevation
  const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
  
  return (
    <div
      className={`cds--avatar ${className || ''}`}
      style={{
        // Set CSS custom properties that reference the UIKit CSS vars directly
        // These point to the UIKit vars, allowing CSS to reference them dynamically
        '--avatar-bg': `var(${bgVar})`,
        '--avatar-border': borderColorValue || `var(${borderVar})`,
        '--avatar-label': `var(${labelVar})`,
        '--avatar-size': `var(${sizeVar})`,
        '--avatar-text-size': textSizeValue || `var(${textSizeVar})`,
        // Only set non-CSS-variable styles here (like borderRadius for circle shape)
        ...(shape === 'circle' ? { borderRadius: '50%' } : {}),
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...carbon}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setImageError(true)}
          className="cds--avatar-image"
        />
      ) : (
        <div className="cds--avatar-fallback">
          {fallback}
        </div>
      )}
    </div>
  )
}

