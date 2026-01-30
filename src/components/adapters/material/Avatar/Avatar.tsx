/**
 * Material UI Avatar Implementation
 * 
 * Material UI-specific Avatar component that uses CSS variables for theming.
 */

import { Avatar as MaterialAvatar } from '@mui/material'
import type { AvatarProps as AdapterAvatarProps } from '../../Avatar'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
  
  // Reactively read border color to trigger re-renders when it changes
  const borderColorValue = useCssVar(borderVar, '')
  
  // Get size and other CSS variables
  const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
  
  // Get level CSS variables (border-size, border-radius, padding)
  const borderSizeVar = getComponentLevelCssVar('Avatar', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Avatar', 'border-radius')
  const paddingVar = getComponentLevelCssVar('Avatar', 'padding')
  
  // Get text CSS variables - use size variant for variant-specific text properties
  const fontFamilyVar = getComponentTextCssVar('Avatar', 'text', 'font-family', sizeVariant)
  const fontSizeVar = getComponentTextCssVar('Avatar', 'text', 'font-size', sizeVariant)
  const fontWeightVar = getComponentTextCssVar('Avatar', 'text', 'font-weight', sizeVariant)
  const letterSpacingVar = getComponentTextCssVar('Avatar', 'text', 'letter-spacing', sizeVariant)
  const lineHeightVar = getComponentTextCssVar('Avatar', 'text', 'line-height', sizeVariant)
  const textDecorationVar = getComponentTextCssVar('Avatar', 'text', 'text-decoration', sizeVariant)
  const textTransformVar = getComponentTextCssVar('Avatar', 'text', 'text-transform', sizeVariant)
  const fontStyleVar = getComponentTextCssVar('Avatar', 'text', 'font-style', sizeVariant)
  
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
        ...material?.sx,
      }}
      className={className}
      style={{
        // Set CSS custom properties that reference the UIKit CSS vars directly
        '--avatar-bg': `var(${bgVar})`,
        '--avatar-border': borderColorValue || `var(${borderVar})`,
        '--avatar-label': `var(${labelVar})`,
        '--avatar-size': `var(${sizeVar})`,
        '--avatar-border-size': `var(${borderSizeVar})`,
        '--avatar-border-radius': shape === 'circle' ? '50%' : `var(${borderRadiusVar})`,
        '--avatar-padding': `var(${paddingVar})`,
        '--avatar-font-family': `var(${fontFamilyVar})`,
        '--avatar-font-size': `var(${fontSizeVar})`,
        '--avatar-font-weight': `var(${fontWeightVar})`,
        '--avatar-letter-spacing': `var(${letterSpacingVar})`,
        '--avatar-line-height': `var(${lineHeightVar})`,
        '--avatar-text-decoration': `var(${textDecorationVar})`,
        '--avatar-text-transform': `var(${textTransformVar})`,
        '--avatar-font-style': `var(${fontStyleVar})`,
        // Only set non-CSS-variable styles here (like boxShadow for elevation)
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    >
      {fallback}
    </MaterialAvatar>
  )
}

