/**
 * Material UI Avatar Implementation
 * 
 * Material UI-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MaterialAvatar } from '@mui/material'
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
  material,
  ...props
}: AdapterAvatarProps) {
  const { mode } = useThemeMode()
  
  // Get color CSS variables using shared utility
  const { bgVar, borderVar, labelVar } = getComponentColorVars({
    componentName: 'Avatar',
    colorVariant,
    layer,
    mode,
    src,
    imageError: false,
  })
  
  // Get size and other CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  // Get text-size from size variant (e.g., variants.sizes.default.properties.text-size)
  const textSizeVar = getComponentCssVar('Avatar', 'size', `${sizeVariant}-text-size`, undefined)
  // Reactively read text-size to trigger re-renders when it changes
  const textSizeValue = useCssVar(textSizeVar, '')
  const paddingVar = getComponentLevelCssVar('Avatar', 'padding')
  const borderSizeVar = getComponentLevelCssVar('Avatar', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Avatar', 'border-radius')
  
  // Map unified size to Material UI size
  const materialSize = sizeVariant === 'small' ? 'small' : sizeVariant === 'large' ? 'medium' : undefined
  
  // Handle elevation
  const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
  
  return (
    <MaterialAvatar
      src={src}
      alt={alt}
      sx={{
        width: materialSize ? undefined : `var(${sizeVar})`,
        height: materialSize ? undefined : `var(${sizeVar})`,
        padding: `var(${paddingVar})`,
        backgroundColor: `var(${bgVar})`,
        color: `var(${labelVar})`,
        border: `var(${borderSizeVar}) solid var(${borderVar})`,
        borderRadius: shape === 'circle' ? '50%' : `var(${borderRadiusVar})`,
        fontSize: textSizeValue || `var(${textSizeVar})`,
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...material?.sx,
      }}
      className={className}
      style={{
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    >
      {fallback}
    </MaterialAvatar>
  )
}

